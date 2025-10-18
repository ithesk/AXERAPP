-- =====================================================
-- MIGRATION: Create Audit Logs Table
-- Description: Registro de auditoría de acciones en el sistema
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Información de la acción
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'viewed', 'exported', 'login', 'logout')),
  entity_type TEXT NOT NULL, -- 'entrada', 'organization', 'member', 'invoice', etc.
  entity_id UUID,

  -- Datos de la acción (antes y después)
  old_data JSONB,
  new_data JSONB,

  -- Metadata adicional
  metadata JSONB DEFAULT '{}'::jsonb, -- IP, user agent, location, etc.

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear índices para consultas eficientes
CREATE INDEX idx_audit_logs_org_id ON public.audit_logs(org_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_org_created ON public.audit_logs(org_id, created_at DESC);

-- Comentarios para documentación
COMMENT ON TABLE public.audit_logs IS 'Registro de auditoría de todas las acciones importantes del sistema';
COMMENT ON COLUMN public.audit_logs.action IS 'Tipo de acción: created, updated, deleted, viewed, exported, login, logout';
COMMENT ON COLUMN public.audit_logs.entity_type IS 'Tipo de entidad afectada (entrada, organization, member, etc)';
COMMENT ON COLUMN public.audit_logs.old_data IS 'Estado anterior de los datos (solo para updates y deletes)';
COMMENT ON COLUMN public.audit_logs.new_data IS 'Estado nuevo de los datos (solo para creates y updates)';
COMMENT ON COLUMN public.audit_logs.metadata IS 'Información adicional como IP, user agent, ubicación, etc';

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies para audit_logs
-- Los miembros pueden ver los logs de su organización
CREATE POLICY "Org members can view audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Solo el sistema puede insertar logs (via SECURITY DEFINER functions)
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Los logs no se pueden actualizar ni eliminar (inmutables)
-- No se crean políticas de UPDATE o DELETE

-- Función helper para crear un log de auditoría
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_org_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    org_id,
    user_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data,
    metadata
  )
  VALUES (
    p_org_id,
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_data,
    p_new_data,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_audit_log IS 'Crea un registro en el log de auditoría';

-- Función para limpiar logs antiguos (retention policy)
-- Se recomienda ejecutar esto periódicamente con un cron job
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(
  p_retention_days INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.audit_logs
  WHERE created_at < (timezone('utc'::text, now()) - (p_retention_days || ' days')::INTERVAL);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_old_audit_logs IS 'Elimina logs de auditoría más antiguos que el período de retención especificado (por defecto 90 días)';

-- Trigger automático para auditar cambios en entradas
CREATE OR REPLACE FUNCTION public.audit_entradas_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_old_data JSONB;
  v_new_data JSONB;
BEGIN
  -- Determinar el tipo de acción
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'updated';
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
    v_old_data := to_jsonb(OLD);
  END IF;

  -- Crear el log de auditoría
  PERFORM public.create_audit_log(
    COALESCE(NEW.org_id, OLD.org_id),
    COALESCE(NEW.usuario_id, OLD.usuario_id, auth.uid()),
    v_action,
    'entrada',
    COALESCE(NEW.id, OLD.id),
    v_old_data,
    v_new_data,
    jsonb_build_object(
      'table', 'entradas',
      'timestamp', timezone('utc'::text, now())
    )
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger de auditoría a la tabla entradas
CREATE TRIGGER audit_entradas_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.entradas
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_entradas_changes();

COMMENT ON FUNCTION public.audit_entradas_changes IS 'Registra automáticamente todos los cambios en la tabla entradas';

-- Vista para logs de auditoría enriquecidos con información del usuario
CREATE OR REPLACE VIEW public.audit_logs_with_user AS
SELECT
  al.*,
  p.email as user_email,
  p.first_name as user_first_name,
  p.last_name as user_last_name,
  o.name as org_name
FROM public.audit_logs al
LEFT JOIN public.profiles p ON al.user_id = p.id
LEFT JOIN public.organizations o ON al.org_id = o.id;

COMMENT ON VIEW public.audit_logs_with_user IS 'Vista de logs de auditoría con información del usuario y organización';

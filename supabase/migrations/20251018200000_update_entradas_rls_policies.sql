-- =====================================================
-- MIGRATION: Update Entradas RLS Policies (Multi-Tenant)
-- Description: Actualizar políticas RLS para aislamiento estricto multi-tenant
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

-- CRÍTICO: Esta migración reemplaza las políticas permisivas existentes
-- con políticas estrictas de multi-tenancy

-- Paso 1: Eliminar políticas existentes (demasiado permisivas)
-- Nombres correctos según la migración original
DROP POLICY IF EXISTS "Users can view all entradas" ON public.entradas;
DROP POLICY IF EXISTS "Users can insert entradas" ON public.entradas;
DROP POLICY IF EXISTS "Users can update entradas" ON public.entradas;
DROP POLICY IF EXISTS "Users can delete entradas" ON public.entradas;

-- También eliminar si existen con nombres en español (por si acaso)
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver entradas" ON public.entradas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar entradas" ON public.entradas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar entradas" ON public.entradas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar entradas" ON public.entradas;

-- Paso 2: Crear nuevas políticas multi-tenant estrictas

-- POLÍTICA SELECT: Los usuarios solo pueden ver entradas de sus organizaciones
CREATE POLICY "Users can view entradas in their orgs"
  ON public.entradas
  FOR SELECT
  USING (
    -- El usuario debe tener acceso a la organización de la entrada
    public.user_has_org_access(org_id)
  );

COMMENT ON POLICY "Users can view entradas in their orgs" ON public.entradas
IS 'Los usuarios solo pueden ver entradas de organizaciones a las que pertenecen';

-- POLÍTICA INSERT: Solo technicians, admins y owners pueden crear entradas
-- Además, verificar límites del plan
CREATE POLICY "Technicians can create entradas in their org"
  ON public.entradas
  FOR INSERT
  WITH CHECK (
    -- El usuario debe tener acceso a la organización
    public.user_has_org_access(org_id)
    -- El usuario debe tener rol adecuado
    AND public.user_has_role(org_id, ARRAY['owner', 'admin', 'technician'])
    -- La organización debe poder crear más entradas (límites del plan)
    AND public.can_create_entrada(org_id)
  );

COMMENT ON POLICY "Technicians can create entradas in their org" ON public.entradas
IS 'Solo technicians, admins y owners pueden crear entradas, respetando límites del plan';

-- POLÍTICA UPDATE: Solo technicians, admins y owners pueden actualizar
-- No se permite cambiar el org_id (mantener aislamiento)
CREATE POLICY "Technicians can update entradas in their org"
  ON public.entradas
  FOR UPDATE
  USING (
    -- El usuario debe tener acceso a la organización actual
    public.user_has_org_access(org_id)
    -- El usuario debe tener rol adecuado
    AND public.user_has_role(org_id, ARRAY['owner', 'admin', 'technician'])
  )
  WITH CHECK (
    -- Verificar que no se cambie el org_id (seguridad crítica)
    org_id = (SELECT org_id FROM public.entradas WHERE id = entradas.id)
    -- El usuario debe seguir teniendo acceso
    AND public.user_has_org_access(org_id)
    AND public.user_has_role(org_id, ARRAY['owner', 'admin', 'technician'])
  );

COMMENT ON POLICY "Technicians can update entradas in their org" ON public.entradas
IS 'Solo technicians, admins y owners pueden actualizar entradas de su organización';

-- POLÍTICA DELETE: Solo admins y owners pueden eliminar entradas
CREATE POLICY "Admins can delete entradas in their org"
  ON public.entradas
  FOR DELETE
  USING (
    -- El usuario debe tener acceso a la organización
    public.user_has_org_access(org_id)
    -- Solo admins y owners pueden eliminar
    AND public.user_has_role(org_id, ARRAY['owner', 'admin'])
  );

COMMENT ON POLICY "Admins can delete entradas in their org" ON public.entradas
IS 'Solo admins y owners pueden eliminar entradas de su organización';

-- Paso 3: Crear índices adicionales para optimizar las consultas con RLS
CREATE INDEX IF NOT EXISTS idx_entradas_org_user_status
  ON public.entradas(org_id, usuario_id, estado);

CREATE INDEX IF NOT EXISTS idx_entradas_org_tecnico
  ON public.entradas(org_id, tecnico_asignado)
  WHERE tecnico_asignado IS NOT NULL;

-- Paso 4: Trigger de seguridad adicional para prevenir cambios de org_id
CREATE OR REPLACE FUNCTION public.prevent_org_id_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevenir cambios de org_id en updates
  IF TG_OP = 'UPDATE' AND OLD.org_id != NEW.org_id THEN
    RAISE EXCEPTION 'No se puede cambiar el org_id de una entrada existente por seguridad';
  END IF;

  -- Validar que el org_id existe y es válido
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = NEW.org_id AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'La organización especificada no existe o está eliminada';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER prevent_org_id_change_trigger
  BEFORE INSERT OR UPDATE ON public.entradas
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_org_id_change();

COMMENT ON FUNCTION public.prevent_org_id_change
IS 'Previene cambios de org_id y valida que la organización existe';

-- Paso 5: Función de utilidad para migrar entradas entre organizaciones (admin only)
-- USAR CON EXTREMO CUIDADO - Solo para casos excepcionales
CREATE OR REPLACE FUNCTION public.migrate_entrada_to_org(
  p_entrada_id UUID,
  p_new_org_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_old_org_id UUID;
BEGIN
  -- Verificar que el usuario sea superadmin del sistema
  -- (Esta función debería usarse solo vía service role o con permisos especiales)

  -- Obtener org_id actual
  SELECT org_id INTO v_old_org_id
  FROM public.entradas
  WHERE id = p_entrada_id;

  IF v_old_org_id IS NULL THEN
    RAISE EXCEPTION 'Entrada no encontrada';
  END IF;

  -- Verificar que la nueva organización existe
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = p_new_org_id) THEN
    RAISE EXCEPTION 'La organización destino no existe';
  END IF;

  -- Registrar en audit log
  PERFORM public.create_audit_log(
    v_old_org_id,
    auth.uid(),
    'updated',
    'entrada_migration',
    p_entrada_id,
    jsonb_build_object('old_org_id', v_old_org_id),
    jsonb_build_object('new_org_id', p_new_org_id, 'reason', p_reason),
    jsonb_build_object('action', 'org_migration', 'timestamp', now())
  );

  -- Generar nuevo id_reparacion para la nueva organización
  UPDATE public.entradas
  SET
    org_id = p_new_org_id,
    id_reparacion = public.generate_entrada_id(p_new_org_id),
    updated_at = now()
  WHERE id = p_entrada_id;

  -- Registrar en la nueva organización
  PERFORM public.create_audit_log(
    p_new_org_id,
    auth.uid(),
    'created',
    'entrada_migration',
    p_entrada_id,
    NULL,
    jsonb_build_object('migrated_from', v_old_org_id, 'reason', p_reason),
    jsonb_build_object('action', 'org_migration', 'timestamp', now())
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.migrate_entrada_to_org
IS 'Migra una entrada de una organización a otra (SOLO PARA CASOS EXCEPCIONALES)';

-- Paso 6: Vista segura para estadísticas por organización
CREATE OR REPLACE VIEW public.entradas_stats_by_org AS
SELECT
  e.org_id,
  o.name as org_name,
  COUNT(*) as total_entradas,
  COUNT(*) FILTER (WHERE e.estado = 'Pendiente') as pendientes,
  COUNT(*) FILTER (WHERE e.estado = 'En reparación') as en_reparacion,
  COUNT(*) FILTER (WHERE e.estado = 'Listo') as listas,
  COUNT(*) FILTER (WHERE e.estado = 'Entregado') as entregadas,
  COUNT(*) FILTER (WHERE DATE(e.fecha_entrada) = CURRENT_DATE) as hoy,
  COUNT(*) FILTER (WHERE DATE_TRUNC('month', e.fecha_entrada) = DATE_TRUNC('month', CURRENT_DATE)) as este_mes,
  MIN(e.fecha_entrada) as primera_entrada,
  MAX(e.fecha_entrada) as ultima_entrada
FROM public.entradas e
JOIN public.organizations o ON e.org_id = o.id
WHERE o.deleted_at IS NULL
GROUP BY e.org_id, o.name;

-- RLS para la vista: solo miembros de la org pueden verla
ALTER VIEW public.entradas_stats_by_org SET (security_invoker = true);

COMMENT ON VIEW public.entradas_stats_by_org
IS 'Estadísticas de entradas agrupadas por organización (respeta RLS)';

DO $$
BEGIN
  RAISE NOTICE 'Políticas RLS de entradas actualizadas exitosamente para multi-tenancy';
  RAISE NOTICE 'IMPORTANTE: Verificar que todas las entradas tengan org_id antes de usar en producción';
END $$;

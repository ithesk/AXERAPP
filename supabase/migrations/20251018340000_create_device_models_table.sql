-- =====================================================
-- MIGRATION: Create Device Models Table
-- Description: Catálogo de modelos de dispositivos para agilizar entradas
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

-- Crear tabla de modelos de dispositivos
CREATE TABLE IF NOT EXISTS public.device_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Información del modelo
  model_name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  reference TEXT,

  -- Detalles técnicos comunes
  common_issues TEXT[],
  repair_notes TEXT,
  estimated_repair_time INTEGER, -- en minutos

  -- Estadísticas de uso
  usage_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Comentarios
COMMENT ON TABLE public.device_models IS 'Catálogo de modelos de dispositivos para reutilizar en entradas';
COMMENT ON COLUMN public.device_models.org_id IS 'Organización propietaria del modelo (aislamiento multi-tenant)';
COMMENT ON COLUMN public.device_models.model_name IS 'Nombre del modelo del dispositivo';
COMMENT ON COLUMN public.device_models.brand IS 'Marca o fabricante del dispositivo';
COMMENT ON COLUMN public.device_models.category IS 'Categoría del dispositivo (smartphone, laptop, tablet, etc.)';
COMMENT ON COLUMN public.device_models.reference IS 'Referencia o código del modelo';
COMMENT ON COLUMN public.device_models.common_issues IS 'Problemas comunes reportados para este modelo';
COMMENT ON COLUMN public.device_models.repair_notes IS 'Notas técnicas para reparación de este modelo';
COMMENT ON COLUMN public.device_models.estimated_repair_time IS 'Tiempo estimado de reparación en minutos';
COMMENT ON COLUMN public.device_models.usage_count IS 'Contador de cuántas veces se ha usado este modelo';
COMMENT ON COLUMN public.device_models.deleted_at IS 'Soft delete - si tiene valor, el modelo está archivado';

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_device_models_org_id ON public.device_models(org_id);
CREATE INDEX IF NOT EXISTS idx_device_models_org_brand ON public.device_models(org_id, lower(brand));
CREATE INDEX IF NOT EXISTS idx_device_models_org_category ON public.device_models(org_id, lower(category));
CREATE INDEX IF NOT EXISTS idx_device_models_usage_count ON public.device_models(org_id, usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_device_models_model_name_search ON public.device_models USING gin (to_tsvector('spanish', model_name));

-- Evitar duplicados por modelo dentro de una misma organización
CREATE UNIQUE INDEX IF NOT EXISTS idx_device_models_org_unique
  ON public.device_models(org_id, lower(model_name), COALESCE(lower(brand), ''))
  WHERE deleted_at IS NULL;

-- Trigger para mantener updated_at
DROP TRIGGER IF EXISTS set_device_models_updated_at ON public.device_models;
CREATE TRIGGER set_device_models_updated_at
  BEFORE UPDATE ON public.device_models
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger de seguridad para validar org_id
CREATE OR REPLACE FUNCTION public.prevent_device_model_org_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.org_id <> NEW.org_id THEN
    RAISE EXCEPTION 'No se puede cambiar el org_id de un modelo de dispositivo existente';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = NEW.org_id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'La organización especificada no existe o está eliminada';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_device_model_org_change_trigger ON public.device_models;
CREATE TRIGGER prevent_device_model_org_change_trigger
  BEFORE INSERT OR UPDATE ON public.device_models
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_device_model_org_change();

COMMENT ON FUNCTION public.prevent_device_model_org_change IS 'Evita modificar org_id y valida organización existente para modelos';

-- Habilitar Row Level Security
ALTER TABLE public.device_models ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas previas por idempotencia
DROP POLICY IF EXISTS "Members can view device models in their org" ON public.device_models;
DROP POLICY IF EXISTS "Managers can insert device models in their org" ON public.device_models;
DROP POLICY IF EXISTS "Managers can update device models in their org" ON public.device_models;
DROP POLICY IF EXISTS "Managers can delete device models in their org" ON public.device_models;

-- Política SELECT: todos los miembros activos pueden ver modelos de su organización
CREATE POLICY "Members can view device models in their org"
  ON public.device_models
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND public.user_has_org_access(org_id)
  );

-- Política INSERT: owners, admins y technicians pueden crear modelos
CREATE POLICY "Managers can insert device models in their org"
  ON public.device_models
  FOR INSERT
  WITH CHECK (
    public.user_has_org_access(org_id)
    AND public.user_has_role(org_id, ARRAY['owner', 'admin', 'technician'])
  );

-- Política UPDATE: owners, admins y technicians pueden editar modelos
CREATE POLICY "Managers can update device models in their org"
  ON public.device_models
  FOR UPDATE
  USING (
    deleted_at IS NULL
    AND public.user_has_role(org_id, ARRAY['owner', 'admin', 'technician'])
    AND public.user_has_org_access(org_id)
  )
  WITH CHECK (
    deleted_at IS NULL
    AND public.user_has_role(org_id, ARRAY['owner', 'admin', 'technician'])
    AND public.user_has_org_access(org_id)
  );

-- Política DELETE: solo owners y admins pueden eliminar modelos
CREATE POLICY "Managers can delete device models in their org"
  ON public.device_models
  FOR DELETE
  USING (
    public.user_has_role(org_id, ARRAY['owner', 'admin'])
    AND public.user_has_org_access(org_id)
  );

-- Agregar columna device_model_id a la tabla entradas
ALTER TABLE public.entradas
  ADD COLUMN IF NOT EXISTS device_model_id UUID REFERENCES public.device_models(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.entradas.device_model_id IS 'Modelo de dispositivo asociado a la entrada para reutilización';

CREATE INDEX IF NOT EXISTS idx_entradas_device_model
  ON public.entradas(org_id, device_model_id)
  WHERE device_model_id IS NOT NULL;

-- Función para incrementar usage_count automáticamente
CREATE OR REPLACE FUNCTION public.increment_device_model_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.device_model_id IS NOT NULL AND (
    TG_OP = 'INSERT' OR
    (TG_OP = 'UPDATE' AND (OLD.device_model_id IS NULL OR OLD.device_model_id <> NEW.device_model_id))
  ) THEN
    UPDATE public.device_models
    SET usage_count = usage_count + 1
    WHERE id = NEW.device_model_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS increment_device_model_usage_trigger ON public.entradas;
CREATE TRIGGER increment_device_model_usage_trigger
  AFTER INSERT OR UPDATE ON public.entradas
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_device_model_usage();

COMMENT ON FUNCTION public.increment_device_model_usage IS 'Incrementa el contador de uso cuando se asocia un modelo a una entrada';

DO $$
BEGIN
  RAISE NOTICE '✅ Migración completada: Tabla de modelos de dispositivos creada';
END $$;

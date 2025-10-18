-- =====================================================
-- MIGRATION: Alter Profiles - Add Organization Relation
-- Description: Agregar relación con organizaciones a la tabla profiles
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

-- Agregar columna current_org_id a profiles
-- Esta columna guarda la última organización activa del usuario
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Crear índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_profiles_current_org_id ON public.profiles(current_org_id);

-- Comentario para documentación
COMMENT ON COLUMN public.profiles.current_org_id IS 'Organización actualmente seleccionada por el usuario (última org activa)';

-- Función para establecer automáticamente la organización actual cuando un usuario se une
CREATE OR REPLACE FUNCTION public.auto_set_current_org()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando un usuario se une a una organización (status = 'active')
  -- y no tiene una org actual, establecer esta como la actual
  IF NEW.status = 'active' AND NEW.joined_at IS NOT NULL THEN
    UPDATE public.profiles
    SET current_org_id = NEW.org_id
    WHERE id = NEW.user_id
      AND current_org_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para establecer org actual automáticamente
CREATE TRIGGER auto_set_current_org_trigger
  AFTER INSERT OR UPDATE ON public.org_members
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_current_org();

COMMENT ON FUNCTION public.auto_set_current_org IS 'Establece automáticamente la organización actual si el usuario no tiene una';

-- Vista útil: usuarios con su organización actual
CREATE OR REPLACE VIEW public.profiles_with_org AS
SELECT
  p.*,
  o.id as org_id,
  o.name as org_name,
  o.slug as org_slug,
  o.subscription_plan as org_plan,
  o.subscription_status as org_subscription_status,
  om.role as org_role
FROM public.profiles p
LEFT JOIN public.organizations o ON p.current_org_id = o.id
LEFT JOIN public.org_members om ON om.org_id = o.id AND om.user_id = p.id;

COMMENT ON VIEW public.profiles_with_org IS 'Vista de perfiles con información de su organización actual';

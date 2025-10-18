-- =====================================================
-- MIGRATION: Fix Infinite Recursion in org_members Policy
-- Description: Usa función SECURITY DEFINER para romper recursión
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

-- Paso 1: Crear función helper que bypasea RLS
CREATE OR REPLACE FUNCTION public.org_has_members(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = p_org_id
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.org_has_members(UUID)
IS 'Verifica si una organización tiene miembros - SECURITY DEFINER para evitar recursión en RLS';

-- Paso 2: Eliminar política problemática
DROP POLICY IF EXISTS "Can create org members" ON public.org_members;

-- Paso 3: Crear nueva política usando la función helper
CREATE POLICY "Can create org members"
  ON public.org_members
  FOR INSERT
  WITH CHECK (
    -- CASO 1: Creando el owner inicial (primera membresía de la org)
    (
      role = 'owner'
      AND user_id = auth.uid()
      AND NOT public.org_has_members(org_id)  -- Usa función SECURITY DEFINER
    )
    OR
    -- CASO 2: Un owner/admin existente invitando nuevos miembros
    (
      public.user_has_role(org_id, ARRAY['owner', 'admin'])
    )
  );

COMMENT ON POLICY "Can create org members" ON public.org_members
IS 'Permite crear owner inicial y a owners/admins invitar miembros - usa SECURITY DEFINER para evitar recursión';

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Política de org_members corregida - recursión infinita eliminada';
END $$;

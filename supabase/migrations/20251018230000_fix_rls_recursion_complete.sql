-- =====================================================
-- MIGRATION: Fix All RLS Recursion Issues
-- Description: Elimina completamente la recursión en políticas de org_members
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

-- Paso 1: Eliminar TODAS las políticas existentes de org_members
DROP POLICY IF EXISTS "Can create org members" ON public.org_members;
DROP POLICY IF EXISTS "Admins can invite members" ON public.org_members;
DROP POLICY IF EXISTS "Users can view their org memberships" ON public.org_members;
DROP POLICY IF EXISTS "Admins can update members" ON public.org_members;
DROP POLICY IF EXISTS "Admins can remove members" ON public.org_members;

-- Paso 2: Crear función helper mejorada para verificar membresías sin recursión
CREATE OR REPLACE FUNCTION public.is_org_owner_or_admin(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = p_org_id
      AND user_id = p_user_id
      AND role IN ('owner', 'admin')
      AND status = 'active'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_org_owner_or_admin(UUID, UUID)
IS 'Verifica si un usuario es owner o admin de una org - SECURITY DEFINER para evitar recursión';

-- Paso 3: Crear políticas SIN recursión

-- POLÍTICA SELECT: Los usuarios pueden ver sus propias membresías
CREATE POLICY "Users can view own memberships"
  ON public.org_members
  FOR SELECT
  USING (user_id = auth.uid());

COMMENT ON POLICY "Users can view own memberships" ON public.org_members
IS 'Los usuarios pueden ver solo sus propias membresías';

-- POLÍTICA INSERT: Dos casos sin recursión
CREATE POLICY "Insert org members"
  ON public.org_members
  FOR INSERT
  WITH CHECK (
    -- CASO 1: Crear owner inicial (cuando NO existe membresía para esa org)
    (
      role = 'owner'
      AND user_id = auth.uid()
      AND NOT public.org_has_members(org_id)
    )
    OR
    -- CASO 2: Owner/Admin invitando (verifica usando función SECURITY DEFINER)
    (
      public.is_org_owner_or_admin(org_id, auth.uid())
    )
  );

COMMENT ON POLICY "Insert org members" ON public.org_members
IS 'Permite crear owner inicial o que owners/admins inviten miembros';

-- POLÍTICA UPDATE: Solo owners/admins pueden actualizar
CREATE POLICY "Update org members"
  ON public.org_members
  FOR UPDATE
  USING (
    public.is_org_owner_or_admin(org_id, auth.uid())
  );

COMMENT ON POLICY "Update org members" ON public.org_members
IS 'Solo owners/admins pueden actualizar membresías';

-- POLÍTICA DELETE: Solo owners/admins pueden eliminar (excepto al owner)
CREATE POLICY "Delete org members"
  ON public.org_members
  FOR DELETE
  USING (
    role != 'owner' -- No se puede eliminar al owner
    AND public.is_org_owner_or_admin(org_id, auth.uid())
  );

COMMENT ON POLICY "Delete org members" ON public.org_members
IS 'Solo owners/admins pueden eliminar membresías (excepto al owner)';

-- Paso 4: Verificar que las funciones helper existen
-- Si org_has_members no existe, crearla
CREATE OR REPLACE FUNCTION public.org_has_members(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = p_org_id
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.org_has_members(UUID)
IS 'Verifica si una organización tiene miembros - SECURITY DEFINER';

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Todas las políticas RLS de org_members recreadas sin recursión';
END $$;

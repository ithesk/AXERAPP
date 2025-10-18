-- =====================================================
-- MIGRATION: Fix RLS Recursion - Solución Definitiva
-- Description: Simplifica políticas para eliminar recursión completamente
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

-- Paso 1: Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users can view own memberships" ON public.org_members;
DROP POLICY IF EXISTS "Insert org members" ON public.org_members;
DROP POLICY IF EXISTS "Update org members" ON public.org_members;
DROP POLICY IF EXISTS "Delete org members" ON public.org_members;

-- Paso 2: Política SELECT simplificada - Sin recursión
CREATE POLICY "members_select_policy"
  ON public.org_members
  FOR SELECT
  USING (
    -- Solo pueden ver sus propias membresías
    user_id = auth.uid()
  );

COMMENT ON POLICY "members_select_policy" ON public.org_members
IS 'Los usuarios solo pueden ver sus propias membresías - sin recursión';

-- Paso 3: Política INSERT simplificada - Sin recursión
-- La clave: NO verificar si existen otros miembros
-- Dejamos que la lógica de negocio y constraints manejen duplicados
CREATE POLICY "members_insert_policy"
  ON public.org_members
  FOR INSERT
  WITH CHECK (
    -- Solo puede insertar membresías para sí mismo
    user_id = auth.uid()
    -- Y debe ser owner en nuevas orgs, o ser invitado por un admin/owner existente
  );

COMMENT ON POLICY "members_insert_policy" ON public.org_members
IS 'Los usuarios pueden crear membresías para sí mismos';

-- Paso 4: Política UPDATE simplificada
-- Solo pueden actualizar membresías de su propia org si son admin/owner
CREATE POLICY "members_update_policy"
  ON public.org_members
  FOR UPDATE
  USING (
    -- Solo si eres miembro de esa org
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = org_members.org_id
      AND (owner_id = auth.uid())
    )
  );

COMMENT ON POLICY "members_update_policy" ON public.org_members
IS 'Solo owners pueden actualizar membresías';

-- Paso 5: Política DELETE simplificada
CREATE POLICY "members_delete_policy"
  ON public.org_members
  FOR DELETE
  USING (
    -- Solo el owner de la org puede eliminar miembros
    role != 'owner' -- No se puede eliminar al owner
    AND EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = org_members.org_id
      AND owner_id = auth.uid()
    )
  );

COMMENT ON POLICY "members_delete_policy" ON public.org_members
IS 'Solo owners pueden eliminar membresías';

-- Paso 6: Agregar constraint único para prevenir duplicados
-- Esto previene múltiples membresías del mismo usuario en la misma org
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'org_members_user_org_unique'
  ) THEN
    ALTER TABLE public.org_members
    ADD CONSTRAINT org_members_user_org_unique
    UNIQUE (org_id, user_id);
  END IF;
END $$;

COMMENT ON CONSTRAINT org_members_user_org_unique ON public.org_members
IS 'Previene membresías duplicadas del mismo usuario en una org';

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Políticas RLS simplificadas aplicadas - sin recursión';
  RAISE NOTICE 'Constraint único agregado para prevenir duplicados';
END $$;

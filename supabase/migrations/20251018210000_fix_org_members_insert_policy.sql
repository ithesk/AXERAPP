-- =====================================================
-- MIGRATION: Fix org_members Insert Policy for Owner Creation
-- Description: Permite crear el primer member (owner) al crear organización
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

-- Eliminar política existente que causa el problema
DROP POLICY IF EXISTS "Admins can invite members" ON public.org_members;

-- Nueva política que permite:
-- 1. Crear el primer miembro (owner) cuando se crea una organización
-- 2. Owners/Admins pueden invitar nuevos miembros
CREATE POLICY "Can create org members"
  ON public.org_members
  FOR INSERT
  WITH CHECK (
    -- CASO 1: El usuario está creando una organización y siendo owner
    -- (cuando el org_members no tiene ningún miembro aún)
    (
      role = 'owner'
      AND user_id = auth.uid()
      AND NOT EXISTS (
        SELECT 1 FROM public.org_members
        WHERE org_id = org_members.org_id
      )
    )
    OR
    -- CASO 2: Un owner/admin existente está invitando un nuevo miembro
    (
      EXISTS (
        SELECT 1 FROM public.org_members AS existing
        WHERE existing.org_id = org_members.org_id
          AND existing.user_id = auth.uid()
          AND existing.role IN ('owner', 'admin')
          AND existing.status = 'active'
      )
    )
  );

COMMENT ON POLICY "Can create org members" ON public.org_members
IS 'Permite crear el owner inicial al crear org, y permite a owners/admins invitar miembros';

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Política de org_members actualizada correctamente para permitir creación de owner inicial';
END $$;

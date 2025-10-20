-- =====================================================
-- FIX: Corregir política UPDATE de entradas
-- Description: Soluciona el error "more than one row returned by a subquery"
-- =====================================================

BEGIN;

-- Eliminar la política problemática
DROP POLICY IF EXISTS "Technicians can update entradas in their org" ON public.entradas;

-- Recrear la política UPDATE sin el subquery problemático
-- El org_id no debe cambiar, esto ya está protegido por el trigger prevent_org_id_change_trigger
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
    -- El usuario debe seguir teniendo acceso a la organización
    -- No verificamos el org_id aquí porque el trigger prevent_org_id_change_trigger
    -- ya previene cambios de org_id
    public.user_has_org_access(org_id)
    AND public.user_has_role(org_id, ARRAY['owner', 'admin', 'technician'])
  );

COMMENT ON POLICY "Technicians can update entradas in their org" ON public.entradas
IS 'Solo technicians, admins y owners pueden actualizar entradas de su organización. El cambio de org_id está prevenido por trigger.';

-- Verificar que el trigger prevent_org_id_change_trigger existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.triggers
    WHERE trigger_name = 'prevent_org_id_change_trigger'
    AND event_object_table = 'entradas'
  ) THEN
    RAISE NOTICE '✅ SUCCESS: UPDATE policy fixed!';
    RAISE NOTICE '';
    RAISE NOTICE 'La política de UPDATE ahora funciona correctamente.';
    RAISE NOTICE 'El trigger prevent_org_id_change_trigger protege contra cambios de org_id.';
    RAISE NOTICE '';
  ELSE
    RAISE WARNING 'ADVERTENCIA: El trigger prevent_org_id_change_trigger no existe.';
    RAISE WARNING 'Asegúrate de aplicar la migración 20251018200000_update_entradas_rls_policies.sql';
  END IF;
END $$;

COMMIT;

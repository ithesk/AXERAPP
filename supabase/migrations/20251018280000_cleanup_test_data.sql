-- =====================================================
-- MIGRATION: Limpiar datos de prueba
-- Description: Elimina organizaciones de prueba para testing limpio
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

-- Eliminar membresías de prueba
DELETE FROM public.org_members
WHERE org_id IN (
  SELECT id FROM public.organizations
  WHERE created_at > NOW() - INTERVAL '1 hour'
);

-- Eliminar organizaciones de prueba creadas en la última hora
DELETE FROM public.organizations
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Limpiar logs de debug
TRUNCATE TABLE public.debug_log;

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Datos de prueba eliminados';
  RAISE NOTICE 'Sistema listo para testing con RLS';
  RAISE NOTICE '========================================';
END $$;

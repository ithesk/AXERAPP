-- =====================================================
-- SCRIPT CONSOLIDADO: Aplicar Todas las Migraciones Multi-Tenant
-- Ejecutar en Supabase Dashboard > SQL Editor
-- =====================================================

-- Este script aplica todas las migraciones multi-tenant en el orden correcto
-- Puedes copiar y pegar TODO este archivo en el SQL Editor

BEGIN;

-- =====================================================
-- PASO 0: Verificar estado actual
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════════════════╗';
  RAISE NOTICE '║   APLICANDO MIGRACIONES MULTI-TENANT AXER       ║';
  RAISE NOTICE '╚══════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Iniciando proceso de migración...';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- PASO 1: Limpiar políticas antiguas (20251018090000)
-- =====================================================
RAISE NOTICE '→ Paso 1/12: Limpiando políticas RLS antiguas...';

DROP POLICY IF EXISTS "Users can view all entradas" ON public.entradas;
DROP POLICY IF EXISTS "Users can insert entradas" ON public.entradas;
DROP POLICY IF EXISTS "Users can update entradas" ON public.entradas;
DROP POLICY IF EXISTS "Users can delete entradas" ON public.entradas;

DROP TRIGGER IF EXISTS trigger_set_id_reparacion ON public.entradas;
DROP FUNCTION IF EXISTS public.set_id_reparacion();
DROP FUNCTION IF EXISTS public.generate_id_reparacion();

RAISE NOTICE '✅ Políticas antiguas eliminadas';

-- =====================================================
-- PASO 2: Crear tabla organizations (20251018100000)
-- =====================================================
\ir 20251018100000_create_organizations_table.sql

-- =====================================================
-- PASO 3: Crear tabla org_members (20251018110000)
-- =====================================================
\ir 20251018110000_create_org_members_table.sql

-- =====================================================
-- PASO 4: Crear tabla invitations (20251018120000)
-- =====================================================
\ir 20251018120000_create_invitations_table.sql

-- =====================================================
-- PASO 5: Crear tabla subscription_plans (20251018130000)
-- =====================================================
\ir 20251018130000_create_subscription_plans_table.sql

-- =====================================================
-- PASO 6: Crear tabla org_settings (20251018140000)
-- =====================================================
\ir 20251018140000_create_org_settings_table.sql

-- =====================================================
-- PASO 7: Crear tabla audit_logs (20251018150000)
-- =====================================================
\ir 20251018150000_create_audit_logs_table.sql

-- =====================================================
-- PASO 8: Modificar profiles (20251018160000)
-- =====================================================
\ir 20251018160000_alter_profiles_add_org_relation.sql

-- =====================================================
-- PASO 9: Modificar entradas con org_id (20251018170000)
-- =====================================================
\ir 20251018170000_alter_entradas_add_org_id.sql

-- =====================================================
-- PASO 10: Crear función generate_entrada_id (20251018180000)
-- =====================================================
\ir 20251018180000_create_generate_entrada_id_function.sql

-- =====================================================
-- PASO 11: Crear funciones RLS helper (20251018190000)
-- =====================================================
\ir 20251018190000_create_rls_helper_functions.sql

-- =====================================================
-- PASO 12: Actualizar políticas RLS de entradas (20251018200000)
-- =====================================================
\ir 20251018200000_update_entradas_rls_policies.sql

-- =====================================================
-- FINAL: Confirmar
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════════════════╗';
  RAISE NOTICE '║   ✅ MIGRACIONES COMPLETADAS EXITOSAMENTE       ║';
  RAISE NOTICE '╚══════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos pasos:';
  RAISE NOTICE '1. Ejecutar verify_migration.sql para verificar';
  RAISE NOTICE '2. Continuar con Fase 2: TypeScript Types';
  RAISE NOTICE '';
END $$;

COMMIT;

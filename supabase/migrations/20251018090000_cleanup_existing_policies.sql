-- =====================================================
-- MIGRATION: Cleanup Existing Policies (Pre-Migration)
-- Description: Limpia políticas RLS antiguas antes de implementar multi-tenant
-- Author: AXER Team
-- Date: 2025-01-18
-- IMPORTANTE: Ejecutar ANTES de las migraciones multi-tenant
-- =====================================================

-- Este script limpia las políticas RLS permisivas existentes
-- para permitir la creación de nuevas políticas multi-tenant estrictas

DO $$
BEGIN
  RAISE NOTICE 'Limpiando políticas RLS existentes de la tabla entradas...';
END $$;

-- Eliminar políticas existentes en la tabla entradas
DROP POLICY IF EXISTS "Users can view all entradas" ON public.entradas;
DROP POLICY IF EXISTS "Users can insert entradas" ON public.entradas;
DROP POLICY IF EXISTS "Users can update entradas" ON public.entradas;
DROP POLICY IF EXISTS "Users can delete entradas" ON public.entradas;

-- También eliminar variantes en español por si existen
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver entradas" ON public.entradas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar entradas" ON public.entradas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar entradas" ON public.entradas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar entradas" ON public.entradas;

-- Eliminar el trigger antiguo de generación de ID (será reemplazado)
DROP TRIGGER IF EXISTS trigger_set_id_reparacion ON public.entradas;
DROP FUNCTION IF EXISTS public.set_id_reparacion();
DROP FUNCTION IF EXISTS public.generate_id_reparacion();

DO $$
BEGIN
  RAISE NOTICE '✅ Políticas antiguas eliminadas correctamente';
  RAISE NOTICE '⚠️  La tabla entradas queda SIN políticas RLS temporalmente';
  RAISE NOTICE '✅ Las nuevas políticas multi-tenant se crearán en migraciones posteriores';
  RAISE NOTICE '';
  RAISE NOTICE 'Continúa con las siguientes migraciones en orden:';
  RAISE NOTICE '  1. 20251018100000_create_organizations_table.sql';
  RAISE NOTICE '  2. 20251018110000_create_org_members_table.sql';
  RAISE NOTICE '  ... (ver README.md para orden completo)';
END $$;

-- =====================================================
-- VERIFICACIÓN: Sistema de Notificaciones
-- Description: Script para verificar que todas las
--              funciones y triggers estén correctamente
--              configurados en la base de datos
-- =====================================================

-- =====================================================
-- Verificar Funciones Helper
-- =====================================================
SELECT
  'get_org_admins_and_owners' as function_name,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ EXISTE'
    ELSE '❌ NO EXISTE'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_org_admins_and_owners'

UNION ALL

SELECT
  'find_org_member_user_id' as function_name,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ EXISTE'
    ELSE '❌ NO EXISTE'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'find_org_member_user_id'

UNION ALL

SELECT
  'notify_entrada_status_change' as function_name,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ EXISTE'
    ELSE '❌ NO EXISTE'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'notify_entrada_status_change'

UNION ALL

SELECT
  'notify_new_entrada' as function_name,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ EXISTE'
    ELSE '❌ NO EXISTE'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'notify_new_entrada'

UNION ALL

SELECT
  'notify_technician_change' as function_name,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ EXISTE'
    ELSE '❌ NO EXISTE'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'notify_technician_change';

-- =====================================================
-- Verificar Triggers
-- =====================================================
SELECT
  tgname as trigger_name,
  '✅ ACTIVO' as status,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname IN (
  'trg_notify_entrada_status_change',
  'trg_notify_new_entrada',
  'trg_notify_technician_change'
)
AND tgrelid = 'public.entradas'::regclass;

-- =====================================================
-- Verificar Tabla de Notificaciones
-- =====================================================
SELECT
  'notifications' as table_name,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ EXISTE'
    ELSE '❌ NO EXISTE'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'notifications';

-- =====================================================
-- Contar Notificaciones Existentes
-- =====================================================
SELECT
  'Total de notificaciones' as metric,
  COUNT(*)::text as value
FROM public.notifications;

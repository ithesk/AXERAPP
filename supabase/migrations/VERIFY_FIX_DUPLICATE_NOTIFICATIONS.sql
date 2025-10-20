-- =====================================================
-- VERIFICACIÓN: Fix de notificaciones duplicadas
-- Description: Verifica que las funciones de notificación
--              excluyan correctamente al técnico de las
--              notificaciones a admins/owners
-- =====================================================

-- 1. Verificar que las funciones existen
SELECT
  proname as function_name,
  prosrc LIKE '%WHERE admin_user.user_id != COALESCE(v_technician_id%' as has_exclusion_filter
FROM pg_proc
WHERE proname IN (
  'notify_entrada_status_change',
  'notify_new_entrada',
  'notify_bitacora_comment'
)
ORDER BY proname;

-- Resultado esperado:
-- Todas las funciones deben tener has_exclusion_filter = true

-- 2. Verificar que el filtro de exclusión está en las funciones
SELECT
  proname as function_name,
  CASE
    WHEN prosrc LIKE '%WHERE admin_user.user_id != COALESCE(v_technician_id%'
    THEN '✅ CORRECTO - Excluye técnico de notificaciones a admins'
    ELSE '❌ ERROR - NO excluye técnico, puede generar duplicados'
  END as status
FROM pg_proc
WHERE proname IN (
  'notify_entrada_status_change',
  'notify_new_entrada',
  'notify_bitacora_comment'
)
ORDER BY proname;

-- 3. Ver el código completo de las funciones para inspección manual
\echo '=== FUNCIÓN: notify_entrada_status_change ==='
SELECT prosrc FROM pg_proc WHERE proname = 'notify_entrada_status_change';

\echo '=== FUNCIÓN: notify_new_entrada ==='
SELECT prosrc FROM pg_proc WHERE proname = 'notify_new_entrada';

\echo '=== FUNCIÓN: notify_bitacora_comment ==='
SELECT prosrc FROM pg_proc WHERE proname = 'notify_bitacora_comment';

-- 4. Verificar que los triggers están activos
SELECT
  t.tgname as trigger_name,
  p.proname as function_name,
  c.relname as table_name,
  CASE t.tgenabled
    WHEN 'O' THEN '✅ Activo'
    WHEN 'D' THEN '❌ Desactivado'
    ELSE '⚠️ Desconocido'
  END as status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE p.proname IN (
  'notify_entrada_status_change',
  'notify_new_entrada',
  'notify_technician_change',
  'notify_bitacora_comment'
)
ORDER BY c.relname, t.tgname;

\echo '✅ Verificación completa. Revisa que:'
\echo '   1. Todas las funciones tengan has_exclusion_filter = true'
\echo '   2. El status de cada función sea "CORRECTO"'
\echo '   3. Todos los triggers estén "Activo"'

-- =====================================================
-- Script de Verificación Post-Migración
-- Ejecutar DESPUÉS de aplicar todas las migraciones
-- =====================================================

-- Banner
SELECT '
╔══════════════════════════════════════════════════╗
║   VERIFICACIÓN DE MIGRACIONES MULTI-TENANT      ║
║              AXER SaaS v1.0                      ║
╚══════════════════════════════════════════════════╝
' as "";

-- 1. VERIFICAR TABLAS CREADAS
SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  1. Verificando Tablas Creadas
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' as "";

SELECT
  CASE
    WHEN COUNT(*) = 7 THEN '✅ TODAS LAS TABLAS CREADAS'
    ELSE '❌ FALTAN TABLAS: ' || (7 - COUNT(*))::TEXT
  END as resultado
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'organizations',
    'org_members',
    'invitations',
    'subscription_plans',
    'org_settings',
    'audit_logs',
    'contacts'
  );

SELECT
  '  - ' || table_name as tabla_creada
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'organizations',
    'org_members',
    'invitations',
    'subscription_plans',
    'org_settings',
    'audit_logs',
    'contacts'
  )
ORDER BY table_name;

-- 2. VERIFICAR COLUMNAS AGREGADAS
SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  2. Verificando Columnas Agregadas
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' as "";

SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'profiles' AND column_name = 'current_org_id'
    ) THEN '✅ profiles.current_org_id'
    ELSE '❌ profiles.current_org_id FALTA'
  END as resultado;

SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'entradas' AND column_name = 'org_id'
    ) THEN '✅ entradas.org_id'
    ELSE '❌ entradas.org_id FALTA'
  END as resultado;

SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'entradas' AND column_name = 'contact_id'
    ) THEN '✅ entradas.contact_id'
    ELSE '❌ entradas.contact_id FALTA'
  END as resultado;

SELECT
  CASE
    WHEN (
      SELECT COUNT(*)
      FROM information_schema.columns
      WHERE table_name = 'entradas'
        AND column_name IN (
          'imei_sn',
          'device_passwords',
          'battery_condition',
          'check_face_id',
          'check_signal',
          'check_wifi',
          'check_screen',
          'check_true_tone',
          'check_touch',
          'check_camera',
          'check_microphone',
          'check_speaker',
          'check_charging',
          'check_buttons',
          'check_panic',
          'check_screws',
          'check_earpiece',
          'check_no_sim',
          'check_flash',
          'check_front_camera'
        )
    ) = 20
    THEN '✅ entradas: campos de intake del dispositivo creados'
    ELSE '❌ entradas: faltan campos de intake del dispositivo'
  END as resultado;

-- 3. VERIFICAR PLANES DE SUSCRIPCIÓN
SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  3. Verificando Planes de Suscripción
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' as "";

SELECT
  CASE
    WHEN COUNT(*) = 4 THEN '✅ TODOS LOS PLANES INSERTADOS'
    ELSE '❌ FALTAN PLANES: ' || (4 - COUNT(*))::TEXT
  END as resultado
FROM subscription_plans;

SELECT
  '  ' ||
  CASE
    WHEN id = 'free' THEN '🆓'
    WHEN id = 'starter' THEN '🚀'
    WHEN id = 'professional' THEN '💼'
    WHEN id = 'enterprise' THEN '🏢'
  END ||
  ' ' || id || ': ' || name ||
  ' ($' || COALESCE(price_monthly::TEXT, 'custom') || '/mes) - ' ||
  max_users::TEXT || ' usuarios, ' ||
  max_entradas_per_month::TEXT || ' entradas/mes'
  as plan_info
FROM subscription_plans
ORDER BY sort_order;

-- 4. VERIFICAR FUNCIONES RLS
SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  4. Verificando Funciones RLS Helper
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' as "";

SELECT
  CASE
    WHEN COUNT(*) >= 5 THEN '✅ FUNCIONES RLS CREADAS: ' || COUNT(*)::TEXT
    ELSE '❌ FALTAN FUNCIONES RLS'
  END as resultado
FROM information_schema.routines
WHERE routine_schema = 'auth'
  AND routine_name LIKE 'user_%';

SELECT
  '  - ' || routine_name as funcion_creada
FROM information_schema.routines
WHERE routine_schema = 'auth'
  AND routine_name LIKE 'user_%'
ORDER BY routine_name;

-- 5. VERIFICAR FUNCIONES PÚBLICAS
SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  5. Verificando Funciones Públicas
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' as "";

SELECT
  CASE
    WHEN COUNT(*) >= 8 THEN '✅ FUNCIONES PÚBLICAS CREADAS: ' || COUNT(*)::TEXT
    ELSE '⚠️  FUNCIONES PÚBLICAS: ' || COUNT(*)::TEXT
  END as resultado
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'generate_entrada_id',
    'create_audit_log',
    'accept_invitation',
    'can_create_entrada',
    'can_add_user',
    'org_has_module',
    'check_org_limit'
  );

-- 6. VERIFICAR POLÍTICAS RLS
SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  6. Verificando Políticas RLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' as "";

-- Verificar RLS habilitado en tablas críticas
SELECT
  schemaname || '.' || tablename as tabla,
  CASE
    WHEN rowsecurity THEN '✅ RLS Habilitado'
    ELSE '❌ RLS NO HABILITADO'
  END as estado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'organizations',
    'org_members',
    'invitations',
    'org_settings',
    'audit_logs',
    'entradas',
    'profiles',
    'contacts'
  )
ORDER BY tablename;

-- Contar políticas por tabla
SELECT '
  Políticas por Tabla:
' as "";

SELECT
  tablename as tabla,
  COUNT(*) as num_policies,
  CASE
    WHEN COUNT(*) >= 3 THEN '✅'
    WHEN COUNT(*) >= 1 THEN '⚠️ '
    ELSE '❌'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'organizations',
    'org_members',
    'invitations',
    'org_settings',
    'audit_logs',
    'entradas',
    'contacts'
  )
GROUP BY tablename
ORDER BY tablename;

-- 7. VERIFICAR ÍNDICES
SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  7. Verificando Índices de Performance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' as "";

SELECT
  tablename as tabla,
  COUNT(*) as num_indices,
  CASE
    WHEN COUNT(*) >= 2 THEN '✅'
    ELSE '⚠️ '
  END as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'organizations',
    'org_members',
    'invitations',
    'entradas',
    'audit_logs',
    'contacts'
  )
GROUP BY tablename
ORDER BY tablename;

-- 8. VERIFICAR INTEGRIDAD DE DATOS
SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  8. Verificando Integridad de Datos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' as "";

-- Verificar que todas las entradas tengan org_id
SELECT
  CASE
    WHEN COUNT(*) = COUNT(org_id) THEN
      '✅ Todas las entradas tienen org_id (' || COUNT(*)::TEXT || ' entradas)'
    ELSE
      '❌ ' || (COUNT(*) - COUNT(org_id))::TEXT || ' entradas sin org_id'
  END as resultado
FROM entradas;

-- Verificar relaciones FK
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✅ No hay entradas huérfanas (sin org válida)'
    ELSE '❌ ' || COUNT(*)::TEXT || ' entradas con org_id inválido'
  END as resultado
FROM entradas e
WHERE NOT EXISTS (
  SELECT 1 FROM organizations o WHERE o.id = e.org_id
);

-- Verificar contactos con organizaciones válidas
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✅ No hay contactos huérfanos (sin org válida)'
    ELSE '❌ ' || COUNT(*)::TEXT || ' contactos con org_id inválido'
  END as resultado
FROM contacts c
WHERE NOT EXISTS (
  SELECT 1 FROM organizations o WHERE o.id = c.org_id
);

-- 9. VERIFICAR TRIGGERS
SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  9. Verificando Triggers
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' as "";

SELECT
  event_object_table as tabla,
  trigger_name,
  '✅' as status
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN (
    'organizations',
    'org_members',
    'org_settings',
    'entradas',
    'audit_logs',
    'contacts'
  )
ORDER BY event_object_table, trigger_name;

-- 10. RESUMEN FINAL
SELECT '
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  10. RESUMEN FINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
' as "";

SELECT
  '📊 Total de Tablas Multi-Tenant: ' || COUNT(*)::TEXT as estadistica
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'organizations',
    'org_members',
    'invitations',
    'subscription_plans',
    'org_settings',
    'audit_logs',
    'contacts'
  )
UNION ALL
SELECT
  '👥 Total de Organizaciones: ' || COUNT(*)::TEXT
FROM organizations
UNION ALL
SELECT
  '📝 Total de Entradas: ' || COUNT(*)::TEXT
FROM entradas
UNION ALL
SELECT
  '👤 Total de Contactos: ' || COUNT(*)::TEXT
FROM contacts
UNION ALL
SELECT
  '🔐 Total de Políticas RLS: ' || COUNT(*)::TEXT
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT
  '⚙️  Total de Funciones Helper: ' || COUNT(*)::TEXT
FROM information_schema.routines
WHERE routine_schema IN ('auth', 'public')
  AND (
    routine_name LIKE 'user_%'
    OR routine_name LIKE 'generate_%'
    OR routine_name LIKE 'can_%'
    OR routine_name LIKE '%_org%'
  );

-- Mensaje final
SELECT '
╔══════════════════════════════════════════════════╗
║                                                  ║
║  ✅ VERIFICACIÓN COMPLETADA                      ║
║                                                  ║
║  Si todos los items muestran ✅, la migración    ║
║  se aplicó correctamente y el sistema está      ║
║  listo para multi-tenancy.                       ║
║                                                  ║
║  Próximos pasos:                                 ║
║  1. Implementar OrganizationContext (Frontend)   ║
║  2. Actualizar hooks (useEntradas)               ║
║  3. Crear componentes UI (OrgSwitcher)           ║
║  4. Integrar Stripe para facturación             ║
║                                                  ║
╚══════════════════════════════════════════════════╝
' as "";

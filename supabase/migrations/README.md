# Migraciones de Base de Datos - AXER SaaS Multi-Tenant

Este directorio contiene todas las migraciones de base de datos para transformar AXER en un sistema SaaS multi-tenant completo.

## 📋 Orden de Ejecución

Las migraciones deben ejecutarse en el siguiente orden:

### Migraciones Base (Ya aplicadas)
1. `20251017222400_create_profiles_table.sql` - Tabla de perfiles de usuario
2. `20251018000000_create_entradas_table.sql` - Tabla de entradas/reparaciones

### Nuevas Migraciones Multi-Tenant (Fase 1)

3. **`20251018095000_create_handle_updated_at_function.sql`**
   - Función genérica `public.handle_updated_at()`
   - Reutilizada por todos los triggers `BEFORE UPDATE`

4. **`20251018100000_create_organizations_table.sql`**
   - Tabla principal de organizaciones/tenants
   - Configuración de suscripciones y planes
   - Límites por plan
   - Integración con Stripe

5. **`20251018110000_create_org_members_table.sql`**
   - Tabla de membresías usuario-organización
   - Sistema de roles (owner, admin, technician, viewer)
   - Estados de membresía (active, invited, suspended)

6. **`20251018120000_create_invitations_table.sql`**
   - Sistema de invitaciones por email
   - Tokens únicos con expiración
   - Función `accept_invitation()` para aceptar invitaciones

7. **`20251018130000_create_subscription_plans_table.sql`**
   - Catálogo de planes disponibles (free, starter, professional, enterprise)
   - Precios y límites por plan
   - Features incluidos en cada plan

8. **`20251018140000_create_org_settings_table.sql`**
   - Configuraciones personalizadas por organización
   - Branding, facturación, notificaciones
   - Campos personalizados por módulo

9. **`20251018150000_create_audit_logs_table.sql`**
   - Sistema completo de auditoría
   - Tracking automático de cambios en entradas
   - Funciones helper para crear logs

10. **`20251018160000_alter_profiles_add_org_relation.sql`**
   - Agregar `current_org_id` a profiles
   - Vista `profiles_with_org`
   - Auto-establecer organización actual

11. **`20251018170000_alter_entradas_add_org_id.sql`** ⚠️ CRÍTICO
    - Agregar `org_id` a entradas (aislamiento multi-tenant)
    - Migración automática de datos existentes
    - Actualizar constraints e índices

12. **`20251018180000_create_generate_entrada_id_function.sql`**
    - Función para generar IDs únicos por organización
    - Formato: `PREFIX-YYYYMMDD-SEQUENCE`
    - Trigger auto-generación de IDs

13. **`20251018190000_create_rls_helper_functions.sql`**
    - Funciones auxiliares para RLS
    - Verificación de permisos y roles
    - Verificación de límites del plan

14. **`20251018200000_update_entradas_rls_policies.sql`** ⚠️ CRÍTICO
15. **`20251018310000_restore_multi_tenant_security.sql`**
    - Rehabilita RLS en org_members y entradas después del debug
    - Restaura funciones helper y políticas definitivas
    - Limpia artefactos de depuración
    - Políticas RLS estrictas multi-tenant
    - Aislamiento completo entre organizaciones
    - Triggers de seguridad

## 🚀 Cómo Aplicar las Migraciones

### Opción 1: Supabase CLI (Recomendado)

```bash
# 1. Asegurarse de tener Supabase CLI instalado
npm install -g supabase

# 2. Linkear con tu proyecto de Supabase
supabase link --project-ref TU_PROJECT_REF

# 3. Aplicar todas las migraciones pendientes
supabase db push

# 4. Verificar el estado
supabase db diff
```

### Opción 2: Supabase Dashboard (Manual)

1. Ve a tu proyecto en [app.supabase.com](https://app.supabase.com)
2. Navega a **SQL Editor**
3. Copia y pega el contenido de cada archivo SQL **en orden**
4. Ejecuta cada migración una por una
5. Verifica que no haya errores en el output

### Opción 3: Script Automatizado

```bash
# Ejecutar todas las migraciones desde la terminal
cd supabase/migrations

# Para cada archivo en orden
for file in 202510181*.sql; do
  echo "Aplicando $file..."
  psql $DATABASE_URL -f $file
done
```

## ⚠️ IMPORTANTE - Antes de Aplicar en Producción

### 1. Backup de Base de Datos
```bash
# Hacer backup completo antes de migrar
supabase db dump > backup_pre_migration_$(date +%Y%m%d).sql
```

### 2. Revisar Datos Existentes

La migración `20251018170000_alter_entradas_add_org_id.sql` **creará automáticamente** una "Organización de Migración" y asignará todas las entradas existentes a ella.

**En producción, deberías:**
- Revisar los datos existentes
- Decidir cómo agrupar las entradas por organización
- Modificar el script de migración según tus necesidades

### 3. Verificar Variables de Entorno

Asegúrate de tener configurado:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📊 Verificación Post-Migración

Después de aplicar las migraciones, verifica que todo funcione:

```sql
-- 1. Verificar que las tablas se crearon correctamente
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'organizations',
    'org_members',
    'invitations',
    'subscription_plans',
    'org_settings',
    'audit_logs'
  );

-- 2. Verificar que los planes se insertaron
SELECT id, name, price_monthly, max_users, max_entradas_per_month
FROM subscription_plans
ORDER BY sort_order;

-- 3. Verificar que las entradas tienen org_id
SELECT
  COUNT(*) as total_entradas,
  COUNT(org_id) as entradas_con_org,
  COUNT(*) - COUNT(org_id) as entradas_sin_org
FROM entradas;

-- 4. Verificar funciones RLS
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'auth'
  AND routine_name LIKE 'user_%';

-- 5. Verificar políticas RLS de entradas
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'entradas';
```

## 🔒 Seguridad

Las migraciones incluyen:

- ✅ Row Level Security (RLS) en todas las tablas
- ✅ Aislamiento estricto entre tenants
- ✅ Verificación de roles y permisos
- ✅ Validación de límites por plan
- ✅ Prevención de cambios de `org_id`
- ✅ Auditoría automática de cambios
- ✅ Funciones con `SECURITY DEFINER` para operaciones privilegiadas

## 📝 Estructura de Base de Datos Final

```
┌─────────────────┐
│ auth.users      │ (Supabase Auth)
└────────┬────────┘
         │
         ├─────────────┐
         │             │
┌────────▼────────┐   │
│ profiles        │   │
│ + current_org_id│   │
└────────┬────────┘   │
         │            │
         │            │
┌────────▼────────────▼─────┐
│ organizations             │
│ + subscription_plan       │
│ + modules_enabled         │
│ + stripe_customer_id      │
└────────┬──────────────────┘
         │
         ├──────────────┬──────────────┬──────────────┬
         │              │              │              │
┌────────▼────────┐ ┌──▼─────────┐ ┌──▼────────┐ ┌──▼────────┐
│ org_members     │ │ entradas   │ │ org_      │ │ audit_    │
│ + role          │ │ + org_id   │ │ settings  │ │ logs      │
│ + status        │ │ (TENANT!)  │ │           │ │           │
└─────────────────┘ └────────────┘ └───────────┘ └───────────┘
         │
┌────────▼────────┐
│ invitations     │
│ + token         │
│ + expires_at    │
└─────────────────┘
```

## 🎯 Próximos Pasos

Después de aplicar las migraciones de Fase 1, continúa con:

1. **Fase 2**: Implementar TypeScript types
2. **Fase 3**: Crear OrganizationContext
3. **Fase 4**: Actualizar hooks (useEntradas, etc.)
4. **Fase 5**: Componentes UI (OrgSwitcher, etc.)
5. **Fase 6**: Integración con Stripe
6. **Fase 7**: Flujo de onboarding

## 🐛 Troubleshooting

### Error: "relation already exists"
Las migraciones usan `IF NOT EXISTS` y `IF EXISTS`, por lo que son idempotentes. Puedes ejecutarlas múltiples veces sin problemas.

### Error: "violates foreign key constraint"
Asegúrate de ejecutar las migraciones en el orden correcto. Las dependencias están documentadas en cada archivo.

### Error: "permission denied for schema auth"
Las funciones RLS usan el schema `auth`. Esto es normal en Supabase y las funciones tienen `SECURITY DEFINER`.

### Performance lenta después de migración
Ejecuta `ANALYZE` en todas las tablas:
```sql
ANALYZE organizations;
ANALYZE org_members;
ANALYZE entradas;
ANALYZE audit_logs;
```

## 📞 Soporte

Si encuentras problemas durante la migración:
1. Revisa los logs de Supabase
2. Verifica que no haya datos inconsistentes
3. Consulta la documentación de cada migración (comentarios en archivos .sql)

---

**Creado por**: AXER Team
**Fecha**: 2025-01-18
**Versión**: 1.0.0 - Multi-Tenant SaaS Migration

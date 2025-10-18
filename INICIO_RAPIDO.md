# 🚀 Inicio Rápido - Aplicar Migraciones Multi-Tenant

## Aplicar las Migraciones en 3 Pasos

### Paso 1: Hacer Backup (Recomendado)
```bash
# Si tienes Supabase CLI instalado:
supabase db dump > backup_$(date +%Y%m%d_%H%M%S).sql

# O desde el dashboard de Supabase:
# Settings > Database > Backup > Create backup
```

### Paso 2: Aplicar Migraciones

#### Opción A: Supabase CLI (Más Rápido)
```bash
cd /Users/pabloholguin/desarrollo2/AXER

# Instalar CLI si no lo tienes
npm install -g supabase

# Linkear con tu proyecto
supabase link --project-ref TU_PROJECT_REF

# Aplicar todas las migraciones
supabase db push

# Ver status
supabase db diff
```

#### Opción B: Supabase Dashboard (Manual)
1. Ve a [app.supabase.com](https://app.supabase.com)
2. Abre tu proyecto
3. Ve a **SQL Editor**
4. Ejecuta cada archivo en orden:

```
📁 supabase/migrations/

✅ Ya aplicadas:
  20251017222400_create_profiles_table.sql
  20251018000000_create_entradas_table.sql

🆕 Por aplicar (en este orden):
  1. 20251018100000_create_organizations_table.sql
  2. 20251018110000_create_org_members_table.sql
  3. 20251018120000_create_invitations_table.sql
  4. 20251018130000_create_subscription_plans_table.sql
  5. 20251018140000_create_org_settings_table.sql
  6. 20251018150000_create_audit_logs_table.sql
  7. 20251018160000_alter_profiles_add_org_relation.sql
  8. 20251018170000_alter_entradas_add_org_id.sql
  9. 20251018180000_create_generate_entrada_id_function.sql
  10. 20251018190000_create_rls_helper_functions.sql
  11. 20251018200000_update_entradas_rls_policies.sql
```

Para cada archivo:
- Copia el contenido completo
- Pega en SQL Editor
- Click "Run"
- Verifica que no haya errores

### Paso 3: Verificar
```bash
# Ejecutar script de verificación
psql $DATABASE_URL -f supabase/migrations/verify_migration.sql

# O en Supabase Dashboard:
# Copiar contenido de verify_migration.sql y ejecutar
```

---

## ✅ Verificación Rápida

Después de aplicar, ejecuta en SQL Editor:

```sql
-- Verificar tablas
SELECT COUNT(*) FROM organizations; -- Debería retornar al menos 1
SELECT COUNT(*) FROM subscription_plans; -- Debería retornar 4
SELECT COUNT(*) FROM entradas WHERE org_id IS NOT NULL; -- Todas las entradas

-- Verificar funciones
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'auth' AND routine_name LIKE 'user_%';

-- Verificar RLS
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'entradas';
-- rowsecurity debería ser TRUE
```

---

## 🎯 Qué Esperar

### Antes de las Migraciones
- ❌ Sin organizaciones
- ❌ Entradas accesibles por todos
- ❌ Sin límites de plan
- ❌ Sin roles ni permisos

### Después de las Migraciones
- ✅ 1 organización de migración creada
- ✅ Todas las entradas asignadas a esa org
- ✅ 4 planes configurados (Free, Starter, Professional, Enterprise)
- ✅ Sistema de roles activo (Owner, Admin, Technician, Viewer)
- ✅ RLS habilitado - aislamiento completo
- ✅ Auditoría automática de cambios
- ✅ Validación de límites por plan

---

## ⚠️ Problemas Comunes

### "permission denied for schema auth"
**Solución**: Es normal. Las funciones usan `SECURITY DEFINER` y tienen los permisos necesarios.

### "relation already exists"
**Solución**: Las migraciones son idempotentes (usan `IF EXISTS`). Puedes ejecutarlas múltiples veces.

### "violates foreign key constraint"
**Solución**: Ejecuta las migraciones **en orden**. No te saltes ninguna.

### "column org_id does not exist" después de migrar
**Solución**: Reinicia tu aplicación Next.js para que recargue el schema de Supabase.

---

## 📊 Datos de Prueba (Opcional)

Después de migrar, puedes crear datos de prueba:

```sql
-- Crear una organización de prueba
INSERT INTO organizations (name, slug, owner_id, subscription_plan)
VALUES (
  'Mi Taller de Prueba',
  'mi-taller-prueba',
  (SELECT id FROM auth.users LIMIT 1), -- Tu user ID
  'professional'
)
RETURNING id;

-- Crear una entrada de prueba (reemplaza ORG_ID con el ID de arriba)
INSERT INTO entradas (
  org_id,
  nombre_cliente,
  telefono,
  modelo,
  problema,
  estado,
  usuario_id
)
VALUES (
  'ORG_ID_AQUI',
  'Cliente de Prueba',
  '5551234567',
  'iPhone 13',
  'Pantalla rota',
  'Pendiente',
  (SELECT id FROM auth.users LIMIT 1)
);
```

---

## 🔄 Rollback (Si algo sale mal)

Si necesitas revertir:

```bash
# Opción 1: Restaurar desde backup
psql $DATABASE_URL < backup_20250118.sql

# Opción 2: Eliminar tablas nuevas manualmente
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS org_settings CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS org_members CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

ALTER TABLE entradas DROP COLUMN IF EXISTS org_id;
ALTER TABLE profiles DROP COLUMN IF EXISTS current_org_id;
```

---

## 📞 Soporte

Si encuentras problemas:

1. ✅ Lee `README.md` en `/supabase/migrations/`
2. ✅ Ejecuta `verify_migration.sql`
3. ✅ Revisa los logs de Supabase
4. ✅ Verifica el orden de ejecución

---

## 🎉 ¡Listo!

Una vez aplicadas las migraciones, tu base de datos está lista para multi-tenancy.

**Próximo paso**: Continuar con la implementación del frontend (Fases 2-7)

---

*Tiempo estimado de aplicación: 5-10 minutos*
*Complejidad: Media*
*Riesgo: Bajo (migraciones son idempotentes y crean datos de prueba)*

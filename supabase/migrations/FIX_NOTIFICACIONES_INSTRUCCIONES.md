# Solución al Sistema de Notificaciones

## Problema Identificado

El sistema de notificaciones no funcionaba porque:

1. **Funciones helper faltantes**: Las funciones `get_org_admins_and_owners()` y `find_org_member_user_id()` no existían en la base de datos
2. **Triggers sin funciones**: Los triggers intentaban usar funciones que no existían, causando fallos silenciosos
3. **Error 404 previo**: El código intentaba llamar a una función `create_notification()` inexistente

## Solución Implementada

He creado una migración completa que:
- Crea las funciones helper necesarias
- Recrea todos los triggers de notificaciones
- Asegura que todo esté correctamente configurado

## Instrucciones para Aplicar la Solución

### Opción 1: Usar el SQL Editor de Supabase (RECOMENDADO)

1. **Abre tu proyecto en Supabase Dashboard**:
   - Ve a: https://supabase.com/dashboard/project/reokxigrkpymvwelqnhj

2. **Abre el SQL Editor**:
   - En el menú lateral, haz clic en "SQL Editor"

3. **Copia y pega el contenido del archivo**:
   - Abre el archivo: `supabase/migrations/20251019000000_fix_notifications_complete.sql`
   - Copia TODO el contenido
   - Pégalo en el SQL Editor

4. **Ejecuta el script**:
   - Haz clic en el botón "Run" o presiona Ctrl+Enter (Cmd+Enter en Mac)
   - Deberías ver mensajes de éxito

5. **Verifica que todo esté correcto**:
   - En el SQL Editor, copia y pega el contenido de `VERIFY_NOTIFICATIONS.sql`
   - Ejecuta este script
   - Deberías ver todas las funciones y triggers marcados con ✅

### Opción 2: Usar Supabase CLI (Si tienes Docker instalado)

```bash
cd /Users/pabloholguin/desarrollo2/AXER
npx supabase db push
```

## Verificación Post-Migración

Después de aplicar la migración, ejecuta el script `VERIFY_NOTIFICATIONS.sql` para verificar que:

- ✅ `get_org_admins_and_owners` existe
- ✅ `find_org_member_user_id` existe
- ✅ `notify_entrada_status_change` existe
- ✅ `notify_new_entrada` existe
- ✅ `notify_technician_change` existe
- ✅ Triggers están activos en la tabla `entradas`

## Cómo Funciona Ahora

### 1. Cuando se crea una nueva entrada:
- Se notifica al técnico asignado
- Se notifica a todos los admins/owners de la organización

### 2. Cuando se actualiza el estado de una entrada:
- Se notifica al técnico asignado
- Se notifica a todos los admins/owners de la organización

### 3. Cuando se cambia el técnico asignado:
- Se notifica al técnico anterior
- Se notifica al nuevo técnico asignado

## Prueba del Sistema

Para probar que las notificaciones funcionan:

1. **Abre tu aplicación** (http://localhost:3000)
2. **Ve a la sección de Entradas**
3. **Actualiza el estado de una entrada** (por ejemplo, de "Cotización" a "En reparación")
4. **Verifica que aparezcan notificaciones**:
   - Haz clic en el icono de campana en la parte superior
   - Deberías ver la notificación del cambio de estado

## Estructura de las Notificaciones

Cada notificación contiene:

```javascript
{
  org_id: UUID,           // ID de la organización
  user_id: UUID,          // ID del usuario que recibe la notificación
  type: string,           // Tipo: 'entrada_status_change', 'assignment', etc.
  title: string,          // Título de la notificación
  message: string,        // Mensaje descriptivo
  entity_type: string,    // 'entrada'
  entity_id: UUID,        // ID de la entrada
  actor_id: UUID,         // ID del usuario que realizó la acción
  actor_name: string,     // Nombre del usuario que realizó la acción
  action_url: string,     // URL para ver más detalles ('/entradas')
  metadata: JSONB,        // Información adicional
  is_read: boolean,       // Si fue leída o no
  created_at: timestamp   // Fecha de creación
}
```

## Solución de Problemas

### Si las notificaciones NO aparecen después de aplicar la migración:

1. **Verifica que los triggers estén activos**:
   ```sql
   SELECT * FROM pg_trigger
   WHERE tgrelid = 'public.entradas'::regclass;
   ```

2. **Verifica que tu usuario sea miembro de la organización**:
   ```sql
   SELECT * FROM public.org_members
   WHERE user_id = 'TU_USER_ID';
   ```

3. **Verifica el campo `tecnico_asignado`**:
   - El campo debe contener el nombre completo del técnico (first_name + last_name)
   - O el email del técnico
   - Debe coincidir EXACTAMENTE con los datos en la tabla `profiles`

4. **Revisa los logs de PostgreSQL** en el Dashboard de Supabase:
   - Ve a "Logs" > "Postgres Logs"
   - Busca errores relacionados con los triggers

## Archivos Creados

- ✅ `20251019000000_fix_notifications_complete.sql` - Migración principal
- ✅ `VERIFY_NOTIFICATIONS.sql` - Script de verificación
- ✅ `FIX_NOTIFICACIONES_INSTRUCCIONES.md` - Este archivo

## Contacto

Si sigues teniendo problemas después de aplicar esta solución, por favor proporciona:
1. El resultado de ejecutar `VERIFY_NOTIFICATIONS.sql`
2. Capturas de pantalla de los errores en la consola del navegador
3. Los logs de PostgreSQL del Dashboard de Supabase

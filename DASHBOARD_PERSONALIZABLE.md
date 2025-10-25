# Dashboard Personalizable - AXER

## 📋 Descripción General

El dashboard de AXER ahora es completamente personalizable por el usuario. Cada usuario puede configurar su propio dashboard con los widgets que necesite, reorganizarlos mediante drag & drop, redimensionarlos y eliminarlos según sus preferencias.

## ✨ Características Principales

### 1. **Widgets Personalizables**
- Agregar/eliminar widgets según necesidades
- Reorganizar mediante drag & drop
- Redimensionar widgets
- Configuración guardada por usuario y organización

### 2. **Datos en Tiempo Real**
- Los widgets obtienen datos reales de la base de datos
- Actualización automática cada 2-5 minutos
- Métricas comparativas con períodos anteriores

### 3. **Modo de Edición**
- Activar/desactivar fácilmente
- Guardado automático de cambios
- Interfaz intuitiva con indicadores visuales

## 🎨 Widgets Disponibles

### Métricas
- **Total Clientes** (`metrics_customers`): Muestra el número total de clientes con tendencia
- **Órdenes** (`metrics_orders`): Total de ventas del mes actual
- **Ingresos** (`metrics_revenue`): Ingresos totales con comparación mensual
- **Entradas Activas** (`metrics_entradas`): Reparaciones en curso

### Gráficos
- **Gráfico de Ventas** (`sales_chart`): Ventas mensuales y tendencias
- **Estadísticas** (`statistics_chart`): Estadísticas generales del negocio

### Listas
- **Entradas Recientes** (`recent_entradas`): Últimas entradas de reparación
- **Órdenes Recientes** (`recent_orders`): Últimas órdenes registradas

### Análisis
- **Meta Mensual** (`monthly_target`): Progreso hacia la meta del mes
- **Datos Demográficos** (`demographics`): Distribución de clientes por ubicación

## 🏗️ Arquitectura

### Base de Datos
```sql
-- Tabla principal
dashboard_widgets
  - id: UUID (PK)
  - user_id: UUID (FK a auth.users)
  - organization_id: UUID (FK a organizations)
  - widget_type: VARCHAR(50)
  - position_x, position_y: INT
  - width, height: INT
  - config: JSONB
  - is_visible: BOOLEAN
```

### Archivos Principales

#### Tipos y Configuración
- `/src/types/dashboard.ts`: Tipos TypeScript para widgets y configuración
- Definiciones de todos los tipos de widgets disponibles
- Layout por defecto para nuevos usuarios

#### Hook Personalizado
- `/src/hooks/useDashboard.ts`: Hook principal para manejar el dashboard
- Funciones:
  - `loadDashboardConfig()`: Cargar configuración desde BD
  - `addWidget()`: Agregar nuevo widget
  - `removeWidget()`: Eliminar widget
  - `updateLayout()`: Actualizar posiciones
  - `resetToDefault()`: Restablecer a configuración por defecto

#### Componentes

**Widgets:**
- `/src/components/dashboard/widgets/MetricsWidget.tsx`: Widgets de métricas con datos reales
- `/src/components/dashboard/widgets/RecentEntradasWidget.tsx`: Lista de entradas recientes
- `/src/components/dashboard/widgets/WidgetRenderer.tsx`: Renderizador principal de widgets

**Grid:**
- `/src/components/dashboard/DashboardGrid.tsx`: Grid con drag & drop usando react-grid-layout

**Modal:**
- `/src/components/dashboard/CustomizeDashboardModal.tsx`: Modal para personalizar dashboard

**Página:**
- `/src/app/(admin)/dashboard/page.tsx`: Página principal del dashboard

## 🚀 Uso

### Para Usuarios

1. **Ver Dashboard**
   - Accede a `/dashboard`
   - Verás tu configuración personalizada

2. **Modo de Edición**
   - Haz clic en botón "Editar"
   - Arrastra widgets para reorganizarlos
   - Redimensiona desde las esquinas
   - Elimina widgets con el botón X
   - Haz clic en "Guardar cambios" cuando termines

3. **Agregar Widgets**
   - Haz clic en "Personalizar"
   - Busca o filtra widgets por categoría
   - Haz clic en "Agregar" en el widget deseado
   - El widget aparecerá en el dashboard

4. **Restablecer Dashboard**
   - En modo edición, haz clic en "Restablecer"
   - Confirma la acción
   - Se restaurará la configuración por defecto

### Para Desarrolladores

#### Agregar un Nuevo Widget

1. **Definir el tipo en `/src/types/dashboard.ts`:**
```typescript
export type WidgetType =
  | 'metrics_customers'
  | 'mi_nuevo_widget'; // Agregar aquí

export const WIDGET_METADATA: Record<WidgetType, WidgetMetadata> = {
  // ... otros widgets
  mi_nuevo_widget: {
    type: 'mi_nuevo_widget',
    title: 'Mi Widget',
    description: 'Descripción del widget',
    icon: 'Icon',
    defaultWidth: 4,
    defaultHeight: 3,
    category: 'analytics',
  },
};
```

2. **Crear el componente del widget:**
```typescript
// /src/components/dashboard/widgets/MiNuevoWidget.tsx
"use client";
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useOrganization } from '@/context/OrganizationContext';

export default function MiNuevoWidget({ config }) {
  const supabase = createClientComponentClient();
  const { currentOrg } = useOrganization();
  const [data, setData] = useState(null);

  useEffect(() => {
    // Cargar datos desde la base de datos
    const fetchData = async () => {
      const { data } = await supabase
        .from('mi_tabla')
        .select('*')
        .eq('organization_id', currentOrg.id);

      setData(data);
    };

    fetchData();
  }, [currentOrg]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 h-full">
      {/* Contenido del widget */}
    </div>
  );
}
```

3. **Registrar en WidgetRenderer:**
```typescript
// /src/components/dashboard/widgets/WidgetRenderer.tsx
import MiNuevoWidget from './MiNuevoWidget';

export default function WidgetRenderer({ widget }) {
  const renderWidget = () => {
    switch (widget.widget_type) {
      // ... otros casos
      case 'mi_nuevo_widget':
        return <MiNuevoWidget config={widget.config} />;
      // ...
    }
  };
  // ...
}
```

## 🔒 Seguridad

- **Row Level Security (RLS)** habilitado en la tabla `dashboard_widgets`
- Usuarios solo pueden ver y modificar sus propios widgets
- Configuración aislada por organización
- Validación de permisos en todas las operaciones

## 📊 Performance

- Widgets con lazy loading usando `dynamic()` de Next.js
- Actualización automática cada 2-5 minutos (configurable)
- Queries optimizadas con índices en BD
- Compresión de layout con `compactType="vertical"`

## 🎯 Próximas Mejoras

- [ ] Configuración avanzada por widget (colores, rangos de fechas)
- [ ] Exportar/importar configuración de dashboard
- [ ] Plantillas predefinidas de dashboard
- [ ] Widgets adicionales (top productos, reparaciones pendientes)
- [ ] Modo de presentación (fullscreen)
- [ ] Compartir configuración entre usuarios
- [ ] Temas personalizados por widget

## 🐛 Troubleshooting

### El dashboard no carga
- Verifica que la migración se aplicó correctamente: `npx supabase db push`
- Revisa la consola del navegador para errores
- Verifica que el usuario tenga una organización asignada

### Los widgets no muestran datos
- Verifica que hay datos en las tablas correspondientes
- Revisa las políticas RLS en Supabase
- Comprueba que `organization_id` está correctamente configurado

### Error al guardar configuración
- Verifica permisos de escritura en la tabla `dashboard_widgets`
- Revisa que el usuario esté autenticado
- Comprueba la conexión a Supabase

## 📝 Notas de Implementación

- La tabla `dashboard_widgets` usa `handle_updated_at()` para actualizar timestamps
- Los layouts se guardan automáticamente al reorganizar en modo edición
- La configuración por defecto se crea automáticamente para nuevos usuarios
- Los widgets se actualizan automáticamente mediante intervals

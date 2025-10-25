/**
 * Tipos para el sistema de dashboard personalizable
 */

export type WidgetType =
  | 'metrics_customers'
  | 'metrics_orders'
  | 'metrics_revenue'
  | 'metrics_entradas'
  | 'sales_chart'
  | 'monthly_target'
  | 'statistics_chart'
  | 'recent_orders'
  | 'recent_entradas'
  | 'demographics'
  | 'top_products'
  | 'pending_repairs';

export interface WidgetMetadata {
  type: WidgetType;
  title: string;
  description: string;
  icon: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  category: 'metrics' | 'charts' | 'lists' | 'analytics';
}

export interface DashboardWidget {
  id: string;
  user_id: string;
  organization_id: string;
  widget_type: WidgetType;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  config: WidgetConfig;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface WidgetConfig {
  // Configuraciones generales
  title?: string;
  refreshInterval?: number; // en segundos

  // Para widgets de métricas
  showPercentage?: boolean;
  comparisonPeriod?: 'day' | 'week' | 'month' | 'year';

  // Para widgets de gráficos
  chartType?: 'line' | 'bar' | 'area' | 'pie';
  dateRange?: {
    start: string;
    end: string;
  };

  // Para widgets de listas
  itemsPerPage?: number;
  showFilters?: boolean;

  // Colores personalizados
  primaryColor?: string;
  secondaryColor?: string;
}

export interface WidgetLayout {
  i: string; // widget id
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface DashboardConfig {
  widgets: DashboardWidget[];
  layout: WidgetLayout[];
}

// Metadatos de widgets disponibles
export const WIDGET_METADATA: Record<WidgetType, WidgetMetadata> = {
  metrics_customers: {
    type: 'metrics_customers',
    title: 'Total Clientes',
    description: 'Número total de clientes y tendencia',
    icon: 'Users',
    defaultWidth: 3,
    defaultHeight: 2,
    minWidth: 2,
    minHeight: 2,
    category: 'metrics',
  },
  metrics_orders: {
    type: 'metrics_orders',
    title: 'Órdenes',
    description: 'Total de órdenes y ventas',
    icon: 'ShoppingCart',
    defaultWidth: 3,
    defaultHeight: 2,
    minWidth: 2,
    minHeight: 2,
    category: 'metrics',
  },
  metrics_revenue: {
    type: 'metrics_revenue',
    title: 'Ingresos',
    description: 'Ingresos totales del período',
    icon: 'DollarSign',
    defaultWidth: 3,
    defaultHeight: 2,
    minWidth: 2,
    minHeight: 2,
    category: 'metrics',
  },
  metrics_entradas: {
    type: 'metrics_entradas',
    title: 'Entradas de Reparación',
    description: 'Total de entradas activas',
    icon: 'Wrench',
    defaultWidth: 3,
    defaultHeight: 2,
    minWidth: 2,
    minHeight: 2,
    category: 'metrics',
  },
  sales_chart: {
    type: 'sales_chart',
    title: 'Gráfico de Ventas',
    description: 'Ventas mensuales y tendencias',
    icon: 'TrendingUp',
    defaultWidth: 8,
    defaultHeight: 4,
    minWidth: 6,
    minHeight: 3,
    category: 'charts',
  },
  monthly_target: {
    type: 'monthly_target',
    title: 'Meta Mensual',
    description: 'Progreso hacia la meta del mes',
    icon: 'Target',
    defaultWidth: 4,
    defaultHeight: 4,
    minWidth: 3,
    minHeight: 3,
    category: 'analytics',
  },
  statistics_chart: {
    type: 'statistics_chart',
    title: 'Estadísticas',
    description: 'Estadísticas generales del negocio',
    icon: 'BarChart3',
    defaultWidth: 12,
    defaultHeight: 4,
    minWidth: 8,
    minHeight: 3,
    category: 'charts',
  },
  recent_orders: {
    type: 'recent_orders',
    title: 'Órdenes Recientes',
    description: 'Últimas órdenes registradas',
    icon: 'List',
    defaultWidth: 6,
    defaultHeight: 4,
    minWidth: 4,
    minHeight: 3,
    category: 'lists',
  },
  recent_entradas: {
    type: 'recent_entradas',
    title: 'Entradas Recientes',
    description: 'Últimas entradas de reparación',
    icon: 'ClipboardList',
    defaultWidth: 6,
    defaultHeight: 4,
    minWidth: 4,
    minHeight: 3,
    category: 'lists',
  },
  demographics: {
    type: 'demographics',
    title: 'Datos Demográficos',
    description: 'Distribución de clientes por ubicación',
    icon: 'MapPin',
    defaultWidth: 6,
    defaultHeight: 4,
    minWidth: 4,
    minHeight: 3,
    category: 'analytics',
  },
  top_products: {
    type: 'top_products',
    title: 'Productos Más Vendidos',
    description: 'Ranking de productos',
    icon: 'Award',
    defaultWidth: 4,
    defaultHeight: 4,
    minWidth: 3,
    minHeight: 3,
    category: 'analytics',
  },
  pending_repairs: {
    type: 'pending_repairs',
    title: 'Reparaciones Pendientes',
    description: 'Reparaciones en progreso',
    icon: 'AlertCircle',
    defaultWidth: 4,
    defaultHeight: 3,
    minWidth: 3,
    minHeight: 2,
    category: 'lists',
  },
};

// Layout por defecto para nuevos usuarios
export const DEFAULT_DASHBOARD_LAYOUT: WidgetLayout[] = [
  { i: 'metrics_customers', x: 0, y: 0, w: 3, h: 2 },
  { i: 'metrics_orders', x: 3, y: 0, w: 3, h: 2 },
  { i: 'metrics_revenue', x: 6, y: 0, w: 3, h: 2 },
  { i: 'metrics_entradas', x: 9, y: 0, w: 3, h: 2 },
  { i: 'sales_chart', x: 0, y: 2, w: 8, h: 4 },
  { i: 'monthly_target', x: 8, y: 2, w: 4, h: 4 },
  { i: 'statistics_chart', x: 0, y: 6, w: 12, h: 4 },
  { i: 'recent_orders', x: 0, y: 10, w: 6, h: 4 },
  { i: 'demographics', x: 6, y: 10, w: 6, h: 4 },
];

export const DEFAULT_WIDGET_TYPES: WidgetType[] = [
  'metrics_customers',
  'metrics_orders',
  'metrics_revenue',
  'metrics_entradas',
  'sales_chart',
  'monthly_target',
  'statistics_chart',
  'recent_orders',
  'demographics',
];

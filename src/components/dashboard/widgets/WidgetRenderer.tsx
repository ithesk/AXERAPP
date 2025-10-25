"use client";

import React from 'react';
import type { DashboardWidget } from '@/types/dashboard';
import MetricsWidget from './MetricsWidget';
import RecentEntradasWidget from './RecentEntradasWidget';
import MonthlyTargetWidget from './MonthlyTargetWidget';
import MonthlySalesChartWidget from './MonthlySalesChartWidget';
import StatisticsChartWidget from './StatisticsChartWidget';
import RecentOrdersWidget from './RecentOrdersWidget';

// Widget legacy que mantenemos (por ahora)
import dynamic from 'next/dynamic';
const DemographicCard = dynamic(() => import('@/components/ecommerce/DemographicCard'), {
  loading: () => <WidgetSkeleton />,
});

interface WidgetRendererProps {
  widget: DashboardWidget;
  onRemove?: (widgetId: string) => void;
  isEditMode?: boolean;
}

function WidgetSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 h-full flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-t-brand-500 border-gray-200 rounded-full animate-spin"></div>
    </div>
  );
}

export default function WidgetRenderer({ widget, onRemove, isEditMode }: WidgetRendererProps) {
  const renderWidget = () => {
    switch (widget.widget_type) {
      // Widgets de métricas
      case 'metrics_customers':
      case 'metrics_orders':
      case 'metrics_revenue':
      case 'metrics_entradas':
        return <MetricsWidget widgetType={widget.widget_type} config={widget.config} />;

      // Widget de entradas recientes
      case 'recent_entradas':
        return <RecentEntradasWidget config={widget.config} />;

      // Widgets mejorados con datos reales y en español
      case 'sales_chart':
        return <MonthlySalesChartWidget />;

      case 'monthly_target':
        return <MonthlyTargetWidget />;

      case 'statistics_chart':
        return <StatisticsChartWidget />;

      case 'recent_orders':
        return <RecentOrdersWidget />;

      case 'demographics':
        return (
          <div className="h-full">
            <DemographicCard />
          </div>
        );

      default:
        return (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 h-full flex items-center justify-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Widget no disponible
            </p>
          </div>
        );
    }
  };

  return (
    <div className="relative h-full w-full group">
      {renderWidget()}

      {/* Botón de eliminar en modo edición */}
      {isEditMode && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('¿Eliminar este widget del dashboard?')) {
              onRemove(widget.id);
            }
          }}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg z-20"
          title="Eliminar widget"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

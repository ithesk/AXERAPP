"use client";

import React, { useMemo } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import '@/styles/dashboard-grid.css';
import WidgetRenderer from './widgets/WidgetRenderer';
import type { DashboardWidget, WidgetLayout } from '@/types/dashboard';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  widgets: DashboardWidget[];
  layout: WidgetLayout[];
  isEditMode: boolean;
  onLayoutChange: (layout: WidgetLayout[]) => void;
  onRemoveWidget: (widgetId: string) => void;
}

export default function DashboardGrid({
  widgets,
  layout,
  isEditMode,
  onLayoutChange,
  onRemoveWidget,
}: DashboardGridProps) {
  // Convertir WidgetLayout[] a Layout[] para react-grid-layout
  const gridLayout = useMemo(() => {
    return layout.map((item) => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW,
      minH: item.minH,
      maxW: item.maxW,
      maxH: item.maxH,
    }));
  }, [layout]);

  const handleLayoutChange = (newLayout: Layout[]) => {
    // Convertir Layout[] de vuelta a WidgetLayout[]
    const updatedLayout: WidgetLayout[] = newLayout.map((item) => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW,
      minH: item.minH,
      maxW: item.maxW,
      maxH: item.maxH,
    }));

    onLayoutChange(updatedLayout);
  };

  if (widgets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            No hay widgets en el dashboard
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Haz clic en &quot;Personalizar&quot; para agregar widgets
          </p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: gridLayout }}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={80}
      isDraggable={isEditMode}
      isResizable={isEditMode}
      onLayoutChange={handleLayoutChange}
      draggableHandle=".widget-drag-handle"
      compactType="vertical"
      preventCollision={false}
      margin={[16, 16]}
      containerPadding={[0, 0]}
    >
      {widgets.map((widget) => (
        <div key={widget.id} className="relative">
          {/* Drag handle - solo visible en modo edición */}
          {isEditMode && (
            <div className="widget-drag-handle absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-gray-900/10 to-transparent dark:from-white/10 rounded-t-2xl cursor-move z-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <div className="flex gap-1">
                <div className="w-1 h-4 bg-gray-400 rounded"></div>
                <div className="w-1 h-4 bg-gray-400 rounded"></div>
                <div className="w-1 h-4 bg-gray-400 rounded"></div>
              </div>
            </div>
          )}

          <WidgetRenderer
            widget={widget}
            onRemove={onRemoveWidget}
            isEditMode={isEditMode}
          />
        </div>
      ))}
    </ResponsiveGridLayout>
  );
}

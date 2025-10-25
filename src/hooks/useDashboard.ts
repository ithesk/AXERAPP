"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useOrganization } from '@/context/OrganizationContext';
import type {
  DashboardWidget,
  WidgetType,
  WidgetLayout,
  WidgetConfig,
  DashboardConfig,
} from '@/types/dashboard';
import {
  DEFAULT_DASHBOARD_LAYOUT,
  DEFAULT_WIDGET_TYPES,
  WIDGET_METADATA,
} from '@/types/dashboard';

export function useDashboard() {
  const supabase = createClientComponentClient();
  const { currentOrg } = useOrganization();
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [layout, setLayout] = useState<WidgetLayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  /**
   * Cargar configuración del dashboard desde la base de datos
   */
  const loadDashboardConfig = useCallback(async () => {
    if (!currentOrg) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: widgetsData, error } = await supabase
        .from('dashboard_widgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', currentOrg.id)
        .eq('is_visible', true)
        .order('position_y')
        .order('position_x');

      if (error) throw error;

      // Si no hay widgets guardados, crear configuración por defecto
      if (!widgetsData || widgetsData.length === 0) {
        await initializeDefaultDashboard();
        return;
      }

      setWidgets(widgetsData);

      // Convertir widgets a layout
      const layoutData: WidgetLayout[] = widgetsData.map((widget) => ({
        i: widget.id,
        x: widget.position_x,
        y: widget.position_y,
        w: widget.width,
        h: widget.height,
        minW: WIDGET_METADATA[widget.widget_type]?.minWidth,
        minH: WIDGET_METADATA[widget.widget_type]?.minHeight,
        maxW: WIDGET_METADATA[widget.widget_type]?.maxWidth,
        maxH: WIDGET_METADATA[widget.widget_type]?.maxHeight,
      }));

      setLayout(layoutData);
    } catch (error) {
      console.error('Error loading dashboard config:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg, supabase]);

  /**
   * Inicializar dashboard con configuración por defecto
   */
  const initializeDefaultDashboard = async () => {
    if (!currentOrg) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const defaultWidgets: Partial<DashboardWidget>[] = DEFAULT_WIDGET_TYPES.map(
        (widgetType, index) => {
          const layoutItem = DEFAULT_DASHBOARD_LAYOUT[index];
          const metadata = WIDGET_METADATA[widgetType];

          return {
            user_id: user.id,
            organization_id: currentOrg.id,
            widget_type: widgetType,
            position_x: layoutItem.x,
            position_y: layoutItem.y,
            width: layoutItem.w,
            height: layoutItem.h,
            config: {},
            is_visible: true,
          };
        }
      );

      const { data, error } = await supabase
        .from('dashboard_widgets')
        .insert(defaultWidgets)
        .select();

      if (error) throw error;

      if (data) {
        setWidgets(data);
        setLayout(DEFAULT_DASHBOARD_LAYOUT.map((item, index) => ({
          ...item,
          i: data[index].id,
        })));
      }
    } catch (error) {
      console.error('Error initializing default dashboard:', error);
    }
  };

  /**
   * Actualizar layout cuando se mueve o redimensiona un widget
   */
  const updateLayout = async (newLayout: WidgetLayout[]) => {
    setLayout(newLayout);

    if (!isEditMode) return; // Solo guardar en modo edición

    try {
      // Actualizar cada widget con su nueva posición
      const updates = newLayout.map((item) => {
        const widget = widgets.find((w) => w.id === item.i);
        if (!widget) return null;

        return supabase
          .from('dashboard_widgets')
          .update({
            position_x: item.x,
            position_y: item.y,
            width: item.w,
            height: item.h,
          })
          .eq('id', item.i);
      });

      await Promise.all(updates.filter(Boolean));
    } catch (error) {
      console.error('Error updating layout:', error);
    }
  };

  /**
   * Agregar un nuevo widget al dashboard
   */
  const addWidget = async (
    widgetType: WidgetType,
    config: WidgetConfig = {}
  ): Promise<boolean> => {
    if (!currentOrg) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const metadata = WIDGET_METADATA[widgetType];

      // Encontrar posición disponible en el grid
      const maxY = Math.max(...layout.map((item) => item.y + item.h), 0);

      const newWidget: Partial<DashboardWidget> = {
        user_id: user.id,
        organization_id: currentOrg.id,
        widget_type: widgetType,
        position_x: 0,
        position_y: maxY,
        width: metadata.defaultWidth,
        height: metadata.defaultHeight,
        config,
        is_visible: true,
      };

      const { data, error } = await supabase
        .from('dashboard_widgets')
        .insert([newWidget])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setWidgets([...widgets, data]);
        setLayout([
          ...layout,
          {
            i: data.id,
            x: data.position_x,
            y: data.position_y,
            w: data.width,
            h: data.height,
            minW: metadata.minWidth,
            minH: metadata.minHeight,
            maxW: metadata.maxWidth,
            maxH: metadata.maxHeight,
          },
        ]);
      }

      return true;
    } catch (error) {
      console.error('Error adding widget:', error);
      return false;
    }
  };

  /**
   * Eliminar un widget del dashboard
   */
  const removeWidget = async (widgetId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dashboard_widgets')
        .delete()
        .eq('id', widgetId);

      if (error) throw error;

      setWidgets(widgets.filter((w) => w.id !== widgetId));
      setLayout(layout.filter((item) => item.i !== widgetId));

      return true;
    } catch (error) {
      console.error('Error removing widget:', error);
      return false;
    }
  };

  /**
   * Actualizar configuración de un widget específico
   */
  const updateWidgetConfig = async (
    widgetId: string,
    config: WidgetConfig
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dashboard_widgets')
        .update({ config })
        .eq('id', widgetId);

      if (error) throw error;

      setWidgets(
        widgets.map((w) => (w.id === widgetId ? { ...w, config } : w))
      );

      return true;
    } catch (error) {
      console.error('Error updating widget config:', error);
      return false;
    }
  };

  /**
   * Resetear dashboard a configuración por defecto
   */
  const resetToDefault = async (): Promise<boolean> => {
    if (!currentOrg) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Eliminar todos los widgets actuales
      await supabase
        .from('dashboard_widgets')
        .delete()
        .eq('user_id', user.id)
        .eq('organization_id', currentOrg.id);

      // Inicializar con configuración por defecto
      await initializeDefaultDashboard();

      return true;
    } catch (error) {
      console.error('Error resetting dashboard:', error);
      return false;
    }
  };

  // Cargar configuración al montar el componente o cambiar de organización
  useEffect(() => {
    loadDashboardConfig();
  }, [loadDashboardConfig]);

  return {
    widgets,
    layout,
    isLoading,
    isEditMode,
    setIsEditMode,
    updateLayout,
    addWidget,
    removeWidget,
    updateWidgetConfig,
    resetToDefault,
    reloadDashboard: loadDashboardConfig,
  };
}

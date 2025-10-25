"use client";

import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useOrganization } from '@/context/OrganizationContext';
import Badge from '@/components/ui/badge/Badge';
import { ArrowDownIcon, ArrowUpIcon, GroupIcon, DollarLineIcon, BoxIconLine } from '@/icons';
import { Wrench, TrendingUp, TrendingDown } from 'lucide-react';
import type { WidgetType } from '@/types/dashboard';

interface MetricData {
  current: number;
  previous: number;
  percentage: number;
  trend: 'up' | 'down';
}

interface MetricsWidgetProps {
  widgetType: WidgetType;
  config?: any;
}

export default function MetricsWidget({ widgetType, config }: MetricsWidgetProps) {
  const supabase = createClientComponentClient();
  const { currentOrg } = useOrganization();
  const [metric, setMetric] = useState<MetricData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentOrg) return;

    const fetchMetric = async () => {
      setIsLoading(true);
      try {
        let data: MetricData | null = null;

        switch (widgetType) {
          case 'metrics_customers':
            data = await fetchCustomersMetric();
            break;
          case 'metrics_orders':
            data = await fetchOrdersMetric();
            break;
          case 'metrics_revenue':
            data = await fetchRevenueMetric();
            break;
          case 'metrics_entradas':
            data = await fetchEntradasMetric();
            break;
        }

        setMetric(data);
      } catch (error) {
        console.error('Error fetching metric:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetric();

    // Refrescar cada 5 minutos
    const interval = setInterval(fetchMetric, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [widgetType, currentOrg]);

  const fetchCustomersMetric = async (): Promise<MetricData> => {
    // Contar contactos totales
    const { count: currentCount } = await supabase
      .from('contactos')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', currentOrg!.id);

    // Contar contactos del mes anterior
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const { count: previousCount } = await supabase
      .from('contactos')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', currentOrg!.id)
      .lt('created_at', lastMonth.toISOString());

    const current = currentCount || 0;
    const previous = previousCount || 0;
    const percentage = previous > 0 ? ((current - previous) / previous) * 100 : 100;

    return {
      current,
      previous,
      percentage: Math.abs(percentage),
      trend: current >= previous ? 'up' : 'down',
    };
  };

  const fetchOrdersMetric = async (): Promise<MetricData> => {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Ventas de este mes
    const { count: currentCount } = await supabase
      .from('ventas')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', currentOrg!.id)
      .gte('created_at', firstDayThisMonth.toISOString());

    // Ventas del mes anterior
    const { count: previousCount } = await supabase
      .from('ventas')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', currentOrg!.id)
      .gte('created_at', firstDayLastMonth.toISOString())
      .lt('created_at', firstDayThisMonth.toISOString());

    const current = currentCount || 0;
    const previous = previousCount || 0;
    const percentage = previous > 0 ? ((current - previous) / previous) * 100 : 100;

    return {
      current,
      previous,
      percentage: Math.abs(percentage),
      trend: current >= previous ? 'up' : 'down',
    };
  };

  const fetchRevenueMetric = async (): Promise<MetricData> => {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Ingresos de este mes
    const { data: currentData } = await supabase
      .from('ventas')
      .select('total')
      .eq('organization_id', currentOrg!.id)
      .gte('created_at', firstDayThisMonth.toISOString());

    // Ingresos del mes anterior
    const { data: previousData } = await supabase
      .from('ventas')
      .select('total')
      .eq('organization_id', currentOrg!.id)
      .gte('created_at', firstDayLastMonth.toISOString())
      .lt('created_at', firstDayThisMonth.toISOString());

    const current = currentData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
    const previous = previousData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
    const percentage = previous > 0 ? ((current - previous) / previous) * 100 : 100;

    return {
      current,
      previous,
      percentage: Math.abs(percentage),
      trend: current >= previous ? 'up' : 'down',
    };
  };

  const fetchEntradasMetric = async (): Promise<MetricData> => {
    // Entradas activas (no entregadas)
    const { count: currentCount } = await supabase
      .from('entradas')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', currentOrg!.id)
      .neq('estado', 'Entregado');

    // Entradas del mes anterior
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const { count: previousCount } = await supabase
      .from('entradas')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', currentOrg!.id)
      .neq('estado', 'Entregado')
      .lt('created_at', lastMonth.toISOString());

    const current = currentCount || 0;
    const previous = previousCount || 0;
    const percentage = previous > 0 ? ((current - previous) / previous) * 100 : 100;

    return {
      current,
      previous,
      percentage: Math.abs(percentage),
      trend: current >= previous ? 'up' : 'down',
    };
  };

  const getMetricInfo = () => {
    switch (widgetType) {
      case 'metrics_customers':
        return {
          label: 'Clientes',
          icon: <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />,
          format: (value: number) => value.toLocaleString(),
        };
      case 'metrics_orders':
        return {
          label: 'Órdenes',
          icon: <BoxIconLine className="text-gray-800 dark:text-white/90" />,
          format: (value: number) => value.toLocaleString(),
        };
      case 'metrics_revenue':
        return {
          label: 'Ingresos',
          icon: <DollarLineIcon className="text-gray-800 dark:text-white/90" />,
          format: (value: number) => `$${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        };
      case 'metrics_entradas':
        return {
          label: 'Entradas Activas',
          icon: <Wrench className="text-gray-800 size-6 dark:text-white/90" />,
          format: (value: number) => value.toLocaleString(),
        };
      default:
        return {
          label: 'Métrica',
          icon: <TrendingUp className="text-gray-800 size-6 dark:text-white/90" />,
          format: (value: number) => value.toLocaleString(),
        };
    }
  };

  const info = getMetricInfo();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-t-brand-500 border-gray-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 h-full">
      <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
        {info.icon}
      </div>

      <div className="flex items-end justify-between mt-5">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {config?.title || info.label}
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {metric ? info.format(metric.current) : '-'}
          </h4>
        </div>
        {metric && (
          <Badge color={metric.trend === 'up' ? 'success' : 'error'}>
            {metric.trend === 'up' ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {metric.percentage.toFixed(2)}%
          </Badge>
        )}
      </div>
    </div>
  );
}

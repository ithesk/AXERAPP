"use client";

import React, { useEffect, useState } from 'react';
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useOrganization } from '@/context/OrganizationContext';

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface MonthlyTargetData {
  target: number;
  revenue: number;
  today: number;
  percentage: number;
  growth: number;
}

export default function MonthlyTargetWidget() {
  const supabase = createClientComponentClient();
  const { currentOrg } = useOrganization();
  const [data, setData] = useState<MonthlyTargetData>({
    target: 50000,
    revenue: 0,
    today: 0,
    percentage: 0,
    growth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentOrg) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const now = new Date();
        const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Ingresos del mes actual
        const { data: revenueData } = await supabase
          .from('ventas')
          .select('total')
          .eq('organization_id', currentOrg.id)
          .gte('created_at', firstDayThisMonth.toISOString());

        const revenue = revenueData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;

        // Ingresos del mes anterior para calcular crecimiento
        const { data: lastMonthData } = await supabase
          .from('ventas')
          .select('total')
          .eq('organization_id', currentOrg.id)
          .gte('created_at', firstDayLastMonth.toISOString())
          .lt('created_at', firstDayThisMonth.toISOString());

        const lastMonthRevenue = lastMonthData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;

        // Ingresos de hoy
        const { data: todayData } = await supabase
          .from('ventas')
          .select('total')
          .eq('organization_id', currentOrg.id)
          .gte('created_at', today.toISOString());

        const todayRevenue = todayData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;

        // Calcular porcentaje y crecimiento
        const target = 50000; // Esto podría venir de configuración del usuario
        const percentage = target > 0 ? (revenue / target) * 100 : 0;
        const growth = lastMonthRevenue > 0 ? ((revenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

        setData({
          target,
          revenue,
          today: todayRevenue,
          percentage: Math.min(percentage, 100),
          growth,
        });
      } catch (error) {
        console.error('Error fetching monthly target data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Refrescar cada 5 minutos
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentOrg, supabase]);

  const series = [data.percentage];
  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: {
          size: "80%",
        },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 5,
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            fontSize: "36px",
            fontWeight: "600",
            offsetY: -40,
            color: "#1D2939",
            formatter: function (val) {
              return val.toFixed(1) + "%";
            },
          },
        },
      },
    },
    fill: {
      type: "solid",
      colors: ["#465FFF"],
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Progreso"],
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-t-brand-500 border-gray-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03] h-full flex flex-col">
      <div className="flex-1 px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Meta Mensual
            </h3>
            <p className="mt-1 font-normal text-gray-500 text-theme-sm dark:text-gray-400">
              Progreso hacia tu meta del mes
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="max-h-[330px]">
            <ReactApexChart
              options={options}
              series={series}
              type="radialBar"
              height={330}
            />
          </div>

          {data.growth !== 0 && (
            <span className={`absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full px-3 py-1 text-xs font-medium ${
              data.growth > 0
                ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500'
                : 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500'
            }`}>
              {data.growth > 0 ? '+' : ''}{data.growth.toFixed(1)}%
            </span>
          )}
        </div>

        <p className="mx-auto mt-10 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
          {data.today > 0 ? (
            <>
              Hoy has ganado <strong>{formatCurrency(data.today)}</strong>
              {data.growth > 0 && ', mayor que el mes pasado. ¡Sigue así!'}
              {data.growth < 0 && ', menor que el mes pasado.'}
              {data.growth === 0 && '.'}
            </>
          ) : (
            'Aún no hay ventas registradas hoy.'
          )}
        </p>
      </div>

      <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5 bg-gray-100 dark:bg-white/[0.03] rounded-b-2xl">
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Meta
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {formatCurrency(data.target)}
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Ingresos
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {formatCurrency(data.revenue)}
            {data.revenue >= data.target ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M7.60141 2.33683C7.73885 2.18084 7.9401 2.08243 8.16435 2.08243C8.16475 2.08243 8.16516 2.08243 8.16556 2.08243C8.35773 2.08219 8.54998 2.15535 8.69664 2.30191L12.6968 6.29924C12.9898 6.59203 12.9899 7.0669 12.6971 7.3599C12.4044 7.6529 11.9295 7.65306 11.6365 7.36027L8.91435 4.64004L8.91435 13.5C8.91435 13.9142 8.57856 14.25 8.16435 14.25C7.75013 14.25 7.41435 13.9142 7.41435 13.5L7.41435 4.64442L4.69679 7.36025C4.4038 7.65305 3.92893 7.6529 3.63613 7.35992C3.34333 7.06693 3.34348 6.59206 3.63646 6.29926L7.60141 2.33683Z" fill="#039855"/>
              </svg>
            ) : null}
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Hoy
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {formatCurrency(data.today)}
          </p>
        </div>
      </div>
    </div>
  );
}

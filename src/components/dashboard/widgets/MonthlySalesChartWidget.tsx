"use client";

import React, { useEffect, useState } from 'react';
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useOrganization } from '@/context/OrganizationContext';

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function MonthlySalesChartWidget() {
  const supabase = createClientComponentClient();
  const { currentOrg } = useOrganization();
  const [chartData, setChartData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentOrg) return;

    const fetchSalesData = async () => {
      setIsLoading(true);
      try {
        const currentYear = new Date().getFullYear();
        const monthlyData = Array(12).fill(0);

        // Obtener todas las ventas del año actual
        const { data: sales, error } = await supabase
          .from('ventas')
          .select('total, created_at')
          .eq('organization_id', currentOrg.id)
          .gte('created_at', `${currentYear}-01-01`)
          .lt('created_at', `${currentYear + 1}-01-01`);

        if (error) throw error;

        // Agrupar por mes
        sales?.forEach((sale) => {
          const month = new Date(sale.created_at).getMonth();
          monthlyData[month] += sale.total || 0;
        });

        setChartData(monthlyData);
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesData();

    // Refrescar cada 5 minutos
    const interval = setInterval(fetchSalesData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentOrg, supabase]);

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: [
        "Ene", "Feb", "Mar", "Abr", "May", "Jun",
        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: {
        text: undefined,
      },
      labels: {
        formatter: (val: number) => {
          return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(val);
        },
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      x: {
        show: true,
      },
      y: {
        formatter: (val: number) => {
          return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(val);
        },
      },
    },
  };

  const series = [
    {
      name: "Ventas",
      data: chartData,
    },
  ];

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6 h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-t-brand-500 border-gray-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Ventas Mensuales
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Año {new Date().getFullYear()}
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <ReactApexChart
            options={options}
            series={series}
            type="bar"
            height={180}
          />
        </div>
      </div>
    </div>
  );
}

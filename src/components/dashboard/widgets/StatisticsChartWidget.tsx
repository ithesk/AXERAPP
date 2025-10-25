"use client";

import React, { useEffect, useState } from 'react';
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useOrganization } from '@/context/OrganizationContext';

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function StatisticsChartWidget() {
  const supabase = createClientComponentClient();
  const { currentOrg } = useOrganization();
  const [salesData, setSalesData] = useState<number[]>(Array(12).fill(0));
  const [revenueData, setRevenueData] = useState<number[]>(Array(12).fill(0));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentOrg) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const currentYear = new Date().getFullYear();
        const monthlySales = Array(12).fill(0);
        const monthlyRevenue = Array(12).fill(0);

        // Obtener ventas del año
        const { data: sales } = await supabase
          .from('ventas')
          .select('total, created_at')
          .eq('organization_id', currentOrg.id)
          .gte('created_at', `${currentYear}-01-01`)
          .lt('created_at', `${currentYear + 1}-01-01`);

        // Obtener entradas del año
        const { data: entradas } = await supabase
          .from('entradas')
          .select('costo_reparacion, created_at')
          .eq('organization_id', currentOrg.id)
          .gte('created_at', `${currentYear}-01-01`)
          .lt('created_at', `${currentYear + 1}-01-01`);

        sales?.forEach((sale) => {
          const month = new Date(sale.created_at).getMonth();
          monthlyRevenue[month] += sale.total || 0;
        });

        entradas?.forEach((entrada) => {
          const month = new Date(entrada.created_at).getMonth();
          monthlySales[month] += entrada.costo_reparacion || 0;
        });

        setSalesData(monthlySales);
        setRevenueData(monthlyRevenue);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentOrg, supabase]);

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#465FFF", "#9CB9FF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line",
      toolbar: { show: false },
    },
    stroke: {
      curve: "straight",
      width: [2, 2],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 6 },
    },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    tooltip: { enabled: true },
    xaxis: {
      type: "category",
      categories: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `$${val.toFixed(0)}`,
      },
    },
  };

  const series = [
    { name: "Reparaciones", data: salesData },
    { name: "Ventas", data: revenueData },
  ];

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-t-brand-500 border-gray-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Estadísticas Anuales
        </h3>
        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          Comparación de reparaciones y ventas del año {new Date().getFullYear()}
        </p>
      </div>

      <div className="flex-1 max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          <ReactApexChart options={options} series={series} type="area" height={310} />
        </div>
      </div>
    </div>
  );
}

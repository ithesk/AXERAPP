"use client";

import React, { useState, useMemo } from "react";
import { useEntradas } from "@/hooks/useEntradas";
import type { Entrada, EstadoEntrada, EntradasFilters } from "@/types/entradas";
import NuevaEntradaModal from "@/components/entradas/NuevaEntradaModal";
import EditarEntradaModal from "@/components/entradas/EditarEntradaModal";
import DetalleEntradaModalOld from "@/components/entradas/DetalleEntradaModalOptimized";
import DetalleEntradaModalWithBudget from "@/components/entradas/DetalleEntradaModalWithBudget";
import { PlusIcon } from "@/icons";

const ESTADO_ORDER: EstadoEntrada[] = [
  "Cotización",
  "Inicio reparación",
  "En reparación",
  "Reparado",
  "Entregado",
  "Cancelado",
];

const ESTADO_SUMMARY_LABELS: Record<EstadoEntrada, string> = {
  "Cotización": "Cotizaciones",
  "Inicio reparación": "Inicio reparación",
  "En reparación": "En reparación",
  "Reparado": "Reparados",
  "Entregado": "Entregados",
  "Cancelado": "Cancelados",
};

const normalizeEstadoEntrada = (estado: string): EstadoEntrada => {
  switch (estado) {
    case "Pendiente":
      return "Cotización";
    case "Listo":
      return "Reparado";
    case "Cotización":
    case "Inicio reparación":
    case "En reparación":
    case "Reparado":
    case "Entregado":
    case "Cancelado":
      return estado as EstadoEntrada;
    default:
      return "Cotización";
  }
};

const getEstadoBadgeClass = (estado: EstadoEntrada) => {
  switch (estado) {
    case "Cotización":
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
    case "Inicio reparación":
      return "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20";
    case "En reparación":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
    case "Reparado":
      return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
    case "Entregado":
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20";
    case "Cancelado":
      return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20";
  }
};

const getEstadoIcon = (estado: EstadoEntrada) => {
  switch (estado) {
    case "Cotización":
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "Inicio reparación":
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2.5 3.5a1 1 0 011-1h6.086a1 1 0 01.707.293l5.914 5.914a1 1 0 010 1.414l-4.672 4.672a1 1 0 01-1.414 0L3.793 9.207A1 1 0 013.5 8.5V3.5z" />
          <path d="M4 2h2v4H4z" />
        </svg>
      );
    case "En reparación":
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "Reparado":
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "Entregado":
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
        </svg>
      );
    case "Cancelado":
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
        </svg>
      );
    default:
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" />
        </svg>
      );
  }
};

const getEstadoFilterStyle = (estado: EstadoEntrada) => {
  switch (estado) {
    case "Cotización":
      return {
        activeClass:
          "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30",
        inactiveClass:
          "bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20",
        countActiveClass: "bg-white/20 text-white",
        countInactiveClass:
          "bg-amber-200 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
      };
    case "Inicio reparación":
      return {
        activeClass:
          "bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/30",
        inactiveClass:
          "bg-violet-100 text-violet-600 hover:bg-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20",
        countActiveClass: "bg-white/20 text-white",
        countInactiveClass:
          "bg-violet-200 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200",
      };
    case "En reparación":
      return {
        activeClass:
          "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30",
        inactiveClass:
          "bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20",
        countActiveClass: "bg-white/20 text-white",
        countInactiveClass:
          "bg-blue-200 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
      };
    case "Reparado":
      return {
        activeClass:
          "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30",
        inactiveClass:
          "bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20",
        countActiveClass: "bg-white/20 text-white",
        countInactiveClass:
          "bg-emerald-200 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
      };
    case "Entregado":
      return {
        activeClass:
          "bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg shadow-slate-500/30",
        inactiveClass:
          "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:hover:bg-slate-500/20",
        countActiveClass: "bg-white/20 text-white",
        countInactiveClass:
          "bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
      };
    case "Cancelado":
      return {
        activeClass:
          "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30",
        inactiveClass:
          "bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20",
        countActiveClass: "bg-white/20 text-white",
        countInactiveClass:
          "bg-rose-200 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
      };
    default:
      return {
        activeClass:
          "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg shadow-gray-500/30",
        inactiveClass:
          "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
        countActiveClass: "bg-white/20 text-white",
        countInactiveClass:
          "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
      };
  }
};

const getEstadoSummaryStyle = (estado: EstadoEntrada) => {
  switch (estado) {
    case "Cotización":
      return {
        borderClass: "border-amber-200 dark:border-amber-500/20",
        backgroundClass: "bg-amber-50/50 dark:bg-amber-500/[0.05]",
        iconBgClass: "bg-gradient-to-br from-amber-500 to-amber-600",
        labelClass: "text-amber-600 dark:text-amber-400",
        valueClass: "text-amber-700 dark:text-amber-300",
      };
    case "Inicio reparación":
      return {
        borderClass: "border-violet-200 dark:border-violet-500/20",
        backgroundClass: "bg-violet-50/50 dark:bg-violet-500/[0.05]",
        iconBgClass: "bg-gradient-to-br from-violet-500 to-violet-600",
        labelClass: "text-violet-600 dark:text-violet-300",
        valueClass: "text-violet-700 dark:text-violet-200",
      };
    case "En reparación":
      return {
        borderClass: "border-blue-200 dark:border-blue-500/20",
        backgroundClass: "bg-blue-50/50 dark:bg-blue-500/[0.05]",
        iconBgClass: "bg-gradient-to-br from-blue-500 to-blue-600",
        labelClass: "text-blue-600 dark:text-blue-400",
        valueClass: "text-blue-700 dark:text-blue-300",
      };
    case "Reparado":
      return {
        borderClass: "border-emerald-200 dark:border-emerald-500/20",
        backgroundClass: "bg-emerald-50/50 dark:bg-emerald-500/[0.05]",
        iconBgClass: "bg-gradient-to-br from-emerald-500 to-emerald-600",
        labelClass: "text-emerald-600 dark:text-emerald-400",
        valueClass: "text-emerald-700 dark:text-emerald-300",
      };
    case "Entregado":
      return {
        borderClass: "border-slate-200 dark:border-slate-500/20",
        backgroundClass: "bg-slate-50/50 dark:bg-slate-500/[0.05]",
        iconBgClass: "bg-gradient-to-br from-slate-500 to-slate-600",
        labelClass: "text-slate-600 dark:text-slate-400",
        valueClass: "text-slate-700 dark:text-slate-300",
      };
    case "Cancelado":
      return {
        borderClass: "border-rose-200 dark:border-rose-500/20",
        backgroundClass: "bg-rose-50/50 dark:bg-rose-500/[0.05]",
        iconBgClass: "bg-gradient-to-br from-rose-500 to-rose-600",
        labelClass: "text-rose-600 dark:text-rose-300",
        valueClass: "text-rose-700 dark:text-rose-200",
      };
    default:
      return {
        borderClass: "border-gray-200 dark:border-gray-700",
        backgroundClass: "bg-gray-50/50 dark:bg-gray-800/40",
        iconBgClass: "bg-gradient-to-br from-gray-600 to-gray-700",
        labelClass: "text-gray-600 dark:text-gray-300",
        valueClass: "text-gray-700 dark:text-gray-200",
      };
  }
};

export default function EntradasPage() {
  const [filters, setFilters] = useState<EntradasFilters>({
    search: "",
    estado: "Todos",
  });
  const [isNuevaModalOpen, setIsNuevaModalOpen] = useState(false);
  const [editingEntrada, setEditingEntrada] = useState<Entrada | null>(null);
  const [detalleEntrada, setDetalleEntrada] = useState<Entrada | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const { entradas, loading, error, deleteEntrada, updateEntrada, refetchEntradas } = useEntradas(filters);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const counts = ESTADO_ORDER.reduce<Record<EstadoEntrada, number>>(
      (acc, estado) => {
        acc[estado] = 0;
        return acc;
      },
      {} as Record<EstadoEntrada, number>
    );

    entradas.forEach((entrada) => {
      const estadoNormalizado = normalizeEstadoEntrada(entrada.estado);
      counts[estadoNormalizado] = (counts[estadoNormalizado] ?? 0) + 1;
    });

    return {
      total: entradas.length,
      counts,
    };
  }, [entradas]);

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta entrada?")) {
      setDeletingId(id);
      const result = await deleteEntrada(id);
      setDeletingId(null);

      if (result.success) {
        alert("Entrada eliminada exitosamente");
      } else {
        alert(`Error: ${result.error}`);
      }
    }
  };

  const handleUpdateEstado = async (id: string, newEstado: EstadoEntrada) => {
    const result = await updateEntrada(id, { estado: newEstado });
    if (result.success) {
      refetchEntradas();
      // Actualizar el estado local de detalleEntrada si está abierto
      if (detalleEntrada && detalleEntrada.id === id) {
        setDetalleEntrada({ ...detalleEntrada, estado: newEstado });
      }
    } else {
      // Lanzar error para que el modal lo capture
      throw new Error(result.error || "Error al actualizar el estado");
    }
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
    });
  };

  const activeFiltersCount = [
    filters.search && filters.search.length > 0,
    filters.estado && filters.estado !== "Todos",
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Entradas
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestión de dispositivos ingresados para reparación
          </p>
        </div>
        <button
          onClick={() => setIsNuevaModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40 hover:scale-105 active:scale-95"
        >
          <PlusIcon />
          Nueva Entrada
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
        {/* Total Card */}
        <div className="relative overflow-hidden transition-all border rounded-xl border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/40 dark:to-gray-900/40 p-4 hover:shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">{stats.total}</p>
            </div>
          </div>
        </div>

        {/* Estado Cards */}
        {ESTADO_ORDER.map((estado) => {
          const style = getEstadoSummaryStyle(estado);
          const icon = React.cloneElement(getEstadoIcon(estado), {
            className: "w-5 h-5 text-white",
          });

          return (
            <div
              key={estado}
              className={`relative overflow-hidden transition-all border rounded-xl ${style.borderClass} ${style.backgroundClass} p-4 hover:shadow-lg cursor-pointer`}
              onClick={() => setFilters({ ...filters, estado })}
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${style.iconBgClass} shadow-lg`}>
                  {icon}
                </div>
                <div>
                  <p className={`text-xs font-medium ${style.labelClass}`}>
                    {ESTADO_SUMMARY_LABELS[estado]}
                  </p>
                  <p className={`text-2xl font-bold ${style.valueClass}`}>
                    {stats.counts[estado] ?? 0}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] backdrop-blur-sm">
        <div className="flex flex-col gap-4 mb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filtros</h3>
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white rounded-full bg-brand-500">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "table"
                  ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
                  : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              title="Vista de tabla"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "cards"
                  ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
                  : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              title="Vista de tarjetas"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Search */}
          <div className="md:col-span-5">
            <label className="block mb-2 text-xs font-semibold text-gray-600 uppercase dark:text-gray-400">
              Búsqueda
            </label>
            <div className="relative group">
              <svg
                className="absolute w-5 h-5 text-gray-400 transition-colors transform -translate-y-1/2 left-3 top-1/2 group-focus-within:text-brand-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Cliente, teléfono, modelo, ID..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="w-full py-2.5 pl-10 pr-10 text-sm border-2 border-gray-200 rounded-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters({ ...filters, search: "" })}
                  className="absolute p-1 text-gray-400 transition-colors transform -translate-y-1/2 rounded-full right-2 top-1/2 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Estado Filter - Simple Pills */}
          <div className="md:col-span-7">
            <label className="block mb-2 text-xs font-semibold text-gray-600 uppercase dark:text-gray-400">
              Estado
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilters({ ...filters, estado: "Todos" })}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                  filters.estado === "Todos"
                    ? "bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg shadow-gray-500/30"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                Todos
              </button>
              {ESTADO_ORDER.map((estado) => {
                const style = getEstadoFilterStyle(estado);
                const isActive = filters.estado === estado;
                const icon = React.cloneElement(getEstadoIcon(estado), {
                  className: "w-3.5 h-3.5",
                });

                return (
                  <button
                    key={estado}
                    onClick={() => setFilters({ ...filters, estado })}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                      isActive ? style.activeClass : style.inactiveClass
                    }`}
                  >
                    {icon}
                    {estado}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24 border border-gray-200 rounded-2xl bg-white/50 dark:bg-white/[0.02] dark:border-gray-800">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-t-transparent rounded-full border-brand-500 animate-spin"></div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Cargando entradas...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-8 border border-red-200 rounded-2xl bg-red-50 dark:bg-red-500/10 dark:border-red-500/20">
          <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Error: {error}</span>
          </div>
        </div>
      ) : entradas.length === 0 ? (
        <div className="py-24 text-center border border-gray-200 rounded-2xl bg-white/50 dark:bg-white/[0.02] dark:border-gray-800">
          <svg
            className="w-20 h-20 mx-auto mb-4 text-gray-300 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
            No hay entradas
          </h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            {activeFiltersCount > 0
              ? "No se encontraron resultados con los filtros aplicados"
              : "Comienza agregando tu primera entrada de reparación"}
          </p>
          <button
            onClick={() => setIsNuevaModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40"
          >
            <PlusIcon />
            {activeFiltersCount > 0 ? "Nueva Entrada" : "Crear primera entrada"}
          </button>
        </div>
      ) : viewMode === "table" ? (
        /* Table View */
        <div className="border border-gray-200 rounded-2xl bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-600 uppercase dark:text-gray-300">
                    ID
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-600 uppercase dark:text-gray-300">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-600 uppercase dark:text-gray-300">
                    Contacto
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-600 uppercase dark:text-gray-300">
                    Dispositivo
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-600 uppercase dark:text-gray-300">
                    Problema
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-600 uppercase dark:text-gray-300">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-600 uppercase dark:text-gray-300">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-right text-gray-600 uppercase dark:text-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {entradas.map((entrada) => (
                  <tr
                    key={entrada.id}
                    onClick={() => setDetalleEntrada(entrada)}
                    className="transition-colors cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm font-semibold text-brand-600 dark:text-brand-400">
                        {entrada.id_reparacion}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {entrada.nombre_cliente}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {entrada.telefono}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {entrada.modelo}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs text-sm text-gray-600 truncate dark:text-gray-400">
                        {entrada.problema}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(entrada.fecha_entrada)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-full ${getEstadoBadgeClass(
                          entrada.estado
                        )}`}
                      >
                        {getEstadoIcon(entrada.estado)}
                        {entrada.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEntrada(entrada);
                          }}
                          className="p-2 text-blue-600 transition-all rounded-lg hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                          title="Editar"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(entrada.id);
                          }}
                          disabled={deletingId === entrada.id}
                          className="p-2 text-red-600 transition-all rounded-lg hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 disabled:opacity-50"
                          title="Eliminar"
                        >
                          {deletingId === entrada.id ? (
                            <div className="w-4 h-4 border-2 border-t-transparent border-red-600 rounded-full animate-spin"></div>
                          ) : (
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {entradas.map((entrada) => (
            <div
              key={entrada.id}
              onClick={() => setDetalleEntrada(entrada)}
              className="p-5 transition-all border border-gray-200 rounded-2xl bg-white dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-xl hover:scale-105 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="mb-1 font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">
                    {entrada.id_reparacion}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {entrada.nombre_cliente}
                  </h3>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold border rounded-lg ${getEstadoBadgeClass(
                    entrada.estado
                  )}`}
                >
                  {getEstadoIcon(entrada.estado)}
                  {entrada.estado}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {entrada.telefono}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {entrada.modelo}
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="line-clamp-2">{entrada.problema}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDateShort(entrada.fecha_entrada)}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingEntrada(entrada);
                    }}
                    className="p-2 text-blue-600 transition-all rounded-lg hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(entrada.id);
                    }}
                    disabled={deletingId === entrada.id}
                    className="p-2 text-red-600 transition-all rounded-lg hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 disabled:opacity-50"
                    title="Eliminar"
                  >
                    {deletingId === entrada.id ? (
                      <div className="w-4 h-4 border-2 border-t-transparent border-red-600 rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <NuevaEntradaModal
        isOpen={isNuevaModalOpen}
        onClose={() => setIsNuevaModalOpen(false)}
        onSuccess={refetchEntradas}
      />
      {editingEntrada && (
        <EditarEntradaModal
          entrada={editingEntrada}
          isOpen={!!editingEntrada}
          onClose={() => setEditingEntrada(null)}
        />
      )}
      {detalleEntrada && (
        <>
          {/* Usar modal con presupuesto para estados de cotización */}
          {detalleEntrada.estado === "Cotización" ? (
            <DetalleEntradaModalWithBudget
              entrada={detalleEntrada}
              isOpen={!!detalleEntrada}
              onClose={() => setDetalleEntrada(null)}
              onUpdateEstado={handleUpdateEstado}
            />
          ) : (
            <DetalleEntradaModalOld
              entrada={detalleEntrada}
              isOpen={!!detalleEntrada}
              onClose={() => setDetalleEntrada(null)}
              onUpdateEstado={handleUpdateEstado}
            />
          )}
        </>
      )}
    </div>
  );
}

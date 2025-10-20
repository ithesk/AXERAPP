"use client";

import React, { useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import type { Entrada, EstadoEntrada } from "@/types/entradas";
import { useToast } from "@/context/ToastContext";
import BudgetManager from "@/components/budgets/BudgetManager";
import type { BudgetWithItems } from "@/types/budgets";

interface DetalleEntradaModalProps {
  entrada: Entrada;
  isOpen: boolean;
  onClose: () => void;
  onUpdateEstado?: (id: string, newEstado: EstadoEntrada) => Promise<void>;
}

type TabType = "info" | "presupuesto" | "bitacora";

const ESTADOS_FLUJO: EstadoEntrada[] = [
  "Cotización",
  "Inicio reparación",
  "En reparación",
  "Reparado",
  "Entregado",
];

const getEstadoIndex = (estado: EstadoEntrada): number => {
  const index = ESTADOS_FLUJO.indexOf(estado);
  return index === -1 ? 0 : index;
};

const getEstadoColor = (estado: EstadoEntrada) => {
  switch (estado) {
    case "Cotización":
      return "bg-amber-500";
    case "Inicio reparación":
      return "bg-violet-500";
    case "En reparación":
      return "bg-blue-500";
    case "Reparado":
      return "bg-emerald-500";
    case "Entregado":
      return "bg-slate-600";
    default:
      return "bg-gray-400";
  }
};

const DEVICE_CHECK_FIELDS = [
  { key: "check_face_id", label: "Face ID" },
  { key: "check_signal", label: "Señal" },
  { key: "check_wifi", label: "Wifi" },
  { key: "check_screen", label: "Pantalla" },
  { key: "check_true_tone", label: "True Tone" },
  { key: "check_touch", label: "Touch" },
  { key: "check_camera", label: "Cámara" },
  { key: "check_microphone", label: "Micrófono" },
  { key: "check_speaker", label: "Bocina" },
  { key: "check_charging", label: "Carga" },
  { key: "check_buttons", label: "Botones" },
  { key: "check_panic", label: "Panic" },
  { key: "check_screws", label: "Tornillos" },
  { key: "check_earpiece", label: "Auricular" },
  { key: "check_no_sim", label: "Sin SIM" },
  { key: "check_flash", label: "Flash" },
  { key: "check_front_camera", label: "Cámara Frontal" },
] as const;

export default function DetalleEntradaModal({
  entrada,
  isOpen,
  onClose,
  onUpdateEstado,
}: DetalleEntradaModalProps) {
  const { showToast } = useToast();
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [budget, setBudget] = useState<BudgetWithItems | null>(null);

  const currentEstadoIndex = getEstadoIndex(entrada.estado);
  const canAdvance = currentEstadoIndex < ESTADOS_FLUJO.length - 1;
  const nextEstado = canAdvance ? ESTADOS_FLUJO[currentEstadoIndex + 1] : null;

  const handleAdvanceEstado = async () => {
    if (!nextEstado || !onUpdateEstado) return;

    setUpdating(true);
    try {
      await onUpdateEstado(entrada.id, nextEstado);
      showToast("success", "Estado actualizado", `La entrada ahora está en: ${nextEstado}`);
    } catch (error) {
      showToast("error", "Error al actualizar", "No se pudo cambiar el estado de la entrada");
    } finally {
      setUpdating(false);
    }
  };

  const handleBudgetChange = (newBudget: BudgetWithItems | null) => {
    setBudget(newBudget);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-6xl m-4">
      <div className="relative w-full max-w-6xl overflow-hidden bg-white rounded-3xl dark:bg-gray-900 max-h-[90vh] flex flex-col">
        {/* Header Fijo */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {entrada.nombre_cliente}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                ID: <span className="font-mono font-semibold text-brand-600 dark:text-brand-400">{entrada.id_reparacion}</span>
                {entrada.tecnico_asignado && (
                  <span className="ml-3">
                    <svg className="inline w-3 h-3 mr-1 -mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    {entrada.tecnico_asignado}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Flujo de Estados */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center flex-1 gap-1">
              {ESTADOS_FLUJO.map((estado, index) => {
                const isCompleted = index < currentEstadoIndex;
                const isCurrent = index === currentEstadoIndex;

                return (
                  <React.Fragment key={estado}>
                    <div
                      className={`relative flex items-center justify-center w-7 h-7 rounded-full border-2 transition-all ${
                        isCompleted
                          ? `${getEstadoColor(estado)} border-transparent text-white`
                          : isCurrent
                          ? `${getEstadoColor(estado)} border-transparent text-white`
                          : "bg-gray-200 border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-700"
                      }`}
                      title={estado}
                    >
                      {isCompleted ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span className="text-[10px] font-bold">{index + 1}</span>
                      )}
                    </div>
                    {index < ESTADOS_FLUJO.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 transition-all ${
                          index < currentEstadoIndex
                            ? getEstadoColor(ESTADOS_FLUJO[index])
                            : "bg-gray-200 dark:bg-gray-800"
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {entrada.estado}
            </div>
          </div>

          {/* Botón para avanzar estado */}
          {canAdvance && (
            <div className="mb-4">
              <Button
                onClick={handleAdvanceEstado}
                disabled={updating}
                size="sm"
                className="w-full sm:w-auto"
              >
                {updating ? (
                  <>
                    <div className="w-3 h-3 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Actualizando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Avanzar a: {nextEstado}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("info")}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === "info"
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              Información
              {activeTab === "info" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 dark:bg-brand-400"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("presupuesto")}
              className={`px-4 py-2 text-sm font-medium transition-colors relative flex items-center gap-2 ${
                activeTab === "presupuesto"
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Presupuesto
              {budget && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold text-white rounded-full bg-green-500">
                  ${budget.total.toFixed(0)}
                </span>
              )}
              {activeTab === "presupuesto" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 dark:bg-brand-400"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("bitacora")}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === "bitacora"
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              Bitácora
              {activeTab === "bitacora" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 dark:bg-brand-400"></div>
              )}
            </button>
          </div>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Tab: Información */}
            {activeTab === "info" && (
              <div className="space-y-6">
                {/* Información Principal */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 dark:bg-gray-800/30 dark:border-gray-800">
                    <label className="block mb-1 text-[10px] font-bold text-gray-500 uppercase dark:text-gray-400">
                      Cliente
                    </label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {entrada.nombre_cliente}
                    </p>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {entrada.telefono}
                    </p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 dark:bg-gray-800/30 dark:border-gray-800">
                    <label className="block mb-1 text-[10px] font-bold text-gray-500 uppercase dark:text-gray-400">
                      Dispositivo
                    </label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {entrada.modelo}
                    </p>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {formatDate(entrada.fecha_entrada)}
                    </p>
                  </div>
                </div>

                {/* Problema y Observaciones */}
                <div className="p-5 border border-gray-200 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 dark:border-gray-800">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Detalles de la Reparación
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                        Problema Reportado
                      </label>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {entrada.problema}
                      </p>
                    </div>
                    {entrada.problema_detalle && (
                      <div>
                        <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                          Descripción Detallada
                        </label>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {entrada.problema_detalle}
                        </p>
                      </div>
                    )}
                    {entrada.accesorios && (
                      <div>
                        <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                          Accesorios
                        </label>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {entrada.accesorios}
                        </p>
                      </div>
                    )}
                    {entrada.observaciones && (
                      <div>
                        <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                          Observaciones
                        </label>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {entrada.observaciones}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Estado del Dispositivo */}
                <div className="p-5 border border-gray-200 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 dark:border-gray-800">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Estado del Dispositivo
                  </h3>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                    {DEVICE_CHECK_FIELDS.map(({ key, label }) => {
                      const isChecked = entrada[key as keyof Entrada];
                      return (
                        <div
                          key={key}
                          className={`flex items-center gap-2 p-2 rounded-lg ${
                            isChecked
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                          }`}
                        >
                          {isChecked ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          <span className="text-xs font-medium">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Presupuesto */}
            {activeTab === "presupuesto" && (
              <BudgetManager
                entradaId={entrada.id}
                entrada={entrada}
                onBudgetChange={handleBudgetChange}
              />
            )}

            {/* Tab: Bitácora */}
            {activeTab === "bitacora" && (
              <div className="p-12 text-center border border-gray-200 rounded-2xl bg-gray-50 dark:border-gray-800 dark:bg-gray-800/30">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                  Bitácora
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  La bitácora de comentarios estará disponible próximamente
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

"use client";

import React, { useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import type { Entrada, EstadoEntrada } from "@/types/entradas";
import { useToast } from "@/context/ToastContext";
import { PrintLabelButton } from "./PrintLabelButton";
import { PrintPOSTicketButton } from "./PrintPOSTicketButton";

interface DetalleEntradaModalProps {
  entrada: Entrada;
  isOpen: boolean;
  onClose: () => void;
  onUpdateEstado?: (id: string, newEstado: EstadoEntrada) => Promise<void>;
}

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
  const [comentario, setComentario] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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
      const errorMessage = error instanceof Error ? error.message : "No se pudo cambiar el estado de la entrada";
      showToast("error", "Error al actualizar", errorMessage);
      console.error("Error actualizando estado:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleAddComentario = () => {
    if (!comentario.trim() && selectedFiles.length === 0) {
      showToast("warning", "Comentario vacío", "Escribe un comentario o adjunta archivos");
      return;
    }

    showToast("info", "Función en desarrollo", "La bitácora se implementará próximamente");
    setComentario("");
    setSelectedFiles([]);
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-6xl m-4">
      <div className="relative w-full max-w-6xl overflow-y-auto bg-white rounded-3xl dark:bg-gray-900 max-h-[90vh]">
        {/* Header Compacto */}
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm dark:bg-gray-900/95 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {entrada.nombre_cliente}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-mono font-semibold text-brand-600 dark:text-brand-400">#{entrada.id_reparacion}</span>
                <span className="mx-2">•</span>
                {entrada.modelo}
                {entrada.tecnico_asignado && (
                  <>
                    <span className="mx-2">•</span>
                    <svg className="inline w-3.5 h-3.5 mr-1 -mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    {entrada.tecnico_asignado}
                  </>
                )}
              </p>
            </div>
            <div className="flex gap-2 mr-2">
              <PrintLabelButton entrada={entrada} variant="outline" size="sm" />
              <PrintPOSTicketButton entrada={entrada} variant="outline" size="sm" mode="print" />
            </div>
          </div>

          {/* Stepper Horizontal Compacto */}
          <div className="flex items-center gap-2">
            <div className="flex items-center flex-1 gap-1">
              {ESTADOS_FLUJO.map((estado, index) => {
                const isCompleted = index < currentEstadoIndex;
                const isCurrent = index === currentEstadoIndex;

                return (
                  <React.Fragment key={estado}>
                    <div
                      className={`relative flex items-center justify-center w-6 h-6 rounded-full transition-all ${
                        isCompleted || isCurrent
                          ? `${getEstadoColor(estado)} text-white`
                          : "bg-gray-200 text-gray-400 dark:bg-gray-800"
                      }`}
                      title={estado}
                    >
                      {isCompleted ? (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="text-[10px] font-bold">{index + 1}</span>
                      )}
                    </div>
                    {index < ESTADOS_FLUJO.length - 1 && (
                      <div className={`flex-1 h-0.5 ${index < currentEstadoIndex ? getEstadoColor(ESTADOS_FLUJO[index]) : "bg-gray-200 dark:bg-gray-800"}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {entrada.estado}
              </span>
              {canAdvance && (
                <Button onClick={handleAdvanceEstado} disabled={updating} size="sm">
                  {updating ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Contenido en Grid */}
        <div className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-3">
          {/* Columna Principal */}
          <div className="space-y-4 lg:col-span-2">
            {/* Problema y Detalles */}
            <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-800">
              <label className="block mb-2 text-xs font-bold text-gray-500 uppercase">Problema Reportado</label>
              <p className="text-sm text-gray-900 dark:text-white leading-relaxed">{entrada.problema}</p>
              {entrada.accesorios && (
                <div className="mt-3">
                  <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">Accesorios</label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{entrada.accesorios}</p>
                </div>
              )}
              {entrada.observaciones && (
                <div className="mt-3">
                  <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">Observaciones</label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{entrada.observaciones}</p>
                </div>
              )}
            </div>

            {/* Detalles Técnicos */}
            {(entrada.imei_sn || entrada.device_passwords || entrada.battery_condition || entrada.estimado_reparacion) && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {entrada.imei_sn && (
                  <div className="p-3 border border-gray-200 rounded-lg dark:border-gray-800">
                    <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">IMEI/SN</label>
                    <p className="text-sm font-mono text-gray-900 dark:text-white">{entrada.imei_sn}</p>
                  </div>
                )}
                {entrada.device_passwords && (
                  <div className="p-3 border border-gray-200 rounded-lg dark:border-gray-800">
                    <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">Códigos</label>
                    <p className="text-sm font-mono text-gray-900 dark:text-white">{entrada.device_passwords}</p>
                  </div>
                )}
                {entrada.battery_condition && (
                  <div className="p-3 border border-gray-200 rounded-lg dark:border-gray-800">
                    <label className="block mb-1 text-xs font-bold text-gray-500 uppercase">Batería</label>
                    <p className="text-sm font-mono text-gray-900 dark:text-white">{entrada.battery_condition}</p>
                  </div>
                )}
                {entrada.estimado_reparacion && (
                  <div className="p-3 border border-emerald-200 bg-emerald-50 rounded-lg dark:border-emerald-800 dark:bg-emerald-900/20">
                    <label className="block mb-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">Estimado</label>
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                      ${entrada.estimado_reparacion.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Verificaciones del Dispositivo */}
            <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-800">
              <label className="block mb-3 text-xs font-bold text-gray-500 uppercase">Chequeo del Dispositivo</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {DEVICE_CHECK_FIELDS.map((field) => {
                  const isChecked = entrada[field.key as keyof Entrada] === true;
                  return (
                    <div
                      key={field.key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                        isChecked
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "bg-gray-50 text-gray-500 dark:bg-gray-800/30 dark:text-gray-500"
                      }`}
                    >
                      <span className="text-sm">{isChecked ? "✓" : "○"}</span>
                      <span className="truncate">{field.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Columna Lateral - Bit ácora */}
          <div className="lg:col-span-1">
            <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-800">
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                Bitácora
              </h3>

              {/* Comentarios */}
              <div className="mb-4 space-y-2">
                <div className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Sistema</span>
                    <span className="text-xs text-gray-500">{formatDate(entrada.fecha_entrada)}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Entrada registrada</p>
                </div>

                <div className="py-6 text-center">
                  <p className="text-sm text-gray-400">No hay más comentarios</p>
                </div>
              </div>

              {/* Formulario Nuevo Comentario */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  placeholder="Agregar comentario..."
                />
                <div className="flex items-center gap-2 mt-2">
                  <label className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Adjuntar
                    <input type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={handleFileSelect} className="hidden" />
                  </label>
                  <Button onClick={handleAddComentario} size="sm" className="flex-1">
                    Agregar
                  </Button>
                </div>
                {selectedFiles.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">{selectedFiles.length} archivo(s)</p>
                )}
              </div>
            </div>

            {/* Info Adicional */}
            <div className="p-3 mt-4 border border-gray-200 rounded-lg dark:border-gray-800">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Teléfono:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{entrada.telefono}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ingreso:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatDate(entrada.fecha_entrada)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-6 py-3 border-t border-gray-200 bg-white/95 backdrop-blur-sm dark:bg-gray-900/95 dark:border-gray-800">
          <Button variant="outline" onClick={onClose} size="sm">
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

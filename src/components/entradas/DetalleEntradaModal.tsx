"use client";

import React, { useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import type { Entrada, EstadoEntrada } from "@/types/entradas";
import { useToast } from "@/context/ToastContext";
import { PrintLabelButton } from "./PrintLabelButton";

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
      showToast("error", "Error al actualizar", "No se pudo cambiar el estado de la entrada");
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

    // TODO: Implementar guardado en base de datos
    showToast("info", "Función en desarrollo", "La bitácora se implementará próximamente");
    setComentario("");
    setSelectedFiles([]);
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
      <div className="relative w-full max-w-6xl overflow-y-auto bg-white rounded-3xl dark:bg-gray-900 max-h-[90vh]">
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm dark:bg-gray-900/95 dark:border-gray-800">
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
            <div>
              <PrintLabelButton entrada={entrada} variant="outline" size="sm" />
            </div>
          </div>

          {/* Flujo de Estados - Stepper Compacto */}
          <div className="flex items-center gap-3">
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

          {/* Botón para avanzar estado - Compacto */}
          {canAdvance && (
            <div className="mt-3">
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
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
          {/* Columna Izquierda - 2/3 del espacio */}
          <div className="space-y-4 lg:col-span-2">
            {/* Información Principal - Compacta */}
            <div className="grid grid-cols-2 gap-4">
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

          {/* Información del Dispositivo */}
          <div className="p-5 border border-gray-200 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 dark:border-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Información del Dispositivo
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                  Modelo
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {entrada.modelo}
                </p>
              </div>
              <div>
                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                  Fecha de Entrada
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(entrada.fecha_entrada)}
                </p>
              </div>
              {entrada.tecnico_asignado && (
                <div className="md:col-span-2">
                  <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                    Técnico Asignado
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-500/20">
                      <svg className="w-4 h-4 text-brand-600 dark:text-brand-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {entrada.tecnico_asignado}
                    </p>
                  </div>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                  Problema Reportado
                </label>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {entrada.problema}
                </p>
              </div>
              {entrada.accesorios && (
                <div className="md:col-span-2">
                  <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                    Accesorios
                  </label>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {entrada.accesorios}
                  </p>
                </div>
              )}
              {entrada.observaciones && (
                <div className="md:col-span-2">
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

          {/* Detalles Técnicos */}
          <div className="p-5 border border-gray-200 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 dark:border-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              <svg className="inline-block w-5 h-5 mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              Detalles Técnicos
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {entrada.imei_sn && (
                <div>
                  <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                    IMEI / Serial
                  </label>
                  <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                    {entrada.imei_sn}
                  </p>
                </div>
              )}
              {entrada.device_passwords && (
                <div>
                  <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                    Contraseñas / Códigos
                  </label>
                  <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                    {entrada.device_passwords}
                  </p>
                </div>
              )}
              {entrada.battery_condition && (
                <div>
                  <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                    Condición de Batería
                  </label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {entrada.battery_condition}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Verificación del Dispositivo */}
          <div className="p-5 border border-gray-200 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 dark:border-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              <svg className="inline-block w-5 h-5 mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Chequeo del Dispositivo
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {DEVICE_CHECK_FIELDS.map((field) => {
                const isChecked = entrada[field.key as keyof Entrada] === true;
                return (
                  <div
                    key={field.key}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                      isChecked
                        ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20"
                        : "bg-white border-gray-200 dark:bg-gray-900/40 dark:border-gray-700"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-5 h-5 rounded border-2 flex-shrink-0 ${
                        isChecked
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {isChecked && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isChecked
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {field.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bitácora de Comentarios */}
          <div className="p-5 border border-gray-200 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 dark:border-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              <svg className="inline-block w-5 h-5 mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Bitácora de Seguimiento
            </h3>

            {/* Área de comentarios existentes */}
            <div className="mb-4 space-y-3">
              <div className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-500/20">
                    <svg className="w-4 h-4 text-brand-600 dark:text-brand-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        Sistema
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(entrada.fecha_entrada)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Entrada registrada en el sistema
                    </p>
                  </div>
                </div>
              </div>

              {/* Mensaje de placeholder */}
              <div className="py-8 text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No hay comentarios adicionales aún
                </p>
              </div>
            </div>

            {/* Formulario para nuevo comentario */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Agregar Comentario
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                placeholder="Escribe un comentario sobre el progreso de la reparación..."
              />

              {/* Área de adjuntos */}
              <div className="mt-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  Adjuntar archivos
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                {selectedFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedFiles.length} archivo(s) seleccionado(s)
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-3">
                <Button
                  onClick={handleAddComentario}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar a Bitácora
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer con botón cerrar */}
      <div className="sticky bottom-0 p-6 border-t border-gray-200 bg-white/95 backdrop-blur-sm dark:bg-gray-900/95 dark:border-gray-800">
        <Button
          variant="outline"
          onClick={onClose}
          className="w-full sm:w-auto"
        >
          Cerrar
        </Button>
      </div>
    </div>
    </Modal>
  );
}

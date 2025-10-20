"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useEntradas } from "@/hooks/useEntradas";
import { useContacts } from "@/hooks/useContacts";
import { useDeviceModels } from "@/hooks/useDeviceModels";
import type { Contact, CreateContactData } from "@/types/contacts";
import type { DeviceModel, CreateDeviceModelData } from "@/types/deviceModels";
import type { Entrada, UpdateEntradaData, EstadoEntrada } from "@/types/entradas";
import { ESTADOS_ENTRADA } from "@/types/entradas";
import ContactInputWithAutocomplete from "@/components/contacts/ContactInputWithAutocomplete";
import ContactModal from "@/components/contacts/ContactModal";
import DeviceModelInputWithAutocomplete from "@/components/device-models/DeviceModelInputWithAutocomplete";
import DeviceModelModal from "@/components/device-models/DeviceModelModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { CONTACT_ALL_AVAILABILITY } from "@/types";
import { useUser } from "@/context/UserContext";
import { useOrgMembers } from "@/hooks/useOrgMembers";
import { useCommonProblems } from "@/hooks/useCommonProblems";

interface EditarEntradaModalProps {
  entrada: Entrada;
  isOpen: boolean;
  onClose: () => void;
}

const DEVICE_CHECK_FIELDS = [
  { name: "check_face_id", label: "Face ID" },
  { name: "check_signal", label: "Señal" },
  { name: "check_wifi", label: "Wifi" },
  { name: "check_screen", label: "Pantalla" },
  { name: "check_true_tone", label: "True Tone" },
  { name: "check_touch", label: "Touch" },
  { name: "check_camera", label: "Camera" },
  { name: "check_microphone", label: "Micrófono" },
  { name: "check_speaker", label: "Bocina" },
  { name: "check_charging", label: "Carga" },
  { name: "check_buttons", label: "Botones" },
  { name: "check_panic", label: "Panic" },
  { name: "check_screws", label: "Tornillos" },
  { name: "check_earpiece", label: "Auricular" },
  { name: "check_no_sim", label: "Sin SIM" },
  { name: "check_flash", label: "Flash" },
  { name: "check_front_camera", label: "Front Camera" },
] as const;

const formatMemberName = (
  firstName?: string | null,
  lastName?: string | null,
  fallbackEmail?: string | null
) => {
  const parts = [firstName?.trim(), lastName?.trim()].filter(
    (part): part is string => !!part && part.length > 0
  );
  if (parts.length > 0) {
    return parts.join(" ");
  }
  if (fallbackEmail && fallbackEmail.trim().length > 0) {
    return fallbackEmail.trim();
  }
  return "Usuario sin nombre";
};

const normalizeEstado = (estado: string): EstadoEntrada => {
  switch (estado) {
    case "Pendiente":
      return "Cotización";
    case "Listo":
      return "Reparado";
    case "En reparación":
    case "Entregado":
    case "Cancelado":
    case "Cotización":
    case "Inicio reparación":
    case "Reparado":
      return estado as EstadoEntrada;
    default:
      return "Cotización";
  }
};

export default function EditarEntradaModal({
  entrada,
  isOpen,
  onClose,
}: EditarEntradaModalProps) {
  const { updateEntrada } = useEntradas();
  const {
    contacts,
    loading: contactsLoading,
    createContact: createContactRecord,
  } = useContacts({ module: "entradas" });
  const {
    deviceModels,
    loading: modelsLoading,
    createDeviceModel,
  } = useDeviceModels();
  const { profile } = useUser();
  const { members, loading: membersLoading } = useOrgMembers();
  const { problems: commonProblems } = useCommonProblems({ is_active: true });
  const currentTechnicianName = useMemo(
    () => formatMemberName(profile?.first_name, profile?.last_name, profile?.email),
    [profile]
  );
  const [saving, setSaving] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isDeviceModelModalOpen, setIsDeviceModelModalOpen] = useState(false);
  const [showProblemSuggestions, setShowProblemSuggestions] = useState(false);
  const [problemaSuggestions, setProblemaSuggestions] = useState<string[]>([]);
  const [formData, setFormData] = useState<UpdateEntradaData>({
    contact_id: entrada.contact_id ?? null,
    device_model_id: entrada.device_model_id ?? null,
    nombre_cliente: entrada.nombre_cliente,
    telefono: entrada.telefono,
    modelo: entrada.modelo,
    problema: entrada.problema,
    problema_detalle: entrada.problema_detalle || "",
    accesorios: entrada.accesorios || "",
    observaciones: entrada.observaciones || "",
    tecnico_asignado:
      (entrada.tecnico_asignado ?? "").trim() ||
      currentTechnicianName ||
      "",
    estado: normalizeEstado(entrada.estado),
    imei_sn: entrada.imei_sn || "",
    device_passwords: entrada.device_passwords || "",
    battery_condition: entrada.battery_condition || "",
    check_face_id: entrada.check_face_id,
    check_signal: entrada.check_signal,
    check_wifi: entrada.check_wifi,
    check_screen: entrada.check_screen,
    check_true_tone: entrada.check_true_tone,
    check_touch: entrada.check_touch,
    check_camera: entrada.check_camera,
    check_microphone: entrada.check_microphone,
    check_speaker: entrada.check_speaker,
    check_charging: entrada.check_charging,
    check_buttons: entrada.check_buttons,
    check_panic: entrada.check_panic,
    check_screws: entrada.check_screws,
    check_earpiece: entrada.check_earpiece,
    check_no_sim: entrada.check_no_sim,
    check_flash: entrada.check_flash,
    check_front_camera: entrada.check_front_camera,
  });

  // Update form when entrada prop changes
  useEffect(() => {
    setFormData({
      contact_id: entrada.contact_id ?? null,
      device_model_id: entrada.device_model_id ?? null,
      nombre_cliente: entrada.nombre_cliente,
      telefono: entrada.telefono,
      modelo: entrada.modelo,
      problema: entrada.problema,
      problema_detalle: entrada.problema_detalle || "",
      accesorios: entrada.accesorios || "",
      observaciones: entrada.observaciones || "",
      tecnico_asignado:
        (entrada.tecnico_asignado ?? "").trim() ||
        currentTechnicianName ||
        "",
      estado: normalizeEstado(entrada.estado),
      imei_sn: entrada.imei_sn || "",
      device_passwords: entrada.device_passwords || "",
      battery_condition: entrada.battery_condition || "",
      check_face_id: entrada.check_face_id,
      check_signal: entrada.check_signal,
      check_wifi: entrada.check_wifi,
      check_screen: entrada.check_screen,
      check_true_tone: entrada.check_true_tone,
      check_touch: entrada.check_touch,
      check_camera: entrada.check_camera,
      check_microphone: entrada.check_microphone,
      check_speaker: entrada.check_speaker,
      check_charging: entrada.check_charging,
      check_buttons: entrada.check_buttons,
      check_panic: entrada.check_panic,
      check_screws: entrada.check_screws,
      check_earpiece: entrada.check_earpiece,
      check_no_sim: entrada.check_no_sim,
      check_flash: entrada.check_flash,
      check_front_camera: entrada.check_front_camera,
    });
  }, [entrada, currentTechnicianName]);

  useEffect(() => {
    if (!currentTechnicianName) return;

    setFormData((prev) => {
      if (prev.tecnico_asignado && prev.tecnico_asignado.trim().length > 0) {
        return prev;
      }

      return {
        ...prev,
        tecnico_asignado: currentTechnicianName,
      };
    });
  }, [currentTechnicianName]);

  const technicianOptions = useMemo(() => {
    const base = members
      .map((member) => {
        const user = member.user as {
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
        } | null;

        const label = formatMemberName(
          user?.first_name,
          user?.last_name,
          user?.email ?? null
        );

        return {
          value: label,
          label,
        };
      })
      .filter(
        (option, index, self) =>
          self.findIndex((other) => other.value === option.value) === index
      );

    if (
      formData.tecnico_asignado &&
      !base.some((option) => option.value === formData.tecnico_asignado)
    ) {
      base.push({
        value: formData.tecnico_asignado,
        label: formData.tecnico_asignado,
      });
    }

    return base.sort((a, b) =>
      a.label.localeCompare(b.label, "es", { sensitivity: "base" })
    );
  }, [members, formData.tecnico_asignado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const technicianValue =
      (formData.tecnico_asignado ?? "").trim() ||
      currentTechnicianName ||
      null;
    const sanitizeToNull = (value: string) => {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    const result = await updateEntrada(entrada.id, {
      ...formData,
      tecnico_asignado: technicianValue,
      imei_sn: sanitizeToNull(formData.imei_sn ?? ""),
      device_passwords: sanitizeToNull(formData.device_passwords ?? ""),
      battery_condition: sanitizeToNull(formData.battery_condition ?? ""),
    });
    setSaving(false);

    if (result.success) {
      onClose();
      alert("Entrada actualizada exitosamente");
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    const nextValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleContactSelect = (contact: Contact) => {
    setFormData((prev) => ({
      ...prev,
      contact_id: contact.id,
      nombre_cliente: contact.name,
      telefono: contact.phone ?? contact.mobile ?? prev.telefono,
    }));
  };

  const handleDeviceModelSelect = (model: DeviceModel) => {
    const modelDisplay = model.brand
      ? `${model.brand} ${model.model_name}`
      : model.model_name;

    setFormData((prev) => ({
      ...prev,
      device_model_id: model.id,
      modelo: modelDisplay,
    }));
  };

  const handleProblemaChange = (value: string) => {
    setFormData((prev) => ({ ...prev, problema: value }));

    // Filtrar sugerencias basadas en el input
    if (value.trim().length > 0) {
      const filtered = commonProblems
        .filter((problem) =>
          problem.problem_text.toLowerCase().includes(value.toLowerCase())
        )
        .map((p) => p.problem_text);
      setProblemaSuggestions(filtered);
      setShowProblemSuggestions(filtered.length > 0);
    } else {
      setProblemaSuggestions([]);
      setShowProblemSuggestions(false);
    }
  };

  const handleSelectProblemSuggestion = (problem: string) => {
    setFormData((prev) => ({ ...prev, problema: problem }));
    setShowProblemSuggestions(false);
    setProblemaSuggestions([]);
  };

  const handleCreateContactFromModal = async (
    payload: CreateContactData
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await createContactRecord({
      ...payload,
      available_in_modules: [CONTACT_ALL_AVAILABILITY],
      is_client: payload.is_client ?? true,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const newContact = result.data;

    setFormData((prev) => ({
      ...prev,
      contact_id: newContact.id,
      nombre_cliente: newContact.name,
      telefono: newContact.phone ?? newContact.mobile ?? prev.telefono,
    }));

    return { success: true };
  };

  const handleCreateDeviceModelFromModal = async (
    payload: CreateDeviceModelData
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await createDeviceModel(payload);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const newModel = result.data;
    const modelDisplay = newModel.brand
      ? `${newModel.brand} ${newModel.model_name}`
      : newModel.model_name;

    setFormData((prev) => ({
      ...prev,
      device_model_id: newModel.id,
      modelo: modelDisplay,
    }));

    return { success: true };
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl m-4">
        <div className="relative w-full max-w-3xl p-6 overflow-y-auto bg-white rounded-3xl dark:bg-gray-900 max-h-[90vh]">
        <div className="mb-6">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Editar Entrada
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ID: {entrada.id_reparacion} • Fecha de entrada: {new Date(entrada.fecha_entrada).toLocaleDateString('es-ES')}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Información del Cliente */}
            <div>
              <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                Información del Cliente
              </h5>
              <ContactInputWithAutocomplete
                nameValue={formData.nombre_cliente}
                phoneValue={formData.telefono}
                onNameChange={(name) => setFormData((prev) => ({ ...prev, nombre_cliente: name }))}
                onPhoneChange={(phone) => setFormData((prev) => ({ ...prev, telefono: phone }))}
                onContactSelect={handleContactSelect}
                contacts={contacts}
                loading={contactsLoading}
                onCreateClick={() => setIsContactModalOpen(true)}
                required
                showPhoneInput={false}
              />
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Teléfono seleccionado:{" "}
                <span className="font-semibold">
                  {formData.telefono?.trim() || "Sin teléfono"}
                </span>
              </div>
            </div>

            {/* Información del Dispositivo */}
            <div>
              <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                Información del Dispositivo
              </h5>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DeviceModelInputWithAutocomplete
                  modelValue={formData.modelo}
                  onModelChange={(modelo) => setFormData((prev) => ({ ...prev, modelo }))}
                  onModelSelect={handleDeviceModelSelect}
                  deviceModels={deviceModels}
                  loading={modelsLoading}
                  onCreateClick={() => setIsDeviceModelModalOpen(true)}
                  required
                />

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    IMEI / SN
                  </label>
                  <input
                    type="text"
                    name="imei_sn"
                    value={formData.imei_sn ?? ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    placeholder="Ingresa el IMEI o número de serie"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contraseñas / Códigos de acceso
                  </label>
                  <input
                    type="text"
                    name="device_passwords"
                    value={formData.device_passwords ?? ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    placeholder="PIN, patrón, passcode..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Condición de batería (%)
                  </label>
                  <input
                    type="text"
                    name="battery_condition"
                    value={formData.battery_condition ?? ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    placeholder="Ej. 82%"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Problema Reportado <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="problema"
                      value={formData.problema}
                      onChange={(e) => handleProblemaChange(e.target.value)}
                      onFocus={() => {
                        if (formData.problema && formData.problema.trim().length > 0) {
                          const filtered = commonProblems
                            .filter((problem) =>
                              problem.problem_text.toLowerCase().includes(formData.problema!.toLowerCase())
                            )
                            .map((p) => p.problem_text);
                          setProblemaSuggestions(filtered);
                          setShowProblemSuggestions(filtered.length > 0);
                        }
                      }}
                      onBlur={() => {
                        // Delay para permitir click en sugerencias
                        setTimeout(() => setShowProblemSuggestions(false), 200);
                      }}
                      required
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      placeholder="Ej: Pantalla rota, No carga, etc."
                    />

                    {/* Sugerencias de problemas comunes */}
                    {showProblemSuggestions && problemaSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700 max-h-60 overflow-y-auto">
                        {problemaSuggestions.slice(0, 10).map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleSelectProblemSuggestion(suggestion)}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Escribe para ver sugerencias de problemas comunes
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Descripción Detallada del Problema (opcional)
                  </label>
                  <textarea
                    name="problema_detalle"
                    value={formData.problema_detalle ?? ""}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    placeholder="Agrega información adicional: cuándo comenzó el problema, qué lo causó, síntomas específicos, etc."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Accesorios Incluidos
                  </label>
                  <input
                    type="text"
                    name="accesorios"
                    value={formData.accesorios}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    placeholder="Cargador, funda, SIM, etc."
                  />
                </div>
              </div>
            </div>

            {/* Chequeo Inicial */}
            <div>
              <h5 className="mb-3 text-lg font-medium text-gray-800 dark:text-white/90">
                Chequeo Inicial del Dispositivo
              </h5>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Actualiza los elementos verificados durante la recepción.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {DEVICE_CHECK_FIELDS.map((field) => {
                  const checked =
                    ((formData as Record<string, boolean | undefined>)[field.name] ??
                      false) === true;
                  return (
                    <label
                      key={field.name}
                      className="flex items-center gap-3 px-3 py-2 border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900/40"
                    >
                      <input
                        type="checkbox"
                        name={field.name}
                        checked={checked}
                        onChange={handleChange}
                        className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {field.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Información Adicional */}
            <div>
              <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                Información Adicional
              </h5>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Técnico Asignado
                  </label>
                  <div className="relative">
                    <select
                      name="tecnico_asignado"
                      value={formData.tecnico_asignado ?? ""}
                      onChange={handleChange}
                      disabled={membersLoading || technicianOptions.length === 0}
                      className="w-full appearance-none px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:disabled:bg-gray-800"
                    >
                      <option value="">
                        {membersLoading
                          ? "Cargando técnicos..."
                          : "Selecciona un técnico"}
                      </option>
                      {technicianOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400 dark:text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </div>
                  {!membersLoading && technicianOptions.length === 0 && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                      No hay usuarios activos en la organización para asignar como técnico.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Estado <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  >
                    {ESTADOS_ENTRADA.map((estadoOption) => (
                      <option key={estadoOption} value={estadoOption}>
                        {estadoOption}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Observaciones
                  </label>
                  <textarea
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    placeholder="Notas adicionales, condiciones especiales, etc."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-800">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </div>
        </form>
        </div>
      </Modal>

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        mode="create"
        initialData={null}
        onSubmit={(payload) => handleCreateContactFromModal(payload as CreateContactData)}
      />

      <DeviceModelModal
        isOpen={isDeviceModelModalOpen}
        onClose={() => setIsDeviceModelModalOpen(false)}
        mode="create"
        initialData={null}
        onSubmit={(payload) => handleCreateDeviceModelFromModal(payload as CreateDeviceModelData)}
      />
    </>
  );
}

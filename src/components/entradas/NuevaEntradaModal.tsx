"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useEntradas } from "@/hooks/useEntradas";
import type { CreateEntradaData } from "@/types/entradas";
import { useContacts } from "@/hooks/useContacts";
import type { Contact, CreateContactData } from "@/types/contacts";
import { useDeviceModels } from "@/hooks/useDeviceModels";
import type { DeviceModel, CreateDeviceModelData } from "@/types/deviceModels";
import { CONTACT_ALL_AVAILABILITY } from "@/types";
import ContactInputWithAutocomplete from "@/components/contacts/ContactInputWithAutocomplete";
import ContactModal from "@/components/contacts/ContactModal";
import DeviceModelInputWithAutocomplete from "@/components/device-models/DeviceModelInputWithAutocomplete";
import DeviceModelModal from "@/components/device-models/DeviceModelModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { useUser } from "@/context/UserContext";
import { useOrgMembers } from "@/hooks/useOrgMembers";
import { useToast } from "@/context/ToastContext";
import { useCommonProblems } from "@/hooks/useCommonProblems";

interface NuevaEntradaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
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

export default function NuevaEntradaModal({
  isOpen,
  onClose,
  onSuccess,
}: NuevaEntradaModalProps) {
  const { createEntrada } = useEntradas();
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
  const { showToast } = useToast();
  const { problems: commonProblems, createProblem } = useCommonProblems({ is_active: true });
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const totalSteps = 2;
  const stepLabels: Record<1 | 2, string> = {
    1: "Datos del cliente y problema",
    2: "Chequeo inicial y entrega",
  };

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

  const technicianOptions = useMemo(
    () =>
      members
        .map((member) => {
          const label = formatMemberName(
            (member.user as { first_name?: string | null } | undefined)?.first_name,
            (member.user as { last_name?: string | null } | undefined)?.last_name,
            (member.user as { email?: string | null } | undefined)?.email ?? null
          );

          return {
            value: label,
            label,
          };
        })
        .filter(
          (option, index, self) =>
            self.findIndex((other) => other.value === option.value) === index
        )
        .sort((a, b) =>
          a.label.localeCompare(b.label, "es", { sensitivity: "base" })
        ),
    [members]
  );

  const currentTechnicianName = useMemo(() => {
    if (!profile) return "";

    return formatMemberName(
      profile.first_name,
      profile.last_name,
      profile.email
    );
  }, [profile]);

  const [saving, setSaving] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isDeviceModelModalOpen, setIsDeviceModelModalOpen] = useState(false);
  const [showProblemSuggestions, setShowProblemSuggestions] = useState(false);
  const [problemaSuggestions, setProblemaSuggestions] = useState<string[]>([]);
  const [formData, setFormData] = useState<CreateEntradaData>({
    contact_id: null,
    device_model_id: null,
    nombre_cliente: "",
    telefono: "",
    modelo: "",
    problema: "",
    problema_detalle: "",
    accesorios: "",
    observaciones: "",
    tecnico_asignado: "",
    estado: "Cotización",
    imei_sn: "",
    device_passwords: "",
    battery_condition: "",
    estimado_reparacion: undefined,
    check_face_id: false,
    check_signal: false,
    check_wifi: false,
    check_screen: false,
    check_true_tone: false,
    check_touch: false,
    check_camera: false,
    check_microphone: false,
    check_speaker: false,
    check_charging: false,
    check_buttons: false,
    check_panic: false,
    check_screws: false,
    check_earpiece: false,
    check_no_sim: false,
    check_flash: false,
    check_front_camera: false,
  });

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

  const technicianSelectOptions = useMemo(() => {
    const base = [...technicianOptions];

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
  }, [technicianOptions, formData.tecnico_asignado]);

  const validateStep = (step: 1 | 2) => {
    if (step === 1) {
      if (!formData.nombre_cliente.trim()) {
        showToast("error", "El nombre del cliente es obligatorio.");
        return false;
      }
      if (!formData.telefono.trim()) {
        showToast("error", "El teléfono de contacto es obligatorio.");
        return false;
      }
      if (!formData.modelo.trim()) {
        showToast("error", "Debes seleccionar o ingresar un modelo.");
        return false;
      }
      if (!formData.problema.trim()) {
        showToast("error", "Describe el problema reportado antes de continuar.");
        return false;
      }
      if (!formData.tecnico_asignado || !formData.tecnico_asignado.trim()) {
        showToast("error", "Selecciona un técnico asignado para continuar.");
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (!validateStep(1)) return;
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2) : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevenir envío si no estamos en el último paso
    if (currentStep < totalSteps) {
      handleNextStep();
      return;
    }

    setSaving(true);

    const sanitizeOptional = (value: string) => {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    };
    const technicianValue =
      (formData.tecnico_asignado ?? "").trim() ||
      currentTechnicianName ||
      undefined;

    const result = await createEntrada({
      ...formData,
      tecnico_asignado: technicianValue,
      imei_sn: sanitizeOptional(formData.imei_sn ?? ""),
      device_passwords: sanitizeOptional(formData.device_passwords ?? ""),
      battery_condition: sanitizeOptional(formData.battery_condition ?? ""),
    });
    setSaving(false);

    if (result.success) {
      showToast("success", "Entrada creada exitosamente", "La entrada se ha registrado correctamente.");

      // Recargar la lista de entradas en el componente padre
      if (onSuccess) {
        onSuccess();
      }

      // Reset form
      setFormData({
        contact_id: null,
        device_model_id: null,
        nombre_cliente: "",
        telefono: "",
        modelo: "",
        problema: "",
        problema_detalle: "",
        accesorios: "",
        observaciones: "",
        tecnico_asignado: "",
        estado: "Cotización",
        imei_sn: "",
        device_passwords: "",
        battery_condition: "",
        check_face_id: false,
        check_signal: false,
        check_wifi: false,
        check_screen: false,
        check_true_tone: false,
        check_touch: false,
        check_camera: false,
        check_microphone: false,
        check_speaker: false,
        check_charging: false,
        check_buttons: false,
        check_panic: false,
        check_screws: false,
        check_earpiece: false,
        check_no_sim: false,
        check_flash: false,
        check_front_camera: false,
      });
      setCurrentStep(1);

      // Cerrar modal después de un pequeño delay para que se vea el toast
      setTimeout(() => {
        onClose();
      }, 300);
    } else {
      showToast("error", "Error al crear entrada", result.error || "No se pudo crear la entrada.");
      console.error('[NuevaEntradaModal] Error creando entrada:', result.error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    let nextValue: string | boolean | number | undefined;

    if (type === "checkbox") {
      nextValue = checked;
    } else if (type === "number") {
      // Para campos numéricos, convertir a número o undefined si está vacío
      nextValue = value === "" ? undefined : parseFloat(value);
    } else {
      nextValue = value;
    }

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
      // Mostrar dropdown si hay sugerencias O si el usuario escribió más de 2 caracteres (para mostrar botón de crear)
      setShowProblemSuggestions(filtered.length > 0 || value.trim().length > 2);
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

  const handleCreateAndSelectProblem = async () => {
    const problemText = formData.problema.trim();
    if (!problemText) return;

    const result = await createProblem({
      problem_text: problemText,
      is_active: true,
    });

    if (result.success) {
      showToast("success", "Problema guardado", `"${problemText}" se ha guardado como problema común.`);
      setShowProblemSuggestions(false);
    } else {
      showToast("error", "Error al guardar", result.error || "No se pudo guardar el problema.");
    }
  };

  const handleCancel = () => {
    setCurrentStep(1);
    onClose();
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

    const newModel = result.data!;
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
      <Modal isOpen={isOpen} onClose={handleCancel} className="max-w-3xl m-4">
        <div className="relative w-full max-w-3xl p-6 overflow-y-auto bg-white rounded-3xl dark:bg-gray-900 max-h-[90vh]">
        <div className="mb-6">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Nueva Entrada
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Registra un nuevo dispositivo para reparación
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Paso {currentStep} de {totalSteps}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {stepLabels[currentStep]}
                </p>
              </div>
              <div className="flex items-center gap-2 w-36">
                {[1, 2].map((step) => (
                  <div
                    key={step}
                    className={`h-2 flex-1 rounded-full transition-all ${currentStep > step ? "bg-brand-500" : currentStep === step ? "bg-brand-500/70" : "bg-gray-200 dark:bg-gray-700"}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {currentStep === 1 ? (
            <div className="space-y-6">
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
                          if (formData.problema.trim().length > 0) {
                            const filtered = commonProblems
                              .filter((problem) =>
                                problem.problem_text.toLowerCase().includes(formData.problema.toLowerCase())
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
                      {showProblemSuggestions && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700 max-h-60 overflow-y-auto">
                          {problemaSuggestions.length > 0 ? (
                            problemaSuggestions.slice(0, 10).map((suggestion, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => handleSelectProblemSuggestion(suggestion)}
                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                              >
                                {suggestion}
                              </button>
                            ))
                          ) : formData.problema.trim().length > 2 ? (
                            /* Botón para guardar como problema común cuando no hay coincidencias */
                            <button
                              type="button"
                              onClick={handleCreateAndSelectProblem}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-500/10 flex items-center justify-center">
                                  <svg className="w-4 h-4 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    Guardar "{formData.problema}"
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Guardar como problema común para futuros usos
                                  </p>
                                </div>
                              </div>
                            </button>
                          ) : null}
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

              <div>
                <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                  Asignación inicial
                </h5>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Técnico Asignado
                    </label>
                    <div className="relative">
                      <select
                        name="tecnico_asignado"
                        value={formData.tecnico_asignado ?? ""}
                        onChange={handleChange}
                        disabled={membersLoading || technicianSelectOptions.length === 0}
                        required
                        className="w-full appearance-none px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:disabled:bg-gray-800"
                      >
                        <option value="">
                          {membersLoading ? "Cargando técnicos..." : "Selecciona un técnico"}
                        </option>
                        {technicianSelectOptions.map((option) => (
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
                        No hay usuarios activos en la organización. Agrega un miembro para asignarlo como técnico.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                  Detalles del Dispositivo
                </h5>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

                  <div>
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

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Estimado de Reparación
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 dark:text-gray-400 text-sm">
                        $
                      </span>
                      <input
                        type="number"
                        name="estimado_reparacion"
                        value={formData.estimado_reparacion ?? ""}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        className="w-full pl-8 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="mb-3 text-lg font-medium text-gray-800 dark:text-white/90">
                  Chequeo Inicial del Dispositivo
                </h5>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                  Marca los elementos verificados durante la recepción.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {DEVICE_CHECK_FIELDS.map((field) => {
                    const checked =
                      ((formData as unknown as Record<string, boolean | undefined>)[field.name] ??
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

              <div>
                <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                  Información Adicional
                </h5>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  El estado inicial se establece automáticamente en <span className="font-semibold">Cotización</span>.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-6 mt-8 border-t border-gray-200 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancelar
            </Button>
            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={saving}
                >
                  Anterior
                </Button>
              )}
              {currentStep < totalSteps && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleNextStep}
                  disabled={saving || membersLoading}
                >
                  Siguiente
                </Button>
              )}
              {currentStep >= totalSteps && (
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </>
                  ) : (
                    "Crear Entrada"
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
        </div>
      </Modal>

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        mode="create"
        initialData={null}
        initialName={formData.nombre_cliente}
        onSubmit={(payload) => handleCreateContactFromModal(payload as CreateContactData)}
      />

      <DeviceModelModal
        isOpen={isDeviceModelModalOpen}
        onClose={() => setIsDeviceModelModalOpen(false)}
        mode="create"
        initialData={null}
        initialModelName={formData.modelo}
        onSubmit={(payload) => handleCreateDeviceModelFromModal(payload as CreateDeviceModelData)}
      />
    </>
  );
}

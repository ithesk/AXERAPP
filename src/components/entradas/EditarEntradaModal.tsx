"use client";

import React, { useState, useEffect } from "react";
import { useEntradas } from "@/hooks/useEntradas";
import { useContacts } from "@/hooks/useContacts";
import { useDeviceModels } from "@/hooks/useDeviceModels";
import type { Contact, CreateContactData } from "@/types/contacts";
import type { DeviceModel, CreateDeviceModelData } from "@/types/deviceModels";
import type { Entrada, UpdateEntradaData, EstadoEntrada } from "@/types/entradas";
import ContactInputWithAutocomplete from "@/components/contacts/ContactInputWithAutocomplete";
import ContactModal from "@/components/contacts/ContactModal";
import DeviceModelInputWithAutocomplete from "@/components/device-models/DeviceModelInputWithAutocomplete";
import DeviceModelModal from "@/components/device-models/DeviceModelModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { CONTACT_ALL_AVAILABILITY } from "@/types";

interface EditarEntradaModalProps {
  entrada: Entrada;
  isOpen: boolean;
  onClose: () => void;
}

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
  const [saving, setSaving] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isDeviceModelModalOpen, setIsDeviceModelModalOpen] = useState(false);
  const [formData, setFormData] = useState<UpdateEntradaData>({
    contact_id: entrada.contact_id ?? null,
    device_model_id: entrada.device_model_id ?? null,
    nombre_cliente: entrada.nombre_cliente,
    telefono: entrada.telefono,
    modelo: entrada.modelo,
    problema: entrada.problema,
    accesorios: entrada.accesorios || "",
    observaciones: entrada.observaciones || "",
    tecnico_asignado: entrada.tecnico_asignado || "",
    estado: entrada.estado,
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
      accesorios: entrada.accesorios || "",
      observaciones: entrada.observaciones || "",
      tecnico_asignado: entrada.tecnico_asignado || "",
      estado: entrada.estado,
    });
  }, [entrada]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const result = await updateEntrada(entrada.id, formData);
    setSaving(false);

    if (result.success) {
      onClose();
      alert("Entrada actualizada exitosamente");
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
              />
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

                <div className="md:col-span-2">
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Problema Reportado <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="problema"
                    value={formData.problema}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    placeholder="Describe el problema o falla del dispositivo..."
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
                  <input
                    type="text"
                    name="tecnico_asignado"
                    value={formData.tecnico_asignado}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    placeholder="Nombre del técnico"
                  />
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
                    <option value="Pendiente">Pendiente</option>
                    <option value="En reparación">En reparación</option>
                    <option value="Listo">Listo</option>
                    <option value="Entregado">Entregado</option>
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

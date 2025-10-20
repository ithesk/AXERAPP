"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import type {
  DeviceModel,
  CreateDeviceModelData,
  UpdateDeviceModelData,
} from "@/types/deviceModels";
import { COMMON_BRANDS, DEVICE_CATEGORY_LABELS } from "@/types/deviceModels";

interface DeviceModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  onSubmit: (
    data: CreateDeviceModelData | UpdateDeviceModelData
  ) => Promise<{ success: boolean; error?: string }>;
  initialData?: DeviceModel | null;
  initialModelName?: string;
}

type FormState = {
  model_name: string;
  brand: string;
  category: string;
  reference: string;
};

const DEFAULT_STATE: FormState = {
  model_name: "",
  brand: "",
  category: "",
  reference: "",
};

export default function DeviceModelModal({
  isOpen,
  onClose,
  mode,
  onSubmit,
  initialData,
  initialModelName,
}: DeviceModelModalProps) {
  const [formState, setFormState] = useState<FormState>(DEFAULT_STATE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData && mode === "edit") {
      setFormState({
        model_name: initialData.model_name ?? "",
        brand: initialData.brand ?? "",
        category: initialData.category ?? "",
        reference: initialData.reference ?? "",
      });
    } else {
      // Modo crear: usar initialModelName si está disponible
      setFormState({
        ...DEFAULT_STATE,
        model_name: initialModelName ?? "",
      });
    }
  }, [initialData, mode, isOpen, initialModelName]);

  const modalTitle =
    mode === "edit" ? "Editar modelo de dispositivo" : "Nuevo modelo de dispositivo";

  const submitLabel = mode === "edit" ? "Guardar cambios" : "Crear modelo";

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formState.model_name.trim()) {
      setError("El nombre del modelo es requerido");
      return;
    }

    setSaving(true);
    setError(null);

    const toOptional = (value: string) => {
      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    };

    const toNullable = (value: string) => {
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    };

    const isEdit = mode === "edit";

    const payload: CreateDeviceModelData | UpdateDeviceModelData = isEdit
      ? {
          model_name: formState.model_name.trim(),
          brand: toNullable(formState.brand),
          category: toNullable(formState.category),
          reference: toNullable(formState.reference),
        }
      : {
          model_name: formState.model_name.trim(),
          brand: toOptional(formState.brand),
          category: toOptional(formState.category),
          reference: toOptional(formState.reference),
        };

    const result = await onSubmit(payload);

    setSaving(false);

    if (!result.success) {
      setError(result.error ?? "Ocurrió un error al guardar el modelo");
      return;
    }

    onClose();
    setFormState(DEFAULT_STATE);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl m-4">
      <div className="w-full p-6 overflow-y-auto bg-white rounded-3xl dark:bg-gray-900 max-h-[90vh]">
        <div className="mb-6">
          <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {modalTitle}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Guarda información básica del dispositivo para búsqueda rápida.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div>
            <h5 className="mb-3 text-sm font-medium text-gray-800 uppercase dark:text-white/70">
              Información Básica
            </h5>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre del Modelo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="model_name"
                  value={formState.model_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Ej. iPhone 14 Pro Max, Galaxy S23 Ultra, MacBook Pro M2"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Marca / Fabricante
                </label>
                <select
                  name="brand"
                  value={formState.brand}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="">Selecciona una marca</option>
                  {COMMON_BRANDS.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Categoría
                </label>
                <select
                  name="category"
                  value={formState.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="">Selecciona una categoría</option>
                  {Object.entries(DEVICE_CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Referencia / Código
                </label>
                <input
                  type="text"
                  name="reference"
                  value={formState.reference}
                  onChange={handleInputChange}
                  placeholder="Ej. A2342, SM-S918B"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
          </div>


          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-500/10 dark:text-red-200 dark:border-red-400/40">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
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
              {saving ? "Guardando..." : submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import type {
  Contact,
  CreateContactData,
  UpdateContactData,
} from "@/types/contacts";
import { COUNTRIES } from "@/data/locations";
import { AvatarUpload } from "@/components/contacts/AvatarUpload";
import { useOrganization } from "@/context/OrganizationContext";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  onSubmit: (
    data: CreateContactData | UpdateContactData
  ) => Promise<{ success: boolean; error?: string }>;
  initialData?: Contact | null;
  initialName?: string;
}

type FormState = {
  name: string;
  phone: string;
  mobile: string;
  email: string;
  is_client: boolean;
  is_vendor: boolean;
  tax_id: string;
  website: string;
  avatar_url: string;
  tags: string;
  address_line1: string;
  address_line2: string;
  address_city: string;
  address_state: string;
  address_postal_code: string;
  address_country: string;
  notes: string;
};

const DEFAULT_STATE: FormState = {
  name: "",
  phone: "",
  mobile: "",
  email: "",
  is_client: true,
  is_vendor: false,
  tax_id: "",
  website: "",
  avatar_url: "",
  tags: "",
  address_line1: "",
  address_line2: "",
  address_city: "",
  address_state: "",
  address_postal_code: "",
  address_country: "",
  notes: "",
};

export default function ContactModal({
  isOpen,
  onClose,
  mode,
  onSubmit,
  initialData,
  initialName,
}: ContactModalProps) {
  const { currentOrg } = useOrganization();
  const [formState, setFormState] = useState<FormState>(DEFAULT_STATE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countrySearch, setCountrySearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);

  const selectedCountry = useMemo(() => {
    const countryName = formState.address_country.trim().toLowerCase();
    return COUNTRIES.find(
      (country) => country.name.toLowerCase() === countryName
    );
  }, [formState.address_country]);

  const availableStates = useMemo(() => {
    return selectedCountry?.states ?? [];
  }, [selectedCountry]);

  const hasStatesForCountry = availableStates.length > 0;

  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase();
    if (!query) return COUNTRIES;
    return COUNTRIES.filter((country) =>
      country.name.toLowerCase().includes(query)
    );
  }, [countrySearch]);

  const filteredStates = useMemo(() => {
    if (!hasStatesForCountry) return [];
    const query = stateSearch.trim().toLowerCase();
    if (!query) return availableStates;
    return availableStates.filter((state) =>
      state.toLowerCase().includes(query)
    );
  }, [availableStates, hasStatesForCountry, stateSearch]);

  useEffect(() => {
    if (initialData && mode === "edit") {
      setFormState({
        name: initialData.name ?? "",
        phone: initialData.phone ?? "",
        mobile: initialData.mobile ?? "",
        email: initialData.email ?? "",
        is_client: initialData.is_client,
        is_vendor: initialData.is_vendor,
        tax_id: initialData.tax_id ?? "",
        website: initialData.website ?? "",
        avatar_url: initialData.avatar_url ?? "",
        tags: initialData.tags?.join(", ") ?? "",
        address_line1: initialData.address?.line1 ?? "",
        address_line2: initialData.address?.line2 ?? "",
        address_city: initialData.address?.city ?? "",
        address_state: initialData.address?.state ?? "",
        address_postal_code: initialData.address?.postal_code ?? "",
        address_country: initialData.address?.country ?? "",
        notes: initialData.notes ?? "",
      });
    } else {
      // Modo crear: usar initialName si está disponible
      setFormState({
        ...DEFAULT_STATE,
        name: initialName ?? "",
      });
    }
  }, [initialData, mode, isOpen, initialName]);

  useEffect(() => {
    setCountrySearch(formState.address_country ?? "");
  }, [formState.address_country]);

  useEffect(() => {
    setStateSearch(formState.address_state ?? "");
  }, [formState.address_state]);

  useEffect(() => {
    if (!selectedCountry || !hasStatesForCountry) return;
    if (
      formState.address_state &&
      !availableStates.includes(formState.address_state)
    ) {
      setFormState((prev) => ({
        ...prev,
        address_state: "",
      }));
    }
  }, [selectedCountry, hasStatesForCountry, availableStates, formState.address_state]);

  const modalTitle = useMemo(
    () => (mode === "edit" ? "Editar contacto" : "Nuevo contacto"),
    [mode]
  );

  const submitLabel = mode === "edit" ? "Guardar cambios" : "Crear contacto";

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;
    const { name, value } = target;
    const isCheckbox = target instanceof HTMLInputElement && target.type === "checkbox";

    setFormState((prev) => ({
      ...prev,
      [name]: isCheckbox ? target.checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formState.name.trim()) {
      setError("El nombre es requerido");
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

    const tagsArray = formState.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const optionalAddress = {
      line1: toOptional(formState.address_line1),
      line2: toOptional(formState.address_line2),
      city: toOptional(formState.address_city),
      state: toOptional(formState.address_state),
      postal_code: toOptional(formState.address_postal_code),
      country: toOptional(formState.address_country),
    };

    const nullableAddress = {
      line1: toNullable(formState.address_line1),
      line2: toNullable(formState.address_line2),
      city: toNullable(formState.address_city),
      state: toNullable(formState.address_state),
      postal_code: toNullable(formState.address_postal_code),
      country: toNullable(formState.address_country),
    };

    const isEdit = mode === "edit";

    const payload: CreateContactData | UpdateContactData = isEdit
      ? {
          name: formState.name.trim(),
          phone: toNullable(formState.phone),
          mobile: toNullable(formState.mobile),
          email: toNullable(formState.email),
          is_client: formState.is_client,
          is_vendor: formState.is_vendor,
          tax_id: toNullable(formState.tax_id),
          website: toNullable(formState.website),
          avatar_url: toNullable(formState.avatar_url),
          tags: tagsArray,
          address: nullableAddress,
          notes: toNullable(formState.notes),
        }
      : {
          name: formState.name.trim(),
          phone: toOptional(formState.phone),
          mobile: toOptional(formState.mobile),
          email: toOptional(formState.email),
          is_client: formState.is_client,
          is_vendor: formState.is_vendor,
          tax_id: toOptional(formState.tax_id),
          website: toOptional(formState.website),
          avatar_url: toOptional(formState.avatar_url),
          tags: tagsArray.length > 0 ? tagsArray : undefined,
          address: optionalAddress,
          notes: toOptional(formState.notes),
        };

    if (!isEdit) {
      const createPayload = payload as CreateContactData;
      if (!createPayload.address) {
        delete createPayload.address;
      } else {
        const hasAddressValue = Object.values(createPayload.address).some(Boolean);
        if (!hasAddressValue) {
          delete createPayload.address;
        }
      }
    }

    const result = await onSubmit(payload);

    setSaving(false);

    if (!result.success) {
      setError(result.error ?? "Ocurrió un error al guardar el contacto");
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
            Gestiona contactos reutilizables disponibles en todos los módulos actuales y futuros.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sección de Avatar y Nombre - Layout horizontal */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar a la izquierda */}
            <div className="flex-shrink-0">
              <AvatarUpload
                currentAvatarUrl={formState.avatar_url}
                contactName={formState.name}
                orgId={currentOrg?.id || ""}
                onUploadSuccess={(url) => {
                  setFormState((prev) => ({
                    ...prev,
                    avatar_url: url,
                  }));
                }}
                onRemove={() => {
                  setFormState((prev) => ({
                    ...prev,
                    avatar_url: "",
                  }));
                }}
                size={120}
              />
            </div>

            {/* Información básica a la derecha del avatar */}
            <div className="flex-1 space-y-4 w-full">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formState.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Ej. Juan Pérez, Importaciones MX, etc."
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Teléfono
                  </label>
                  <PhoneInput
                    value={formState.phone}
                    onChange={(value) => setFormState((prev) => ({ ...prev, phone: value }))}
                    placeholder="Teléfono fijo"
                    defaultCountry="DO"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Móvil / WhatsApp
                  </label>
                  <PhoneInput
                    value={formState.mobile}
                    onChange={(value) => setFormState((prev) => ({ ...prev, mobile: value }))}
                    placeholder="Móvil / WhatsApp"
                    defaultCountry="DO"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  value={formState.email}
                  onChange={handleInputChange}
                  placeholder="contacto@empresa.com"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
          </div>

          {/* Clasificación del contacto */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl dark:border-gray-800">
              <input
                type="checkbox"
                name="is_client"
                checked={formState.is_client}
                onChange={handleInputChange}
                className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  Es cliente
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Disponible en procesos orientados al cliente como entradas y ventas.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl dark:border-gray-800">
              <input
                type="checkbox"
                name="is_vendor"
                checked={formState.is_vendor}
                onChange={handleInputChange}
                className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  Es proveedor
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Útil para compras y abastecimiento a proveedores frecuentes.
                </p>
              </div>
            </label>
          </div>

          <div>
            <h5 className="mb-3 text-sm font-medium text-gray-800 uppercase dark:text-white/70">
              Información adicional
            </h5>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Documento fiscal (RNC / Cédula)
                </label>
                <input
                  type="text"
                  name="tax_id"
                  value={formState.tax_id}
                  onChange={handleInputChange}
                  placeholder="000-00000-0"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sitio web
                </label>
                <input
                  type="url"
                  name="website"
                  value={formState.website}
                  onChange={handleInputChange}
                  placeholder="https://empresa.com"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Etiquetas
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formState.tags}
                  onChange={handleInputChange}
                  placeholder="Cliente VIP, Mayorista"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Separa las etiquetas con comas.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h5 className="mb-3 text-sm font-medium text-gray-800 uppercase dark:text-white/70">
              Dirección
            </h5>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Calle y número
                </label>
                <input
                  type="text"
                  name="address_line1"
                  value={formState.address_line1}
                  onChange={handleInputChange}
                  placeholder="Av. Reforma 123"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Referencia / Interior
                </label>
                <input
                  type="text"
                  name="address_line2"
                  value={formState.address_line2}
                  onChange={handleInputChange}
                  placeholder="Piso 3, Oficina 12"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ciudad
                </label>
                <input
                  type="text"
                  name="address_city"
                  value={formState.address_city}
                  onChange={handleInputChange}
                  placeholder="Ciudad de México"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Estado / Provincia
                </label>
                {hasStatesForCountry ? (
                  <div className="relative">
                    <input
                      type="text"
                      name="address_state"
                      autoComplete="off"
                      value={stateSearch}
                      onChange={(e) => {
                        const value = e.target.value;
                        setStateSearch(value);
                        setFormState((prev) => ({
                          ...prev,
                          address_state: value,
                        }));
                      }}
                      onFocus={() => setIsStateDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setIsStateDropdownOpen(false), 150)}
                      placeholder="Selecciona una provincia"
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                    />
                    {isStateDropdownOpen && (
                      <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
                        {filteredStates.length === 0 ? (
                          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                            No se encontraron coincidencias
                          </div>
                        ) : (
                          filteredStates.map((state) => (
                            <button
                              type="button"
                              key={state}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setStateSearch(state);
                                setFormState((prev) => ({
                                  ...prev,
                                  address_state: state,
                                }));
                                setIsStateDropdownOpen(false);
                              }}
                              className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                            >
                              {state}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    name="address_state"
                    value={formState.address_state}
                    onChange={handleInputChange}
                    placeholder="CDMX"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {hasStatesForCountry
                    ? "Selecciona una provincia de la lista basada en el país."
                    : "Puedes escribir la provincia o región manualmente."}
                </p>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Código Postal
                </label>
                <input
                  type="text"
                  name="address_postal_code"
                  value={formState.address_postal_code}
                  onChange={handleInputChange}
                  placeholder="06000"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  País
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      name="address_country"
                      autoComplete="off"
                      value={countrySearch}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCountrySearch(value);
                        setFormState((prev) => ({
                          ...prev,
                          address_country: value,
                        }));
                      }}
                      onFocus={() => setIsCountryDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setIsCountryDropdownOpen(false), 150)}
                      placeholder="Selecciona o escribe un país"
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                    />
                    {isCountryDropdownOpen && (
                      <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
                        {filteredCountries.length === 0 ? (
                          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                            No se encontraron coincidencias
                          </div>
                        ) : (
                          filteredCountries.map((country) => (
                            <button
                              type="button"
                              key={country.code}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setCountrySearch(country.name);
                                setFormState((prev) => ({
                                  ...prev,
                                  address_country: country.name,
                                  address_state: "",
                                }));
                                setIsCountryDropdownOpen(false);
                              }}
                              className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                            >
                              {country.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Empieza a escribir para buscar un país y selecciona una opción. La lista de provincias se ajustará automáticamente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Notas internas
            </label>
            <textarea
              name="notes"
              value={formState.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Observaciones internas, mejores horarios de contacto, etc."
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-500/10 dark:text-red-200 dark:border-red-400/40">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button type="button" size="sm" variant="outline" onClick={onClose} disabled={saving}>
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

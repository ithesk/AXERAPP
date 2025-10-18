"use client";

import React, { useState } from "react";
import Image from "next/image";
import ContactSelect from "./ContactSelect";
import ContactModal from "./ContactModal";
import { useContacts } from "@/hooks/useContacts";
import type { ContactModule, CreateContactData } from "@/types/contacts";
import { CONTACT_MODULE_LABELS, CONTACT_ALL_AVAILABILITY } from "@/types";

interface ContactUsageCardProps {
  module: ContactModule;
  title: string;
  description: string;
}

const ContactUsageCard: React.FC<ContactUsageCardProps> = ({
  module,
  title,
  description,
}) => {
  const { contacts, loading, createContact } = useContacts({ module });
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedContact = contacts.find((contact) => contact.id === selectedContactId) ?? null;
  const addressParts = selectedContact
    ? [
        selectedContact.address?.line1,
        selectedContact.address?.line2,
        selectedContact.address?.city,
        selectedContact.address?.state,
        selectedContact.address?.postal_code,
        selectedContact.address?.country,
      ].filter((value): value is string => Boolean(value && value.trim().length > 0))
    : [];

  const handleCreateContact = async (
    payload: CreateContactData
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await createContact({
      ...payload,
      available_in_modules: [CONTACT_ALL_AVAILABILITY],
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    setSelectedContactId(result.data.id);
    return { success: true };
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>

      <div className="space-y-4">
        <ContactSelect
          label={`Contacto para ${CONTACT_MODULE_LABELS[module].toLowerCase()}`}
          contacts={contacts}
          value={selectedContactId}
          onChange={setSelectedContactId}
          loading={loading}
          placeholder={loading ? "Cargando contactos..." : "Selecciona un contacto"}
          emptyLabel="Aún no hay contactos para este módulo"
          onCreateClick={() => setIsModalOpen(true)}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Los contactos son globales para todos los módulos; aquí solo seleccionas cuál usar.
        </p>

        {selectedContact ? (
          <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-lg font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-200">
                {selectedContact.avatar_url ? (
                  <Image
                    src={selectedContact.avatar_url}
                    alt={selectedContact.name}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (selectedContact.name?.charAt(0) ?? "?").toUpperCase()
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-base font-semibold text-gray-900 dark:text-white/90">
                    {selectedContact.name}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    {selectedContact.is_client && (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                        Cliente
                      </span>
                    )}
                    {selectedContact.is_vendor && (
                      <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                        Proveedor
                      </span>
                    )}
                    {selectedContact.tags.length > 0 &&
                      selectedContact.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600 dark:bg-slate-500/10 dark:text-slate-200"
                        >
                          #{tag}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="space-y-1">
                  {selectedContact.phone && <p>Teléfono: {selectedContact.phone}</p>}
                  {selectedContact.mobile && <p>Móvil: {selectedContact.mobile}</p>}
                  {selectedContact.email && (
                    <p className="text-gray-500 dark:text-gray-400">Email: {selectedContact.email}</p>
                  )}
                  {selectedContact.website && (
                    <p>
                      Sitio web:{" "}
                      <a
                        href={selectedContact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 hover:underline dark:text-brand-300"
                      >
                        {selectedContact.website}
                      </a>
                    </p>
                  )}
                  {selectedContact.tax_id && <p>Documento: {selectedContact.tax_id}</p>}
                  {addressParts.length > 0 && <p>Dirección: {addressParts.join(", ")}</p>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Selecciona un contacto para asociarlo a este flujo operativo.
          </p>
        )}
      </div>

      <ContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode="create"
        initialData={null}
        onSubmit={(payload) => handleCreateContact(payload as CreateContactData)}
      />
    </div>
  );
};

export default ContactUsageCard;

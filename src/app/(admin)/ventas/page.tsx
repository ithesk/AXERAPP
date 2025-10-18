"use client";

import React, { useState } from "react";
import ContactAutocomplete from "@/components/contacts/ContactAutocomplete";
import ContactModal from "@/components/contacts/ContactModal";
import { useContacts } from "@/hooks/useContacts";
import type { Contact, CreateContactData } from "@/types/contacts";
import { CONTACT_ALL_AVAILABILITY } from "@/types";

export default function Ventas() {
  const {
    contacts,
    loading: contactsLoading,
    createContact: createContactRecord,
  } = useContacts({ module: "ventas" });

  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const handleContactSelect = (contactId: string | null, contact: Contact | null) => {
    setSelectedContactId(contactId);
    setSelectedContact(contact);
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
    setSelectedContactId(newContact.id);
    setSelectedContact(newContact);

    return { success: true };
  };

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <h1 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Ventas
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Módulo de gestión de ventas con contactos vinculados a clientes y prospectos.
          </p>
        </div>

        {/* Demo del ContactAutocomplete */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Seleccionar Cliente para Venta
          </h2>

          <div className="max-w-2xl">
            <ContactAutocomplete
              label="Cliente"
              contacts={contacts}
              value={selectedContactId}
              onChange={handleContactSelect}
              loading={contactsLoading}
              placeholder="Busca por nombre, teléfono, email..."
              emptyLabel="No se encontraron clientes"
              onCreateClick={() => setIsContactModalOpen(true)}
              showAvatar={true}
              required={true}
            />

            {selectedContact && (
              <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Cliente seleccionado:
                </h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p><strong>Nombre:</strong> {selectedContact.name}</p>
                  {selectedContact.phone && <p><strong>Teléfono:</strong> {selectedContact.phone}</p>}
                  {selectedContact.mobile && <p><strong>Móvil:</strong> {selectedContact.mobile}</p>}
                  {selectedContact.email && <p><strong>Email:</strong> {selectedContact.email}</p>}
                  {selectedContact.tax_id && <p><strong>RNC/Cédula:</strong> {selectedContact.tax_id}</p>}
                  <p>
                    <strong>Rol:</strong>{" "}
                    {selectedContact.is_client && "Cliente"}
                    {selectedContact.is_client && selectedContact.is_vendor && " y "}
                    {selectedContact.is_vendor && "Proveedor"}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Nota:</strong> Este es un demo del componente ContactAutocomplete.
                En producción, aquí irían los campos del formulario de venta (productos, cantidades, precios, etc.).
              </p>
            </div>
          </div>
        </div>
      </div>

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        mode="create"
        initialData={null}
        onSubmit={(payload) => handleCreateContactFromModal(payload as CreateContactData)}
      />
    </>
  );
}

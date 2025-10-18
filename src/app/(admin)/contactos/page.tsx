"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ContactModal from "@/components/contacts/ContactModal";
import { useContacts } from "@/hooks/useContacts";
import type {
  Contact,
  ContactModule,
  CreateContactData,
  UpdateContactData,
} from "@/types/contacts";
import { CONTACT_ALL_AVAILABILITY, CONTACT_MODULE_LABELS } from "@/types";
import {
  PlusIcon,
  PencilIcon,
  TrashBinIcon,
} from "@/icons";

type ModuleFilter = "todos" | ContactModule;

const MODULE_FILTERS: { id: ModuleFilter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "entradas", label: "Entradas" },
  { id: "ventas", label: "Ventas" },
  { id: "compras", label: "Compras" },
  { id: "inventario", label: "Inventario" },
];

export default function ContactosPage() {
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const activeModule =
    moduleFilter === "todos" ? undefined : (moduleFilter as ContactModule);

  const {
    contacts,
    loading,
    error,
    createContact,
    updateContact,
    deleteContact,
  } = useContacts(
    activeModule ? { module: activeModule } : {}
  );

  const filteredContacts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return contacts;
    }

    return contacts.filter((contact) => {
      const hayCoincidencia = [contact.name, contact.phone, contact.email]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query));

      return hayCoincidencia;
    });
  }, [contacts, searchTerm]);

  const stats = useMemo(() => {
    const total = contacts.length;
    const clients = contacts.filter((contact) => contact.is_client).length;
    const vendors = contacts.filter((contact) => contact.is_vendor).length;

    return { total, clients, vendors };
  }, [contacts]);

  const openCreateModal = () => {
    setEditingContact(null);
    setIsModalOpen(true);
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingContact(null);
    setIsModalOpen(false);
  };

  const handleCreateContact = async (
    payload: CreateContactData
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await createContact(payload);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true };
  };

  const handleUpdateContact = async (
    payload: UpdateContactData
  ): Promise<{ success: boolean; error?: string }> => {
    if (!editingContact) {
      return { success: false, error: "Contacto inválido" };
    }

    const result = await updateContact(editingContact.id, payload);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true };
  };

  const handleDeleteContact = async (contact: Contact) => {
    const confirmation = window.confirm(
      `¿Eliminar el contacto "${contact.name}"? Esta acción no se puede deshacer.`
    );

    if (!confirmation) return;

    const result = await deleteContact(contact.id);
    if (!result.success) {
      window.alert(result.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Contactos
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Administra contactos compartidos para entradas, ventas y compras.
            </p>
          </div>
          <Button
            onClick={openCreateModal}
            startIcon={<PlusIcon className="w-4 h-4" />}
          >
            Nuevo contacto
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-6 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Contactos activos
            </p>
            <p className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              {stats.total}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Con rol de cliente
            </p>
            <p className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              {stats.clients}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Con rol de proveedor
            </p>
            <p className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              {stats.vendors}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {MODULE_FILTERS.map((filter) => {
              const isActive = moduleFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setModuleFilter(filter.id)}
                  className={`rounded-lg px-4 py-2 text-sm transition ${
                    isActive
                      ? "bg-brand-500 text-white shadow-theme-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-80">
            <input
              type="search"
              placeholder="Buscar por nombre, teléfono o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Tabla con diseño mejorado inspirado en BasicTableOne */}
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[1000px]">
              <Table>
                {/* Table Header */}
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Contacto
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Información
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Roles
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Creado
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400"
                    >
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHeader>

                {/* Table Body */}
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                      >
                        Cargando contactos...
                      </TableCell>
                    </TableRow>
                  ) : filteredContacts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="px-5 py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                      >
                        No se encontraron contactos con los filtros actuales.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContacts.map((contact) => {
                      // Variables comentadas - pueden usarse en el futuro
                      // const addressSegments = [
                      //   contact.address?.line1,
                      //   contact.address?.line2,
                      //   contact.address?.city,
                      //   contact.address?.state,
                      //   contact.address?.postal_code,
                      //   contact.address?.country,
                      // ].filter((segment): segment is string => Boolean(segment && segment.trim()));

                      // const modulesLabel = contact.available_in_modules.includes(CONTACT_ALL_AVAILABILITY)
                      //   ? "Todos los módulos"
                      //   : contact.available_in_modules
                      //       .map((module) => CONTACT_MODULE_LABELS[module as ContactModule] ?? module)
                      //       .join(", ");

                      return (
                        <TableRow key={contact.id}>
                          {/* Columna de Contacto con Avatar */}
                          <TableCell className="px-5 py-4 sm:px-6 text-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 overflow-hidden rounded-full">
                                {contact.avatar_url ? (
                                  <Image
                                    width={40}
                                    height={40}
                                    src={contact.avatar_url}
                                    alt={contact.name}
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center bg-brand-100 text-sm font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-200">
                                    {(contact.name?.charAt(0) ?? "?").toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                  {contact.name}
                                </span>
                                {contact.tags.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {contact.tags.slice(0, 2).map((tag) => (
                                      <span
                                        key={tag}
                                        className="text-theme-xs text-brand-600 dark:text-brand-300"
                                      >
                                        #{tag}
                                      </span>
                                    ))}
                                    {contact.tags.length > 2 && (
                                      <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                                        +{contact.tags.length - 2}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Columna de Información */}
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            <div className="space-y-0.5">
                              {contact.phone && (
                                <p className="text-theme-xs">📞 {contact.phone}</p>
                              )}
                              {contact.mobile && (
                                <p className="text-theme-xs">📱 {contact.mobile}</p>
                              )}
                              {contact.email && (
                                <p className="text-theme-xs">✉️ {contact.email}</p>
                              )}
                              {!contact.phone && !contact.mobile && !contact.email && (
                                <p className="text-theme-xs text-gray-400 dark:text-gray-500">
                                  Sin datos de contacto
                                </p>
                              )}
                            </div>
                          </TableCell>

                          {/* Columna de Roles */}
                          <TableCell className="px-4 py-3 text-start">
                            <div className="flex flex-col gap-1">
                              {contact.is_client && (
                                <Badge size="sm" color="success">
                                  Cliente
                                </Badge>
                              )}
                              {contact.is_vendor && (
                                <Badge size="sm" color="warning">
                                  Proveedor
                                </Badge>
                              )}
                              {!contact.is_client && !contact.is_vendor && (
                                <Badge size="sm" color="light">
                                  Sin rol
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          {/* Columna de Fecha */}
                          <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                            {new Date(contact.created_at).toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>

                          {/* Columna de Acciones */}
                          <TableCell className="px-4 py-3 text-end">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditModal(contact)}
                                className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-brand-300 hover:text-brand-500 dark:border-gray-800 dark:text-gray-300 dark:hover:border-brand-500/50 dark:hover:text-brand-300"
                                title="Editar contacto"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteContact(contact)}
                                className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
                                title="Eliminar contacto"
                              >
                                <TrashBinIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      <ContactModal
        isOpen={isModalOpen}
        onClose={closeModal}
        mode={editingContact ? "edit" : "create"}
        initialData={editingContact}
        onSubmit={(payload) =>
          editingContact
            ? handleUpdateContact(payload as UpdateContactData)
            : handleCreateContact(payload as CreateContactData)
        }
      />
    </div>
  );
}

"use client";

import React from "react";
import type { Contact } from "@/types/contacts";

interface ContactSelectProps {
  label?: string;
  value: string | null;
  onChange: (contactId: string | null) => void;
  contacts: Contact[];
  loading?: boolean;
  placeholder?: string;
  emptyLabel?: string;
  onCreateClick?: () => void;
}

export default function ContactSelect({
  label = "Selecciona un contacto",
  value,
  onChange,
  contacts,
  loading = false,
  placeholder = "Selecciona un contacto guardado",
  emptyLabel = "Sin contactos aún",
  onCreateClick,
}: ContactSelectProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {onCreateClick && (
          <button
            type="button"
            onClick={onCreateClick}
            className="text-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-300 dark:hover:text-brand-200"
          >
            + Nuevo contacto
          </button>
        )}
      </div>

      <select
        value={value ?? ""}
        onChange={(e) => {
          const selected = e.target.value || null;
          onChange(selected);
        }}
        disabled={loading}
        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-brand-500"
      >
        <option value="">{loading ? "Cargando..." : placeholder}</option>
        {contacts.length === 0 && !loading ? (
          <option value="" disabled>
            {emptyLabel}
          </option>
        ) : (
          contacts.map((contact) => {
            const secondaryInfo = contact.mobile || contact.phone || contact.email;
            return (
              <option key={contact.id} value={contact.id}>
                {contact.name}
                {secondaryInfo ? ` • ${secondaryInfo}` : ""}
              </option>
            );
          })
        )}
      </select>
    </div>
  );
}

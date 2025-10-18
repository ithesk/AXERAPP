"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import type { Contact } from "@/types/contacts";
import { PlusIcon } from "@/icons";

interface ContactInputWithAutocompleteProps {
  /** Valor del nombre (escritura manual o autocompletado) */
  nameValue: string;
  /** Valor del teléfono */
  phoneValue: string;
  /** Callback cuando cambia el nombre */
  onNameChange: (name: string) => void;
  /** Callback cuando cambia el teléfono */
  onPhoneChange: (phone: string) => void;
  /** Callback cuando se selecciona un contacto de la lista */
  onContactSelect: (contact: Contact) => void;
  /** Lista de contactos disponibles */
  contacts: Contact[];
  /** Estado de carga */
  loading?: boolean;
  /** Callback para crear nuevo contacto */
  onCreateClick?: () => void;
  /** Requerido */
  required?: boolean;
  /** Deshabilitado */
  disabled?: boolean;
}

export default function ContactInputWithAutocomplete({
  nameValue,
  phoneValue,
  onNameChange,
  onPhoneChange,
  onContactSelect,
  contacts,
  loading = false,
  onCreateClick,
  required = false,
  disabled = false,
}: ContactInputWithAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtrar contactos basado en búsqueda
  const filteredContacts = useMemo(() => {
    if (!nameValue.trim()) return contacts;

    const query = nameValue.toLowerCase();
    return contacts.filter((contact) => {
      const searchableFields = [
        contact.name,
        contact.phone,
        contact.mobile,
        contact.email,
        contact.tax_id,
        ...contact.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableFields.includes(query);
    });
  }, [contacts, nameValue]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        nameInputRef.current &&
        !nameInputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onNameChange(value);
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleNameFocus = () => {
    if (nameValue) {
      setIsOpen(true);
    }
  };

  const handleSelectContact = (contact: Contact) => {
    onContactSelect(contact);
    setIsOpen(false);
    // Enfocar el siguiente campo (teléfono o siguiente en el form)
    phoneInputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredContacts.length ? prev + 1 : prev
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;

      case "Enter":
        e.preventDefault();
        if (highlightedIndex === filteredContacts.length && onCreateClick) {
          // Opción "Crear nuevo"
          onCreateClick();
          setIsOpen(false);
        } else if (filteredContacts[highlightedIndex]) {
          handleSelectContact(filteredContacts[highlightedIndex]);
        }
        break;

      case "Escape":
        setIsOpen(false);
        break;

      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  const handleCreateNew = () => {
    if (onCreateClick) {
      onCreateClick();
      setIsOpen(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Campo de nombre con autocomplete */}
      <div className="relative">
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Nombre del Cliente {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <input
            ref={nameInputRef}
            type="text"
            value={nameValue}
            onChange={handleNameChange}
            onFocus={handleNameFocus}
            onKeyDown={handleKeyDown}
            disabled={disabled || loading}
            required={required}
            placeholder="Escribe o selecciona..."
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700
                     focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
                     disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-50
                     dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100
                     dark:focus:border-brand-500 dark:disabled:bg-gray-800"
          />

          {/* Botón de crear nuevo */}
          {onCreateClick && (
            <button
              type="button"
              onClick={handleCreateNew}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-brand-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded transition-colors"
              title="Crear nuevo contacto"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown de sugerencias */}
        {isOpen && !disabled && filteredContacts.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg
                     dark:border-gray-800 dark:bg-gray-900"
          >
            {/* Lista de contactos */}
            {filteredContacts.map((contact, index) => {
              const isHighlighted = index === highlightedIndex;

              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => handleSelectContact(contact)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`
                    w-full px-4 py-3 text-left transition-colors
                    ${
                      isHighlighted
                        ? "bg-brand-50 dark:bg-brand-500/10"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {contact.avatar_url ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden">
                          <Image
                            src={contact.avatar_url}
                            alt={contact.name}
                            width={32}
                            height={32}
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-500/10 flex items-center justify-center">
                          <span className="text-xs font-semibold text-brand-600 dark:text-brand-300">
                            {contact.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info del contacto */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 dark:text-white/90 text-sm truncate">
                          {contact.name}
                        </span>
                        {contact.is_client && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                            Cliente
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {contact.phone || contact.mobile || contact.email || "Sin info de contacto"}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Campo de teléfono */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Teléfono de Contacto {required && <span className="text-red-500">*</span>}
        </label>
        <input
          ref={phoneInputRef}
          type="tel"
          value={phoneValue}
          onChange={(e) => onPhoneChange(e.target.value)}
          required={required}
          disabled={disabled}
          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          placeholder="+1 (555) 123-4567"
        />
      </div>
    </div>
  );
}

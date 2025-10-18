"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import type { Contact } from "@/types/contacts";
import { PlusIcon } from "@/icons";

interface ContactAutocompleteProps {
  /** Label del campo */
  label?: string;
  /** ID del contacto seleccionado */
  value: string | null;
  /** Callback cuando se selecciona un contacto */
  onChange: (contactId: string | null, contact: Contact | null) => void;
  /** Lista de contactos disponibles */
  contacts: Contact[];
  /** Estado de carga */
  loading?: boolean;
  /** Placeholder del input */
  placeholder?: string;
  /** Texto cuando no hay contactos */
  emptyLabel?: string;
  /** Callback para crear nuevo contacto */
  onCreateClick?: () => void;
  /** Mostrar avatar en las sugerencias */
  showAvatar?: boolean;
  /** Requerido */
  required?: boolean;
  /** Deshabilitado */
  disabled?: boolean;
}

export default function ContactAutocomplete({
  label = "Buscar contacto",
  value,
  onChange,
  contacts,
  loading = false,
  placeholder = "Escribe para buscar o seleccionar...",
  emptyLabel = "No se encontraron contactos",
  onCreateClick,
  showAvatar = true,
  required = false,
  disabled = false,
}: ContactAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Contacto seleccionado actual
  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === value) || null,
    [contacts, value]
  );

  // Filtrar contactos basado en búsqueda
  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) return contacts;

    const query = searchTerm.toLowerCase();
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
  }, [contacts, searchTerm]);

  // Actualizar el término de búsqueda cuando se selecciona un contacto
  useEffect(() => {
    if (selectedContact && !isOpen) {
      setSearchTerm(selectedContact.name);
    }
  }, [selectedContact, isOpen]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(true);
    setHighlightedIndex(0);

    // Si se borra el campo, limpiar selección
    if (!value) {
      onChange(null, null);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    // Seleccionar todo el texto para facilitar reemplazo
    inputRef.current?.select();
  };

  const handleSelectContact = (contact: Contact) => {
    setSearchTerm(contact.name);
    onChange(contact.id, contact);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
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
        inputRef.current?.blur();
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
    <div className="space-y-2">
      {/* Label y botón de crear */}
      <div className="flex items-center justify-between">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        {onCreateClick && (
          <button
            type="button"
            onClick={handleCreateNew}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-300 dark:hover:text-brand-200 transition-colors"
          >
            <PlusIcon className="w-3 h-3" />
            Nuevo contacto
          </button>
        )}
      </div>

      {/* Input con icono de búsqueda */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          required={required}
          placeholder={loading ? "Cargando..." : placeholder}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700
                   focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
                   disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-50
                   dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100
                   dark:focus:border-brand-500 dark:disabled:bg-gray-800"
        />

        {/* Indicador de contacto seleccionado */}
        {selectedContact && !isOpen && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {showAvatar && selectedContact.avatar_url && (
              <div className="w-6 h-6 rounded-full overflow-hidden">
                <Image
                  src={selectedContact.avatar_url}
                  alt={selectedContact.name}
                  width={24}
                  height={24}
                  className="object-cover"
                />
              </div>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Seleccionado
            </span>
          </div>
        )}
      </div>

      {/* Dropdown de sugerencias */}
      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg
                   dark:border-gray-800 dark:bg-gray-900"
        >
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              Cargando contactos...
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              {emptyLabel}
            </div>
          ) : (
            <>
              {/* Lista de contactos */}
              {filteredContacts.map((contact, index) => {
                const isHighlighted = index === highlightedIndex;
                const isSelected = contact.id === value;

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
                      ${isSelected ? "bg-brand-100/50 dark:bg-brand-500/20" : ""}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      {showAvatar && (
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
                      )}

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

                      {/* Checkmark si está seleccionado */}
                      {isSelected && (
                        <svg
                          className="w-5 h-5 text-brand-500 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Opción de crear nuevo contacto */}
              {onCreateClick && (
                <button
                  type="button"
                  onClick={handleCreateNew}
                  onMouseEnter={() => setHighlightedIndex(filteredContacts.length)}
                  className={`
                    w-full px-4 py-3 text-left border-t border-gray-200 dark:border-gray-800 transition-colors
                    ${
                      highlightedIndex === filteredContacts.length
                        ? "bg-brand-50 dark:bg-brand-500/10"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center">
                      <PlusIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="font-medium text-brand-600 dark:text-brand-300 text-sm">
                        Crear nuevo contacto
                      </span>
                      {searchTerm && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          "{searchTerm}"
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

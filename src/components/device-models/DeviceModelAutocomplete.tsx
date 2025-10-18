"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import type { DeviceModel } from "@/types/deviceModels";
import { PlusIcon } from "@/icons";
import Badge from "@/components/ui/badge/Badge";

interface DeviceModelAutocompleteProps {
  /** Label del campo */
  label?: string;
  /** ID del modelo seleccionado */
  value: string | null;
  /** Callback cuando se selecciona un modelo */
  onChange: (modelId: string | null, model: DeviceModel | null) => void;
  /** Lista de modelos disponibles */
  deviceModels: DeviceModel[];
  /** Estado de carga */
  loading?: boolean;
  /** Placeholder del input */
  placeholder?: string;
  /** Texto cuando no hay modelos */
  emptyLabel?: string;
  /** Callback para crear nuevo modelo */
  onCreateClick?: () => void;
  /** Requerido */
  required?: boolean;
  /** Deshabilitado */
  disabled?: boolean;
}

export default function DeviceModelAutocomplete({
  label = "Buscar modelo",
  value,
  onChange,
  deviceModels,
  loading = false,
  placeholder = "Escribe para buscar modelo del dispositivo...",
  emptyLabel = "No se encontraron modelos",
  onCreateClick,
  required = false,
  disabled = false,
}: DeviceModelAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modelo seleccionado actual
  const selectedModel = useMemo(
    () => deviceModels.find((m) => m.id === value) || null,
    [deviceModels, value]
  );

  // Filtrar modelos basado en búsqueda
  const filteredModels = useMemo(() => {
    if (!searchTerm.trim()) return deviceModels;

    const query = searchTerm.toLowerCase();
    return deviceModels.filter((model) => {
      const searchableFields = [
        model.model_name,
        model.brand,
        model.category,
        model.reference,
        ...model.common_issues,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableFields.includes(query);
    });
  }, [deviceModels, searchTerm]);

  // Actualizar el término de búsqueda cuando se selecciona un modelo
  useEffect(() => {
    if (selectedModel && !isOpen) {
      const displayText = selectedModel.brand
        ? `${selectedModel.brand} ${selectedModel.model_name}`
        : selectedModel.model_name;
      setSearchTerm(displayText);
    }
  }, [selectedModel, isOpen]);

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
    inputRef.current?.select();
  };

  const handleSelectModel = (model: DeviceModel) => {
    const displayText = model.brand
      ? `${model.brand} ${model.model_name}`
      : model.model_name;
    setSearchTerm(displayText);
    onChange(model.id, model);
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
          prev < filteredModels.length ? prev + 1 : prev
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;

      case "Enter":
        e.preventDefault();
        if (highlightedIndex === filteredModels.length && onCreateClick) {
          onCreateClick();
          setIsOpen(false);
        } else if (filteredModels[highlightedIndex]) {
          handleSelectModel(filteredModels[highlightedIndex]);
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
            Nuevo modelo
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

        {/* Indicador de modelo seleccionado */}
        {selectedModel && !isOpen && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {selectedModel.usage_count > 0 && `${selectedModel.usage_count} usos`}
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
              Cargando modelos...
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              {emptyLabel}
            </div>
          ) : (
            <>
              {/* Lista de modelos */}
              {filteredModels.map((model, index) => {
                const isHighlighted = index === highlightedIndex;
                const isSelected = model.id === value;

                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => handleSelectModel(model)}
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
                    <div className="flex items-start justify-between gap-3">
                      {/* Info del modelo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-800 dark:text-white/90 text-sm">
                            {model.model_name}
                          </span>
                          {model.brand && (
                            <Badge size="sm" color="light">
                              {model.brand}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          {model.category && (
                            <span>📱 {model.category}</span>
                          )}
                          {model.reference && (
                            <span>• Ref: {model.reference}</span>
                          )}
                          {model.usage_count > 0 && (
                            <span>• {model.usage_count} usos</span>
                          )}
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

              {/* Opción de crear nuevo modelo */}
              {onCreateClick && (
                <button
                  type="button"
                  onClick={handleCreateNew}
                  onMouseEnter={() => setHighlightedIndex(filteredModels.length)}
                  className={`
                    w-full px-4 py-3 text-left border-t border-gray-200 dark:border-gray-800 transition-colors
                    ${
                      highlightedIndex === filteredModels.length
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
                        Crear nuevo modelo
                      </span>
                      {searchTerm && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          &quot;{searchTerm}&quot;
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

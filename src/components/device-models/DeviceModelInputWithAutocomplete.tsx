"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import type { DeviceModel } from "@/types/deviceModels";
import { PlusIcon } from "@/icons";

interface DeviceModelInputWithAutocompleteProps {
  /** Valor del modelo (escritura manual o autocompletado) */
  modelValue: string;
  /** Callback cuando cambia el modelo */
  onModelChange: (model: string) => void;
  /** Callback cuando se selecciona un modelo de la lista */
  onModelSelect: (model: DeviceModel) => void;
  /** Lista de modelos disponibles */
  deviceModels: DeviceModel[];
  /** Estado de carga */
  loading?: boolean;
  /** Callback para crear nuevo modelo */
  onCreateClick?: () => void;
  /** Requerido */
  required?: boolean;
  /** Deshabilitado */
  disabled?: boolean;
}

export default function DeviceModelInputWithAutocomplete({
  modelValue,
  onModelChange,
  onModelSelect,
  deviceModels,
  loading = false,
  onCreateClick,
  required = false,
  disabled = false,
}: DeviceModelInputWithAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtrar modelos basado en búsqueda
  const filteredModels = useMemo(() => {
    if (!modelValue.trim()) return deviceModels;

    const query = modelValue.toLowerCase();
    return deviceModels.filter((model) => {
      const searchableFields = [
        model.model_name,
        model.brand,
        model.category,
        model.reference,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableFields.includes(query);
    });
  }, [deviceModels, modelValue]);

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
    onModelChange(value);
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleInputFocus = () => {
    if (modelValue) {
      setIsOpen(true);
    }
  };

  const handleSelectModel = (model: DeviceModel) => {
    onModelSelect(model);
    setIsOpen(false);
    inputRef.current?.blur();
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
          // Opción "Crear nuevo"
          onCreateClick();
          setIsOpen(false);
        } else if (filteredModels[highlightedIndex]) {
          handleSelectModel(filteredModels[highlightedIndex]);
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
    <div className="md:col-span-2">
      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        Modelo del Dispositivo {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={modelValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          required={required}
          placeholder="Escribe o selecciona modelo..."
          className="w-full px-4 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg bg-white text-gray-700
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
            title="Crear nuevo modelo"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown de sugerencias */}
      {isOpen && !disabled && filteredModels.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg
                   dark:border-gray-800 dark:bg-gray-900"
        >
          {/* Lista de modelos */}
          {filteredModels.map((model, index) => {
            const isHighlighted = index === highlightedIndex;
            const displayName = model.brand
              ? `${model.brand} ${model.model_name}`
              : model.model_name;

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
                `}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Info del modelo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800 dark:text-white/90 text-sm truncate">
                        {displayName}
                      </span>
                      {model.category && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                          {model.category}
                        </span>
                      )}
                    </div>
                    {model.reference && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        Ref: {model.reference}
                      </div>
                    )}
                  </div>

                  {/* Usage count badge */}
                  {model.usage_count > 0 && (
                    <span className="flex-shrink-0 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {model.usage_count} {model.usage_count === 1 ? "uso" : "usos"}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Escribe manualmente o selecciona un modelo guardado
      </p>
    </div>
  );
}

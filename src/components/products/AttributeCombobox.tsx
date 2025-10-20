"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Plus, X } from "lucide-react";

export interface AttributeOption {
  id: string;
  name: string;
}

interface AttributeComboboxProps {
  label: string;
  placeholder?: string;
  helperText?: string;
  inputValue: string;
  selectedOption: AttributeOption | null;
  options: AttributeOption[];
  optionsLoading?: boolean;
  onInputChange: (value: string) => void;
  onSelectOption: (option: AttributeOption) => void;
  onClear: () => void;
  onCreateOption?: (name: string) => Promise<AttributeOption | null>;
}

const AttributeCombobox: React.FC<AttributeComboboxProps> = ({
  label,
  placeholder = "Escribe para buscar o crear...",
  helperText,
  inputValue,
  selectedOption,
  options,
  optionsLoading = false,
  onInputChange,
  onSelectOption,
  onClear,
  onCreateOption,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    if (!inputValue.trim()) {
      return options.slice(0, 8);
    }

    const query = inputValue.toLowerCase();
    return options
      .filter((option) => option.name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [options, inputValue]);

  const normalizedOptions = useMemo(
    () => options.map((option) => option.name.toLowerCase()),
    [options]
  );

  const trimmedValue = inputValue.trim();
  const canCreate =
    !!onCreateOption &&
    trimmedValue.length > 0 &&
    !normalizedOptions.includes(trimmedValue.toLowerCase());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOptionClick = (option: AttributeOption) => {
    onSelectOption(option);
    onInputChange(option.name);
    setIsOpen(false);
  };

  const handleCreateOption = async () => {
    if (!onCreateOption || !canCreate) return;

    try {
      setIsCreating(true);
      const newOption = await onCreateOption(trimmedValue);
      if (newOption) {
        onSelectOption(newOption);
        onInputChange(newOption.name);
        setIsOpen(false);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onInputChange(value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleClear = () => {
    onClear();
    onInputChange("");
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (filteredOptions.length > 0) {
        handleOptionClick(filteredOptions[0]);
      } else if (canCreate) {
        handleCreateOption();
      }
    }
  };

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative">
        <input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pr-12 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-brand-500"
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label="Limpiar selección"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {helperText && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      )}

      {isOpen && (
        <div className="absolute left-0 top-full z-30 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="max-h-64 overflow-auto">
            {optionsLoading && (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando sugerencias...
              </div>
            )}

            {!optionsLoading && filteredOptions.length > 0 && (
              <ul className="py-1">
                {filteredOptions.map((option) => {
                  const isSelected =
                    selectedOption?.id === option.id ||
                    selectedOption?.name === option.name;

                  return (
                    <li key={option.id}>
                      <button
                        type="button"
                        onClick={() => handleOptionClick(option)}
                        className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-sm text-left transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          isSelected
                            ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"
                            : "text-gray-700 dark:text-gray-200"
                        }`}
                      >
                        <span>{option.name}</span>
                        {isSelected && <Check className="h-4 w-4" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {!optionsLoading && filteredOptions.length === 0 && !canCreate && (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                No hay resultados
              </div>
            )}
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleCreateOption}
              disabled={isCreating}
              className="flex w-full items-center gap-2 border-t border-gray-200 px-4 py-2 text-sm font-medium text-brand-600 transition hover:bg-brand-50 disabled:opacity-60 dark:border-gray-800 dark:text-brand-300 dark:hover:bg-brand-500/10"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Crear "{trimmedValue}"
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AttributeCombobox;

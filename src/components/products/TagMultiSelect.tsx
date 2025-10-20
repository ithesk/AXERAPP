"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";

export interface TagSelection {
  id: string | null;
  name: string;
  color?: string | null;
}

interface TagMultiSelectProps {
  label: string;
  placeholder?: string;
  helperText?: string;
  selectedTags: TagSelection[];
  availableTags: TagSelection[];
  loading?: boolean;
  onChange: (tags: TagSelection[]) => void;
  onCreateTag?: (name: string) => Promise<TagSelection | null>;
}

const TagMultiSelect: React.FC<TagMultiSelectProps> = ({
  label,
  placeholder = "Escribe para buscar o crear...",
  helperText,
  selectedTags,
  availableTags,
  loading = false,
  onChange,
  onCreateTag,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const normalizedSelected = useMemo(
    () => selectedTags.map((tag) => tag.name.toLowerCase()),
    [selectedTags]
  );

  const filteredTags = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    return availableTags
      .filter(
        (tag) =>
          !normalizedSelected.includes(tag.name.toLowerCase()) &&
          (query ? tag.name.toLowerCase().includes(query) : true)
      )
      .slice(0, 8);
  }, [availableTags, inputValue, normalizedSelected]);

  const trimmedValue = inputValue.trim();
  const canCreate =
    !!onCreateTag &&
    trimmedValue.length > 0 &&
    !normalizedSelected.includes(trimmedValue.toLowerCase()) &&
    !availableTags
      .map((tag) => tag.name.toLowerCase())
      .includes(trimmedValue.toLowerCase());

  const handleRemoveTag = (tagToRemove: TagSelection) => {
    onChange(selectedTags.filter((tag) => tag.name !== tagToRemove.name));
  };

  const handleSelectTag = (tag: TagSelection) => {
    onChange([...selectedTags, tag]);
    setInputValue("");
    setIsOpen(false);
  };

  const handleCreateTag = async () => {
    if (!onCreateTag || !canCreate) return;

    try {
      setIsCreating(true);
      const created = await onCreateTag(trimmedValue);
      if (created) {
        onChange([...selectedTags, created]);
        setInputValue("");
        setIsOpen(false);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    setIsOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !inputValue && selectedTags.length > 0) {
      handleRemoveTag(selectedTags[selectedTags.length - 1]);
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (filteredTags.length > 0) {
        handleSelectTag(filteredTags[0]);
      } else if (canCreate) {
        handleCreateTag();
      }
    }
  };

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <div
        className="relative flex min-h-[44px] flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 transition focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:focus-within:border-brand-500"
        onClick={() => setIsOpen(true)}
      >
        {selectedTags.length === 0 && !inputValue && (
          <span className="text-sm text-gray-400 dark:text-gray-500">
            {placeholder}
          </span>
        )}

        {selectedTags.map((tag) => (
          <span
            key={`${tag.id ?? "new"}-${tag.name}`}
            className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: tag.color ?? "#3B82F6" }}
            />
            {tag.name}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="text-gray-400 transition hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              aria-label={`Eliminar etiqueta ${tag.name}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}

        <input
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="flex-1 border-0 bg-transparent p-0 text-sm text-gray-700 placeholder:text-gray-400 focus:border-0 focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
      </div>

      {helperText && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      )}

      {isOpen && (
        <div className="absolute left-0 top-full z-30 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="max-h-52 overflow-auto">
            {loading && (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando etiquetas...
              </div>
            )}

            {!loading && filteredTags.length > 0 && (
              <ul className="py-1">
                {filteredTags.map((tag) => (
                  <li key={tag.id ?? tag.name}>
                    <button
                      type="button"
                      onClick={() => handleSelectTag(tag)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: tag.color ?? "#3B82F6" }}
                      />
                      {tag.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!loading && filteredTags.length === 0 && !canCreate && (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                No hay coincidencias
              </div>
            )}
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleCreateTag}
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

export default TagMultiSelect;

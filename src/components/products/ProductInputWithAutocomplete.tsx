"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import type { Product } from "@/types/products";
import { PlusIcon } from "@/icons";
import { formatPrice, formatStock, getStockStatus, getStockStatusColor } from "@/types/products";

interface ProductInputWithAutocompleteProps {
  /** Valor del nombre/descripción del producto */
  productValue: string;
  /** Callback cuando cambia el valor */
  onProductChange: (value: string) => void;
  /** Callback cuando se selecciona un producto de la lista */
  onProductSelect: (product: Product) => void;
  /** Lista de productos disponibles */
  products: Product[];
  /** Estado de carga */
  loading?: boolean;
  /** Callback para crear nuevo producto */
  onCreateClick?: () => void;
  /** Requerido */
  required?: boolean;
  /** Deshabilitado */
  disabled?: boolean;
  /** Filtrar por tipo de producto */
  filterByType?: 'part' | 'service';
  /** Mostrar solo productos con stock */
  onlyInStock?: boolean;
}

export default function ProductInputWithAutocomplete({
  productValue,
  onProductChange,
  onProductSelect,
  products,
  loading = false,
  onCreateClick,
  required = false,
  disabled = false,
  filterByType,
  onlyInStock = false,
}: ProductInputWithAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtrar productos basado en búsqueda y filtros
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filtrar por tipo si se especifica
    if (filterByType) {
      filtered = filtered.filter(p => p.product_type === filterByType);
    }

    // Filtrar solo productos activos
    filtered = filtered.filter(p => p.is_active);

    // Filtrar solo productos con stock si se requiere
    if (onlyInStock) {
      filtered = filtered.filter(p => {
        if (p.product_type === 'service') return true;
        if (!p.track_inventory) return true;
        return p.current_stock > 0;
      });
    }

    // Filtrar por búsqueda
    if (!productValue.trim()) return filtered;

    const query = productValue.toLowerCase();
    return filtered.filter((product) => {
      const brandName =
        typeof product.brand === "string"
          ? product.brand
          : product.brand?.name;
      const categoryName =
        typeof product.category === "string"
          ? product.category
          : product.category?.name;
      const tagNames = (product.tags || []).map((tag) => tag.name);

      const searchableFields = [
        product.name,
        brandName,
        product.sku,
        product.description,
        categoryName,
        ...tagNames,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableFields.includes(query);
    });
  }, [products, productValue, filterByType, onlyInStock]);

  // Detectar cuando no hay coincidencias y el usuario está escribiendo
  const hasNoMatches = productValue.trim().length > 0 && filteredProducts.length === 0 && !loading;

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
    onProductChange(value);
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleInputFocus = () => {
    if (productValue) {
      setIsOpen(true);
    }
  };

  const handleSelectProduct = (product: Product) => {
    onProductSelect(product);
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
          prev < filteredProducts.length ? prev + 1 : prev
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;

      case "Enter":
        e.preventDefault();
        if (highlightedIndex === filteredProducts.length && onCreateClick) {
          // Opción "Crear nuevo"
          onCreateClick();
          setIsOpen(false);
        } else if (filteredProducts[highlightedIndex]) {
          handleSelectProduct(filteredProducts[highlightedIndex]);
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
    <div className="relative">
      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        Producto / Descripción {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={productValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          required={required}
          placeholder="Buscar producto o escribir descripción..."
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
            title="Crear nuevo producto"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown de sugerencias */}
      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg
                   dark:border-gray-800 dark:bg-gray-900"
        >
          {filteredProducts.length > 0 ? (
            <>
              {/* Lista de productos */}
              {filteredProducts.map((product, index) => {
                const isHighlighted = index === highlightedIndex;
                const stockStatus = getStockStatus(product);
                const brandName =
                  typeof product.brand === "string"
                    ? product.brand
                    : product.brand?.name;
                const categoryName =
                  typeof product.category === "string"
                    ? product.category
                    : product.category?.name;
                const displayName = brandName
                  ? `${brandName} ${product.name}`
                  : product.name;

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelectProduct(product)}
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
                      {/* Info del producto */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-800 dark:text-white/90 text-sm truncate">
                            {displayName}
                          </span>
                          {product.product_type === 'service' && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                              Servicio
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          {product.sku && (
                            <span>SKU: {product.sku}</span>
                          )}
                          {categoryName && (
                            <span>{categoryName}</span>
                          )}
                        </div>
                      </div>

                      {/* Precio y Stock */}
                      <div className="flex-shrink-0 text-right">
                        <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
                          {formatPrice(product.sale_price)}
                        </div>
                        {product.product_type === 'part' && product.track_inventory && (
                          <div className={`text-xs ${getStockStatusColor(stockStatus)}`}>
                            Stock: {formatStock(product)}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </>
          ) : hasNoMatches && onCreateClick ? (
            /* Botón para crear nuevo producto cuando no hay coincidencias */
            <button
              type="button"
              onClick={handleCreateNew}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-t border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-500/10 flex items-center justify-center">
                  <PlusIcon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    Crear "{productValue}"
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    No se encontró este producto
                  </p>
                </div>
              </div>
            </button>
          ) : null}
        </div>
      )}

      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Escribe para buscar en el catálogo o crear un nuevo producto
      </p>
    </div>
  );
}

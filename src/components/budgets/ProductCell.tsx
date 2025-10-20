"use client";

import React, { useState, useRef, useEffect } from "react";
import type { Product } from "@/types/products";
import {
  formatPrice,
  formatStock,
  getProductDisplayName,
  getStockStatus,
  getStockStatusColor,
} from "@/types/products";
import { PlusIcon } from "@/icons";

interface ProductCellProps {
  value: string;
  selectedProduct: Product | null;
  products: Product[];
  loading?: boolean;
  onChange: (value: string) => void;
  onProductSelect: (product: Product | null) => void;
  onCreateClick?: () => void;
  disabled?: boolean;
  filterByType?: "part" | "service";
  onEnter?: () => void;
  onEscape?: () => void;
  onTab?: (shiftKey: boolean) => void;
}

export default function ProductCell({
  value,
  selectedProduct,
  products,
  loading = false,
  onChange,
  onProductSelect,
  onCreateClick,
  disabled = false,
  filterByType,
  onEnter,
  onEscape,
  onTab,
}: ProductCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtrar productos
  const filteredProducts = React.useMemo(() => {
    let filtered = products.filter((p) => p.is_active);

    if (filterByType) {
      filtered = filtered.filter((p) => p.product_type === filterByType);
    }

    if (!value.trim()) return filtered;

    const query = value.toLowerCase();
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
  }, [products, value, filterByType]);

  const hasNoMatches = value.trim().length > 0 && filteredProducts.length === 0 && !loading;

  // Auto-focus cuando entra en modo edición
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

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
        setIsEditing(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDoubleClick = () => {
    if (!disabled) {
      setIsEditing(true);
      setIsOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleSelectProduct = (product: Product) => {
    onProductSelect(product);
    onChange(getProductDisplayName(product));
    setIsOpen(false);
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    if (onCreateClick) {
      onCreateClick();
      setIsOpen(false);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) =>
            prev < filteredProducts.length ? prev + 1 : prev
          );
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;

      case "Enter":
        e.preventDefault();
        if (isOpen) {
          if (highlightedIndex === filteredProducts.length && onCreateClick) {
            handleCreateNew();
          } else if (filteredProducts[highlightedIndex]) {
            handleSelectProduct(filteredProducts[highlightedIndex]);
          }
        }
        setIsEditing(false);
        setIsOpen(false);
        if (onEnter) onEnter();
        break;

      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setIsEditing(false);
        if (onEscape) onEscape();
        break;

      case "Tab":
        e.preventDefault();
        setIsOpen(false);
        setIsEditing(false);
        if (onTab) onTab(e.shiftKey);
        break;
    }
  };

  const displayValue = () => {
    if (selectedProduct) {
      return selectedProduct.brand
        ? `${selectedProduct.brand} ${selectedProduct.name}`
        : selectedProduct.name;
    }
    return value || "Buscar producto...";
  };

  if (isEditing) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          placeholder="Buscar producto o escribir descripción..."
          className="w-full px-2 py-1.5 text-sm border border-brand-500 rounded focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white dark:bg-gray-900 dark:text-white"
        />

        {/* Dropdown de sugerencias */}
        {isOpen && !disabled && (
          <div
            ref={dropdownRef}
            className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
          >
            {filteredProducts.length > 0 ? (
              <>
                {filteredProducts.map((product, index) => {
                  const isHighlighted = index === highlightedIndex;
                  const stockStatus = getStockStatus(product);
                  const brandName =
                    typeof product.brand === "string"
                      ? product.brand
                      : product.brand?.name;
                  const displayName = brandName
                    ? `${brandName} ${product.name}`
                    : product.name;

                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelectProduct(product)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`w-full px-3 py-2 text-left transition-colors ${
                        isHighlighted
                          ? "bg-brand-50 dark:bg-brand-500/10"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 dark:text-white/90 text-xs truncate">
                              {displayName}
                            </span>
                            {product.product_type === "service" && (
                              <span className="text-xs px-1 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                                Servicio
                              </span>
                            )}
                          </div>
                          {product.sku && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              SKU: {product.sku}
                            </span>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="text-xs font-semibold text-gray-800 dark:text-white/90">
                            {formatPrice(product.sale_price)}
                          </div>
                          {product.product_type === "part" && product.track_inventory && (
                            <div className={`text-xs ${getStockStatusColor(stockStatus)}`}>
                              {formatStock(product)}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </>
            ) : hasNoMatches && onCreateClick ? (
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-500/10 flex items-center justify-center">
                    <PlusIcon className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-800 dark:text-white/90">
                      Crear "{value}"
                    </p>
                  </div>
                </div>
              </button>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`w-full px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded transition-colors ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${
        !selectedProduct && !value
          ? "text-gray-400 italic"
          : "text-gray-800 dark:text-white/90"
      }`}
      title="Doble clic para editar"
    >
      {displayValue()}
    </div>
  );
}

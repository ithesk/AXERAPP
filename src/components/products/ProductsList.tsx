"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useToast } from "@/context/ToastContext";
import Button from "@/components/ui/button/Button";
import ProductModal from "@/components/products/ProductModal";
import Input from "@/components/form/input/InputField";
import type { Product, CreateProductData, UpdateProductData, ProductType } from "@/types/products";
import {
  formatPrice,
  formatStock,
  getProductDisplayName,
  getStockStatus,
  PRODUCT_TYPE_LABELS,
} from "@/types/products";
import { Search, Filter, ChevronDown, Check } from "lucide-react";
import { PencilIcon, TrashBinIcon } from "@/icons";

export default function ProductsList() {
  const { products, loading, createProduct, updateProduct, deleteProduct } = useProducts();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<ProductType | "all">("all");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [typeSortOrder, setTypeSortOrder] = useState<"asc" | "desc" | null>(null);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [stockMenuOpen, setStockMenuOpen] = useState(false);

  const typeMenuRef = useRef<HTMLDivElement>(null);
  const stockMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeMenuRef.current && !typeMenuRef.current.contains(event.target as Node)) {
        setTypeMenuOpen(false);
      }

      if (stockMenuRef.current && !stockMenuRef.current.contains(event.target as Node)) {
        setStockMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (filterType !== "all") {
      filtered = filtered.filter((p) => p.product_type === filterType);
    }

    if (filterLowStock) {
      filtered = filtered.filter(
        (p) => p.track_inventory && p.current_stock <= p.min_stock
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => {
        const brandName =
          typeof p.brand === "string" ? p.brand : p.brand?.name;
        const categoryName =
          typeof p.category === "string" ? p.category : p.category?.name;
        const tagNames = (p.tags || []).map((tag) => tag.name);

        return (
          p.name.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query) ||
          brandName?.toLowerCase().includes(query) ||
          categoryName?.toLowerCase().includes(query) ||
          tagNames.some((tag) => tag.toLowerCase().includes(query))
        );
      });
    }

    if (typeSortOrder) {
      const direction = typeSortOrder === "asc" ? 1 : -1;
      filtered.sort(
        (a, b) => a.product_type.localeCompare(b.product_type) * direction
      );
    }

    return filtered;
  }, [products, filterType, filterLowStock, searchQuery, typeSortOrder]);

  const isTypeFilterActive = filterType !== "all" || typeSortOrder !== null;
  const isStockFilterActive = filterLowStock;

  const handleTypeFilterSelect = (value: ProductType | "all") => {
    setFilterType(value);
    if (value === "all") {
      setTypeSortOrder("asc");
    } else {
      setTypeSortOrder(null);
    }
    setTypeMenuOpen(false);
  };

  const handleTypeSortChange = (order: "asc" | "desc" | null) => {
    setTypeSortOrder(order);
    setTypeMenuOpen(false);
  };

  const handleStockFilterSelect = (onlyLowStock: boolean) => {
    setFilterLowStock(onlyLowStock);
    setStockMenuOpen(false);
  };

  const handleResetFilters = () => {
    setFilterType("all");
    setFilterLowStock(false);
    setTypeSortOrder(null);
    setTypeMenuOpen(false);
    setStockMenuOpen(false);
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`¿Eliminar "${product.name}"?`)) return;

    const result = await deleteProduct(product.id);

    if (result.success) {
      showToast("success", "Eliminado", `"${product.name}" ha sido eliminado`);
    } else {
      showToast("error", "Error", result.error || "No se pudo eliminar");
    }
  };

  const handleSubmitProduct = async (data: CreateProductData | UpdateProductData) => {
    if (editingProduct) {
      const updatePayload = data as UpdateProductData;
      const result = await updateProduct(editingProduct.id, updatePayload);
      if (result.success) {
        showToast("success", "Actualizado", "Los cambios se guardaron");
        setIsModalOpen(false);
      } else {
        return { success: false, error: result.error };
      }
    } else {
      const createPayload = data as CreateProductData;
      const result = await createProduct(createPayload);
      if (result.success) {
        showToast("success", "Creado", `"${createPayload.name}" se creó correctamente`);
        setIsModalOpen(false);
      } else {
        return { success: false, error: result.error };
      }
    }

    return { success: true };
  };

  const partCount = products.filter((p) => p.product_type === "part").length;
  const serviceCount = products.filter((p) => p.product_type === "service").length;
  const lowStockCount = products.filter(
    (p) => p.track_inventory && p.current_stock <= p.min_stock
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Catálogo de Productos
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gestiona piezas, repuestos y servicios
          </p>
        </div>
        <Button onClick={handleCreateProduct} size="sm">
          + Nuevo Producto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="p-4 bg-white border border-gray-200 rounded-xl dark:bg-white/[0.03] dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
          <p className="mt-1 text-2xl font-bold">{products.length}</p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-xl dark:bg-white/[0.03] dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">Piezas</p>
          <p className="mt-1 text-2xl font-bold">{partCount}</p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-xl dark:bg-white/[0.03] dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">Servicios</p>
          <p className="mt-1 text-2xl font-bold">{serviceCount}</p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-xl dark:bg-white/[0.03] dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">Stock Bajo</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{lowStockCount}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="p-4 bg-white border rounded-xl dark:bg-white/[0.03] dark:border-gray-800">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, SKU, marca, categoría o etiqueta..."
            className="pl-11"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="relative overflow-visible bg-white border rounded-xl dark:bg-white/[0.03] dark:border-gray-800">
        {loading ? (
          <div className="text-center py-12">Cargando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                  <div className="relative inline-flex items-center" ref={typeMenuRef}>
                    <button
                      type="button"
                      onClick={() => setTypeMenuOpen((open) => !open)}
                      className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                        isTypeFilterActive
                          ? "text-brand-600 dark:text-brand-400"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                      aria-haspopup="menu"
                      aria-expanded={typeMenuOpen}
                    >
                      <Filter className="h-3.5 w-3.5" />
                      Tipo
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${
                          typeMenuOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {typeMenuOpen && (
                      <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
                        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                          Filtrar por tipo
                        </div>
                        <div className="py-1">
                          {[{ value: "all" as const, label: "Todos los tipos" }, { value: "part" as const, label: "Solo piezas" }, { value: "service" as const, label: "Solo servicios" }].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleTypeFilterSelect(option.value)}
                              className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800/80"
                            >
                              <span>{option.label}</span>
                              {filterType === option.value && (
                                <Check className="h-4 w-4 text-brand-500 dark:text-brand-400" />
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-gray-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-700 dark:text-gray-500">
                          Organizar
                        </div>
                        <div className="py-1">
                          <button
                            type="button"
                            onClick={() => handleTypeSortChange("asc")}
                            className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800/80"
                          >
                            <span>A → Z por tipo</span>
                            {typeSortOrder === "asc" && (
                              <Check className="h-4 w-4 text-brand-500 dark:text-brand-400" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTypeSortChange("desc")}
                            className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800/80"
                          >
                            <span>Z → A por tipo</span>
                            {typeSortOrder === "desc" && (
                              <Check className="h-4 w-4 text-brand-500 dark:text-brand-400" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTypeSortChange(null)}
                            className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800/80"
                          >
                            <span>Restablecer orden</span>
                            {typeSortOrder === null && (
                              <Check className="h-4 w-4 text-brand-500 dark:text-brand-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">SKU</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Precio</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase">
                  <div className="relative mx-auto inline-flex items-center" ref={stockMenuRef}>
                    <button
                      type="button"
                      onClick={() => setStockMenuOpen((open) => !open)}
                      className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                        isStockFilterActive
                          ? "text-brand-600 dark:text-brand-400"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                      aria-haspopup="menu"
                      aria-expanded={stockMenuOpen}
                    >
                      <Filter className="h-3.5 w-3.5" />
                      Stock
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${
                          stockMenuOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {stockMenuOpen && (
                      <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
                        <div className="py-1">
                          <button
                            type="button"
                            onClick={() => handleStockFilterSelect(false)}
                            className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800/80"
                          >
                            <span>Todos los productos</span>
                            {!filterLowStock && (
                              <Check className="h-4 w-4 text-brand-500 dark:text-brand-400" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStockFilterSelect(true)}
                            className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800/80"
                          >
                            <span>Solo stock bajo</span>
                            {filterLowStock && (
                              <Check className="h-4 w-4 text-brand-500 dark:text-brand-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <span>No se encontraron productos con los filtros actuales.</span>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-brand-500 dark:hover:text-brand-400"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const displayName = getProductDisplayName(product);
                  const categoryName =
                    typeof product.category === "string"
                      ? product.category
                      : product.category?.name;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{displayName}</p>
                          {categoryName && (
                            <p className="text-xs text-gray-500">{categoryName}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
                          {PRODUCT_TYPE_LABELS[product.product_type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{product.sku || "-"}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatPrice(product.sale_price)}</td>
                      <td className="px-4 py-3 text-center">
                        {product.track_inventory ? formatStock(product) : "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditProduct(product)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-gray-800 dark:text-gray-400 dark:hover:border-brand-600 dark:hover:text-brand-400"
                            aria-label={`Editar ${product.name}`}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-red-300 hover:text-red-600 dark:border-gray-800 dark:text-gray-400 dark:hover:border-red-500 dark:hover:text-red-400"
                            aria-label={`Eliminar ${product.name}`}
                          >
                            <TrashBinIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={editingProduct ? "edit" : "create"}
        initialData={editingProduct}
        onSubmit={handleSubmitProduct}
      />
    </div>
  );
}

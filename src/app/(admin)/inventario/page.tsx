"use client";

import React, { useState, useMemo } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useInventory } from "@/hooks/useInventory";
import { useToast } from "@/context/ToastContext";
import Button from "@/components/ui/button/Button";
import type { Product } from "@/types/products";
import {
  formatPrice,
  formatStock,
  getProductDisplayName,
  getStockStatus,
  getStockStatusBadgeColor,
  getStockStatusColor,
} from "@/types/products";
import {
  MOVEMENT_TYPE_LABELS,
  getMovementTypeColor,
  formatQuantity,
} from "@/types/inventory";

export default function InventarioPage() {
  const { products, loading: productsLoading } = useProducts({
    product_type: "part",
    track_inventory: true,
  });
  const { movements, loading: movementsLoading, createMovement } = useInventory();
  const { showToast } = useToast();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [adjustmentNotes, setAdjustmentNotes] = useState("");

  // Filtrar movimientos del producto seleccionado
  const productMovements = useMemo(() => {
    if (!selectedProduct) return [];
    return movements.filter((m) => m.product_id === selectedProduct.id);
  }, [movements, selectedProduct]);

  // Calcular estadísticas
  const lowStockProducts = useMemo(
    () => products.filter((p) => p.current_stock <= p.min_stock),
    [products]
  );

  const outOfStockProducts = useMemo(
    () => products.filter((p) => p.current_stock <= 0),
    [products]
  );

  const totalValue = useMemo(
    () =>
      products.reduce(
        (sum, p) => sum + p.current_stock * (p.cost_price || p.sale_price),
        0
      ),
    [products]
  );

  const handleAdjustStock = () => {
    if (!selectedProduct) return;
    setAdjustmentQuantity(0);
    setAdjustmentNotes("");
    setIsAdjustmentModalOpen(true);
  };

  const handleSubmitAdjustment = async () => {
    if (!selectedProduct) return;

    if (adjustmentQuantity === 0) {
      showToast("error", "Error", "La cantidad debe ser diferente de cero");
      return;
    }

    const result = await createMovement({
      product_id: selectedProduct.id,
      movement_type: "adjustment",
      quantity: adjustmentQuantity,
      notes: adjustmentNotes.trim() || "Ajuste manual de inventario",
    });

    if (result.success) {
      showToast(
        "success",
        "Inventario ajustado",
        `Stock actualizado para "${selectedProduct.name}"`
      );
      setIsAdjustmentModalOpen(false);
      setSelectedProduct(null);
    } else {
      showToast("error", "Error", result.error || "No se pudo ajustar el inventario");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Inventario
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Control y seguimiento de stock de productos
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="p-4 bg-white border border-gray-200 rounded-xl dark:bg-white/[0.03] dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">Productos en Stock</p>
          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
            {products.length}
          </p>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-xl dark:bg-white/[0.03] dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
            {formatPrice(totalValue)}
          </p>
        </div>

        <div className="p-4 bg-white border border-amber-200 rounded-xl dark:bg-amber-900/10 dark:border-amber-800/50">
          <p className="text-sm text-amber-600 dark:text-amber-400">Stock Bajo</p>
          <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {lowStockProducts.length}
          </p>
        </div>

        <div className="p-4 bg-white border border-red-200 rounded-xl dark:bg-red-900/10 dark:border-red-800/50">
          <p className="text-sm text-red-600 dark:text-red-400">Sin Stock</p>
          <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
            {outOfStockProducts.length}
          </p>
        </div>
      </div>

      {/* Layout de 2 columnas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Lista de productos con stock */}
        <div className="bg-white border border-gray-200 rounded-xl dark:bg-white/[0.03] dark:border-gray-800">
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Productos
            </h2>
          </div>

          {productsLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Cargando inventario...
                </p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No hay productos con control de inventario
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[600px]">
              {products.map((product) => {
                const stockStatus = getStockStatus(product);
                const isSelected = selectedProduct?.id === product.id;

                return (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`w-full px-4 py-3 text-left border-b dark:border-gray-700 transition-colors ${
                      isSelected
                        ? "bg-brand-50 dark:bg-brand-500/10"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 dark:text-white/90 truncate">
                          {getProductDisplayName(product)}
                        </p>
                        {product.sku && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            SKU: {product.sku}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${getStockStatusColor(stockStatus)}`}>
                          {formatStock(product)}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded ${getStockStatusBadgeColor(stockStatus)}`}>
                          {stockStatus === "out" && "Sin stock"}
                          {stockStatus === "low" && "Bajo"}
                          {stockStatus === "high" && "OK"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detalles y movimientos del producto seleccionado */}
        <div className="bg-white border border-gray-200 rounded-xl dark:bg-white/[0.03] dark:border-gray-800">
          <div className="p-4 border-b dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {selectedProduct ? "Detalles y Movimientos" : "Selecciona un producto"}
              </h2>
              {selectedProduct && (
                <Button size="sm" onClick={handleAdjustStock}>
                  Ajustar Stock
                </Button>
              )}
            </div>
          </div>

          {!selectedProduct ? (
            <div className="flex items-center justify-center p-12">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Selecciona un producto para ver sus detalles
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Información del producto */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
                  {selectedProduct.brand
                    ? `${selectedProduct.brand} ${selectedProduct.name}`
                    : selectedProduct.name}
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Stock actual</p>
                    <p className="font-semibold text-gray-800 dark:text-white/90">
                      {formatStock(selectedProduct)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Stock mínimo</p>
                    <p className="font-semibold text-gray-800 dark:text-white/90">
                      {selectedProduct.min_stock} {selectedProduct.stock_unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Precio de venta</p>
                    <p className="font-semibold text-gray-800 dark:text-white/90">
                      {formatPrice(selectedProduct.sale_price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Precio de costo</p>
                    <p className="font-semibold text-gray-800 dark:text-white/90">
                      {formatPrice(selectedProduct.cost_price)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Movimientos */}
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Historial de Movimientos
                </h4>
                {movementsLoading ? (
                  <div className="py-8 text-center">
                    <div className="inline-block w-6 h-6 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin"></div>
                  </div>
                ) : productMovements.length === 0 ? (
                  <p className="py-8 text-sm text-center text-gray-500 dark:text-gray-400">
                    Sin movimientos registrados
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[350px] overflow-y-auto">
                    {productMovements.map((movement) => (
                      <div
                        key={movement.id}
                        className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                {MOVEMENT_TYPE_LABELS[movement.movement_type]}
                              </span>
                              <span className={`text-sm font-semibold ${getMovementTypeColor(movement.movement_type)}`}>
                                {formatQuantity(movement)}
                              </span>
                            </div>
                            {movement.notes && (
                              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                {movement.notes}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                              {new Date(movement.created_at).toLocaleString("es-DO")}
                            </p>
                          </div>
                          <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                            <p>Stock: {movement.stock_after}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de ajuste de stock */}
      {isAdjustmentModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-6 m-4 bg-white rounded-2xl dark:bg-gray-900">
            <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
              Ajustar Stock
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {selectedProduct.brand
                ? `${selectedProduct.brand} ${selectedProduct.name}`
                : selectedProduct.name}
            </p>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Cantidad (+ para añadir, - para quitar)
              </label>
              <input
                type="number"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(parseFloat(e.target.value) || 0)}
                step="0.01"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                placeholder="Ej: 10 o -5"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Stock actual: {formatStock(selectedProduct)}
                {adjustmentQuantity !== 0 && (
                  <span className="ml-2">
                    → Nuevo stock:{" "}
                    {(selectedProduct.current_stock + adjustmentQuantity).toFixed(2)}{" "}
                    {selectedProduct.stock_unit}
                  </span>
                )}
              </p>
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Notas (opcional)
              </label>
              <textarea
                value={adjustmentNotes}
                onChange={(e) => setAdjustmentNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                placeholder="Razón del ajuste..."
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmitAdjustment} className="flex-1">
                Ajustar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

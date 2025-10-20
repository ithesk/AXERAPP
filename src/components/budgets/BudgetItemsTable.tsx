"use client";

import React, { useState, useMemo, useCallback } from "react";
import type { BudgetItem, BudgetItemType } from "@/types/budgets";
import type { Product, CreateProductData } from "@/types/products";
import { useProducts } from "@/hooks/useProducts";
import { useToast } from "@/context/ToastContext";
import EditableCell from "./EditableCell";
import ProductCell from "./ProductCell";
import ProductModal from "@/components/products/ProductModal";
import { TrashBinIcon } from "@/icons";
import {
  formatPrice,
  getProductDisplayName,
  getStockStatus,
  getStockStatusColor,
} from "@/types/products";

interface BudgetItemsTableProps {
  items: BudgetItem[];
  onItemsChange: (items: BudgetItem[]) => void;
  disabled?: boolean;
}

export default function BudgetItemsTable({
  items,
  onItemsChange,
  disabled = false,
}: BudgetItemsTableProps) {
  const { products, loading: productsLoading, createProduct } = useProducts();
  const { showToast } = useToast();

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productModalInitialName, setProductModalInitialName] = useState("");
  const [productModalInitialType, setProductModalInitialType] = useState<"part" | "service">("part");
  const [pendingItemIndex, setPendingItemIndex] = useState<number | null>(null);

  // Agregar nueva fila
  const handleAddRow = useCallback(() => {
    const timestamp = new Date().toISOString();
    const newItem: BudgetItem = {
      id: `temp-${Date.now()}`,
      budget_id: "",
      item_type: "part",
      description: "",
      quantity: 1,
      unit_price: 0,
      subtotal: 0,
      sort_order: items.length,
      discount_percentage: 0,
      tax_percentage: 0,
      created_at: timestamp,
      updated_at: timestamp,
      display_order: items.length,
      is_custom: true,
      product_id: null,
    };
    onItemsChange([...items, newItem]);
  }, [items, onItemsChange]);

  // Eliminar fila
  const handleDeleteRow = useCallback(
    (index: number) => {
      const newItems = items.filter((_, i) => i !== index);
      onItemsChange(newItems);
    },
    [items, onItemsChange]
  );

  // Actualizar campo de un item
  const handleUpdateItem = useCallback(
    (index: number, field: keyof BudgetItem, value: any) => {
      const newItems = [...items];
      const item = { ...newItems[index], [field]: value };

      // Recalcular subtotal
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const discountRate = Number(item.discount_percentage ?? 0);
      const taxRate = Number(item.tax_percentage ?? 0);
      const subtotalBeforeDiscount = quantity * unitPrice;
      const discountAmount = subtotalBeforeDiscount * (discountRate / 100);
      const subtotalAfterDiscount = subtotalBeforeDiscount - discountAmount;
      const taxAmount = subtotalAfterDiscount * (taxRate / 100);
      item.subtotal = subtotalAfterDiscount + taxAmount;

      newItems[index] = item;
      onItemsChange(newItems);
    },
    [items, onItemsChange]
  );

  // Seleccionar producto
  const handleProductSelect = useCallback(
    (index: number, product: Product | null) => {
      if (!product) {
        handleUpdateItem(index, "product_id", null);
        handleUpdateItem(index, "is_custom", true);
        return;
      }

      const newItems = [...items];
      const item = { ...newItems[index] };

      item.product_id = product.id;
      item.is_custom = false;
      const mappedType: BudgetItemType = product.product_type === "service" ? "labor" : "part";
      item.item_type = mappedType;
      item.description = getProductDisplayName(product);
      item.unit_price = product.sale_price;
      item.product = product;

      // Recalcular subtotal
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const discountRate = Number(item.discount_percentage ?? 0);
      const taxRate = Number(item.tax_percentage ?? 0);
      const subtotalBeforeDiscount = quantity * unitPrice;
      const discountAmount = subtotalBeforeDiscount * (discountRate / 100);
      const subtotalAfterDiscount = subtotalBeforeDiscount - discountAmount;
      const taxAmount = subtotalAfterDiscount * (taxRate / 100);
      item.subtotal = subtotalAfterDiscount + taxAmount;

      newItems[index] = item;
      onItemsChange(newItems);
    },
    [items, onItemsChange, handleUpdateItem]
  );

  // Abrir modal para crear producto
  const handleOpenProductModal = useCallback((index: number, initialName: string) => {
    setPendingItemIndex(index);
    setProductModalInitialName(initialName);
    setProductModalInitialType("part");
    setIsProductModalOpen(true);
  }, []);

  // Crear producto desde modal
  const handleCreateProductFromModal = useCallback(
    async (productData: CreateProductData) => {
      const result = await createProduct(productData);

      if (result.success && result.data && pendingItemIndex !== null) {
        showToast("success", "Producto creado", `"${result.data.name}" ha sido creado`);
        handleProductSelect(pendingItemIndex, result.data);
        setIsProductModalOpen(false);
        setPendingItemIndex(null);
        setProductModalInitialName("");
        return { success: true };
      }

      const errorMessage = result.error || "No se pudo crear el producto";
      showToast("error", "Error", errorMessage);
      return { success: false, error: errorMessage };
    },
    [createProduct, showToast, handleProductSelect, pendingItemIndex]
  );

  // Calcular totales
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const itemSubtotal = quantity * unitPrice;
      return sum + itemSubtotal;
    }, 0);

    const discount = items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const discountRate = Number(item.discount_percentage ?? 0);
      const itemSubtotal = quantity * unitPrice;
      const itemDiscount = itemSubtotal * (discountRate / 100);
      return sum + itemDiscount;
    }, 0);

    const tax = items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const discountRate = Number(item.discount_percentage ?? 0);
      const taxRate = Number(item.tax_percentage ?? 0);
      const itemSubtotal = quantity * unitPrice;
      const itemDiscount = itemSubtotal * (discountRate / 100);
      const subtotalAfterDiscount = itemSubtotal - itemDiscount;
      const itemTax = subtotalAfterDiscount * (taxRate / 100);
      return sum + itemTax;
    }, 0);

    const total = subtotal - discount + tax;

    return { subtotal, discount, tax, total };
  }, [items]);

  // Validar stock para productos
  const getStockWarning = useCallback(
    (item: BudgetItem): string | null => {
      if (!item.product || item.item_type === "labor") return null;
      if (!item.product.track_inventory) return null;

      const availableStock = item.product.current_stock;
      const requiredQuantity = item.quantity;

      if (availableStock < requiredQuantity) {
        return `Stock insuficiente (disponible: ${availableStock} ${item.product.stock_unit})`;
      }

      const stockStatus = getStockStatus(item.product);
      if (stockStatus === "low") {
        return `Stock bajo (${availableStock} ${item.product.stock_unit})`;
      }

      return null;
    },
    []
  );

  return (
    <div className="space-y-4">
      {/* Tabla */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 w-10">
                #
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 min-w-[250px]">
                Producto / Descripción
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 w-24">
                Tipo
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 w-24">
                Cantidad
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 w-32">
                Precio Unit.
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 w-24">
                Desc. %
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 w-24">
                IVA %
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 w-32">
                Subtotal
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 w-16">

              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-white/[0.03]">
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  No hay items en el presupuesto. Haz clic en "Agregar Item" para comenzar.
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const stockWarning = getStockWarning(item);

                return (
                  <tr
                    key={item.id || index}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                  >
                    {/* # */}
                    <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                      {index + 1}
                    </td>

                    {/* Producto / Descripción */}
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        <ProductCell
                          value={item.description}
                          selectedProduct={item.product || null}
                          products={products}
                          loading={productsLoading}
                          onChange={(value) => handleUpdateItem(index, "description", value)}
                          onProductSelect={(product) => handleProductSelect(index, product)}
                          onCreateClick={() =>
                            handleOpenProductModal(index, item.description)
                          }
                          disabled={disabled}
                        />
                        {stockWarning && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 px-2">
                            ⚠️ {stockWarning}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Tipo */}
                    <td className="px-3 py-2">
                      <select
                        value={item.item_type}
                        onChange={(e) =>
                          handleUpdateItem(index, "item_type", e.target.value as BudgetItemType)
                        }
                        disabled={disabled || !item.is_custom}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white dark:bg-gray-900 dark:border-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="part">Pieza</option>
                        <option value="labor">Servicio</option>
                      </select>
                    </td>

                    {/* Cantidad */}
                    <td className="px-3 py-2">
                      <EditableCell
                        value={item.quantity}
                        onChange={(value) =>
                          handleUpdateItem(index, "quantity", parseFloat(value.toString()) || 0)
                        }
                        type="number"
                        min={0}
                        step={0.01}
                        disabled={disabled}
                        className="text-right"
                      />
                    </td>

                    {/* Precio Unitario */}
                    <td className="px-3 py-2">
                      <EditableCell
                        value={item.unit_price}
                        onChange={(value) =>
                          handleUpdateItem(index, "unit_price", parseFloat(value.toString()) || 0)
                        }
                        type="number"
                        min={0}
                        step={0.01}
                        disabled={disabled}
                        className="text-right"
                      />
                    </td>

                    {/* Descuento % */}
                    <td className="px-3 py-2">
                      <EditableCell
                        value={item.discount_percentage ?? 0}
                        onChange={(value) =>
                          handleUpdateItem(
                            index,
                            "discount_percentage",
                            parseFloat(value.toString()) || 0
                          )
                        }
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        disabled={disabled}
                        className="text-right"
                      />
                    </td>

                    {/* IVA % */}
                    <td className="px-3 py-2">
                      <EditableCell
                        value={item.tax_percentage ?? 0}
                        onChange={(value) =>
                          handleUpdateItem(
                            index,
                            "tax_percentage",
                            parseFloat(value.toString()) || 0
                          )
                        }
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        disabled={disabled}
                        className="text-right"
                      />
                    </td>

                    {/* Subtotal */}
                    <td className="px-3 py-2 text-right text-sm font-semibold text-gray-800 dark:text-white/90">
                      {formatPrice(item.subtotal)}
                    </td>

                    {/* Acciones */}
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(index)}
                        disabled={disabled}
                        className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Eliminar item"
                      >
                        <TrashBinIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Botón Agregar Item */}
      <div>
        <button
          type="button"
          onClick={handleAddRow}
          disabled={disabled}
          className="px-4 py-2 text-sm font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Agregar Item
        </button>
      </div>

      {/* Totales */}
      <div className="flex justify-end">
        <div className="w-full max-w-sm space-y-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
            <span className="font-medium text-gray-800 dark:text-white/90">
              {formatPrice(totals.subtotal)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Descuento:</span>
            <span className="font-medium text-red-600 dark:text-red-400">
              -{formatPrice(totals.discount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">IVA:</span>
            <span className="font-medium text-gray-800 dark:text-white/90">
              {formatPrice(totals.tax)}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-800 dark:text-white/90">Total:</span>
              <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
                {formatPrice(totals.total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de creación de producto */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setPendingItemIndex(null);
          setProductModalInitialName("");
        }}
        mode="create"
        initialName={productModalInitialName}
        initialType={productModalInitialType}
        onSubmit={(data) => handleCreateProductFromModal(data as CreateProductData)}
      />
    </div>
  );
}

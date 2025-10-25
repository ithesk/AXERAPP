// =====================================================
// TYPES: Sistema de Productos
// =====================================================

import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";
import type { Brand, Category, Tag } from './product-attributes';

type ProductRow = Tables<"products">;

export type ProductType = ProductRow["product_type"];

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  part: 'Pieza',
  service: 'Servicio',
};

export const PRODUCT_TYPE_DESCRIPTIONS: Record<ProductType, string> = {
  part: 'Pieza almacenable (afecta inventario)',
  service: 'Servicio o mano de obra (no afecta inventario)',
};

// Unidades de medida comunes
export const STOCK_UNITS = [
  'unidad',
  'metro',
  'litro',
  'kg',
  'gramo',
  'caja',
  'paquete',
  'rollo',
  'par',
] as const;

export type StockUnit = typeof STOCK_UNITS[number];

// =====================================================
// INTERFACES
// =====================================================

export interface Product extends ProductRow {
  category?: Category | null;
  brand?: Brand | null;
  tags?: Tag[];
}

// =====================================================
// CREATE/UPDATE INTERFACES
// =====================================================

type ProductInsert = TablesInsert<"products">;
type ProductUpdate = TablesUpdate<"products">;

export interface CreateProductData
  extends Omit<
    ProductInsert,
    | "id"
    | "org_id"
    | "created_at"
    | "updated_at"
    | "created_by"
  > {
  tag_ids?: string[];
  category?: string;
  brand?: string;
  tags?: string[];
}

export interface UpdateProductData
  extends Partial<
    Omit<
      ProductUpdate,
      | "id"
      | "org_id"
      | "created_at"
      | "updated_at"
      | "created_by"
    >
  > {
  tag_ids?: string[];
  category?: string | null;
  brand?: string | null;
  tags?: string[];
}

// =====================================================
// FILTROS Y BÚSQUEDA
// =====================================================

export interface ProductsFilters {
  product_type?: ProductType;
  is_active?: boolean;
  track_inventory?: boolean;
  low_stock?: boolean; // Productos con stock por debajo del mínimo
  category?: string;
  category_id?: string;
  brand?: string;
  brand_id?: string;
  tags?: string[];
  tag_ids?: string[];
  search?: string; // Búsqueda por nombre, SKU, descripción
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export function isLowStock(product: Product): boolean {
  if (product.product_type !== 'part' || !product.track_inventory) {
    return false;
  }
  return product.current_stock <= product.min_stock;
}

export function isOutOfStock(product: Product): boolean {
  if (product.product_type !== 'part' || !product.track_inventory) {
    return false;
  }
  return product.current_stock <= 0;
}

export function hasStock(product: Product, quantity: number): boolean {
  if (product.product_type === 'service' || !product.track_inventory) {
    return true; // Los servicios siempre están "disponibles"
  }
  return product.current_stock >= quantity;
}

export function getStockStatus(product: Product): 'high' | 'low' | 'out' | 'na' {
  if (product.product_type === 'service' || !product.track_inventory) {
    return 'na'; // No aplica
  }

  if (product.current_stock <= 0) {
    return 'out'; // Sin stock
  }

  if (product.current_stock <= product.min_stock) {
    return 'low'; // Stock bajo
  }

  return 'high'; // Stock normal
}

export function getStockStatusColor(status: ReturnType<typeof getStockStatus>): string {
  const colors = {
    high: 'text-green-600 dark:text-green-400',
    low: 'text-amber-600 dark:text-amber-400',
    out: 'text-red-600 dark:text-red-400',
    na: 'text-gray-400 dark:text-gray-500',
  };
  return colors[status];
}

export function getStockStatusBadgeColor(status: ReturnType<typeof getStockStatus>): string {
  const colors = {
    high: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    low: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    out: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    na: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };
  return colors[status];
}

export function formatStock(product: Product): string {
  if (product.product_type === 'service' || !product.track_inventory) {
    return 'N/A';
  }

  const stock = product.current_stock.toFixed(2).replace(/\.?0+$/, '');
  return `${stock} ${product.stock_unit}`;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
  }).format(price);
}

export function getProductDisplayName(product: Product): string {
  const brandName =
    typeof product.brand === "string"
      ? product.brand
      : product.brand?.name;

  if (brandName) {
    return `${brandName} ${product.name}`;
  }

  return product.name;
}

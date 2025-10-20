// =====================================================
// TYPES: Sistema de Productos
// =====================================================

import type { Brand, Category, Tag } from './product-attributes';

export type ProductType = 'part' | 'service';

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

export interface Product {
  id: string;
  org_id: string;

  // Información básica
  name: string;
  description: string | null;
  sku: string | null;

  // Tipo de producto
  product_type: ProductType;

  // Precio y costos
  sale_price: number;
  cost_price: number;

  // Inventario (solo para product_type = 'part')
  track_inventory: boolean;
  current_stock: number;
  min_stock: number;
  max_stock: number | null;
  stock_unit: string;

  // Categorización (ahora con IDs)
  category_id: string | null;
  brand_id: string | null;

  // Relaciones cargadas
  category?: Category | null;
  brand?: Brand | null;
  tags?: Tag[];

  // Estado
  is_active: boolean;

  // Metadata
  notes: string | null;
  image_url: string | null;
  barcode: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// =====================================================
// CREATE/UPDATE INTERFACES
// =====================================================

export interface CreateProductData {
  // Información básica
  name: string;
  description?: string;
  sku?: string;

  // Tipo de producto
  product_type: ProductType;

  // Precio y costos
  sale_price: number;
  cost_price?: number;

  // Inventario (solo para product_type = 'part')
  track_inventory?: boolean;
  current_stock?: number;
  min_stock?: number;
  max_stock?: number;
  stock_unit?: string;

  // Categorización (ahora son IDs)
  category_id?: string;
  brand_id?: string;
  tag_ids?: string[]; // Array de IDs de tags
  // Compatibilidad temporal mientras se completa la migración a IDs
  category?: string;
  brand?: string;
  tags?: string[];

  // Metadata
  notes?: string;
  image_url?: string;
  barcode?: string;
}

export interface UpdateProductData {
  // Información básica
  name?: string;
  description?: string | null;
  sku?: string | null;

  // Tipo de producto (normalmente no se debe cambiar después de creado)
  product_type?: ProductType;

  // Precio y costos
  sale_price?: number;
  cost_price?: number;

  // Inventario
  track_inventory?: boolean;
  current_stock?: number; // Normalmente no se actualiza directamente, se usa inventory_movements
  min_stock?: number;
  max_stock?: number | null;
  stock_unit?: string;

  // Categorización (ahora son IDs)
  category_id?: string | null;
  brand_id?: string | null;
  tag_ids?: string[]; // Array de IDs de tags
  // Compatibilidad temporal mientras se completa la migración a IDs
  category?: string | null;
  brand?: string | null;
  tags?: string[];

  // Estado
  is_active?: boolean;

  // Metadata
  notes?: string | null;
  image_url?: string | null;
  barcode?: string | null;
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

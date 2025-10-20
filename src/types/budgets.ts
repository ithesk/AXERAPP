// =====================================================
// TYPES: Sistema de Presupuestos
// =====================================================

export type BudgetStatus = 'draft' | 'sent' | 'approved' | 'rejected';

export type BudgetItemType = 'part' | 'labor';

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

export const BUDGET_ITEM_TYPE_LABELS: Record<BudgetItemType, string> = {
  part: 'Pieza',
  labor: 'Mano de Obra',
};

// =====================================================
// INTERFACES
// =====================================================

export interface BudgetItem {
  id: string;
  budget_id: string;
  item_type: BudgetItemType;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number; // Calculado automáticamente en la BD
  discount_percentage?: number;
  tax_percentage?: number;
  sku?: string | null;
  notes?: string | null;
  sort_order?: number;
  display_order?: number;
  created_at: string;
  updated_at: string;

  // Nuevos campos para productos
  product_id?: string | null;
  is_custom: boolean; // true = item manual, false = producto del catálogo

  // Relaciones (cargadas por separado si es necesario)
  product?: import('./products').Product;
}

export interface Budget {
  id: string;
  entrada_id: string;
  org_id: string;
  status: BudgetStatus;

  // Totales
  subtotal_parts: number;
  subtotal_labor: number;
  tax_percentage: number;
  tax_amount: number;
  discount_percentage: number;
  discount_amount: number;
  total: number;

  // Notas y validez
  notes?: string | null;
  valid_until?: string | null;

  // Fechas de aprobación/rechazo
  approved_at?: string | null;
  rejected_at?: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  created_by?: string | null;

  // Relaciones (se cargan por separado)
  items?: BudgetItem[];
}

// =====================================================
// CREATE/UPDATE INTERFACES
// =====================================================

export interface CreateBudgetItemData {
  item_type: BudgetItemType;
  description: string;
  quantity: number;
  unit_price: number;
  sku?: string;
  notes?: string;
  display_order?: number;
  sort_order?: number;
  discount_percentage?: number;
  tax_percentage?: number;

  // Nuevos campos para productos
  product_id?: string; // ID del producto del catálogo (opcional)
  is_custom?: boolean; // true si es manual, false si viene de producto
}

export interface UpdateBudgetItemData {
  description?: string;
  quantity?: number;
  unit_price?: number;
  sku?: string | null;
  notes?: string | null;
  display_order?: number;
  sort_order?: number;
  discount_percentage?: number;
  tax_percentage?: number;

  // Nuevos campos para productos
  product_id?: string | null;
  is_custom?: boolean;
}

export interface CreateBudgetData {
  entrada_id: string;
  tax_percentage?: number;
  discount_percentage?: number;
  notes?: string;
  valid_until?: string;
  items?: CreateBudgetItemData[];
}

export interface UpdateBudgetData {
  status?: BudgetStatus;
  tax_percentage?: number;
  discount_percentage?: number;
  notes?: string | null;
  valid_until?: string | null;
}

// =====================================================
// VISTA COMPLETA (Budget con Items)
// =====================================================

export interface BudgetWithItems extends Budget {
  items: BudgetItem[];
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export function calculateItemSubtotal(quantity: number, unitPrice: number): number {
  return Number((quantity * unitPrice).toFixed(2));
}

export function calculateBudgetTotals(items: BudgetItem[], taxPercentage: number = 0, discountPercentage: number = 0) {
  const subtotalParts = items
    .filter(item => item.item_type === 'part')
    .reduce((sum, item) => sum + item.subtotal, 0);

  const subtotalLabor = items
    .filter(item => item.item_type === 'labor')
    .reduce((sum, item) => sum + item.subtotal, 0);

  const subtotal = subtotalParts + subtotalLabor;
  const taxAmount = subtotal * (taxPercentage / 100);
  const discountAmount = subtotal * (discountPercentage / 100);
  const total = subtotal + taxAmount - discountAmount;

  return {
    subtotalParts: Number(subtotalParts.toFixed(2)),
    subtotalLabor: Number(subtotalLabor.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
  }).format(amount);
}

export function getBudgetStatusColor(status: BudgetStatus): string {
  const colors: Record<BudgetStatus, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  };
  return colors[status];
}

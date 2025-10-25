import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

export type BudgetStatus = Tables<"budgets">["status"];

export type BudgetItemType = Tables<"budget_items">["item_type"];

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

type BudgetItemRow = Tables<"budget_items">;
type BudgetRow = Tables<"budgets">;

// =====================================================
// INTERFACES
// =====================================================

export interface BudgetItem
  extends Omit<BudgetItemRow, "product_id" | "created_at" | "updated_at"> {
  product_id: BudgetItemRow["product_id"];
  product?: import("./products").Product;
}

export interface Budget
  extends Omit<
    BudgetRow,
    | "created_at"
    | "updated_at"
    | "created_by"
  > {
  created_at: BudgetRow["created_at"];
  updated_at: BudgetRow["updated_at"];
  created_by: BudgetRow["created_by"];
  items?: BudgetItem[];
}

// =====================================================
// CREATE/UPDATE INTERFACES
// =====================================================

type BudgetItemInsert = TablesInsert<"budget_items">;
type BudgetItemUpdate = TablesUpdate<"budget_items">;
type BudgetInsert = TablesInsert<"budgets">;
type BudgetUpdate = TablesUpdate<"budgets">;

export type CreateBudgetItemData = Omit<
  BudgetItemInsert,
  "id" | "budget_id" | "created_at" | "updated_at"
>;

export type UpdateBudgetItemData = Omit<
  BudgetItemUpdate,
  "budget_id" | "created_at" | "updated_at"
>;

export type CreateBudgetData = Omit<
  BudgetInsert,
  | "id"
  | "org_id"
  | "total"
  | "subtotal_parts"
  | "subtotal_labor"
  | "tax_amount"
  | "discount_amount"
  | "status"
  | "created_at"
  | "updated_at"
  | "created_by"
> & {
  items?: CreateBudgetItemData[];
};

export type UpdateBudgetData = Partial<
  Omit<
    BudgetUpdate,
    | "id"
    | "org_id"
    | "entrada_id"
    | "created_at"
    | "updated_at"
    | "created_by"
  >
>;

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

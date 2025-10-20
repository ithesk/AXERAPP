// =====================================================
// TYPES: Sistema de Inventario
// =====================================================

export type MovementType =
  | 'purchase'       // Compra/Entrada de inventario
  | 'sale'           // Venta/Salida de inventario
  | 'adjustment'     // Ajuste manual de inventario
  | 'return'         // Devolución
  | 'budget_reserve' // Reserva por presupuesto aprobado
  | 'budget_release' // Liberación por presupuesto rechazado/cancelado
  | 'transfer_in'    // Transferencia entrante
  | 'transfer_out';  // Transferencia saliente

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  purchase: 'Compra',
  sale: 'Venta',
  adjustment: 'Ajuste',
  return: 'Devolución',
  budget_reserve: 'Reserva (Presupuesto)',
  budget_release: 'Liberación (Presupuesto)',
  transfer_in: 'Transferencia Entrante',
  transfer_out: 'Transferencia Saliente',
};

export const MOVEMENT_TYPE_ICONS: Record<MovementType, string> = {
  purchase: '📦', // Entrada
  sale: '🛒', // Salida
  adjustment: '🔧', // Ajuste
  return: '↩️', // Devolución
  budget_reserve: '🔒', // Reserva
  budget_release: '🔓', // Liberación
  transfer_in: '⬅️', // Entrada
  transfer_out: '➡️', // Salida
};

export type ReferenceType = 'budget' | 'sale' | 'purchase' | 'manual' | 'transfer';

// =====================================================
// INTERFACES
// =====================================================

export interface InventoryMovement {
  id: string;
  org_id: string;
  product_id: string;

  // Tipo de movimiento
  movement_type: MovementType;

  // Cantidades
  quantity: number; // Positivo = entrada, Negativo = salida
  stock_before: number;
  stock_after: number;

  // Referencias
  reference_type: ReferenceType | null;
  reference_id: string | null;

  // Costos (opcional)
  unit_cost: number | null;
  total_cost: number | null;

  // Metadata
  notes: string | null;
  created_at: string;
  created_by: string | null;

  // Relaciones (cargadas por separado si es necesario)
  product?: import('./products').Product;
}

// =====================================================
// CREATE/UPDATE INTERFACES
// =====================================================

export interface CreateInventoryMovementData {
  product_id: string;
  movement_type: MovementType;
  quantity: number;
  reference_type?: ReferenceType;
  reference_id?: string;
  unit_cost?: number;
  notes?: string;
}

// Los movimientos de inventario NO se actualizan, son inmutables
// Solo se pueden crear o eliminar (en casos excepcionales)

// =====================================================
// FILTROS Y BÚSQUEDA
// =====================================================

export interface InventoryMovementsFilters {
  product_id?: string;
  movement_type?: MovementType;
  reference_type?: ReferenceType;
  reference_id?: string;
  date_from?: string; // ISO date string
  date_to?: string; // ISO date string
}

// =====================================================
// STOCK VALIDATION
// =====================================================

export interface StockValidation {
  product_id: string;
  product_name: string;
  required_quantity: number;
  available_stock: number;
  missing_quantity: number;
}

export interface StockValidationResult {
  is_valid: boolean;
  issues: StockValidation[];
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export function isInboundMovement(movementType: MovementType): boolean {
  return ['purchase', 'return', 'budget_release', 'transfer_in', 'adjustment'].includes(movementType);
}

export function isOutboundMovement(movementType: MovementType): boolean {
  return ['sale', 'budget_reserve', 'transfer_out'].includes(movementType);
}

export function getMovementDirection(movementType: MovementType): 'in' | 'out' | 'adjustment' {
  if (movementType === 'adjustment') return 'adjustment';
  return isInboundMovement(movementType) ? 'in' : 'out';
}

export function getMovementTypeColor(movementType: MovementType): string {
  const direction = getMovementDirection(movementType);

  const colors = {
    in: 'text-green-600 dark:text-green-400',
    out: 'text-red-600 dark:text-red-400',
    adjustment: 'text-blue-600 dark:text-blue-400',
  };

  return colors[direction];
}

export function getMovementTypeBadgeColor(movementType: MovementType): string {
  const direction = getMovementDirection(movementType);

  const colors = {
    in: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    out: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    adjustment: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  };

  return colors[direction];
}

export function formatQuantity(movement: InventoryMovement): string {
  const sign = movement.quantity >= 0 ? '+' : '';
  const qty = Math.abs(movement.quantity).toFixed(2).replace(/\.?0+$/, '');
  return `${sign}${qty}`;
}

export function formatStock(stock: number): string {
  return stock.toFixed(2).replace(/\.?0+$/, '');
}

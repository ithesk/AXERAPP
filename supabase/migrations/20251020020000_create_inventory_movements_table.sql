-- =====================================================
-- MIGRATION: Create Inventory Movements Table
-- Description: Sistema de movimientos de inventario para control de stock
-- =====================================================

-- Crear tabla de movimientos de inventario
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

  -- Tipo de movimiento
  movement_type VARCHAR(30) NOT NULL CHECK (movement_type IN (
    'purchase',        -- Compra/Entrada de inventario
    'sale',            -- Venta/Salida de inventario
    'adjustment',      -- Ajuste manual de inventario
    'return',          -- Devolución
    'budget_reserve',  -- Reserva por presupuesto aprobado
    'budget_release',  -- Liberación por presupuesto rechazado/cancelado
    'transfer_in',     -- Transferencia entrante
    'transfer_out'     -- Transferencia saliente
  )),

  -- Cantidades
  quantity DECIMAL(12,3) NOT NULL,
  stock_before DECIMAL(12,3) NOT NULL,
  stock_after DECIMAL(12,3) NOT NULL,

  -- Referencias al documento que generó el movimiento
  reference_type VARCHAR(30), -- 'budget', 'sale', 'purchase', 'manual', etc.
  reference_id UUID, -- ID del documento relacionado (budget_id, sale_id, etc.)

  -- Costos (opcional, para valorización de inventario)
  unit_cost DECIMAL(12,2),
  total_cost DECIMAL(12,2),

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT valid_quantity CHECK (quantity != 0),
  CONSTRAINT valid_stock CHECK (stock_before >= 0 AND stock_after >= 0)
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_inventory_movements_org_id ON inventory_movements(org_id);
CREATE INDEX idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_inventory_movements_reference ON inventory_movements(reference_type, reference_id)
  WHERE reference_type IS NOT NULL AND reference_id IS NOT NULL;
CREATE INDEX idx_inventory_movements_created_at ON inventory_movements(created_at DESC);

-- Comentarios
COMMENT ON TABLE inventory_movements IS 'Registro de todos los movimientos de inventario (entradas/salidas)';
COMMENT ON COLUMN inventory_movements.movement_type IS 'Tipo de movimiento: purchase, sale, adjustment, return, budget_reserve, budget_release';
COMMENT ON COLUMN inventory_movements.quantity IS 'Cantidad del movimiento (positivo=entrada, negativo=salida)';
COMMENT ON COLUMN inventory_movements.stock_before IS 'Stock antes del movimiento';
COMMENT ON COLUMN inventory_movements.stock_after IS 'Stock después del movimiento';
COMMENT ON COLUMN inventory_movements.reference_type IS 'Tipo de documento: budget, sale, purchase, manual';
COMMENT ON COLUMN inventory_movements.reference_id IS 'ID del documento que generó el movimiento';

-- RLS (Row Level Security)
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios solo pueden ver movimientos de su organización
CREATE POLICY inventory_movements_select_policy ON inventory_movements
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

-- Policy: Los usuarios pueden insertar movimientos en su organización
CREATE POLICY inventory_movements_insert_policy ON inventory_movements
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

-- Policy: Los movimientos NO se pueden actualizar (son inmutables)
-- Solo se pueden eliminar en casos excepcionales

-- Policy: Los usuarios pueden eliminar movimientos de su organización (casos excepcionales)
CREATE POLICY inventory_movements_delete_policy ON inventory_movements
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

-- =====================================================
-- FUNCTION: Crear movimiento de inventario
-- =====================================================
CREATE OR REPLACE FUNCTION create_inventory_movement(
  p_org_id UUID,
  p_product_id UUID,
  p_movement_type VARCHAR(30),
  p_quantity DECIMAL(12,3),
  p_reference_type VARCHAR(30) DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_unit_cost DECIMAL(12,2) DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stock_before DECIMAL(12,3);
  v_stock_after DECIMAL(12,3);
  v_total_cost DECIMAL(12,2);
  v_movement_id UUID;
BEGIN
  -- Obtener stock actual
  SELECT current_stock INTO v_stock_before
  FROM products
  WHERE id = p_product_id AND org_id = p_org_id
  FOR UPDATE; -- Bloquear fila para evitar race conditions

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado';
  END IF;

  -- Calcular nuevo stock
  v_stock_after := v_stock_before + p_quantity;

  -- Validar que no quede stock negativo
  IF v_stock_after < 0 THEN
    RAISE EXCEPTION 'Stock insuficiente. Stock actual: %, Cantidad solicitada: %',
      v_stock_before, ABS(p_quantity);
  END IF;

  -- Calcular costo total
  IF p_unit_cost IS NOT NULL THEN
    v_total_cost := p_unit_cost * ABS(p_quantity);
  END IF;

  -- Insertar movimiento
  INSERT INTO inventory_movements (
    org_id,
    product_id,
    movement_type,
    quantity,
    stock_before,
    stock_after,
    reference_type,
    reference_id,
    unit_cost,
    total_cost,
    notes,
    created_by
  ) VALUES (
    p_org_id,
    p_product_id,
    p_movement_type,
    p_quantity,
    v_stock_before,
    v_stock_after,
    p_reference_type,
    p_reference_id,
    p_unit_cost,
    v_total_cost,
    p_notes,
    COALESCE(p_created_by, auth.uid())
  ) RETURNING id INTO v_movement_id;

  -- Actualizar stock del producto
  UPDATE products
  SET
    current_stock = v_stock_after,
    updated_at = NOW()
  WHERE id = p_product_id AND org_id = p_org_id;

  RETURN v_movement_id;
END;
$$;

COMMENT ON FUNCTION create_inventory_movement IS 'Crea un movimiento de inventario y actualiza el stock del producto de forma atómica';

-- =====================================================
-- MIGRATION: Alter Budget Items to Support Products
-- Description: Agregar soporte de productos a budget_items
-- =====================================================

-- Agregar columna product_id para vincular con productos
ALTER TABLE budget_items
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- Agregar columna is_custom para distinguir items manuales vs productos
ALTER TABLE budget_items
ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;

-- Agregar índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_budget_items_product_id ON budget_items(product_id)
  WHERE product_id IS NOT NULL;

-- Comentarios
COMMENT ON COLUMN budget_items.product_id IS 'ID del producto vinculado (NULL si es un item custom/manual)';
COMMENT ON COLUMN budget_items.is_custom IS 'TRUE si es un item manual sin producto vinculado, FALSE si viene de catálogo';

-- =====================================================
-- FUNCTION: Validar stock antes de aprobar presupuesto
-- =====================================================
CREATE OR REPLACE FUNCTION validate_budget_stock(p_budget_id UUID)
RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR(255),
  required_quantity DECIMAL(12,3),
  available_stock DECIMAL(12,3),
  missing_quantity DECIMAL(12,3)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS product_id,
    p.name AS product_name,
    bi.quantity AS required_quantity,
    p.current_stock AS available_stock,
    (bi.quantity - p.current_stock) AS missing_quantity
  FROM budget_items bi
  INNER JOIN products p ON bi.product_id = p.id
  WHERE bi.budget_id = p_budget_id
    AND bi.item_type = 'part' -- Solo piezas (no servicios)
    AND bi.product_id IS NOT NULL -- Solo items con producto vinculado
    AND p.track_inventory = true -- Solo productos con control de inventario
    AND p.current_stock < bi.quantity -- Stock insuficiente
  ORDER BY p.name;
END;
$$;

COMMENT ON FUNCTION validate_budget_stock IS 'Valida si hay stock suficiente para todos los productos de un presupuesto';

-- =====================================================
-- FUNCTION: Reservar inventario al aprobar presupuesto
-- =====================================================
CREATE OR REPLACE FUNCTION reserve_budget_inventory(
  p_budget_id UUID,
  p_created_by UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_budget_record RECORD;
  v_item_record RECORD;
  v_product_record RECORD;
BEGIN
  -- Obtener información del presupuesto
  SELECT org_id, entrada_id INTO v_budget_record
  FROM budgets
  WHERE id = p_budget_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Presupuesto no encontrado';
  END IF;

  -- Procesar cada item del presupuesto
  FOR v_item_record IN
    SELECT bi.*
    FROM budget_items bi
    WHERE bi.budget_id = p_budget_id
      AND bi.item_type = 'part' -- Solo piezas
      AND bi.product_id IS NOT NULL -- Solo items con producto
  LOOP
    -- Obtener información del producto
    SELECT * INTO v_product_record
    FROM products
    WHERE id = v_item_record.product_id
      AND org_id = v_budget_record.org_id;

    -- Solo procesar si el producto tiene control de inventario
    IF v_product_record.track_inventory THEN
      -- Crear movimiento de inventario (salida/reserva)
      PERFORM create_inventory_movement(
        p_org_id := v_budget_record.org_id,
        p_product_id := v_item_record.product_id,
        p_movement_type := 'budget_reserve',
        p_quantity := -v_item_record.quantity, -- Negativo = salida
        p_reference_type := 'budget',
        p_reference_id := p_budget_id,
        p_unit_cost := v_product_record.cost_price,
        p_notes := 'Reserva por aprobación de presupuesto',
        p_created_by := COALESCE(p_created_by, auth.uid())
      );
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION reserve_budget_inventory IS 'Reserva/descuenta inventario cuando se aprueba un presupuesto';

-- =====================================================
-- FUNCTION: Liberar inventario al rechazar presupuesto
-- =====================================================
CREATE OR REPLACE FUNCTION release_budget_inventory(
  p_budget_id UUID,
  p_created_by UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_movement_record RECORD;
BEGIN
  -- Revertir todos los movimientos de reserva de este presupuesto
  FOR v_movement_record IN
    SELECT *
    FROM inventory_movements
    WHERE reference_type = 'budget'
      AND reference_id = p_budget_id
      AND movement_type = 'budget_reserve'
  LOOP
    -- Crear movimiento inverso (entrada/liberación)
    PERFORM create_inventory_movement(
      p_org_id := v_movement_record.org_id,
      p_product_id := v_movement_record.product_id,
      p_movement_type := 'budget_release',
      p_quantity := ABS(v_movement_record.quantity), -- Positivo = entrada
      p_reference_type := 'budget',
      p_reference_id := p_budget_id,
      p_notes := 'Liberación por rechazo de presupuesto',
      p_created_by := COALESCE(p_created_by, auth.uid())
    );
  END LOOP;
END;
$$;

COMMENT ON FUNCTION release_budget_inventory IS 'Libera/devuelve inventario cuando se rechaza un presupuesto';

-- =====================================================
-- Sistema de Presupuestos para Entradas de Reparación
-- Description: Crear tablas para gestionar presupuestos con piezas y mano de obra
-- Date: 2025-10-19
-- =====================================================

BEGIN;

-- =====================================================
-- TABLA: budgets (Presupuestos)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrada_id UUID NOT NULL REFERENCES public.entradas(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Estado del presupuesto
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected')),

  -- Totales (calculados automáticamente)
  subtotal_parts DECIMAL(10, 2) DEFAULT 0,
  subtotal_labor DECIMAL(10, 2) DEFAULT 0,
  tax_percentage DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) DEFAULT 0,

  -- Notas y validez
  notes TEXT,
  valid_until DATE,

  -- Fechas de aprobación/rechazo
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Restricción: un presupuesto por entrada
  UNIQUE(entrada_id)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_budgets_entrada_id ON public.budgets(entrada_id);
CREATE INDEX IF NOT EXISTS idx_budgets_org_id ON public.budgets(org_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON public.budgets(status);

-- =====================================================
-- TABLA: budget_items (Items del Presupuesto)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,

  -- Tipo de item
  item_type TEXT NOT NULL CHECK (item_type IN ('part', 'labor')),

  -- Información del item
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,

  -- Subtotal calculado (cantidad * precio unitario)
  subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,

  -- SKU/código (opcional, útil para piezas)
  sku TEXT,

  -- Notas adicionales del item
  notes TEXT,

  -- Orden de visualización
  display_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON public.budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_type ON public.budget_items(item_type);

-- =====================================================
-- FUNCIÓN: Actualizar totales del presupuesto
-- =====================================================
CREATE OR REPLACE FUNCTION update_budget_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_budget_id UUID;
  v_subtotal_parts DECIMAL(10, 2);
  v_subtotal_labor DECIMAL(10, 2);
  v_tax_amount DECIMAL(10, 2);
  v_discount_amount DECIMAL(10, 2);
  v_total DECIMAL(10, 2);
  v_tax_percentage DECIMAL(5, 2);
  v_discount_percentage DECIMAL(5, 2);
BEGIN
  -- Determinar el budget_id según la operación
  IF TG_OP = 'DELETE' THEN
    v_budget_id := OLD.budget_id;
  ELSE
    v_budget_id := NEW.budget_id;
  END IF;

  -- Obtener porcentajes actuales
  SELECT tax_percentage, discount_percentage
  INTO v_tax_percentage, v_discount_percentage
  FROM public.budgets
  WHERE id = v_budget_id;

  -- Calcular subtotales por tipo
  SELECT
    COALESCE(SUM(CASE WHEN item_type = 'part' THEN subtotal ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN item_type = 'labor' THEN subtotal ELSE 0 END), 0)
  INTO v_subtotal_parts, v_subtotal_labor
  FROM public.budget_items
  WHERE budget_id = v_budget_id;

  -- Calcular impuesto y descuento
  v_tax_amount := (v_subtotal_parts + v_subtotal_labor) * (v_tax_percentage / 100);
  v_discount_amount := (v_subtotal_parts + v_subtotal_labor) * (v_discount_percentage / 100);

  -- Calcular total final
  v_total := (v_subtotal_parts + v_subtotal_labor) + v_tax_amount - v_discount_amount;

  -- Actualizar el presupuesto
  UPDATE public.budgets
  SET
    subtotal_parts = v_subtotal_parts,
    subtotal_labor = v_subtotal_labor,
    tax_amount = v_tax_amount,
    discount_amount = v_discount_amount,
    total = v_total,
    updated_at = NOW()
  WHERE id = v_budget_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS: Actualizar totales automáticamente
-- =====================================================
DROP TRIGGER IF EXISTS trg_update_budget_totals_insert ON public.budget_items;
CREATE TRIGGER trg_update_budget_totals_insert
  AFTER INSERT ON public.budget_items
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_totals();

DROP TRIGGER IF EXISTS trg_update_budget_totals_update ON public.budget_items;
CREATE TRIGGER trg_update_budget_totals_update
  AFTER UPDATE ON public.budget_items
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_totals();

DROP TRIGGER IF EXISTS trg_update_budget_totals_delete ON public.budget_items;
CREATE TRIGGER trg_update_budget_totals_delete
  AFTER DELETE ON public.budget_items
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_totals();

-- =====================================================
-- FUNCIÓN: Actualizar totales cuando cambian porcentajes
-- =====================================================
CREATE OR REPLACE FUNCTION recalculate_budget_on_percentage_change()
RETURNS TRIGGER AS $$
DECLARE
  v_subtotal DECIMAL(10, 2);
BEGIN
  -- Solo recalcular si cambiaron los porcentajes
  IF (OLD.tax_percentage IS DISTINCT FROM NEW.tax_percentage) OR
     (OLD.discount_percentage IS DISTINCT FROM NEW.discount_percentage) THEN

    v_subtotal := NEW.subtotal_parts + NEW.subtotal_labor;

    NEW.tax_amount := v_subtotal * (NEW.tax_percentage / 100);
    NEW.discount_amount := v_subtotal * (NEW.discount_percentage / 100);
    NEW.total := v_subtotal + NEW.tax_amount - NEW.discount_amount;
    NEW.updated_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalculate_budget_percentages ON public.budgets;
CREATE TRIGGER trg_recalculate_budget_percentages
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_budget_on_percentage_change();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

-- BUDGETS: Los miembros de la organización pueden ver presupuestos
CREATE POLICY "Miembros pueden ver presupuestos"
  ON public.budgets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = budgets.org_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
  );

-- BUDGETS: Los miembros pueden crear presupuestos
CREATE POLICY "Miembros pueden crear presupuestos"
  ON public.budgets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = budgets.org_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
  );

-- BUDGETS: Los miembros pueden actualizar presupuestos
CREATE POLICY "Miembros pueden actualizar presupuestos"
  ON public.budgets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = budgets.org_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
  );

-- BUDGETS: Los miembros pueden eliminar presupuestos
CREATE POLICY "Miembros pueden eliminar presupuestos"
  ON public.budgets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = budgets.org_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
  );

-- BUDGET_ITEMS: Los miembros pueden ver items
CREATE POLICY "Miembros pueden ver items de presupuesto"
  ON public.budget_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.budgets b
      JOIN public.org_members om ON om.org_id = b.org_id
      WHERE b.id = budget_items.budget_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
  );

-- BUDGET_ITEMS: Los miembros pueden crear items
CREATE POLICY "Miembros pueden crear items de presupuesto"
  ON public.budget_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.budgets b
      JOIN public.org_members om ON om.org_id = b.org_id
      WHERE b.id = budget_items.budget_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
  );

-- BUDGET_ITEMS: Los miembros pueden actualizar items
CREATE POLICY "Miembros pueden actualizar items de presupuesto"
  ON public.budget_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.budgets b
      JOIN public.org_members om ON om.org_id = b.org_id
      WHERE b.id = budget_items.budget_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
  );

-- BUDGET_ITEMS: Los miembros pueden eliminar items
CREATE POLICY "Miembros pueden eliminar items de presupuesto"
  ON public.budget_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.budgets b
      JOIN public.org_members om ON om.org_id = b.org_id
      WHERE b.id = budget_items.budget_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
  );

-- =====================================================
-- Mensaje de confirmación
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de presupuestos creado correctamente';
  RAISE NOTICE '   - Tabla budgets creada';
  RAISE NOTICE '   - Tabla budget_items creada';
  RAISE NOTICE '   - Triggers de cálculo automático configurados';
  RAISE NOTICE '   - Políticas RLS aplicadas';
END $$;

COMMIT;

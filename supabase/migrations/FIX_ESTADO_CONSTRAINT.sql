-- =====================================================
-- FIX: Update Entradas Estado Constraint
-- Description: Fixes the estado column constraint to match the new workflow
-- =====================================================

BEGIN;

-- Step 1: Update existing data to new values
UPDATE public.entradas
SET estado = 'Cotización'
WHERE estado IN ('Pendiente', 'cotizacion', 'Cotizacion');

UPDATE public.entradas
SET estado = 'Reparado'
WHERE estado IN ('Listo', 'listo');

-- Step 2: Drop the old constraint
ALTER TABLE public.entradas
  DROP CONSTRAINT IF EXISTS entradas_estado_check;

-- Step 3: Add the new constraint with all valid states
ALTER TABLE public.entradas
  ADD CONSTRAINT entradas_estado_check CHECK (
    estado IN (
      'Cotización',
      'Inicio reparación',
      'En reparación',
      'Reparado',
      'Entregado',
      'Cancelado'
    )
  );

-- Step 4: Update the default value
ALTER TABLE public.entradas
  ALTER COLUMN estado SET DEFAULT 'Cotización';

-- Verify the changes
DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'entradas'
    AND constraint_name = 'entradas_estado_check'
  ) INTO constraint_exists;

  IF constraint_exists THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ SUCCESS: Estado constraint updated successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Valid estado values are now:';
    RAISE NOTICE '  • Cotización';
    RAISE NOTICE '  • Inicio reparación';
    RAISE NOTICE '  • En reparación';
    RAISE NOTICE '  • Reparado';
    RAISE NOTICE '  • Entregado';
    RAISE NOTICE '  • Cancelado';
    RAISE NOTICE '';
  ELSE
    RAISE WARNING 'Constraint was not created properly';
  END IF;
END $$;

COMMIT;

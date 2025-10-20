-- =====================================================
-- ADD COLUMN: problema_detalle to entradas table
-- Description: Adds optional detailed description field for problema
-- Date: 2025-10-18
-- =====================================================

BEGIN;

-- Add problema_detalle column to entradas table
ALTER TABLE public.entradas
ADD COLUMN IF NOT EXISTS problema_detalle TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.entradas.problema_detalle IS
'Descripción detallada opcional del problema. Complementa el campo "problema" con información adicional como: cuándo comenzó, qué lo causó, síntomas específicos, etc.';

-- Verify the column was added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'entradas'
    AND column_name = 'problema_detalle'
  ) THEN
    RAISE NOTICE '✅ SUCCESS: Column problema_detalle added to entradas table';
    RAISE NOTICE '';
    RAISE NOTICE 'Column details:';
    RAISE NOTICE '  - Name: problema_detalle';
    RAISE NOTICE '  - Type: TEXT';
    RAISE NOTICE '  - Nullable: YES';
    RAISE NOTICE '  - Purpose: Detailed description of the reported problem';
    RAISE NOTICE '';
  ELSE
    RAISE EXCEPTION '❌ ERROR: Column problema_detalle was not created';
  END IF;
END $$;

COMMIT;

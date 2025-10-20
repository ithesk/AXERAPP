-- =====================================================
-- MIGRATION: Add estimado_reparacion to entradas
-- Description: Agrega campo para almacenar el estimado de costo de reparación
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

BEGIN;

-- Agregar columna estimado_reparacion a la tabla entradas
ALTER TABLE public.entradas
  ADD COLUMN IF NOT EXISTS estimado_reparacion DECIMAL(10, 2);

-- Agregar comentario para documentación
COMMENT ON COLUMN public.entradas.estimado_reparacion
IS 'Estimado del costo de reparación proporcionado al cliente';

-- Verificar que la columna se agregó correctamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'entradas'
    AND column_name = 'estimado_reparacion'
  ) THEN
    RAISE NOTICE '✅ SUCCESS: Campo estimado_reparacion agregado exitosamente';
    RAISE NOTICE '';
    RAISE NOTICE 'Ahora puedes almacenar el estimado de reparación en las entradas.';
    RAISE NOTICE '';
  ELSE
    RAISE WARNING 'La columna estimado_reparacion no se agregó correctamente';
  END IF;
END $$;

COMMIT;

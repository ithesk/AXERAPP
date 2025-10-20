-- =====================================================
-- MIGRATION: Update Entradas Estado Constraint
-- Description: Ajusta los estados válidos a la nueva secuencia del flujo
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

-- Normalizar valores existentes
UPDATE public.entradas
SET estado = 'Cotización'
WHERE estado IN ('Pendiente', 'cotizacion', 'Cotizacion');

UPDATE public.entradas
SET estado = 'Reparado'
WHERE estado IN ('Listo', 'listo');

-- Actualizar constraint para reflejar los nuevos estados válidos
ALTER TABLE public.entradas
  DROP CONSTRAINT IF EXISTS entradas_estado_check;

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

-- Asegurar default correcto
ALTER TABLE public.entradas
  ALTER COLUMN estado SET DEFAULT 'Cotización';

DO $$
BEGIN
  RAISE NOTICE 'Constraint entradas_estado_check actualizado con la nueva secuencia de estados.';
END $$;

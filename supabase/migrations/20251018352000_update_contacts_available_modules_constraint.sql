-- =====================================================
-- MIGRATION: Update Contacts available_in_modules Constraint
-- Description: Permitir valor 'all' en el arreglo de módulos disponibles
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

-- Asegurar valores actuales válidos
UPDATE public.contacts
SET available_in_modules = ARRAY['all']::TEXT[]
WHERE available_in_modules IS NULL
  OR array_length(available_in_modules, 1) = 0;

-- Ajustar constraint para incluir el valor 'all'
ALTER TABLE public.contacts
  DROP CONSTRAINT IF EXISTS contacts_available_modules_check;

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_available_modules_check
  CHECK (
    available_in_modules IS NOT NULL
    AND array_length(available_in_modules, 1) > 0
    AND available_in_modules <@ ARRAY['all', 'entradas', 'ventas', 'compras', 'inventario']
  );

DO $$
BEGIN
  RAISE NOTICE 'Constraint contacts_available_modules_check actualizado para permitir el valor ''all''.';
END $$;

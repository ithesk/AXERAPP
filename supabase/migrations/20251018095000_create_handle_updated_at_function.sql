-- =====================================================
-- MIGRATION: Create handle_updated_at() helper
-- Description: Función genérica para mantener updated_at en tablas públicas
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.handle_updated_at IS 'Actualiza la columna updated_at con la hora UTC actual';

DO $$
BEGIN
  RAISE NOTICE 'Función handle_updated_at() lista para usarse en triggers BEFORE UPDATE';
END $$;

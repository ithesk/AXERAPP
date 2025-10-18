-- =====================================================
-- MIGRATION: Alter Contacts - Add Extended Profile Fields
-- Description: Agrega móvil, documento fiscal, web, avatar, etiquetas y dirección detallada
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS mobile TEXT,
  ADD COLUMN IF NOT EXISTS tax_id TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS address_city TEXT,
  ADD COLUMN IF NOT EXISTS address_state TEXT,
  ADD COLUMN IF NOT EXISTS address_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS address_country TEXT;

COMMENT ON COLUMN public.contacts.mobile IS 'Número móvil o WhatsApp del contacto';
COMMENT ON COLUMN public.contacts.tax_id IS 'Documento fiscal del contacto (RNC, cédula u otro)';
COMMENT ON COLUMN public.contacts.website IS 'Sitio web o enlace principal del contacto';
COMMENT ON COLUMN public.contacts.avatar_url IS 'URL a la foto o logo del contacto';
COMMENT ON COLUMN public.contacts.tags IS 'Etiquetas personalizadas para clasificar el contacto';
COMMENT ON COLUMN public.contacts.address_line1 IS 'Dirección línea 1 (calle, número)';
COMMENT ON COLUMN public.contacts.address_line2 IS 'Dirección línea 2 (departamento, referencia)';
COMMENT ON COLUMN public.contacts.address_city IS 'Ciudad del contacto';
COMMENT ON COLUMN public.contacts.address_state IS 'Estado/Provincia del contacto';
COMMENT ON COLUMN public.contacts.address_postal_code IS 'Código postal del contacto';
COMMENT ON COLUMN public.contacts.address_country IS 'País del contacto';

CREATE INDEX IF NOT EXISTS idx_contacts_tags ON public.contacts USING gin(tags);

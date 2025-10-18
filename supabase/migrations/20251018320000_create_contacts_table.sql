-- =====================================================
-- MIGRATION: Create Contacts Table (Multi-Tenant)
-- Description: Gestiona contactos reutilizables para módulos (entradas, ventas, compras)
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

-- Paso 1: Crear tabla de contactos multi-tenant
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  mobile TEXT,
  email TEXT,
  is_client BOOLEAN NOT NULL DEFAULT true,
  is_vendor BOOLEAN NOT NULL DEFAULT false,
  tax_id TEXT,
  website TEXT,
  avatar_url TEXT,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  address_line1 TEXT,
  address_line2 TEXT,
  address_city TEXT,
  address_state TEXT,
  address_postal_code TEXT,
  address_country TEXT,
  available_in_modules TEXT[] NOT NULL DEFAULT ARRAY['all'],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE public.contacts IS 'Contactos de una organización para reutilizar en entradas, ventas y compras';
COMMENT ON COLUMN public.contacts.org_id IS 'Organización propietaria del contacto (aislamiento multi-tenant)';
COMMENT ON COLUMN public.contacts.name IS 'Nombre completo o comercial del contacto';
COMMENT ON COLUMN public.contacts.phone IS 'Número telefónico del contacto';
COMMENT ON COLUMN public.contacts.mobile IS 'Número móvil o WhatsApp del contacto';
COMMENT ON COLUMN public.contacts.email IS 'Correo electrónico del contacto';
COMMENT ON COLUMN public.contacts.is_client IS 'Indica si el contacto es cliente';
COMMENT ON COLUMN public.contacts.is_vendor IS 'Indica si el contacto es proveedor';
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
COMMENT ON COLUMN public.contacts.available_in_modules IS 'Módulos donde puede utilizarse el contacto ("all" indica disponibilidad global)';
COMMENT ON COLUMN public.contacts.deleted_at IS 'Soft delete - si tiene valor, el contacto está archivado';

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_contacts_org_id ON public.contacts(org_id);
CREATE INDEX IF NOT EXISTS idx_contacts_org_name ON public.contacts(org_id, lower(name));
CREATE INDEX IF NOT EXISTS idx_contacts_available_modules ON public.contacts USING gin (available_in_modules);
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON public.contacts USING gin (tags);

-- Evitar duplicados por nombre/teléfono dentro de una misma organización
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_org_name_phone_unique
  ON public.contacts(org_id, lower(name), COALESCE(phone, ''));

-- Asegurar que contactos existentes sean globales por defecto
UPDATE public.contacts
SET available_in_modules = ARRAY['all']::TEXT[]
WHERE available_in_modules IS NULL
  OR NOT ('all' = ANY(available_in_modules));

-- Asegurar que las etiquetas nulas se conviertan en arreglo vacío
UPDATE public.contacts
SET tags = ARRAY[]::TEXT[]
WHERE tags IS NULL;

-- Trigger para mantener updated_at
DROP TRIGGER IF EXISTS set_contacts_updated_at ON public.contacts;
CREATE TRIGGER set_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger de seguridad para validar org_id
CREATE OR REPLACE FUNCTION public.prevent_contact_org_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.org_id <> NEW.org_id THEN
    RAISE EXCEPTION 'No se puede cambiar el org_id de un contacto existente';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = NEW.org_id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'La organización especificada no existe o está eliminada';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_contact_org_change_trigger ON public.contacts;
CREATE TRIGGER prevent_contact_org_change_trigger
  BEFORE INSERT OR UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_contact_org_change();

COMMENT ON FUNCTION public.prevent_contact_org_change IS 'Evita modificar org_id y valida organización existente para contactos';

-- Habilitar Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas previas por idempotencia
DROP POLICY IF EXISTS "Members can view contacts in their org" ON public.contacts;
DROP POLICY IF EXISTS "Managers can insert contacts in their org" ON public.contacts;
DROP POLICY IF EXISTS "Managers can update contacts in their org" ON public.contacts;
DROP POLICY IF EXISTS "Managers can delete contacts in their org" ON public.contacts;

-- Política SELECT: todos los miembros activos pueden ver contactos de su organización
CREATE POLICY "Members can view contacts in their org"
  ON public.contacts
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND public.user_has_org_access(org_id)
  );

-- Política INSERT: owners, admins y technicians pueden crear contactos
CREATE POLICY "Managers can insert contacts in their org"
  ON public.contacts
  FOR INSERT
  WITH CHECK (
    public.user_has_org_access(org_id)
    AND public.user_has_role(org_id, ARRAY['owner', 'admin', 'technician'])
  );

-- Política UPDATE: owners, admins y technicians pueden editar contactos
CREATE POLICY "Managers can update contacts in their org"
  ON public.contacts
  FOR UPDATE
  USING (
    deleted_at IS NULL
    AND public.user_has_role(org_id, ARRAY['owner', 'admin', 'technician'])
    AND public.user_has_org_access(org_id)
  )
  WITH CHECK (
    deleted_at IS NULL
    AND public.user_has_role(org_id, ARRAY['owner', 'admin', 'technician'])
    AND public.user_has_org_access(org_id)
  );

-- Política DELETE: solo owners y admins pueden eliminar contactos
CREATE POLICY "Managers can delete contacts in their org"
  ON public.contacts
  FOR DELETE
  USING (
    public.user_has_role(org_id, ARRAY['owner', 'admin'])
    AND public.user_has_org_access(org_id)
  );

-- Paso 2: Relacionar contactos con entradas existentes
ALTER TABLE public.entradas
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.entradas.contact_id IS 'Contacto asociado a la entrada (cliente) para reutilización en otros módulos';

CREATE INDEX IF NOT EXISTS idx_entradas_org_contact
  ON public.entradas(org_id, contact_id)
  WHERE contact_id IS NOT NULL;

-- Crear contactos a partir de entradas existentes
DO $$
DECLARE
  entrada_record RECORD;
BEGIN
  FOR entrada_record IN
    SELECT DISTINCT
      e.org_id,
      e.nombre_cliente,
      e.telefono
    FROM public.entradas e
    WHERE e.org_id IS NOT NULL
      AND e.nombre_cliente IS NOT NULL
      AND e.nombre_cliente <> ''
  LOOP
    INSERT INTO public.contacts (
      org_id,
      name,
      phone,
      mobile,
      email,
      is_client,
      is_vendor,
      tax_id,
      website,
      avatar_url,
      tags,
      address_line1,
      address_line2,
      address_city,
      address_state,
      address_postal_code,
      address_country,
      available_in_modules
    )
    SELECT
      entrada_record.org_id,
      entrada_record.nombre_cliente,
      entrada_record.telefono,
      NULL,
      NULL,
      true,
      false,
      NULL,
      NULL,
      NULL,
      ARRAY[]::TEXT[],
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      ARRAY['all']::TEXT[]
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.contacts c
      WHERE c.org_id = entrada_record.org_id
        AND lower(c.name) = lower(entrada_record.nombre_cliente)
        AND COALESCE(c.phone, '') = COALESCE(entrada_record.telefono, '')
    );
  END LOOP;

  UPDATE public.entradas e
  SET contact_id = c.id
  FROM public.contacts c
  WHERE c.org_id = e.org_id
    AND lower(c.name) = lower(e.nombre_cliente)
    AND COALESCE(c.phone, '') = COALESCE(e.telefono, '')
    AND e.contact_id IS NULL;
END $$;

DO $$
BEGIN
  RAISE NOTICE '✅ Migración completada: contactos creados y vinculados a entradas existentes';
END $$;

-- =====================================================
-- MIGRATION: Add created_by column to contacts table
-- Description: Adds created_by field to track who created the contact
-- Date: 2025-10-19
-- =====================================================

BEGIN;

-- Add created_by column to contacts table
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.contacts.created_by IS 'Usuario que creó el contacto';

-- Set created_by for existing contacts to NULL
-- (we don't have historical data for this)
UPDATE public.contacts
SET created_by = NULL
WHERE created_by IS NULL;

-- Create a trigger to automatically set created_by on insert
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_contact_created_by ON public.contacts;
CREATE TRIGGER set_contact_created_by
  BEFORE INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_created_by();

COMMENT ON FUNCTION public.set_created_by IS 'Automatically sets created_by to current user on insert';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: created_by column added to contacts table';
END $$;

COMMIT;

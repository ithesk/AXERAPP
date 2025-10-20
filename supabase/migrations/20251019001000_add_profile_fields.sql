-- =====================================================
-- Agregar campos faltantes a la tabla profiles
-- Description: Agrega columnas para el perfil de usuario
-- Date: 2025-10-19
-- =====================================================

BEGIN;

-- Agregar columnas si no existen
DO $$
BEGIN
  -- Agregar bio si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'bio'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN bio TEXT;
    RAISE NOTICE 'Columna bio agregada';
  END IF;

  -- Agregar phone si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone VARCHAR(50);
    RAISE NOTICE 'Columna phone agregada';
  END IF;

  -- Agregar role si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role VARCHAR(100);
    RAISE NOTICE 'Columna role agregada';
  END IF;

  -- Agregar location si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'location'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN location VARCHAR(255);
    RAISE NOTICE 'Columna location agregada';
  END IF;

  -- Agregar facebook_url si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'facebook_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN facebook_url TEXT;
    RAISE NOTICE 'Columna facebook_url agregada';
  END IF;

  -- Agregar twitter_url si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'twitter_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN twitter_url TEXT;
    RAISE NOTICE 'Columna twitter_url agregada';
  END IF;

  -- Agregar linkedin_url si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN linkedin_url TEXT;
    RAISE NOTICE 'Columna linkedin_url agregada';
  END IF;

  -- Agregar instagram_url si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'instagram_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN instagram_url TEXT;
    RAISE NOTICE 'Columna instagram_url agregada';
  END IF;
END $$;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Campos de perfil agregados correctamente';
END $$;

COMMIT;

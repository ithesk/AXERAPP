-- =====================================================
-- MIGRATION: Create Profiles Table (Already Applied)
-- Description: Esta migración ya fue aplicada previamente
-- Author: AXER Team
-- Date: 2025-10-17
-- =====================================================

-- NOTA: Esta migración ya está aplicada en la base de datos
-- Este archivo existe solo para mantener el tracking de migraciones
-- con la base de datos remota

DO $$
BEGIN
  RAISE NOTICE 'Migración 20251017222400 ya aplicada previamente';
  RAISE NOTICE 'La tabla profiles ya existe en la base de datos';
  RAISE NOTICE 'Continuando con las siguientes migraciones...';
END $$;

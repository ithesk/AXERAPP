-- =====================================================
-- MIGRATION: Alter Entradas - Add Device Intake Fields
-- Description: Campos extra para registrar información del dispositivo
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

ALTER TABLE public.entradas
  ADD COLUMN IF NOT EXISTS imei_sn TEXT,
  ADD COLUMN IF NOT EXISTS device_passwords TEXT,
  ADD COLUMN IF NOT EXISTS battery_condition TEXT,
  ADD COLUMN IF NOT EXISTS check_face_id BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS check_signal BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS check_wifi BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS check_screen BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS check_true_tone BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS check_touch BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS check_camera BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS check_microphone BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS check_speaker BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS check_charging BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS check_buttons BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS check_panic BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS check_screws BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS check_earpiece BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS check_no_sim BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS check_flash BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS check_front_camera BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.entradas.imei_sn IS 'Identificador IMEI o número de serie del dispositivo recibido';
COMMENT ON COLUMN public.entradas.device_passwords IS 'Contraseñas o códigos de acceso proporcionados por el cliente';
COMMENT ON COLUMN public.entradas.battery_condition IS 'Condición de la batería reportada (porcentaje u observaciones)';
COMMENT ON COLUMN public.entradas.check_face_id IS 'Resultado de prueba del Face ID al recibir el dispositivo';
COMMENT ON COLUMN public.entradas.check_signal IS 'Resultado de prueba de señal al recibir el dispositivo';
COMMENT ON COLUMN public.entradas.check_wifi IS 'Resultado de prueba de conectividad WiFi';
COMMENT ON COLUMN public.entradas.check_screen IS 'Resultado de prueba de pantalla';
COMMENT ON COLUMN public.entradas.check_true_tone IS 'Resultado de prueba de True Tone';
COMMENT ON COLUMN public.entradas.check_touch IS 'Resultado de prueba de funcionalidad táctil';
COMMENT ON COLUMN public.entradas.check_camera IS 'Resultado de prueba de la cámara principal';
COMMENT ON COLUMN public.entradas.check_microphone IS 'Resultado de prueba de micrófono';
COMMENT ON COLUMN public.entradas.check_speaker IS 'Resultado de prueba de bocina';
COMMENT ON COLUMN public.entradas.check_charging IS 'Resultado de prueba de carga';
COMMENT ON COLUMN public.entradas.check_buttons IS 'Resultado de prueba de botones físicos';
COMMENT ON COLUMN public.entradas.check_panic IS 'Resultado de prueba del botón de pánico o SOS';
COMMENT ON COLUMN public.entradas.check_screws IS 'Estado de los tornillos del dispositivo al recibirlo';
COMMENT ON COLUMN public.entradas.check_earpiece IS 'Resultado de prueba del auricular/altavoz superior';
COMMENT ON COLUMN public.entradas.check_no_sim IS 'Indica si la recepción se realizó sin tarjeta SIM';
COMMENT ON COLUMN public.entradas.check_flash IS 'Resultado de prueba del flash';
COMMENT ON COLUMN public.entradas.check_front_camera IS 'Resultado de prueba de la cámara frontal';

DO $$
BEGIN
  RAISE NOTICE 'Migración completada: nuevos campos de intake agregados a entradas';
END $$;

-- =====================================================
-- Habilitar Realtime para Notificaciones
-- Description: Activa las suscripciones en tiempo real
--              para la tabla notifications
-- Date: 2025-10-19
-- =====================================================

BEGIN;

-- Habilitar realtime para la tabla notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Realtime habilitado para tabla notifications';
  RAISE NOTICE '   Los cambios ahora se transmitirán en tiempo real';
END $$;

COMMIT;

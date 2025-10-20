-- =====================================================
-- RE-ENABLE NOTIFICATION TRIGGERS
-- Description: Vuelve a habilitar los triggers de notificaciones
--              después de los cambios de depuración.
-- Date: 2025-10-18
-- =====================================================

BEGIN;

ALTER TABLE public.entradas ENABLE TRIGGER entrada_status_change_notification;
ALTER TABLE public.entradas ENABLE TRIGGER new_entrada_notification;
ALTER TABLE public.entradas ENABLE TRIGGER technician_change_notification;

DO $$
BEGIN
  RAISE NOTICE '✅ Notification triggers re-enabled';
END $$;

COMMIT;

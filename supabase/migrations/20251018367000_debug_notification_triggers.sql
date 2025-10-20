-- =====================================================
-- DEBUG NOTIFICATION TRIGGERS
-- Description: Temporarily disable triggers to identify the issue
-- Date: 2025-10-18
-- =====================================================

BEGIN;

-- Disable all notification triggers temporarily
ALTER TABLE public.entradas DISABLE TRIGGER entrada_status_change_notification;
ALTER TABLE public.entradas DISABLE TRIGGER new_entrada_notification;
ALTER TABLE public.entradas DISABLE TRIGGER technician_change_notification;

DO $$
BEGIN
  RAISE NOTICE '⚠️  NOTIFICATION TRIGGERS DISABLED FOR DEBUGGING';
  RAISE NOTICE 'Try updating an entrada now to confirm triggers are the issue';
  RAISE NOTICE 'If update works, the problem is in the triggers';
  RAISE NOTICE 'If update still fails, the problem is elsewhere';
END $$;

COMMIT;

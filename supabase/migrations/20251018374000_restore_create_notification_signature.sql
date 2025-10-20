-- =====================================================
-- FIX: Restore create_notification signature
-- Description: Restaura la firma de la función create_notification() a la
--              definida inicialmente en la migración de creación de tabla.
-- Date: 2025-10-18
-- =====================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.create_notification(
  p_org_id UUID,
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL,
  p_actor_name TEXT DEFAULT NULL,
  p_actor_avatar TEXT DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    org_id,
    user_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    actor_id,
    actor_name,
    actor_avatar,
    action_url,
    metadata
  ) VALUES (
    p_org_id,
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_entity_type,
    p_entity_id,
    p_actor_id,
    p_actor_name,
    p_actor_avatar,
    p_action_url,
    p_metadata
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DO $$
BEGIN
  RAISE NOTICE '✅ create_notification signature restored';
END $$;

COMMIT;

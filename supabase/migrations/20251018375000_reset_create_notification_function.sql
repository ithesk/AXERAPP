-- =====================================================
-- FIX: Reset create_notification function signature
-- Description: Elimina versiones previas de la función
--              create_notification y la recrea con la firma correcta
--              y defaults compatibles con llamadas con parámetros
--              nombrados.
-- Date: 2025-10-18
-- =====================================================

BEGIN;

-- Eliminar versiones previas con firmas distintas
DROP FUNCTION IF EXISTS public.create_notification(
  UUID, UUID, TEXT, TEXT, TEXT,
  TEXT, TEXT, UUID, TEXT, TEXT, TEXT, JSONB
);

DROP FUNCTION IF EXISTS public.create_notification(
  UUID, UUID, TEXT, TEXT, TEXT,
  TEXT, TEXT, UUID, TEXT, TEXT, TEXT, JSONB, BOOLEAN
);

DROP FUNCTION IF EXISTS public.create_notification(
  UUID, UUID, TEXT, TEXT, TEXT,
  TEXT, TEXT, UUID, TEXT, TEXT, TEXT
);

-- Volver a crear la función con la firma esperada
CREATE FUNCTION public.create_notification(
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
  p_metadata JSONB DEFAULT '{}'::jsonb
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
  RAISE NOTICE '✅ create_notification reset with expected signature';
END $$;

COMMIT;

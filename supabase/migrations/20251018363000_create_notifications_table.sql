-- =====================================================
-- CREATE TABLE: notifications
-- Description: System for user notifications
-- Date: 2025-10-18
-- =====================================================

BEGIN;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Notification content
  type TEXT NOT NULL, -- 'entrada_status_change', 'new_sale', 'new_contact', 'team_activity', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Related entity
  entity_type TEXT, -- 'entrada', 'venta', 'contacto', etc.
  entity_id TEXT,

  -- Actor (quien generó la notificación)
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT,
  actor_avatar TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Status
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Link to navigate
  action_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON public.notifications(org_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Add comments
COMMENT ON TABLE public.notifications IS 'Sistema de notificaciones para usuarios';
COMMENT ON COLUMN public.notifications.type IS 'Tipo de notificación';
COMMENT ON COLUMN public.notifications.entity_type IS 'Tipo de entidad relacionada';
COMMENT ON COLUMN public.notifications.entity_id IS 'ID de la entidad relacionada';
COMMENT ON COLUMN public.notifications.actor_id IS 'Usuario que generó la notificación';
COMMENT ON COLUMN public.notifications.metadata IS 'Datos adicionales en formato JSON';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notifications_updated_at();

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- SELECT: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND public.user_has_org_access(org_id)
  );

-- INSERT: System can create notifications (done via functions/triggers)
CREATE POLICY "System can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (
    public.user_has_org_access(org_id)
  );

-- UPDATE: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND public.user_has_org_access(org_id)
  )
  WITH CHECK (
    auth.uid() = user_id
    AND public.user_has_org_access(org_id)
  );

-- DELETE: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications
  FOR DELETE
  USING (
    auth.uid() = user_id
    AND public.user_has_org_access(org_id)
  );

-- Helper function to create notifications
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify table creation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'notifications'
  ) THEN
    RAISE NOTICE '✅ SUCCESS: Table notifications created successfully';
    RAISE NOTICE '';
    RAISE NOTICE 'Table details:';
    RAISE NOTICE '  - Multi-tenant (org_id)';
    RAISE NOTICE '  - RLS enabled';
    RAISE NOTICE '  - 4 policies created';
    RAISE NOTICE '  - Helper function create_notification() available';
    RAISE NOTICE '';
  ELSE
    RAISE EXCEPTION '❌ ERROR: Table notifications was not created';
  END IF;
END $$;

COMMIT;

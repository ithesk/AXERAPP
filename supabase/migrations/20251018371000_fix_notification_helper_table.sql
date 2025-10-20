-- =====================================================
-- FIX: Notification helper uses correct membership table
-- Description: Actualiza la función get_org_admins_and_owners para
--              consultar public.org_members (nombre real de la tabla).
-- Date: 2025-10-18
-- =====================================================

BEGIN;

CREATE OR REPLACE FUNCTION get_org_admins_and_owners(p_org_id UUID)
RETURNS TABLE(user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT om.user_id
  FROM public.org_members om
  WHERE om.org_id = p_org_id
    AND om.role IN ('owner', 'admin')
    AND om.status = 'active';
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ get_org_admins_and_owners now queries public.org_members';
END $$;

COMMIT;

-- =====================================================
-- MIGRATION: Restore Multi-Tenant Security Baseline
-- Description: Vuelve a habilitar RLS estricta y helpers después de debug
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

-- Función genérica updated_at (idempotente)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.handle_updated_at
IS 'Actualiza la columna updated_at con la hora UTC actual';

-- Eliminar artefactos de debug
DROP TRIGGER IF EXISTS log_org_members_trigger ON public.org_members;
DROP FUNCTION IF EXISTS public.log_org_members_changes();
DROP FUNCTION IF EXISTS public.log_debug(TEXT, TEXT, JSONB);
DROP TABLE IF EXISTS public.debug_log;

-- Asegurar columnas y constraints en org_members
ALTER TABLE public.org_members
  ADD COLUMN IF NOT EXISTS left_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.org_members
  ALTER COLUMN role SET DEFAULT 'viewer';

ALTER TABLE public.org_members
  DROP CONSTRAINT IF EXISTS org_members_role_check;

ALTER TABLE public.org_members
  ADD CONSTRAINT org_members_role_check
  CHECK (role IN ('owner', 'admin', 'technician', 'viewer'));

ALTER TABLE public.org_members
  DROP CONSTRAINT IF EXISTS org_members_status_check;

ALTER TABLE public.org_members
  ADD CONSTRAINT org_members_status_check
  CHECK (status IN ('active', 'invited', 'suspended', 'removed'));

-- Restaurar funciones helper críticas (idempotentes)
CREATE OR REPLACE FUNCTION public.user_has_org_access(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_members
    WHERE user_id = auth.uid()
      AND org_id = p_org_id
      AND status = 'active'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.user_has_org_access(UUID)
IS 'Verifica si el usuario autenticado pertenece a la organización especificada';

CREATE OR REPLACE FUNCTION public.user_has_role(p_org_id UUID, p_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_members
    WHERE user_id = auth.uid()
      AND org_id = p_org_id
      AND role = ANY(p_roles)
      AND status = 'active'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.user_has_role(UUID, TEXT[])
IS 'Verifica si el usuario autenticado tiene alguno de los roles proporcionados en la organización';

CREATE OR REPLACE FUNCTION public.org_has_members(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_members
    WHERE org_id = p_org_id
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.org_has_members(UUID)
IS 'Indica si existe al menos una membresía para la organización dada';

CREATE OR REPLACE FUNCTION public.is_org_owner_or_admin(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_members
    WHERE org_id = p_org_id
      AND user_id = p_user_id
      AND role IN ('owner', 'admin')
      AND status = 'active'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_org_owner_or_admin(UUID, UUID)
IS 'Verifica si un usuario es owner o admin de una organización (helper para RLS)';

-- Restaurar función de control de límites (necesaria para políticas INSERT)
CREATE OR REPLACE FUNCTION public.can_create_entrada(p_org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_count INTEGER;
  v_max_count INTEGER;
BEGIN
  SELECT max_entradas_per_month INTO v_max_count
  FROM public.organizations
  WHERE id = p_org_id;

  IF v_max_count IS NULL THEN
    RETURN true;
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO v_current_count
  FROM public.entradas
  WHERE org_id = p_org_id
    AND DATE_TRUNC('month', fecha_entrada) = DATE_TRUNC('month', CURRENT_DATE);

  RETURN v_current_count < v_max_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.can_create_entrada(UUID)
IS 'Determina si la organización puede crear otra entrada según los límites de su plan';

-- Rehabilitar RLS en org_members y limpiar políticas antiguas
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol_name TEXT;
  policies TEXT[] := ARRAY[
    'members_select_policy',
    'members_insert_policy',
    'members_update_policy',
    'members_delete_policy',
    'select_own_memberships',
    'insert_own_membership',
    'update_memberships',
    'delete_memberships',
    'Users can view members of their orgs',
    'Admins can invite members',
    'Admins can update members',
    'Admins can remove members',
    'Users can view own memberships',
    'Insert org members',
    'Update org members',
    'Delete org members',
    'Can create org members'
  ];
BEGIN
  FOREACH pol_name IN ARRAY policies LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.org_members', pol_name);
  END LOOP;
END $$;

-- Políticas definitivas para org_members
CREATE POLICY "Members can view org members"
  ON public.org_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.user_has_org_access(org_id)
  );

CREATE POLICY "Can insert org members"
  ON public.org_members
  FOR INSERT
  WITH CHECK (
    (
      role = 'owner'
      AND user_id = auth.uid()
      AND NOT public.org_has_members(org_id)
    )
    OR public.user_has_role(org_id, ARRAY['owner', 'admin'])
  );

CREATE POLICY "Can update org members"
  ON public.org_members
  FOR UPDATE
  USING (
    public.user_has_role(org_id, ARRAY['owner', 'admin'])
  )
  WITH CHECK (
    public.user_has_role(org_id, ARRAY['owner', 'admin'])
  );

CREATE POLICY "Can remove org members"
  ON public.org_members
  FOR DELETE
  USING (
    role != 'owner'
    AND public.user_has_role(org_id, ARRAY['owner', 'admin'])
  );

-- Actualizar políticas de organizations para incluir miembros activos
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Owners and admins can update organization" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Owners can delete their organization" ON public.organizations;

CREATE POLICY "Users can view their organizations"
  ON public.organizations
  FOR SELECT
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.org_members m
      WHERE m.org_id = organizations.id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

CREATE POLICY "Owners and admins can update organization"
  ON public.organizations
  FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR public.user_has_role(id, ARRAY['owner', 'admin'])
  );

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their organization"
  ON public.organizations
  FOR DELETE
  USING (owner_id = auth.uid());

-- RLS estricta para entradas
ALTER TABLE public.entradas ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol_name TEXT;
  policies TEXT[] := ARRAY[
    'entradas_select_simple',
    'entradas_insert_simple',
    'entradas_update_simple',
    'entradas_delete_simple',
    'Users can view entradas in their orgs',
    'Technicians can create entradas in their org',
    'Technicians can update entradas in their org',
    'Admins can delete entradas in their org'
  ];
BEGIN
  FOREACH pol_name IN ARRAY policies LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.entradas', pol_name);
  END LOOP;
END $$;

CREATE POLICY "Users can view entradas in their orgs"
  ON public.entradas
  FOR SELECT
  USING (
    public.user_has_org_access(org_id)
  );

CREATE POLICY "Technicians can create entradas in their org"
  ON public.entradas
  FOR INSERT
  WITH CHECK (
    public.user_has_org_access(org_id)
    AND public.user_has_role(org_id, ARRAY['owner', 'admin', 'technician'])
    AND public.can_create_entrada(org_id)
  );

CREATE POLICY "Technicians can update entradas in their org"
  ON public.entradas
  FOR UPDATE
  USING (
    public.user_has_org_access(org_id)
    AND public.user_has_role(org_id, ARRAY['owner', 'admin', 'technician'])
  )
  WITH CHECK (
    org_id = (SELECT org_id FROM public.entradas WHERE id = entradas.id)
    AND public.user_has_org_access(org_id)
    AND public.user_has_role(org_id, ARRAY['owner', 'admin', 'technician'])
  );

CREATE POLICY "Admins can delete entradas in their org"
  ON public.entradas
  FOR DELETE
  USING (
    public.user_has_org_access(org_id)
    AND public.user_has_role(org_id, ARRAY['owner', 'admin'])
  );

-- Trigger preventivo para cambios de org_id
CREATE OR REPLACE FUNCTION public.prevent_org_id_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.org_id <> NEW.org_id THEN
    RAISE EXCEPTION 'No se puede cambiar el org_id de una entrada existente';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = NEW.org_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'La organización especificada no existe o está eliminada';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_org_id_change_trigger ON public.entradas;

CREATE TRIGGER prevent_org_id_change_trigger
  BEFORE INSERT OR UPDATE ON public.entradas
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_org_id_change();

DO $$
BEGIN
  RAISE NOTICE '✅ Seguridad multi-tenant restaurada correctamente';
END $$;

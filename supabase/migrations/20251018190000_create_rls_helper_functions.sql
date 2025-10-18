-- =====================================================
-- MIGRATION: RLS Helper Functions
-- Description: Funciones auxiliares para políticas de Row Level Security
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

-- Función para obtener el org_id actual del usuario
-- Esta función es clave para las políticas RLS
CREATE OR REPLACE FUNCTION public.user_org_id()
RETURNS UUID AS $$
  SELECT current_org_id
  FROM public.profiles
  WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.user_org_id IS 'Retorna el ID de la organización actual del usuario autenticado';

-- Función para verificar si el usuario pertenece a una organización
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

COMMENT ON FUNCTION public.user_has_org_access IS 'Verifica si el usuario tiene acceso a una organización específica';

-- Función para verificar si el usuario tiene un rol específico en una organización
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

COMMENT ON FUNCTION public.user_has_role IS 'Verifica si el usuario tiene uno de los roles especificados en una organización';

-- Función para obtener el rol del usuario en una organización
CREATE OR REPLACE FUNCTION public.user_role_in_org(p_org_id UUID)
RETURNS TEXT AS $$
  SELECT role
  FROM public.org_members
  WHERE user_id = auth.uid()
    AND org_id = p_org_id
    AND status = 'active'
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.user_role_in_org IS 'Retorna el rol del usuario en una organización específica';

-- Función para verificar si el usuario es owner de una organización
CREATE OR REPLACE FUNCTION public.user_is_org_owner(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = p_org_id
      AND owner_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.user_is_org_owner IS 'Verifica si el usuario es el owner (dueño) de una organización';

-- Función para verificar si el usuario puede gestionar miembros
CREATE OR REPLACE FUNCTION public.user_can_manage_members(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT public.user_has_role(p_org_id, ARRAY['owner', 'admin']);
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.user_can_manage_members IS 'Verifica si el usuario puede gestionar miembros de la organización';

-- Función para verificar si el usuario puede modificar configuraciones
CREATE OR REPLACE FUNCTION public.user_can_manage_settings(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT public.user_has_role(p_org_id, ARRAY['owner', 'admin']);
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.user_can_manage_settings IS 'Verifica si el usuario puede modificar configuraciones de la organización';

-- Función para obtener todas las organizaciones del usuario
CREATE OR REPLACE FUNCTION public.user_organizations()
RETURNS TABLE (org_id UUID) AS $$
  SELECT org_id
  FROM public.org_members
  WHERE user_id = auth.uid()
    AND status = 'active';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.user_organizations IS 'Retorna todas las organizaciones a las que pertenece el usuario';

-- Función para verificar si una organización ya tiene miembros
CREATE OR REPLACE FUNCTION public.org_has_members(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_members
    WHERE org_id = p_org_id
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.org_has_members IS 'Indica si existen miembros para una organización determinada';

-- Función para validar si un usuario es owner o admin de una organización
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

COMMENT ON FUNCTION public.is_org_owner_or_admin IS 'Verifica si un usuario es owner o admin de una organización específica';

-- Función para verificar límites del plan
CREATE OR REPLACE FUNCTION public.check_org_limit(
  p_org_id UUID,
  p_limit_type TEXT, -- 'users', 'entradas_monthly', 'storage'
  p_current_value INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_max_value INTEGER;
BEGIN
  -- Obtener el límite según el tipo
  CASE p_limit_type
    WHEN 'users' THEN
      SELECT max_users INTO v_max_value
      FROM public.organizations
      WHERE id = p_org_id;

    WHEN 'entradas_monthly' THEN
      SELECT max_entradas_per_month INTO v_max_value
      FROM public.organizations
      WHERE id = p_org_id;

    ELSE
      RETURN true; -- Límite desconocido, permitir por defecto
  END CASE;

  -- NULL significa ilimitado (plan enterprise)
  IF v_max_value IS NULL THEN
    RETURN true;
  END IF;

  -- Verificar si el valor actual está dentro del límite
  RETURN p_current_value < v_max_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.check_org_limit IS 'Verifica si una organización está dentro de los límites de su plan';

-- Función para verificar si un módulo está habilitado
CREATE OR REPLACE FUNCTION public.org_has_module(
  p_org_id UUID,
  p_module TEXT
)
RETURNS BOOLEAN AS $$
  SELECT p_module = ANY(modules_enabled)
  FROM public.organizations
  WHERE id = p_org_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.org_has_module IS 'Verifica si un módulo está habilitado para una organización';

-- Función para obtener el número de usuarios activos en una organización
CREATE OR REPLACE FUNCTION public.org_active_users_count(p_org_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.org_members
  WHERE org_id = p_org_id
    AND status = 'active';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.org_active_users_count IS 'Retorna el número de usuarios activos en una organización';

-- Función para obtener el número de entradas del mes actual
CREATE OR REPLACE FUNCTION public.org_monthly_entradas_count(p_org_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.entradas
  WHERE org_id = p_org_id
    AND DATE_TRUNC('month', fecha_entrada) = DATE_TRUNC('month', CURRENT_DATE);
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.org_monthly_entradas_count IS 'Retorna el número de entradas creadas este mes en una organización';

-- Función para verificar si se puede crear una nueva entrada (respetando límites)
CREATE OR REPLACE FUNCTION public.can_create_entrada(p_org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_count INTEGER;
  v_max_count INTEGER;
BEGIN
  -- Obtener límite del plan
  SELECT max_entradas_per_month INTO v_max_count
  FROM public.organizations
  WHERE id = p_org_id;

  -- NULL significa ilimitado
  IF v_max_count IS NULL THEN
    RETURN true;
  END IF;

  -- Contar entradas del mes
  v_current_count := public.org_monthly_entradas_count(p_org_id);

  -- Verificar si está dentro del límite
  RETURN v_current_count < v_max_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.can_create_entrada IS 'Verifica si la organización puede crear una nueva entrada según los límites de su plan';

-- Función para verificar si se puede agregar un nuevo usuario
CREATE OR REPLACE FUNCTION public.can_add_user(p_org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_count INTEGER;
  v_max_count INTEGER;
BEGIN
  -- Obtener límite del plan
  SELECT max_users INTO v_max_count
  FROM public.organizations
  WHERE id = p_org_id;

  -- NULL significa ilimitado
  IF v_max_count IS NULL THEN
    RETURN true;
  END IF;

  -- Contar usuarios activos
  v_current_count := public.org_active_users_count(p_org_id);

  -- Verificar si está dentro del límite
  RETURN v_current_count < v_max_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.can_add_user IS 'Verifica si la organización puede agregar un nuevo usuario según los límites de su plan';

-- Vista de utilidad: información de límites y uso por organización
CREATE OR REPLACE VIEW public.org_usage_stats AS
SELECT
  o.id as org_id,
  o.name as org_name,
  o.subscription_plan,
  o.subscription_status,

  -- Usuarios
  public.org_active_users_count(o.id) as current_users,
  o.max_users,
  CASE
    WHEN o.max_users IS NULL THEN 'unlimited'
    WHEN public.org_active_users_count(o.id) >= o.max_users THEN 'limit_reached'
    WHEN public.org_active_users_count(o.id)::FLOAT / o.max_users > 0.8 THEN 'warning'
    ELSE 'ok'
  END as users_status,

  -- Entradas mensuales
  public.org_monthly_entradas_count(o.id) as current_monthly_entradas,
  o.max_entradas_per_month,
  CASE
    WHEN o.max_entradas_per_month IS NULL THEN 'unlimited'
    WHEN public.org_monthly_entradas_count(o.id) >= o.max_entradas_per_month THEN 'limit_reached'
    WHEN public.org_monthly_entradas_count(o.id)::FLOAT / o.max_entradas_per_month > 0.8 THEN 'warning'
    ELSE 'ok'
  END as entradas_status

FROM public.organizations o
WHERE o.deleted_at IS NULL;

COMMENT ON VIEW public.org_usage_stats IS 'Vista de estadísticas de uso y límites por organización';

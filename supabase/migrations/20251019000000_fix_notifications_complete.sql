-- =====================================================
-- COMPLETE FIX: Sistema de Notificaciones
-- Description: Asegura que todas las funciones helper y
--              triggers de notificaciones existan correctamente
-- Date: 2025-10-19
-- =====================================================

BEGIN;

-- =====================================================
-- PASO 1: Crear función helper para obtener admins/owners
-- =====================================================
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PASO 2: Crear función helper para encontrar user_id del técnico
-- =====================================================
CREATE OR REPLACE FUNCTION public.find_org_member_user_id(
  p_org_id UUID,
  p_identifier TEXT
) RETURNS UUID AS $$
DECLARE
  v_clean_identifier TEXT := NULLIF(TRIM(p_identifier), '');
  v_user_id UUID;
BEGIN
  IF v_clean_identifier IS NULL THEN
    RETURN NULL;
  END IF;

  -- Buscar por nombre completo (first_name + last_name)
  SELECT om.user_id INTO v_user_id
  FROM public.org_members om
  JOIN public.profiles p ON p.id = om.user_id
  WHERE om.org_id = p_org_id
    AND om.status = 'active'
    AND TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')) = v_clean_identifier
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    RETURN v_user_id;
  END IF;

  -- Buscar por email
  SELECT om.user_id INTO v_user_id
  FROM public.org_members om
  JOIN public.profiles p ON p.id = om.user_id
  WHERE om.org_id = p_org_id
    AND om.status = 'active'
    AND p.email = v_clean_identifier
  LIMIT 1;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PASO 3: Eliminar triggers existentes si existen
-- =====================================================
DROP TRIGGER IF EXISTS trg_notify_entrada_status_change ON public.entradas;
DROP TRIGGER IF EXISTS trg_notify_new_entrada ON public.entradas;
DROP TRIGGER IF EXISTS trg_notify_technician_change ON public.entradas;

-- Solo eliminar el trigger de bitacora si la tabla existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bitacora') THEN
    DROP TRIGGER IF EXISTS trg_notify_bitacora_comment ON public.bitacora;
  END IF;
END $$;

-- =====================================================
-- PASO 4: TRIGGER 1 - Cambio de estado de entrada
-- =====================================================
CREATE OR REPLACE FUNCTION notify_entrada_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_name TEXT;
  v_technician_id UUID;
BEGIN
  -- Solo si el estado cambió
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    -- Obtener nombre del actor
    IF NEW.usuario_id IS NOT NULL THEN
      SELECT COALESCE(first_name || ' ' || last_name, email)
      INTO v_actor_name
      FROM public.profiles
      WHERE id = NEW.usuario_id;
    END IF;

    -- Notificar al técnico asignado
    v_technician_id := public.find_org_member_user_id(NEW.org_id, NEW.tecnico_asignado);

    IF v_technician_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        org_id, user_id, type, title, message,
        entity_type, entity_id, actor_id, actor_name,
        action_url, metadata
      ) VALUES (
        NEW.org_id,
        v_technician_id,
        'entrada_status_change',
        'Estado de entrada actualizado',
        format('La entrada #%s cambió de "%s" a "%s"', NEW.id_reparacion, OLD.estado, NEW.estado),
        'entrada',
        NEW.id,
        NEW.usuario_id,
        v_actor_name,
        '/entradas',
        jsonb_build_object(
          'old_status', OLD.estado,
          'new_status', NEW.estado,
          'entrada_id', NEW.id_reparacion,
          'cliente', NEW.nombre_cliente
        )
      );
    END IF;

    -- Notificar a admins y owners
    INSERT INTO public.notifications (
      org_id, user_id, type, title, message,
      entity_type, entity_id, actor_id, actor_name,
      action_url, metadata
    )
    SELECT
      NEW.org_id,
      admin_user.user_id,
      'entrada_status_change',
      format('Entrada %s - %s', NEW.id_reparacion, NEW.estado),
      format('La entrada #%s de %s está %s',
        NEW.id_reparacion, NEW.nombre_cliente, NEW.estado),
      'entrada',
      NEW.id,
      NEW.usuario_id,
      v_actor_name,
      '/entradas',
      jsonb_build_object(
        'old_status', OLD.estado,
        'new_status', NEW.estado,
        'entrada_id', NEW.id_reparacion,
        'cliente', NEW.nombre_cliente
      )
    FROM get_org_admins_and_owners(NEW.org_id) admin_user
    WHERE admin_user.user_id != COALESCE(v_technician_id, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PASO 5: TRIGGER 2 - Nueva entrada
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_entrada()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_name TEXT;
  v_technician_id UUID;
BEGIN
  -- Obtener nombre del actor
  IF NEW.usuario_id IS NOT NULL THEN
    SELECT COALESCE(first_name || ' ' || last_name, email)
    INTO v_actor_name
    FROM public.profiles
    WHERE id = NEW.usuario_id;
  END IF;

  -- Notificar al técnico asignado
  v_technician_id := public.find_org_member_user_id(NEW.org_id, NEW.tecnico_asignado);

  IF v_technician_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      org_id, user_id, type, title, message,
      entity_type, entity_id, actor_id, actor_name,
      action_url, metadata
    ) VALUES (
      NEW.org_id,
      v_technician_id,
      'assignment',
      'Nueva entrada asignada',
      format('Te han asignado la entrada #%s de %s', NEW.id_reparacion, NEW.nombre_cliente),
      'entrada',
      NEW.id,
      NEW.usuario_id,
      v_actor_name,
      '/entradas',
      jsonb_build_object(
        'entrada_id', NEW.id_reparacion,
        'cliente', NEW.nombre_cliente,
        'problema', NEW.problema,
        'estado', NEW.estado
      )
    );
  END IF;

  -- Notificar a admins y owners
  INSERT INTO public.notifications (
    org_id, user_id, type, title, message,
    entity_type, entity_id, actor_id, actor_name,
    action_url, metadata
  )
  SELECT
    NEW.org_id,
    admin_user.user_id,
    'team_activity',
    'Nueva entrada registrada',
    format('Se registró la entrada #%s de %s',
      NEW.id_reparacion, NEW.nombre_cliente),
    'entrada',
    NEW.id,
    NEW.usuario_id,
    v_actor_name,
    '/entradas',
    jsonb_build_object(
      'entrada_id', NEW.id_reparacion,
      'cliente', NEW.nombre_cliente,
      'problema', NEW.problema
    )
  FROM get_org_admins_and_owners(NEW.org_id) admin_user
  WHERE admin_user.user_id != COALESCE(v_technician_id, '00000000-0000-0000-0000-000000000000'::uuid);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PASO 6: TRIGGER 3 - Cambio de técnico asignado
-- =====================================================
CREATE OR REPLACE FUNCTION notify_technician_change()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_name TEXT;
  v_old_technician_id UUID;
  v_new_technician_id UUID;
BEGIN
  IF OLD.tecnico_asignado IS DISTINCT FROM NEW.tecnico_asignado THEN
    -- Obtener nombre del actor
    IF NEW.usuario_id IS NOT NULL THEN
      SELECT COALESCE(first_name || ' ' || last_name, email)
      INTO v_actor_name
      FROM public.profiles
      WHERE id = NEW.usuario_id;
    END IF;

    v_old_technician_id := public.find_org_member_user_id(NEW.org_id, OLD.tecnico_asignado);
    v_new_technician_id := public.find_org_member_user_id(NEW.org_id, NEW.tecnico_asignado);

    -- Notificar al técnico anterior
    IF v_old_technician_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        org_id, user_id, type, title, message,
        entity_type, entity_id, actor_id, actor_name,
        action_url, metadata
      ) VALUES (
        NEW.org_id,
        v_old_technician_id,
        'technician_change',
        format('Has sido reasignado de la entrada #%s', NEW.id_reparacion),
        format('La entrada de %s fue reasignada a otro técnico', NEW.nombre_cliente),
        'entrada',
        NEW.id,
        NEW.usuario_id,
        v_actor_name,
        '/entradas',
        jsonb_build_object(
          'entrada_id', NEW.id_reparacion,
          'cliente', NEW.nombre_cliente,
          'nuevo_tecnico', NEW.tecnico_asignado
        )
      );
    END IF;

    -- Notificar al nuevo técnico
    IF v_new_technician_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        org_id, user_id, type, title, message,
        entity_type, entity_id, actor_id, actor_name,
        action_url, metadata
      ) VALUES (
        NEW.org_id,
        v_new_technician_id,
        'technician_change',
        format('Nueva entrada asignada #%s', NEW.id_reparacion),
        format('Te asignaron la entrada de %s', NEW.nombre_cliente),
        'entrada',
        NEW.id,
        NEW.usuario_id,
        v_actor_name,
        '/entradas',
        jsonb_build_object(
          'entrada_id', NEW.id_reparacion,
          'cliente', NEW.nombre_cliente,
          'tecnico_anterior', OLD.tecnico_asignado
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PASO 7: Crear los triggers
-- =====================================================
CREATE TRIGGER trg_notify_entrada_status_change
  AFTER UPDATE ON public.entradas
  FOR EACH ROW
  EXECUTE FUNCTION notify_entrada_status_change();

CREATE TRIGGER trg_notify_new_entrada
  AFTER INSERT ON public.entradas
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_entrada();

CREATE TRIGGER trg_notify_technician_change
  AFTER UPDATE ON public.entradas
  FOR EACH ROW
  EXECUTE FUNCTION notify_technician_change();

-- =====================================================
-- PASO 8: Verificación
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de notificaciones configurado correctamente:';
  RAISE NOTICE '   - get_org_admins_and_owners() creada';
  RAISE NOTICE '   - find_org_member_user_id() creada';
  RAISE NOTICE '   - notify_entrada_status_change() creada';
  RAISE NOTICE '   - notify_new_entrada() creada';
  RAISE NOTICE '   - notify_technician_change() creada';
  RAISE NOTICE '   - Triggers activados en tabla entradas';
END $$;

COMMIT;

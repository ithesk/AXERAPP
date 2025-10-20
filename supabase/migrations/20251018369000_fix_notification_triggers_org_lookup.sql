-- =====================================================
-- FIX: Update notification triggers to avoid invalid org_id references
-- Description: Ajusta los triggers de notificaciones para usar org_members
--              en lugar de una columna inexistente p.org_id en profiles.
-- Date: 2025-10-18
-- =====================================================

BEGIN;

-- =====================================================
-- TRIGGER 1: Notificar cambio de estado en entradas
-- =====================================================
CREATE OR REPLACE FUNCTION notify_entrada_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_name TEXT;
  v_technician_id UUID;
BEGIN
  -- Solo notificar si el estado cambió
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN

    -- Obtener nombre del actor (si existe)
    IF NEW.usuario_id IS NOT NULL THEN
      SELECT COALESCE(first_name || ' ' || last_name, email)
      INTO v_actor_name
      FROM public.profiles
      WHERE id = NEW.usuario_id;
    END IF;

    -- Obtener ID del técnico asignado que pertenece a la organización
    SELECT p.id INTO v_technician_id
    FROM public.profiles p
    JOIN public.org_members om ON om.user_id = p.id
    WHERE LOWER(p.email) = LOWER(NEW.tecnico_asignado)
      AND om.org_id = NEW.org_id
      AND om.status = 'active'
    LIMIT 1;

    -- Notificar al técnico asignado (si existe y no es el que hizo el cambio)
    IF v_technician_id IS NOT NULL AND v_technician_id != NEW.usuario_id THEN
      PERFORM public.create_notification(
        p_org_id := NEW.org_id,
        p_user_id := v_technician_id,
        p_type := 'entrada_status_change',
        p_title := 'Estado de entrada actualizado',
        p_message := format('La entrada #%s cambió de "%s" a "%s"',
          NEW.id_reparacion, OLD.estado, NEW.estado),
        p_entity_type := 'entrada',
        p_entity_id := NEW.id,
        p_actor_id := NEW.usuario_id,
        p_actor_name := v_actor_name,
        p_action_url := '/entradas',
        p_metadata := jsonb_build_object(
          'old_status', OLD.estado,
          'new_status', NEW.estado,
          'entrada_id', NEW.id_reparacion,
          'cliente', NEW.nombre_cliente
        )
      );
    END IF;

    -- Si cambió a "Reparado" o "Entregado", notificar a admins/owners
    IF NEW.estado IN ('Reparado', 'Entregado') THEN
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
      WHERE admin_user.user_id != COALESCE(NEW.usuario_id, '00000000-0000-0000-0000-000000000000'::UUID);
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER 2: Notificar nueva entrada creada
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_entrada()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_name TEXT;
  v_technician_id UUID;
BEGIN
  -- Obtener nombre del creador
  IF NEW.usuario_id IS NOT NULL THEN
    SELECT COALESCE(first_name || ' ' || last_name, email)
    INTO v_actor_name
    FROM public.profiles
    WHERE id = NEW.usuario_id;
  END IF;

  -- Obtener ID del técnico asignado que pertenece a la organización
  IF NEW.tecnico_asignado IS NOT NULL THEN
    SELECT p.id INTO v_technician_id
    FROM public.profiles p
    JOIN public.org_members om ON om.user_id = p.id
    WHERE LOWER(p.email) = LOWER(NEW.tecnico_asignado)
      AND om.org_id = NEW.org_id
      AND om.status = 'active'
    LIMIT 1;
  END IF;

  -- Notificar al técnico asignado (si existe y no es el creador)
  IF v_technician_id IS NOT NULL AND v_technician_id != NEW.usuario_id THEN
    PERFORM public.create_notification(
      p_org_id := NEW.org_id,
      p_user_id := v_technician_id,
      p_type := 'assignment',
      p_title := 'Nueva entrada asignada',
      p_message := format('Te han asignado la entrada #%s de %s',
        NEW.id_reparacion, NEW.nombre_cliente),
      p_entity_type := 'entrada',
      p_entity_id := NEW.id,
      p_actor_id := NEW.usuario_id,
      p_actor_name := v_actor_name,
      p_action_url := '/entradas',
      p_metadata := jsonb_build_object(
        'entrada_id', NEW.id_reparacion,
        'cliente', NEW.nombre_cliente,
        'problema', NEW.problema,
        'estado', NEW.estado
      )
    );
  END IF;

  -- Notificar a admins sobre nueva entrada
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
  WHERE admin_user.user_id != COALESCE(NEW.usuario_id, '00000000-0000-0000-0000-000000000000'::UUID);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;

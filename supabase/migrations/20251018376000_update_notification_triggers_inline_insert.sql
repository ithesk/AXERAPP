-- =====================================================
-- UPDATE: Inline notification inserts in triggers
-- Description: Evita dependencia de la función create_notification
--              insertando directamente en public.notifications.
-- Date: 2025-10-18
-- =====================================================

BEGIN;

-- =====================================================
-- TRIGGER 1: Cambio de estado de entrada
-- =====================================================
CREATE OR REPLACE FUNCTION notify_entrada_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_name TEXT;
  v_technician_id UUID;
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    IF NEW.usuario_id IS NOT NULL THEN
      SELECT COALESCE(first_name || ' ' || last_name, email)
      INTO v_actor_name
      FROM public.profiles
      WHERE id = NEW.usuario_id;
    END IF;

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
    FROM get_org_admins_and_owners(NEW.org_id) admin_user;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER 2: Nueva entrada
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_entrada()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_name TEXT;
  v_technician_id UUID;
BEGIN
  IF NEW.usuario_id IS NOT NULL THEN
    SELECT COALESCE(first_name || ' ' || last_name, email)
    INTO v_actor_name
    FROM public.profiles
    WHERE id = NEW.usuario_id;
  END IF;

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
  FROM get_org_admins_and_owners(NEW.org_id) admin_user;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER 4: Comentarios en bitácora
-- =====================================================
CREATE OR REPLACE FUNCTION notify_bitacora_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_name TEXT;
  v_entrada RECORD;
  v_technician_id UUID;
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    SELECT COALESCE(first_name || ' ' || last_name, email)
    INTO v_actor_name
    FROM public.profiles
    WHERE id = NEW.created_by;
  END IF;

  SELECT * INTO v_entrada
  FROM public.entradas
  WHERE id = NEW.entrada_id;

  IF v_entrada IS NOT NULL THEN
    v_technician_id := public.find_org_member_user_id(v_entrada.org_id, v_entrada.tecnico_asignado);

    IF v_technician_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        org_id, user_id, type, title, message,
        entity_type, entity_id, actor_id, actor_name,
        action_url, metadata
      ) VALUES (
        v_entrada.org_id,
        v_technician_id,
        'comment_added',
        format('Comentario en entrada #%s', v_entrada.id_reparacion),
        format('%s agregó un comentario: "%s"',
          v_actor_name,
          CASE
            WHEN length(NEW.comment) > 50
            THEN substring(NEW.comment from 1 for 50) || '...'
            ELSE NEW.comment
          END),
        'entrada',
        v_entrada.id,
        NEW.created_by,
        v_actor_name,
        '/entradas',
        jsonb_build_object(
          'entrada_id', v_entrada.id_reparacion,
          'cliente', v_entrada.nombre_cliente,
          'comment_preview', substring(NEW.comment from 1 for 100)
        )
      );
    END IF;

    INSERT INTO public.notifications (
      org_id, user_id, type, title, message,
      entity_type, entity_id, actor_id, actor_name,
      action_url, metadata
    )
    SELECT
      v_entrada.org_id,
      admin_user.user_id,
      'comment_added',
      format('Comentario en entrada #%s', v_entrada.id_reparacion),
      format('%s agregó un comentario en la entrada de %s',
        v_actor_name, v_entrada.nombre_cliente),
      'entrada',
      v_entrada.id,
      NEW.created_by,
      v_actor_name,
      '/entradas',
      jsonb_build_object(
        'entrada_id', v_entrada.id_reparacion,
        'cliente', v_entrada.nombre_cliente,
        'comment_preview', substring(NEW.comment from 1 for 100)
      )
    FROM get_org_admins_and_owners(v_entrada.org_id) admin_user;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER 5: Cambio de técnico asignado
-- =====================================================
CREATE OR REPLACE FUNCTION notify_technician_change()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_name TEXT;
  v_old_technician_id UUID;
  v_new_technician_id UUID;
BEGIN
  IF OLD.tecnico_asignado IS DISTINCT FROM NEW.tecnico_asignado THEN
    IF NEW.usuario_id IS NOT NULL THEN
      SELECT COALESCE(first_name || ' ' || last_name, email)
      INTO v_actor_name
      FROM public.profiles
      WHERE id = NEW.usuario_id;
    END IF;

    v_old_technician_id := public.find_org_member_user_id(NEW.org_id, OLD.tecnico_asignado);
    v_new_technician_id := public.find_org_member_user_id(NEW.org_id, NEW.tecnico_asignado);

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
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Notification triggers now insert inline without create_notification()';
END $$;

COMMIT;

-- =====================================================
-- FIX NOTIFICATION TRIGGERS
-- Description: Fix column reference errors in triggers
-- Date: 2025-10-18
-- =====================================================

BEGIN;

-- =====================================================
-- TRIGGER 1: Fix Notificar cambio de estado en entradas
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

    -- Obtener ID del técnico asignado (buscar por email en la misma organización)
    IF NEW.tecnico_asignado IS NOT NULL THEN
      SELECT id INTO v_technician_id
      FROM public.profiles
      WHERE email = NEW.tecnico_asignado
      AND org_id = NEW.org_id
      LIMIT 1;
    END IF;

    -- Notificar al técnico asignado (si existe y no es el que hizo el cambio)
    IF v_technician_id IS NOT NULL AND v_technician_id != COALESCE(NEW.usuario_id, '00000000-0000-0000-0000-000000000000'::UUID) THEN
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
-- TRIGGER 2: Fix Notificar nueva entrada creada
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

  -- Obtener ID del técnico asignado (buscar por email en la misma organización)
  IF NEW.tecnico_asignado IS NOT NULL THEN
    SELECT id INTO v_technician_id
    FROM public.profiles
    WHERE email = NEW.tecnico_asignado
    AND org_id = NEW.org_id
    LIMIT 1;
  END IF;

  -- Notificar al técnico asignado (si existe y no es el creador)
  IF v_technician_id IS NOT NULL AND v_technician_id != COALESCE(NEW.usuario_id, '00000000-0000-0000-0000-000000000000'::UUID) THEN
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

-- =====================================================
-- TRIGGER 5: Fix Notificar cambio de técnico asignado
-- =====================================================
CREATE OR REPLACE FUNCTION notify_technician_change()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_name TEXT;
  v_old_technician_id UUID;
  v_new_technician_id UUID;
BEGIN
  -- Solo notificar si cambió el técnico
  IF OLD.tecnico_asignado IS DISTINCT FROM NEW.tecnico_asignado THEN

    -- Obtener nombre del actor
    IF NEW.usuario_id IS NOT NULL THEN
      SELECT COALESCE(first_name || ' ' || last_name, email)
      INTO v_actor_name
      FROM public.profiles
      WHERE id = NEW.usuario_id;
    END IF;

    -- Obtener ID del técnico anterior (buscar por email)
    IF OLD.tecnico_asignado IS NOT NULL THEN
      SELECT id INTO v_old_technician_id
      FROM public.profiles
      WHERE email = OLD.tecnico_asignado
      AND org_id = NEW.org_id
      LIMIT 1;
    END IF;

    -- Obtener ID del nuevo técnico (buscar por email)
    IF NEW.tecnico_asignado IS NOT NULL THEN
      SELECT id INTO v_new_technician_id
      FROM public.profiles
      WHERE email = NEW.tecnico_asignado
      AND org_id = NEW.org_id
      LIMIT 1;
    END IF;

    -- Notificar al técnico anterior (reasignación)
    IF v_old_technician_id IS NOT NULL THEN
      PERFORM public.create_notification(
        p_org_id := NEW.org_id,
        p_user_id := v_old_technician_id,
        p_type := 'team_activity',
        p_title := 'Entrada reasignada',
        p_message := format('La entrada #%s fue reasignada a otro técnico',
          NEW.id_reparacion),
        p_entity_type := 'entrada',
        p_entity_id := NEW.id,
        p_actor_id := NEW.usuario_id,
        p_actor_name := v_actor_name,
        p_action_url := '/entradas',
        p_metadata := jsonb_build_object(
          'entrada_id', NEW.id_reparacion,
          'cliente', NEW.nombre_cliente,
          'new_technician', NEW.tecnico_asignado
        )
      );
    END IF;

    -- Notificar al nuevo técnico (asignación)
    IF v_new_technician_id IS NOT NULL THEN
      PERFORM public.create_notification(
        p_org_id := NEW.org_id,
        p_user_id := v_new_technician_id,
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

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER 4: Fix Notificar comentarios en bitácora
-- =====================================================
CREATE OR REPLACE FUNCTION notify_bitacora_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_name TEXT;
  v_entrada RECORD;
  v_technician_id UUID;
BEGIN
  -- Obtener nombre del autor del comentario
  IF NEW.created_by IS NOT NULL THEN
    SELECT COALESCE(first_name || ' ' || last_name, email)
    INTO v_actor_name
    FROM public.profiles
    WHERE id = NEW.created_by;
  END IF;

  -- Obtener información de la entrada
  SELECT * INTO v_entrada
  FROM public.entradas
  WHERE id = NEW.entrada_id;

  IF v_entrada IS NOT NULL THEN
    -- Obtener ID del técnico asignado (buscar por email)
    IF v_entrada.tecnico_asignado IS NOT NULL THEN
      SELECT id INTO v_technician_id
      FROM public.profiles
      WHERE email = v_entrada.tecnico_asignado
      AND org_id = v_entrada.org_id
      LIMIT 1;
    END IF;

    -- Notificar al técnico asignado (si existe y no es el autor)
    IF v_technician_id IS NOT NULL AND v_technician_id != COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::UUID) THEN
      PERFORM public.create_notification(
        p_org_id := v_entrada.org_id,
        p_user_id := v_technician_id,
        p_type := 'comment_added',
        p_title := format('Comentario en entrada #%s', v_entrada.id_reparacion),
        p_message := format('%s agregó un comentario: "%s"',
          v_actor_name,
          CASE
            WHEN length(NEW.comment) > 50
            THEN substring(NEW.comment from 1 for 50) || '...'
            ELSE NEW.comment
          END),
        p_entity_type := 'entrada',
        p_entity_id := v_entrada.id,
        p_actor_id := NEW.created_by,
        p_actor_name := v_actor_name,
        p_action_url := '/entradas',
        p_metadata := jsonb_build_object(
          'entrada_id', v_entrada.id_reparacion,
          'cliente', v_entrada.nombre_cliente,
          'comment_preview', substring(NEW.comment from 1 for 100)
        )
      );
    END IF;

    -- Notificar a admins/owners
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
    FROM get_org_admins_and_owners(v_entrada.org_id) admin_user
    WHERE admin_user.user_id != COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::UUID)
    AND admin_user.user_id != COALESCE(v_technician_id, '00000000-0000-0000-0000-000000000000'::UUID);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify fix
DO $$
BEGIN
  RAISE NOTICE '✅ SUCCESS: Notification triggers fixed successfully';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed issues:';
  RAISE NOTICE '  - Removed table alias "p" causing org_id column error';
  RAISE NOTICE '  - Simplified profile lookups by email';
  RAISE NOTICE '  - All triggers now use direct column references';
  RAISE NOTICE '';
END $$;

COMMIT;

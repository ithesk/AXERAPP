-- =====================================================
-- CREATE NOTIFICATION TRIGGERS
-- Description: Automatic notifications for system events
-- Date: 2025-10-18
-- =====================================================

BEGIN;

-- =====================================================
-- HELPER FUNCTION: Get organization members for notifications
-- =====================================================
CREATE OR REPLACE FUNCTION get_org_admins_and_owners(p_org_id UUID)
RETURNS TABLE(user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT om.user_id
  FROM public.organization_members om
  WHERE om.org_id = p_org_id
  AND om.role IN ('owner', 'admin')
  AND om.status = 'active';
END;
$$ LANGUAGE plpgsql;

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

    -- Obtener ID del técnico asignado
    SELECT p.id INTO v_technician_id
    FROM public.profiles p
    WHERE p.email = NEW.tecnico_asignado
    AND p.org_id = NEW.org_id
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

DROP TRIGGER IF EXISTS entrada_status_change_notification ON public.entradas;
CREATE TRIGGER entrada_status_change_notification
  AFTER UPDATE ON public.entradas
  FOR EACH ROW
  EXECUTE FUNCTION notify_entrada_status_change();

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

  -- Obtener ID del técnico asignado
  IF NEW.tecnico_asignado IS NOT NULL THEN
    SELECT p.id INTO v_technician_id
    FROM public.profiles p
    WHERE p.email = NEW.tecnico_asignado
    AND p.org_id = NEW.org_id
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

DROP TRIGGER IF EXISTS new_entrada_notification ON public.entradas;
CREATE TRIGGER new_entrada_notification
  AFTER INSERT ON public.entradas
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_entrada();

-- =====================================================
-- TRIGGER 3: Notificar nuevo contacto creado
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_contact()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_name TEXT;
BEGIN
  -- Obtener nombre del creador
  IF NEW.created_by IS NOT NULL THEN
    SELECT COALESCE(first_name || ' ' || last_name, email)
    INTO v_actor_name
    FROM public.profiles
    WHERE id = NEW.created_by;
  END IF;

  -- Notificar a admins/owners sobre nuevo contacto
  INSERT INTO public.notifications (
    org_id, user_id, type, title, message,
    entity_type, entity_id, actor_id, actor_name,
    action_url, metadata
  )
  SELECT
    NEW.org_id,
    admin_user.user_id,
    'new_contact',
    'Nuevo contacto agregado',
    format('Se agregó el contacto %s', NEW.name),
    'contacto',
    NEW.id,
    NEW.created_by,
    v_actor_name,
    '/contactos',
    jsonb_build_object(
      'contact_name', NEW.name,
      'phone', NEW.phone,
      'email', NEW.email
    )
  FROM get_org_admins_and_owners(NEW.org_id) admin_user
  WHERE admin_user.user_id != COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::UUID);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS new_contact_notification ON public.contacts;
CREATE TRIGGER new_contact_notification
  AFTER INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_contact();

-- =====================================================
-- TRIGGER 4: Notificar comentarios en bitácora (si la tabla existe)
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
    -- Obtener ID del técnico asignado
    SELECT p.id INTO v_technician_id
    FROM public.profiles p
    WHERE p.email = v_entrada.tecnico_asignado
    AND p.org_id = v_entrada.org_id
    LIMIT 1;

    -- Notificar al técnico asignado (si existe y no es el autor)
    IF v_technician_id IS NOT NULL AND v_technician_id != NEW.created_by THEN
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

-- Solo crear el trigger si la tabla bitacora existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bitacora'
  ) THEN
    DROP TRIGGER IF EXISTS bitacora_comment_notification ON public.bitacora;
    CREATE TRIGGER bitacora_comment_notification
      AFTER INSERT ON public.bitacora
      FOR EACH ROW
      EXECUTE FUNCTION notify_bitacora_comment();
    RAISE NOTICE '  4. bitacora_comment_notification - Comentarios en bitácora';
  ELSE
    RAISE NOTICE '  4. bitacora_comment_notification - SKIPPED (tabla no existe)';
  END IF;
END $$;

-- =====================================================
-- TRIGGER 5: Notificar cambio de técnico asignado
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

    -- Obtener ID del técnico anterior
    IF OLD.tecnico_asignado IS NOT NULL THEN
      SELECT p.id INTO v_old_technician_id
      FROM public.profiles p
      WHERE p.email = OLD.tecnico_asignado
      AND p.org_id = NEW.org_id
      LIMIT 1;
    END IF;

    -- Obtener ID del nuevo técnico
    IF NEW.tecnico_asignado IS NOT NULL THEN
      SELECT p.id INTO v_new_technician_id
      FROM public.profiles p
      WHERE p.email = NEW.tecnico_asignado
      AND p.org_id = NEW.org_id
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

DROP TRIGGER IF EXISTS technician_change_notification ON public.entradas;
CREATE TRIGGER technician_change_notification
  AFTER UPDATE ON public.entradas
  FOR EACH ROW
  EXECUTE FUNCTION notify_technician_change();

-- Verify triggers creation
DO $$
BEGIN
  RAISE NOTICE '✅ SUCCESS: Notification triggers created successfully';
  RAISE NOTICE '';
  RAISE NOTICE 'Triggers created:';
  RAISE NOTICE '  1. entrada_status_change_notification - Cambios de estado';
  RAISE NOTICE '  2. new_entrada_notification - Nuevas entradas';
  RAISE NOTICE '  3. new_contact_notification - Nuevos contactos';
  RAISE NOTICE '  4. bitacora_comment_notification - Comentarios en bitácora';
  RAISE NOTICE '  5. technician_change_notification - Cambios de técnico';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ Las notificaciones se crearán automáticamente en tiempo real';
  RAISE NOTICE '';
END $$;

COMMIT;

-- =====================================================
-- MIGRATION: Alter Entradas - Add Organization ID (MULTI-TENANT)
-- Description: Agregar org_id a entradas para aislamiento multi-tenant
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

-- IMPORTANTE: Esta migración es CRÍTICA para multi-tenancy
-- Asegura que cada entrada pertenezca a una organización específica

-- Paso 1: Agregar columna org_id (permitir NULL temporalmente)
ALTER TABLE public.entradas
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Paso 2: Para datos existentes, crear una organización por defecto o asignar manualmente
-- NOTA: Esto debe ajustarse según tus datos existentes
-- Opción A: Si tienes datos de prueba, puedes crear una org de migración
-- Opción B: Si tienes datos reales, necesitas asignar cada entrada a su org correcta

-- Crear organización de migración si no existe (solo para desarrollo)
-- En producción, deberías migrar los datos manualmente a organizaciones reales
DO $$
DECLARE
  v_migration_org_id UUID;
  v_admin_user_id UUID;
BEGIN
  -- Buscar el primer usuario del sistema para ser owner
  SELECT id INTO v_admin_user_id
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1;

  -- Solo crear si hay usuarios y no hay organizaciones
  IF v_admin_user_id IS NOT NULL THEN
    -- Verificar si ya existe una organización de migración
    SELECT id INTO v_migration_org_id
    FROM public.organizations
    WHERE slug = 'migration-org'
    LIMIT 1;

    -- Si no existe, crearla
    IF v_migration_org_id IS NULL THEN
      INSERT INTO public.organizations (
        name,
        slug,
        owner_id,
        subscription_plan,
        subscription_status,
        max_users,
        max_entradas_per_month,
        modules_enabled
      )
      VALUES (
        'Organización de Migración',
        'migration-org',
        v_admin_user_id,
        'professional', -- Plan generoso para migración
        'active',
        100,
        10000,
        ARRAY['entradas', 'ventas', 'inventario', 'compras']
      )
      RETURNING id INTO v_migration_org_id;

      -- Crear membresía para el owner
      INSERT INTO public.org_members (org_id, user_id, role, status, joined_at)
      VALUES (v_migration_org_id, v_admin_user_id, 'owner', 'active', timezone('utc'::text, now()));

      -- Actualizar todas las entradas existentes sin org_id
      UPDATE public.entradas
      SET org_id = v_migration_org_id
      WHERE org_id IS NULL;

      RAISE NOTICE 'Organización de migración creada con ID: %', v_migration_org_id;
      RAISE NOTICE 'Todas las entradas existentes asignadas a la organización de migración';
    ELSE
      -- Si ya existe, asignar entradas sin org
      UPDATE public.entradas
      SET org_id = v_migration_org_id
      WHERE org_id IS NULL;

      RAISE NOTICE 'Usando organización de migración existente: %', v_migration_org_id;
    END IF;
  END IF;
END $$;

-- Paso 3: Hacer org_id NOT NULL después de migrar datos
-- NOTA: Descomentar esto solo después de asegurar que todas las entradas tienen org_id
ALTER TABLE public.entradas
ALTER COLUMN org_id SET NOT NULL;

-- Paso 4: Crear índices para mejorar el rendimiento de queries multi-tenant
CREATE INDEX IF NOT EXISTS idx_entradas_org_id ON public.entradas(org_id);
CREATE INDEX IF NOT EXISTS idx_entradas_org_estado ON public.entradas(org_id, estado);
CREATE INDEX IF NOT EXISTS idx_entradas_org_fecha ON public.entradas(org_id, fecha_entrada DESC);
CREATE INDEX IF NOT EXISTS idx_entradas_org_usuario ON public.entradas(org_id, usuario_id);

-- Paso 5: Actualizar constraint de id_reparacion
-- El ID de reparación debe ser único POR ORGANIZACIÓN, no globalmente
ALTER TABLE public.entradas DROP CONSTRAINT IF EXISTS entradas_id_reparacion_key;

-- Crear constraint compuesto: único por org + id_reparacion
ALTER TABLE public.entradas
ADD CONSTRAINT entradas_org_id_reparacion_unique UNIQUE (org_id, id_reparacion);

-- Comentario para documentación
COMMENT ON COLUMN public.entradas.org_id IS 'ID de la organización a la que pertenece esta entrada (multi-tenant isolation)';

-- Paso 6: Crear vista útil para entradas con información de la organización
CREATE OR REPLACE VIEW public.entradas_with_org AS
SELECT
  e.*,
  o.name as org_name,
  o.slug as org_slug,
  p.first_name || ' ' || p.last_name as usuario_nombre,
  p.email as usuario_email
FROM public.entradas e
LEFT JOIN public.organizations o ON e.org_id = o.id
LEFT JOIN public.profiles p ON e.usuario_id = p.id;

COMMENT ON VIEW public.entradas_with_org IS 'Vista de entradas con información enriquecida de organización y usuario';

-- Paso 7: Actualizar función de búsqueda full-text para incluir org_id
-- Recrear el índice de búsqueda para incluir el filtro de organización
DROP INDEX IF EXISTS idx_entradas_search;

CREATE INDEX idx_entradas_search ON public.entradas
USING gin(to_tsvector('spanish',
  coalesce(nombre_cliente, '') || ' ' ||
  coalesce(telefono, '') || ' ' ||
  coalesce(modelo, '') || ' ' ||
  coalesce(problema, '') || ' ' ||
  coalesce(id_reparacion, '')
));

-- Índice compuesto para búsqueda filtrada por organización
CREATE INDEX idx_entradas_org_search ON public.entradas(org_id)
INCLUDE (nombre_cliente, telefono, modelo, problema, id_reparacion);

DO $$
BEGIN
  RAISE NOTICE 'Migración completada: tabla entradas ahora es multi-tenant';
END $$;

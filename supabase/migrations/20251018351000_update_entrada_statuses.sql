-- =====================================================
-- MIGRATION: Update Entrada Status Workflow
-- Description: Ajusta estados iniciales, datos existentes y estadísticas
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

-- Actualizar datos existentes a la nueva nomenclatura
UPDATE public.entradas
SET estado = 'Cotización'
WHERE estado ILIKE 'pendiente';

UPDATE public.entradas
SET estado = 'Reparado'
WHERE estado ILIKE 'listo';

-- Ajustar valores por defecto
ALTER TABLE public.entradas
  ALTER COLUMN estado SET DEFAULT 'Cotización';

ALTER TABLE public.org_settings
  ALTER COLUMN entrada_default_status SET DEFAULT 'Cotización';

UPDATE public.org_settings
SET entrada_default_status = 'Cotización'
WHERE entrada_default_status ILIKE 'pendiente';

DROP VIEW IF EXISTS public.entradas_stats_by_org;

-- Refrescar vista de estadísticas por organización con los nuevos estados
CREATE VIEW public.entradas_stats_by_org AS
SELECT
  e.org_id,
  o.name AS org_name,
  COUNT(*) AS total_entradas,
  COUNT(*) FILTER (WHERE e.estado = 'Cotización') AS cotizaciones,
  COUNT(*) FILTER (WHERE e.estado = 'Inicio reparación') AS inicio_reparacion,
  COUNT(*) FILTER (WHERE e.estado = 'En reparación') AS en_reparacion,
  COUNT(*) FILTER (WHERE e.estado = 'Reparado') AS reparados,
  COUNT(*) FILTER (WHERE e.estado = 'Entregado') AS entregados,
  COUNT(*) FILTER (WHERE e.estado = 'Cancelado') AS cancelados,
  COUNT(*) FILTER (WHERE DATE(e.fecha_entrada) = CURRENT_DATE) AS hoy,
  COUNT(*) FILTER (WHERE DATE_TRUNC('month', e.fecha_entrada) = DATE_TRUNC('month', CURRENT_DATE)) AS este_mes,
  MIN(e.fecha_entrada) AS primera_entrada,
  MAX(e.fecha_entrada) AS ultima_entrada
FROM public.entradas e
JOIN public.organizations o ON e.org_id = o.id
WHERE o.deleted_at IS NULL
GROUP BY e.org_id, o.name;

ALTER VIEW public.entradas_stats_by_org SET (security_invoker = true);

COMMENT ON VIEW public.entradas_stats_by_org
IS 'Estadísticas de entradas agrupadas por organización (respeta RLS) con la nueva secuencia de estados';

DO $$
BEGIN
  RAISE NOTICE 'Migración completada: estados de entradas actualizados a Cotización → Inicio reparación → En reparación → Reparado → Entregado → Cancelado';
END $$;

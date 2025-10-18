-- =====================================================
-- MIGRATION: Generate Entrada ID Function (Per Tenant)
-- Description: Función para generar IDs únicos de entrada por organización
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

-- Función para generar ID de reparación único por organización
-- Formato: {PREFIX}-{YYYYMMDD}-{SEQUENCE}
-- Ejemplo: REP-20250118-0001

CREATE OR REPLACE FUNCTION public.generate_entrada_id(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_date TEXT;
  v_sequence INTEGER;
  v_id TEXT;
BEGIN
  -- Obtener el prefijo configurado para la organización (por defecto 'REP')
  SELECT COALESCE(entrada_prefix, 'REP')
  INTO v_prefix
  FROM public.org_settings
  WHERE org_id = p_org_id;

  -- Si no hay configuración, usar 'REP' por defecto
  IF v_prefix IS NULL THEN
    v_prefix := 'REP';
  END IF;

  -- Obtener la fecha actual en formato YYYYMMDD
  v_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

  -- Obtener el siguiente número de secuencia para esta org y fecha
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(id_reparacion, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM public.entradas
  WHERE org_id = p_org_id
    AND id_reparacion LIKE v_prefix || '-' || v_date || '-%';

  -- Si no se encontró secuencia, verificar si hay un start personalizado
  IF v_sequence = 1 THEN
    SELECT COALESCE(entrada_sequence_start, 1)
    INTO v_sequence
    FROM public.org_settings
    WHERE org_id = p_org_id;

    -- Si ya hay entradas con ese prefix y fecha, usar el siguiente número
    IF EXISTS (
      SELECT 1 FROM public.entradas
      WHERE org_id = p_org_id
        AND id_reparacion LIKE v_prefix || '-' || v_date || '-%'
    ) THEN
      SELECT COALESCE(MAX(
        CAST(SPLIT_PART(id_reparacion, '-', 3) AS INTEGER)
      ), 0) + 1
      INTO v_sequence
      FROM public.entradas
      WHERE org_id = p_org_id
        AND id_reparacion LIKE v_prefix || '-' || v_date || '-%';
    END IF;
  END IF;

  -- Construir el ID final: PREFIX-YYYYMMDD-XXXX
  v_id := v_prefix || '-' || v_date || '-' || LPAD(v_sequence::TEXT, 4, '0');

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.generate_entrada_id IS 'Genera un ID único de entrada por organización con formato PREFIX-YYYYMMDD-SEQUENCE';

-- Función alternativa que permite especificar el prefijo manualmente
CREATE OR REPLACE FUNCTION public.generate_entrada_id_custom(
  p_org_id UUID,
  p_prefix TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_date TEXT;
  v_sequence INTEGER;
  v_id TEXT;
BEGIN
  -- Usar el prefijo proporcionado o el configurado
  IF p_prefix IS NOT NULL THEN
    v_prefix := p_prefix;
  ELSE
    SELECT COALESCE(entrada_prefix, 'REP')
    INTO v_prefix
    FROM public.org_settings
    WHERE org_id = p_org_id;

    IF v_prefix IS NULL THEN
      v_prefix := 'REP';
    END IF;
  END IF;

  v_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(id_reparacion, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM public.entradas
  WHERE org_id = p_org_id
    AND id_reparacion LIKE v_prefix || '-' || v_date || '-%';

  v_id := v_prefix || '-' || v_date || '-' || LPAD(v_sequence::TEXT, 4, '0');

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.generate_entrada_id_custom IS 'Genera un ID de entrada con prefijo personalizado';

-- Función para resetear la secuencia de una organización (usar con cuidado)
CREATE OR REPLACE FUNCTION public.reset_entrada_sequence(
  p_org_id UUID,
  p_new_start INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar que el usuario sea owner o admin de la organización
  IF NOT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = p_org_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para resetear la secuencia de esta organización';
  END IF;

  -- Actualizar el inicio de secuencia
  UPDATE public.org_settings
  SET entrada_sequence_start = p_new_start
  WHERE org_id = p_org_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.reset_entrada_sequence IS 'Resetea el inicio de secuencia de entradas para una organización (requiere permisos de admin)';

-- Trigger para auto-generar id_reparacion si no se proporciona
CREATE OR REPLACE FUNCTION public.auto_generate_entrada_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Si no se proporciona id_reparacion, generarlo automáticamente
  IF NEW.id_reparacion IS NULL OR NEW.id_reparacion = '' THEN
    NEW.id_reparacion := public.generate_entrada_id(NEW.org_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger en la tabla entradas
DROP TRIGGER IF EXISTS auto_generate_entrada_id_trigger ON public.entradas;

CREATE TRIGGER auto_generate_entrada_id_trigger
  BEFORE INSERT ON public.entradas
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_entrada_id();

COMMENT ON FUNCTION public.auto_generate_entrada_id IS 'Auto-genera el id_reparacion si no se proporciona al crear una entrada';

-- Función de utilidad para obtener estadísticas de IDs por organización
CREATE OR REPLACE FUNCTION public.get_entrada_id_stats(p_org_id UUID)
RETURNS TABLE (
  total_entradas BIGINT,
  entradas_hoy BIGINT,
  ultimo_id_generado TEXT,
  proximo_id_estimado TEXT
) AS $$
DECLARE
  v_proximo_id TEXT;
BEGIN
  -- Generar próximo ID (sin insertarlo)
  v_proximo_id := public.generate_entrada_id(p_org_id);

  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_entradas,
    COUNT(*) FILTER (WHERE DATE(fecha_entrada) = CURRENT_DATE)::BIGINT as entradas_hoy,
    MAX(id_reparacion) as ultimo_id_generado,
    v_proximo_id as proximo_id_estimado
  FROM public.entradas
  WHERE org_id = p_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_entrada_id_stats IS 'Obtiene estadísticas de IDs de entrada para una organización';

-- =====================================================
-- CREATE TABLE: common_problems
-- Description: Table to manage common device problems catalog
-- Date: 2025-10-18
-- =====================================================

BEGIN;

-- Create common_problems table
CREATE TABLE IF NOT EXISTS public.common_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  problem_text TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Ensure unique problems per organization
  CONSTRAINT unique_problem_per_org UNIQUE(org_id, problem_text)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_common_problems_org_id ON public.common_problems(org_id);
CREATE INDEX IF NOT EXISTS idx_common_problems_category ON public.common_problems(category);
CREATE INDEX IF NOT EXISTS idx_common_problems_active ON public.common_problems(is_active);
CREATE INDEX IF NOT EXISTS idx_common_problems_display_order ON public.common_problems(display_order);

-- Add comments
COMMENT ON TABLE public.common_problems IS 'Catálogo de problemas comunes para dispositivos, personalizable por organización';
COMMENT ON COLUMN public.common_problems.problem_text IS 'Texto del problema común';
COMMENT ON COLUMN public.common_problems.category IS 'Categoría del problema (Pantalla, Batería, Carga, etc.)';
COMMENT ON COLUMN public.common_problems.is_active IS 'Indica si el problema está activo para autocompletado';
COMMENT ON COLUMN public.common_problems.display_order IS 'Orden de visualización en el autocompletado';

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_common_problems_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger
CREATE OR REPLACE TRIGGER update_common_problems_updated_at
  BEFORE UPDATE ON public.common_problems
  FOR EACH ROW
  EXECUTE FUNCTION public.update_common_problems_updated_at();

-- Enable RLS
ALTER TABLE public.common_problems ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- SELECT: Users can view common problems from their organization
CREATE POLICY "Users can view common problems in their org"
  ON public.common_problems
  FOR SELECT
  USING (public.user_has_org_access(org_id));

-- INSERT: Admins and owners can create common problems
CREATE POLICY "Admins can create common problems"
  ON public.common_problems
  FOR INSERT
  WITH CHECK (
    public.user_has_org_access(org_id)
    AND public.user_has_role(org_id, ARRAY['owner', 'admin'])
  );

-- UPDATE: Admins and owners can update common problems
CREATE POLICY "Admins can update common problems"
  ON public.common_problems
  FOR UPDATE
  USING (
    public.user_has_org_access(org_id)
    AND public.user_has_role(org_id, ARRAY['owner', 'admin'])
  )
  WITH CHECK (
    public.user_has_org_access(org_id)
    AND public.user_has_role(org_id, ARRAY['owner', 'admin'])
  );

-- DELETE: Only owners can delete common problems
CREATE POLICY "Owners can delete common problems"
  ON public.common_problems
  FOR DELETE
  USING (
    public.user_has_org_access(org_id)
    AND public.user_has_role(org_id, ARRAY['owner'])
  );

-- Insert default common problems for existing organizations
INSERT INTO public.common_problems (org_id, problem_text, category, display_order, is_active)
SELECT
  o.id as org_id,
  p.problem_text,
  p.category,
  p.display_order,
  true as is_active
FROM public.organizations o
CROSS JOIN (
  VALUES
    -- Pantalla
    ('Pantalla rota o fisurada', 'Pantalla', 1),
    ('Pantalla no enciende', 'Pantalla', 2),
    ('Pantalla con manchas o líneas', 'Pantalla', 3),
    ('Touch no funciona', 'Pantalla', 4),
    ('Touch funciona parcialmente', 'Pantalla', 5),
    ('Cristal templado roto', 'Pantalla', 6),

    -- Batería
    ('Batería se descarga rápido', 'Batería', 10),
    ('No carga la batería', 'Batería', 11),
    ('Batería inflada', 'Batería', 12),
    ('Apagado repentino con batería', 'Batería', 13),
    ('Batería no detectada', 'Batería', 14),

    -- Carga
    ('No carga el dispositivo', 'Carga', 20),
    ('Carga lenta', 'Carga', 21),
    ('Puerto de carga dañado', 'Carga', 22),
    ('Cable de carga no reconocido', 'Carga', 23),
    ('Carga intermitente', 'Carga', 24),

    -- Botones
    ('Botón de encendido no funciona', 'Botones', 30),
    ('Botones de volumen no funcionan', 'Botones', 31),
    ('Botón Home no funciona', 'Botones', 32),
    ('Botón de silencio atascado', 'Botones', 33),

    -- Audio
    ('Sin audio en bocina', 'Audio', 40),
    ('Sin audio en auricular', 'Audio', 41),
    ('Micrófono no funciona', 'Audio', 42),
    ('Audio distorsionado', 'Audio', 43),
    ('Volumen bajo', 'Audio', 44),

    -- Cámaras
    ('Cámara trasera no funciona', 'Cámaras', 50),
    ('Cámara frontal no funciona', 'Cámaras', 51),
    ('Foto borrosa', 'Cámaras', 52),
    ('Flash no funciona', 'Cámaras', 53),
    ('Cámara con manchas', 'Cámaras', 54),

    -- Conectividad
    ('Sin señal celular', 'Conectividad', 60),
    ('WiFi no funciona', 'Conectividad', 61),
    ('Bluetooth no funciona', 'Conectividad', 62),
    ('GPS no funciona', 'Conectividad', 63),
    ('Sin servicio', 'Conectividad', 64),

    -- Software
    ('Dispositivo bloqueado', 'Software', 70),
    ('Actualización fallida', 'Software', 71),
    ('Reinicio constante (bootloop)', 'Software', 72),
    ('Lento o congelado', 'Software', 73),
    ('Virus o malware', 'Software', 74),

    -- Agua/Daño físico
    ('Daño por líquido', 'Daño Físico', 80),
    ('Caída con golpe', 'Daño Físico', 81),
    ('Oxidación interna', 'Daño Físico', 82),

    -- Sensores
    ('Face ID no funciona', 'Sensores', 90),
    ('Touch ID no funciona', 'Sensores', 91),
    ('Sensor de proximidad no funciona', 'Sensores', 92),

    -- Otros
    ('Cambio de batería', 'Servicios', 100),
    ('Cambio de pantalla', 'Servicios', 101),
    ('Limpieza interna', 'Servicios', 102),
    ('Respaldo de datos', 'Servicios', 103),
    ('Configuración inicial', 'Servicios', 104)
) AS p(problem_text, category, display_order)
ON CONFLICT (org_id, problem_text) DO NOTHING;

-- Verify table creation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'common_problems'
  ) THEN
    RAISE NOTICE '✅ SUCCESS: Table common_problems created successfully';
    RAISE NOTICE '';
    RAISE NOTICE 'Table details:';
    RAISE NOTICE '  - Multi-tenant (org_id)';
    RAISE NOTICE '  - RLS enabled';
    RAISE NOTICE '  - 4 policies created';
    RAISE NOTICE '  - Default problems seeded for existing organizations';
    RAISE NOTICE '';
  ELSE
    RAISE EXCEPTION '❌ ERROR: Table common_problems was not created';
  END IF;
END $$;

COMMIT;

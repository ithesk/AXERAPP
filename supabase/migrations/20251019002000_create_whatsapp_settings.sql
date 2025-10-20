-- =====================================================
-- Crear tabla para configuración de WhatsApp
-- Description: Almacena la configuración de la API de WhatsApp por organización
-- Date: 2025-10-19
-- =====================================================

BEGIN;

-- Crear tabla whatsapp_settings si no existe
CREATE TABLE IF NOT EXISTS public.whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  api_url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id)
);

-- Índice para búsquedas rápidas por organización
CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_org_id
  ON public.whatsapp_settings(org_id);

-- Habilitar RLS
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- Política: Los miembros de la organización pueden ver la configuración
CREATE POLICY "Miembros pueden ver configuración de WhatsApp"
  ON public.whatsapp_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = whatsapp_settings.org_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
  );

-- Política: Solo admins y owners pueden insertar/actualizar configuración
CREATE POLICY "Admins pueden gestionar configuración de WhatsApp"
  ON public.whatsapp_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = whatsapp_settings.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'owner')
        AND om.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = whatsapp_settings.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin', 'owner')
        AND om.status = 'active'
    )
  );

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Tabla whatsapp_settings creada correctamente';
END $$;

COMMIT;

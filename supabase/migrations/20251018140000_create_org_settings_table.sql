-- =====================================================
-- MIGRATION: Create Org Settings Table
-- Description: Configuraciones personalizadas por organización
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

-- Create org_settings table
CREATE TABLE IF NOT EXISTS public.org_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Configuraciones de Entradas/Reparaciones
  entrada_prefix TEXT DEFAULT 'REP',
  entrada_sequence_start INTEGER DEFAULT 1,
  entrada_default_status TEXT DEFAULT 'Pendiente',
  entrada_estados_custom JSONB DEFAULT '[]'::jsonb,

  -- Configuraciones de Facturación
  tax_id TEXT,
  tax_name TEXT DEFAULT 'IVA',
  tax_rate DECIMAL(5,2) DEFAULT 16.00,
  invoice_prefix TEXT DEFAULT 'FAC',
  invoice_sequence_start INTEGER DEFAULT 1,
  invoice_footer TEXT,

  -- Configuraciones de Email/Notificaciones
  email_notifications_enabled BOOLEAN DEFAULT true,
  email_from_name TEXT,
  email_from_address TEXT,
  email_signature TEXT,
  email_templates JSONB DEFAULT '{}'::jsonb,

  -- Configuraciones de Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#10B981',
  accent_color TEXT DEFAULT '#F59E0B',

  -- Configuraciones de Impresión
  print_header TEXT,
  print_footer TEXT,
  print_paper_size TEXT DEFAULT 'letter' CHECK (print_paper_size IN ('letter', 'a4', 'ticket')),

  -- Campos personalizados por módulo
  custom_fields_entradas JSONB DEFAULT '[]'::jsonb,
  custom_fields_ventas JSONB DEFAULT '[]'::jsonb,
  custom_fields_compras JSONB DEFAULT '[]'::jsonb,
  custom_fields_inventario JSONB DEFAULT '[]'::jsonb,

  -- Integraciones (WhatsApp, Telegram, etc.)
  integrations JSONB DEFAULT '{}'::jsonb,

  -- Configuraciones de seguridad
  require_2fa BOOLEAN DEFAULT false,
  session_timeout_minutes INTEGER DEFAULT 480, -- 8 horas
  password_expiry_days INTEGER,

  -- Configuraciones de idioma y formato
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  time_format TEXT DEFAULT '24h' CHECK (time_format IN ('12h', '24h')),
  currency TEXT DEFAULT 'MXN',
  currency_symbol TEXT DEFAULT '$',
  currency_position TEXT DEFAULT 'before' CHECK (currency_position IN ('before', 'after')),
  decimal_separator TEXT DEFAULT '.',
  thousands_separator TEXT DEFAULT ',',

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear índice
CREATE INDEX idx_org_settings_org_id ON public.org_settings(org_id);

-- Comentarios para documentación
COMMENT ON TABLE public.org_settings IS 'Configuraciones personalizadas por organización';
COMMENT ON COLUMN public.org_settings.entrada_estados_custom IS 'Array JSON de estados personalizados para entradas';
COMMENT ON COLUMN public.org_settings.email_templates IS 'Plantillas de email personalizadas por tipo de notificación';
COMMENT ON COLUMN public.org_settings.custom_fields_entradas IS 'Campos personalizados para el módulo de entradas';
COMMENT ON COLUMN public.org_settings.integrations IS 'Configuración de integraciones externas (WhatsApp, Telegram, etc)';

-- Trigger para actualizar updated_at
CREATE TRIGGER set_updated_at_org_settings
  BEFORE UPDATE ON public.org_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies para org_settings
-- Los miembros pueden ver las configuraciones de su organización
CREATE POLICY "Org members can view settings"
  ON public.org_settings
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Solo owners y admins pueden actualizar configuraciones
CREATE POLICY "Admins can update settings"
  ON public.org_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_id = org_settings.org_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- Las configuraciones se crean automáticamente al crear una organización
CREATE POLICY "System can insert settings"
  ON public.org_settings
  FOR INSERT
  WITH CHECK (true);

-- Función para crear configuraciones por defecto al crear una organización
CREATE OR REPLACE FUNCTION public.create_default_org_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.org_settings (org_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear configuraciones automáticamente
CREATE TRIGGER create_org_settings_on_org_creation
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_org_settings();

COMMENT ON FUNCTION public.create_default_org_settings IS 'Crea configuraciones por defecto al crear una nueva organización';

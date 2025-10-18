-- =====================================================
-- MIGRATION: Create Organizations Table (Multi-Tenant)
-- Description: Tabla principal para organizaciones/tenants
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,

  -- Configuración
  settings JSONB DEFAULT '{}'::jsonb,
  branding JSONB DEFAULT '{
    "logo_url": null,
    "primary_color": "#3B82F6",
    "secondary_color": "#10B981"
  }'::jsonb,

  -- Suscripción y plan
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'suspended', 'past_due')),
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'professional', 'enterprise')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,

  -- Límites por plan
  max_users INTEGER DEFAULT 1,
  max_entradas_per_month INTEGER DEFAULT 50,
  modules_enabled TEXT[] DEFAULT ARRAY['entradas'],

  -- Integración con Stripe
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,

  -- Configuración regional
  timezone TEXT DEFAULT 'America/Mexico_City',
  locale TEXT DEFAULT 'es',

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_subscription_status ON public.organizations(subscription_status);
CREATE INDEX idx_organizations_deleted_at ON public.organizations(deleted_at) WHERE deleted_at IS NULL;

-- Comentarios para documentación
COMMENT ON TABLE public.organizations IS 'Tabla principal de organizaciones/tenants del sistema SaaS';
COMMENT ON COLUMN public.organizations.slug IS 'Identificador único amigable para URLs (ej: mi-empresa)';
COMMENT ON COLUMN public.organizations.subscription_status IS 'Estado de la suscripción: trial, active, cancelled, suspended, past_due';
COMMENT ON COLUMN public.organizations.subscription_plan IS 'Plan activo: free, starter, professional, enterprise';
COMMENT ON COLUMN public.organizations.modules_enabled IS 'Array de módulos habilitados según el plan (entradas, ventas, compras, inventario)';
COMMENT ON COLUMN public.organizations.deleted_at IS 'Soft delete - si tiene valor, la organización está eliminada';

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at_organizations()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_organizations
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at_organizations();

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies para organizations
-- TEMPORAL: Solo owners pueden ver sus organizaciones
-- Esta política se actualizará en la migración de org_members para incluir miembros
CREATE POLICY "Users can view their organizations"
  ON public.organizations
  FOR SELECT
  USING (owner_id = auth.uid());

-- Solo owners pueden actualizar su organización (o admins)
CREATE POLICY "Owners and admins can update organization"
  ON public.organizations
  FOR UPDATE
  USING (
    owner_id = auth.uid()
  );

-- Cualquier usuario autenticado puede crear una organización
CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Solo owners pueden eliminar (soft delete)
CREATE POLICY "Owners can delete their organization"
  ON public.organizations
  FOR DELETE
  USING (owner_id = auth.uid());

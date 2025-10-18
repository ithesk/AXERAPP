-- =====================================================
-- MIGRATION: Create Subscription Plans Table
-- Description: Catálogo de planes de suscripción disponibles
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY CHECK (id IN ('free', 'starter', 'professional', 'enterprise')),
  name TEXT NOT NULL,
  description TEXT,

  -- Precios (en USD)
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),

  -- IDs de precios en Stripe
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,

  -- Límites del plan
  max_users INTEGER,
  max_entradas_per_month INTEGER,
  max_storage_gb INTEGER,

  -- Módulos disponibles
  modules TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Features del plan (array de objetos JSON)
  features JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear índice
CREATE INDEX idx_subscription_plans_active ON public.subscription_plans(is_active, sort_order);

-- Comentarios para documentación
COMMENT ON TABLE public.subscription_plans IS 'Catálogo de planes de suscripción disponibles en el sistema';
COMMENT ON COLUMN public.subscription_plans.modules IS 'Array de módulos disponibles: entradas, ventas, compras, inventario';
COMMENT ON COLUMN public.subscription_plans.features IS 'Array JSON de características del plan con formato: [{"name": "Feature", "included": true}]';

-- Trigger para actualizar updated_at
CREATE TRIGGER set_updated_at_subscription_plans
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Todos pueden ver los planes (necesario para el signup)
CREATE POLICY "Anyone can view subscription plans"
  ON public.subscription_plans
  FOR SELECT
  USING (is_active = true);

-- Solo admins del sistema pueden modificar planes (requiere service role)
-- Las modificaciones se harán típicamente vía SQL directo o migrations

-- Insertar planes base
INSERT INTO public.subscription_plans (
  id,
  name,
  description,
  price_monthly,
  price_yearly,
  max_users,
  max_entradas_per_month,
  max_storage_gb,
  modules,
  features,
  sort_order
) VALUES
(
  'free',
  'Plan Gratuito',
  'Perfecto para empezar y probar el sistema',
  0.00,
  0.00,
  1,
  50,
  1,
  ARRAY['entradas'],
  '[
    {"name": "1 usuario", "included": true},
    {"name": "50 entradas por mes", "included": true},
    {"name": "Módulo de entradas/reparaciones", "included": true},
    {"name": "1 GB de almacenamiento", "included": true},
    {"name": "Soporte por email", "included": true}
  ]'::jsonb,
  1
),
(
  'starter',
  'Plan Starter',
  'Ideal para negocios pequeños en crecimiento',
  29.00,
  290.00,
  5,
  500,
  10,
  ARRAY['entradas', 'ventas'],
  '[
    {"name": "Hasta 5 usuarios", "included": true},
    {"name": "500 entradas por mes", "included": true},
    {"name": "Módulos: Entradas + Ventas", "included": true},
    {"name": "10 GB de almacenamiento", "included": true},
    {"name": "Reportes básicos", "included": true},
    {"name": "Soporte prioritario", "included": true},
    {"name": "Notificaciones por email", "included": true}
  ]'::jsonb,
  2
),
(
  'professional',
  'Plan Professional',
  'Para negocios establecidos que necesitan todas las funciones',
  79.00,
  790.00,
  20,
  2000,
  50,
  ARRAY['entradas', 'ventas', 'inventario', 'compras'],
  '[
    {"name": "Hasta 20 usuarios", "included": true},
    {"name": "2000 entradas por mes", "included": true},
    {"name": "Todos los módulos", "included": true},
    {"name": "50 GB de almacenamiento", "included": true},
    {"name": "Reportes avanzados y análisis", "included": true},
    {"name": "API de integración", "included": true},
    {"name": "Campos personalizados", "included": true},
    {"name": "Branding personalizado", "included": true},
    {"name": "Soporte prioritario 24/5", "included": true},
    {"name": "Exportación de datos", "included": true}
  ]'::jsonb,
  3
),
(
  'enterprise',
  'Plan Enterprise',
  'Solución completa para grandes organizaciones',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  ARRAY['entradas', 'ventas', 'inventario', 'compras'],
  '[
    {"name": "Usuarios ilimitados", "included": true},
    {"name": "Entradas ilimitadas", "included": true},
    {"name": "Todos los módulos", "included": true},
    {"name": "Almacenamiento ilimitado", "included": true},
    {"name": "Reportes personalizados", "included": true},
    {"name": "API dedicada", "included": true},
    {"name": "Integraciones avanzadas", "included": true},
    {"name": "Multi-ubicación", "included": true},
    {"name": "SSO/SAML", "included": true},
    {"name": "Soporte 24/7 con SLA", "included": true},
    {"name": "Onboarding personalizado", "included": true},
    {"name": "Gerente de cuenta dedicado", "included": true}
  ]'::jsonb,
  4
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  max_users = EXCLUDED.max_users,
  max_entradas_per_month = EXCLUDED.max_entradas_per_month,
  max_storage_gb = EXCLUDED.max_storage_gb,
  modules = EXCLUDED.modules,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  updated_at = timezone('utc'::text, now());

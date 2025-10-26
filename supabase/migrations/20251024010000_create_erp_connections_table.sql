-- =====================================================
-- MIGRATION: Create ERP Connections Table
-- Description: Administra credenciales/progreso de la integración Odoo por organización
-- Author: AXER Team
-- Date: 2025-10-24
-- =====================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.erp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'odoo',
  base_url TEXT NOT NULL,
  company_id INTEGER,
  database_name TEXT,
  auth_type TEXT NOT NULL DEFAULT 'api_key' CHECK (auth_type IN ('api_key', 'oauth')),
  client_id TEXT,
  client_secret TEXT,
  api_key TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connected', 'error', 'pending')),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (org_id, provider)
);

COMMENT ON TABLE public.erp_connections IS 'Conexiones ERP/Odoo por organización con credenciales y estado';
COMMENT ON COLUMN public.erp_connections.org_id IS 'Organización propietaria de la conexión';
COMMENT ON COLUMN public.erp_connections.base_url IS 'URL base del servidor Odoo (https://mi-odoo.com)';
COMMENT ON COLUMN public.erp_connections.company_id IS 'ID de la compañía/empresa dentro de Odoo';
COMMENT ON COLUMN public.erp_connections.auth_type IS 'Método de autenticación utilizado (api_key u oauth)';
COMMENT ON COLUMN public.erp_connections.api_key IS 'Token o API key para autenticación simple';
COMMENT ON COLUMN public.erp_connections.client_id IS 'Client ID registrado para OAuth con Odoo';
COMMENT ON COLUMN public.erp_connections.client_secret IS 'Client Secret registrado para OAuth con Odoo';
COMMENT ON COLUMN public.erp_connections.access_token IS 'Access token vigente al conectarse vía OAuth';
COMMENT ON COLUMN public.erp_connections.refresh_token IS 'Refresh token para renovar credenciales OAuth';
COMMENT ON COLUMN public.erp_connections.status IS 'Estado actual de la conexión Odoo';

CREATE INDEX IF NOT EXISTS idx_erp_connections_org_id
  ON public.erp_connections(org_id);

CREATE INDEX IF NOT EXISTS idx_erp_connections_status
  ON public.erp_connections(status)
  WHERE status <> 'connected';

DROP TRIGGER IF EXISTS set_erp_connections_updated_at ON public.erp_connections;
CREATE TRIGGER set_erp_connections_updated_at
  BEFORE UPDATE ON public.erp_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.erp_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read ERP connections for their org" ON public.erp_connections;
CREATE POLICY "Members can read ERP connections for their org"
  ON public.erp_connections
  FOR SELECT
  USING (
    public.user_has_org_access(org_id)
  );

DROP POLICY IF EXISTS "Admins can upsert ERP connections in their org" ON public.erp_connections;
CREATE POLICY "Admins can upsert ERP connections in their org"
  ON public.erp_connections
  FOR INSERT
  WITH CHECK (
    public.user_has_role(org_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Admins can update ERP connections in their org" ON public.erp_connections;
CREATE POLICY "Admins can update ERP connections in their org"
  ON public.erp_connections
  FOR UPDATE
  USING (
    public.user_has_role(org_id, ARRAY['owner', 'admin'])
    AND public.user_has_org_access(org_id)
  )
  WITH CHECK (
    public.user_has_role(org_id, ARRAY['owner', 'admin'])
    AND public.user_has_org_access(org_id)
  );

DROP POLICY IF EXISTS "Admins can delete ERP connections in their org" ON public.erp_connections;
CREATE POLICY "Admins can delete ERP connections in their org"
  ON public.erp_connections
  FOR DELETE
  USING (
    public.user_has_role(org_id, ARRAY['owner', 'admin'])
    AND public.user_has_org_access(org_id)
  );

DO $$
BEGIN
  RAISE NOTICE '✅ Tabla erp_connections creada correctamente';
END $$;

COMMIT;

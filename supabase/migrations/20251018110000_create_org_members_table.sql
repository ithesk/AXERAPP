-- =====================================================
-- MIGRATION: Create Org Members Table (Multi-Tenant)
-- Description: Tabla de membresías de usuarios en organizaciones
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

-- Create org_members table
CREATE TABLE IF NOT EXISTS public.org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Rol del usuario en la organización
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'technician', 'viewer')),

  -- Estado de la membresía
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended', 'removed')),

  -- Información de invitación
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Constraint: un usuario solo puede tener una membresía por organización
  UNIQUE(org_id, user_id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_org_members_org_id ON public.org_members(org_id);
CREATE INDEX idx_org_members_user_id ON public.org_members(user_id);
CREATE INDEX idx_org_members_role ON public.org_members(role);
CREATE INDEX idx_org_members_status ON public.org_members(status);
CREATE INDEX idx_org_members_org_user ON public.org_members(org_id, user_id);

-- Comentarios para documentación
COMMENT ON TABLE public.org_members IS 'Membresías de usuarios en organizaciones con sus roles';
COMMENT ON COLUMN public.org_members.role IS 'Rol: owner (dueño), admin (administrador), technician (técnico), viewer (solo lectura)';
COMMENT ON COLUMN public.org_members.status IS 'Estado: active (activo), invited (invitado pendiente), suspended (suspendido), removed (removido)';

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER set_updated_at_org_members
  BEFORE UPDATE ON public.org_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para establecer joined_at cuando el status cambia a 'active'
CREATE OR REPLACE FUNCTION public.handle_org_member_activation()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el status cambia a 'active' y joined_at es NULL, establecer la fecha actual
  IF NEW.status = 'active' AND OLD.status != 'active' AND NEW.joined_at IS NULL THEN
    NEW.joined_at = timezone('utc'::text, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_joined_at_org_members
  BEFORE UPDATE ON public.org_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_org_member_activation();

-- Enable Row Level Security
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies para org_members (utilizan funciones SECURITY DEFINER)

-- Los miembros activos pueden consultar la información de su organización
CREATE POLICY "Members can view org members"
  ON public.org_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.user_has_org_access(org_id)
  );

-- Creación de miembros: permite al owner inicial auto-registrarse y a owners/admins invitar
CREATE POLICY "Can insert org members"
  ON public.org_members
  FOR INSERT
  WITH CHECK (
    (
      role = 'owner'
      AND user_id = auth.uid()
      AND NOT public.org_has_members(org_id)
    )
    OR public.user_has_role(org_id, ARRAY['owner', 'admin'])
  );

-- Owners y admins pueden actualizar membresías (cambios de rol/estado)
CREATE POLICY "Can update org members"
  ON public.org_members
  FOR UPDATE
  USING (
    public.user_has_role(org_id, ARRAY['owner', 'admin'])
  )
  WITH CHECK (
    public.user_has_role(org_id, ARRAY['owner', 'admin'])
  );

-- Owners y admins pueden marcar miembros como removidos (excepto al owner)
CREATE POLICY "Can remove org members"
  ON public.org_members
  FOR DELETE
  USING (
    role != 'owner'
    AND public.user_has_role(org_id, ARRAY['owner', 'admin'])
  );

-- Actualizar las políticas de organizations para incluir verificación de org_members
-- Ahora que org_members existe, podemos incluir miembros en las políticas

-- Actualizar política SELECT para incluir miembros
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;

CREATE POLICY "Users can view their organizations"
  ON public.organizations
  FOR SELECT
  USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Actualizar política UPDATE para permitir a admins actualizar
DROP POLICY IF EXISTS "Owners and admins can update organization" ON public.organizations;

CREATE POLICY "Owners and admins can update organization"
  ON public.organizations
  FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_id = organizations.id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

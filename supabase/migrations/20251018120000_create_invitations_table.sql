-- =====================================================
-- MIGRATION: Create Invitations Table (Multi-Tenant)
-- Description: Tabla para gestionar invitaciones a organizaciones
-- Author: AXER Team
-- Date: 2025-01-18
-- =====================================================

-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'technician', 'viewer')),

  -- Información de la invitación
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),

  -- Control de expiración
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Constraint: solo una invitación activa por email y organización
  UNIQUE(org_id, email)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_org_id ON public.invitations(org_id);
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_expires_at ON public.invitations(expires_at);

-- Comentarios para documentación
COMMENT ON TABLE public.invitations IS 'Invitaciones pendientes para unirse a organizaciones';
COMMENT ON COLUMN public.invitations.token IS 'Token único para aceptar la invitación (URL param)';
COMMENT ON COLUMN public.invitations.expires_at IS 'Fecha de expiración de la invitación (por defecto 7 días)';
COMMENT ON COLUMN public.invitations.accepted_at IS 'Fecha en que se aceptó la invitación (NULL si pendiente)';

-- Enable Row Level Security
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies para invitations
-- Los miembros de la organización pueden ver las invitaciones de su org
CREATE POLICY "Org members can view invitations"
  ON public.invitations
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Los admins pueden crear invitaciones
CREATE POLICY "Admins can create invitations"
  ON public.invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_id = invitations.org_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- Las invitaciones se pueden actualizar para marcarlas como aceptadas
CREATE POLICY "Users can accept invitations"
  ON public.invitations
  FOR UPDATE
  USING (
    accepted_at IS NULL -- Solo si no ha sido aceptada
    AND expires_at > timezone('utc'::text, now()) -- Solo si no ha expirado
  );

-- Los admins pueden eliminar invitaciones
CREATE POLICY "Admins can delete invitations"
  ON public.invitations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_id = invitations.org_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- Función para limpiar invitaciones expiradas (se puede ejecutar con un cron job)
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.invitations
  WHERE expires_at < timezone('utc'::text, now())
    AND accepted_at IS NULL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_expired_invitations IS 'Elimina invitaciones expiradas no aceptadas. Retorna el número de invitaciones eliminadas.';

-- Función para aceptar una invitación
CREATE OR REPLACE FUNCTION public.accept_invitation(
  p_token TEXT,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_invitation RECORD;
  v_member_id UUID;
BEGIN
  -- Buscar invitación válida
  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE token = p_token
    AND accepted_at IS NULL
    AND expires_at > timezone('utc'::text, now());

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invitación no encontrada o expirada'
    );
  END IF;

  -- Verificar que el email coincida con el usuario
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = p_user_id
      AND email = v_invitation.email
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'El email no coincide con la invitación'
    );
  END IF;

  -- Verificar que el usuario no sea ya miembro
  IF EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = v_invitation.org_id
      AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ya eres miembro de esta organización'
    );
  END IF;

  -- Crear la membresía
  INSERT INTO public.org_members (org_id, user_id, role, status, invited_by, invited_at, joined_at)
  VALUES (
    v_invitation.org_id,
    p_user_id,
    v_invitation.role,
    'active',
    v_invitation.invited_by,
    v_invitation.created_at,
    timezone('utc'::text, now())
  )
  RETURNING id INTO v_member_id;

  -- Marcar invitación como aceptada
  UPDATE public.invitations
  SET accepted_at = timezone('utc'::text, now())
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object(
    'success', true,
    'member_id', v_member_id,
    'org_id', v_invitation.org_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.accept_invitation IS 'Acepta una invitación y crea la membresía correspondiente';

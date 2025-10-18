"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "@/context/OrganizationContext";
import type {
  OrgMember,
  OrgRole,
  Invitation,
  InviteMemberData,
} from "@/types/organization";

export function useOrgMembers() {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const { currentOrg, hasPermission } = useOrganization();

  // =====================================================
  // Fetch Members
  // =====================================================

  const fetchMembers = useCallback(async () => {
    if (!currentOrg) {
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("org_members")
        .select(
          `
          *,
          user:profiles(
            id,
            email,
            first_name,
            last_name,
            avatar_url
          )
        `
        )
        .eq("org_id", currentOrg.id)
        .eq("status", "active")
        .order("joined_at", { ascending: false });

      if (fetchError) throw fetchError;

      setMembers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching members");
      console.error("Error fetching members:", err);
    } finally {
      setLoading(false);
    }
  }, [currentOrg, supabase]);

  // =====================================================
  // Fetch Invitations
  // =====================================================

  const fetchInvitations = useCallback(async () => {
    if (!currentOrg) {
      setInvitations([]);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("org_invitations")
        .select("*")
        .eq("org_id", currentOrg.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setInvitations(data || []);
    } catch (err) {
      console.error("Error fetching invitations:", err);
    }
  }, [currentOrg, supabase]);

  // =====================================================
  // Invite Member
  // =====================================================

  const inviteMember = async (data: InviteMemberData) => {
    if (!currentOrg) {
      const errorMessage = "No hay una organización seleccionada";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    if (!hasPermission("manage_members")) {
      const errorMessage = "No tienes permiso para invitar miembros";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    try {
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Crear invitación
      const { data: invitation, error: inviteError } = await supabase
        .from("org_invitations")
        .insert([
          {
            org_id: currentOrg.id,
            email: data.email,
            role: data.role,
            invited_by: user?.id,
            expires_at: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(), // 7 días
          },
        ])
        .select()
        .single();

      if (inviteError) throw inviteError;

      // TODO: Enviar email de invitación aquí
      // await sendInvitationEmail(invitation);

      await fetchInvitations();

      return { success: true, data: invitation };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error inviting member";
      setError(errorMessage);
      console.error("Error inviting member:", err);
      return { success: false, error: errorMessage };
    }
  };

  // =====================================================
  // Update Member Role
  // =====================================================

  const updateMemberRole = async (memberId: string, newRole: OrgRole) => {
    if (!currentOrg) {
      const errorMessage = "No hay una organización seleccionada";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    if (!hasPermission("manage_members")) {
      const errorMessage = "No tienes permiso para modificar roles";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    try {
      setError(null);

      // Verificar que no se está intentando modificar al owner
      const member = members.find((m) => m.id === memberId);
      if (member?.role === "owner") {
        throw new Error("No se puede modificar el rol del propietario");
      }

      const { data, error: updateError } = await supabase
        .from("org_members")
        .update({ role: newRole })
        .eq("id", memberId)
        .eq("org_id", currentOrg.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Actualizar estado local
      setMembers((prev) =>
        prev.map((member) => (member.id === memberId ? data : member))
      );

      return { success: true, data };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error updating member role";
      setError(errorMessage);
      console.error("Error updating member role:", err);
      return { success: false, error: errorMessage };
    }
  };

  // =====================================================
  // Remove Member
  // =====================================================

  const removeMember = async (memberId: string) => {
    if (!currentOrg) {
      const errorMessage = "No hay una organización seleccionada";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    if (!hasPermission("manage_members")) {
      const errorMessage = "No tienes permiso para remover miembros";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    try {
      setError(null);

      // Verificar que no se está intentando remover al owner
      const member = members.find((m) => m.id === memberId);
      if (member?.role === "owner") {
        throw new Error("No se puede remover al propietario");
      }

      // Soft delete: cambiar status a 'removed'
      const { error: removeError } = await supabase
        .from("org_members")
        .update({
          status: "removed",
          left_at: new Date().toISOString()
        })
        .eq("id", memberId)
        .eq("org_id", currentOrg.id);

      if (removeError) throw removeError;

      // Actualizar estado local
      setMembers((prev) => prev.filter((member) => member.id !== memberId));

      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error removing member";
      setError(errorMessage);
      console.error("Error removing member:", err);
      return { success: false, error: errorMessage };
    }
  };

  // =====================================================
  // Cancel Invitation
  // =====================================================

  const cancelInvitation = async (invitationId: string) => {
    if (!currentOrg) {
      const errorMessage = "No hay una organización seleccionada";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    if (!hasPermission("manage_members")) {
      const errorMessage = "No tienes permiso para cancelar invitaciones";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    try {
      setError(null);

      const { error: cancelError } = await supabase
        .from("org_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId)
        .eq("org_id", currentOrg.id);

      if (cancelError) throw cancelError;

      // Actualizar estado local
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));

      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error cancelling invitation";
      setError(errorMessage);
      console.error("Error cancelling invitation:", err);
      return { success: false, error: errorMessage };
    }
  };

  // =====================================================
  // Resend Invitation
  // =====================================================

  const resendInvitation = async (invitationId: string) => {
    if (!currentOrg) {
      const errorMessage = "No hay una organización seleccionada";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    if (!hasPermission("manage_members")) {
      const errorMessage = "No tienes permiso para reenviar invitaciones";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    try {
      setError(null);

      // Extender la fecha de expiración
      const { data, error: updateError } = await supabase
        .from("org_invitations")
        .update({
          expires_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
        .eq("id", invitationId)
        .eq("org_id", currentOrg.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // TODO: Reenviar email de invitación aquí
      // await sendInvitationEmail(data);

      await fetchInvitations();

      return { success: true, data };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error resending invitation";
      setError(errorMessage);
      console.error("Error resending invitation:", err);
      return { success: false, error: errorMessage };
    }
  };

  // =====================================================
  // Load on Mount
  // =====================================================

  useEffect(() => {
    fetchMembers();
    fetchInvitations();
  }, [fetchMembers, fetchInvitations]);

  return {
    members,
    invitations,
    loading,
    error,
    inviteMember,
    updateMemberRole,
    removeMember,
    cancelInvitation,
    resendInvitation,
    refetchMembers: fetchMembers,
    refetchInvitations: fetchInvitations,
  };
}

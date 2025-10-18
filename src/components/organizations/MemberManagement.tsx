"use client";

import { useState } from "react";
import { useOrganization } from "@/context/OrganizationContext";
import { useOrgMembers } from "@/hooks/useOrgMembers";
import {
  UserPlus,
  Mail,
  Crown,
  Shield,
  Wrench,
  Eye,
  MoreVertical,
  Trash2,
  Edit,
  X,
} from "lucide-react";
import type { OrgRole } from "@/types/organization";

const ROLE_ICONS = {
  owner: Crown,
  admin: Shield,
  technician: Wrench,
  viewer: Eye,
};

const ROLE_COLORS = {
  owner: "text-yellow-600 dark:text-yellow-400",
  admin: "text-blue-600 dark:text-blue-400",
  technician: "text-green-600 dark:text-green-400",
  viewer: "text-gray-600 dark:text-gray-400",
};

const ROLE_LABELS = {
  owner: "Propietario",
  admin: "Administrador",
  technician: "Técnico",
  viewer: "Visualizador",
};

export function MemberManagement() {
  const { currentOrg, hasPermission, currentMembership } = useOrganization();
  const {
    members,
    invitations,
    loading,
    error,
    inviteMember,
    updateMemberRole,
    removeMember,
    cancelInvitation,
    resendInvitation,
  } = useOrgMembers();

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);

  const canManageMembers = hasPermission("manage_members");

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const role = formData.get("role") as OrgRole;

    if (!email || !role) return;

    setInviteLoading(true);
    try {
      const result = await inviteMember({ email, role });
      if (result.success) {
        setShowInviteDialog(false);
        e.currentTarget.reset();
      }
    } finally {
      setInviteLoading(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: OrgRole) => {
    await updateMemberRole(memberId, newRole);
    setEditingRole(null);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("¿Estás seguro de que deseas remover este miembro?")) return;
    await removeMember(memberId);
    setSelectedMember(null);
  };

  if (!currentOrg) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          Selecciona una organización para ver los miembros
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Miembros del Equipo</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestiona los miembros de {currentOrg.name}
          </p>
        </div>

        {canManageMembers && (
          <button
            onClick={() => setShowInviteDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Invitar Miembro
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold">
            Miembros Activos ({members.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No hay miembros en esta organización
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {members.map((member) => {
              const RoleIcon = ROLE_ICONS[member.role as OrgRole];
              const isCurrentUser = member.user_id === currentMembership?.user_id;

              return (
                <div
                  key={member.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-medium">
                      {member.user?.first_name?.[0] || member.user?.email?.[0].toUpperCase()}
                    </div>

                    {/* Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {member.user?.first_name} {member.user?.last_name}
                          {isCurrentUser && (
                            <span className="text-xs text-gray-500 ml-2">(Tú)</span>
                          )}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {member.user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Role badge */}
                    {editingRole === member.id && canManageMembers && member.role !== "owner" ? (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleUpdateRole(member.id, e.target.value as OrgRole)
                        }
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                      >
                        <option value="admin">Administrador</option>
                        <option value="technician">Técnico</option>
                        <option value="viewer">Visualizador</option>
                      </select>
                    ) : (
                      <div
                        className={`flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 ${
                          ROLE_COLORS[member.role as OrgRole]
                        }`}
                      >
                        <RoleIcon className="h-3 w-3" />
                        <span className="text-sm font-medium">
                          {ROLE_LABELS[member.role as OrgRole]}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    {canManageMembers && member.role !== "owner" && !isCurrentUser && (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setSelectedMember(
                              selectedMember === member.id ? null : member.id
                            )
                          }
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {selectedMember === member.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setSelectedMember(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]">
                              <button
                                onClick={() => {
                                  setEditingRole(member.id);
                                  setSelectedMember(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Cambiar rol
                              </button>
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                                Remover
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {canManageMembers && invitations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold">
              Invitaciones Pendientes ({invitations.length})
            </h3>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {invitations.map((invitation) => {
              const RoleIcon = ROLE_ICONS[invitation.role as OrgRole];
              const isExpired =
                new Date(invitation.expires_at) < new Date();

              return (
                <div
                  key={invitation.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-gray-500" />
                    </div>

                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isExpired ? "Expirada" : "Pendiente"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 ${
                        ROLE_COLORS[invitation.role as OrgRole]
                      }`}
                    >
                      <RoleIcon className="h-3 w-3" />
                      <span className="text-sm font-medium">
                        {ROLE_LABELS[invitation.role as OrgRole]}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {isExpired ? (
                        <button
                          onClick={() => resendInvitation(invitation.id)}
                          className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                        >
                          Reenviar
                        </button>
                      ) : null}
                      <button
                        onClick={() => cancelInvitation(invitation.id)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invite Dialog */}
      {showInviteDialog && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => !inviteLoading && setShowInviteDialog(false)}
          />

          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4">Invitar Miembro</h2>

              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    disabled={inviteLoading}
                    placeholder="usuario@ejemplo.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium mb-2">
                    Rol
                  </label>
                  <select
                    id="role"
                    name="role"
                    required
                    disabled={inviteLoading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    <option value="admin">Administrador</option>
                    <option value="technician">Técnico</option>
                    <option value="viewer">Visualizador</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    El rol determina los permisos del miembro
                  </p>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInviteDialog(false)}
                    disabled={inviteLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {inviteLoading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Enviar Invitación
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

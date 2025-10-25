import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

type OrganizationRow = Tables<"organizations">;
type OrgMemberRow = Tables<"org_members">;
type InvitationRow = Tables<"invitations">;
type OrgSettingsRow = Tables<"org_settings">;

// Roles disponibles en una organización
export type OrgRole = OrgMemberRow["role"];

// Estados de membresía
export type OrgMemberStatus = OrgMemberRow["status"];

// Estados de suscripción
export type SubscriptionStatus = OrganizationRow["subscription_status"];

// Planes de suscripción disponibles
export type SubscriptionPlan = OrganizationRow["subscription_plan"];

// Módulos disponibles en el sistema
export type Module = Extract<
  OrganizationRow["modules_enabled"][number],
  "entradas" | "ventas" | "compras" | "inventario"
>;

// =====================================================
// Organization Interface
// =====================================================

export interface Organization
  extends Omit<OrganizationRow, "branding" | "settings" | "modules_enabled"> {
  settings: Record<string, unknown>;
  branding: OrganizationBranding;
  modules_enabled: Module[];
}

// =====================================================
// Organization Branding
// =====================================================

export interface OrganizationBranding {
  logo_url?: string | null;
  primary_color?: string;
  secondary_color?: string;
  [key: string]: unknown;
}

// =====================================================
// Organization Member
// =====================================================

export interface OrgMember extends OrgMemberRow {
  user?: {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;

  organization?: Pick<Organization, "id" | "name" | "slug">;
}

// =====================================================
// Invitation
// =====================================================

export interface Invitation extends InvitationRow {
  organization?: Pick<Organization, "id" | "name" | "slug">;
  inviter?: {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

// =====================================================
// Organization Settings
// =====================================================

export interface OrgSettings
  extends Omit<
    OrgSettingsRow,
    | "entrada_estados_custom"
    | "email_templates"
    | "custom_fields_entradas"
    | "custom_fields_ventas"
    | "custom_fields_compras"
    | "custom_fields_inventario"
    | "integrations"
  > {
  entrada_estados_custom: string[] | null;
  email_templates: Record<string, unknown>;
  custom_fields_entradas: Record<string, unknown>[];
  custom_fields_ventas: Record<string, unknown>[];
  custom_fields_compras: Record<string, unknown>[];
  custom_fields_inventario: Record<string, unknown>[];
  integrations: Record<string, unknown>;
}

// =====================================================
// Organization Usage Stats
// =====================================================

export interface OrgUsageStats {
  current_users: number;
  max_users: number | null;
  current_entradas_this_month: number;
  max_entradas_per_month: number | null;
  storage_used_gb: number;
  max_storage_gb: number | null;
  users_status: 'ok' | 'warning' | 'limit_reached' | 'unlimited';
  entradas_status: 'ok' | 'warning' | 'limit_reached' | 'unlimited';
}

// =====================================================
// Organization with Extended Data
// =====================================================

export interface OrganizationWithStats extends Organization {
  member_count: number;
  current_usage: OrgUsageStats;
  is_owner: boolean;
  current_user_invited_role: OrgRole | null;
}

// =====================================================
// DTOs (Data Transfer Objects)
// =====================================================

type OrganizationInsert = TablesInsert<"organizations">;
type OrganizationUpdate = TablesUpdate<"organizations">;

export interface CreateOrganizationData {
  name: OrganizationInsert["name"];
  slug: OrganizationInsert["slug"];
  subscription_plan?: OrganizationInsert["subscription_plan"];
  timezone?: OrganizationInsert["timezone"];
  locale?: OrganizationInsert["locale"];
}

export interface UpdateOrganizationData
  extends Partial<
    Pick<
      OrganizationUpdate,
      "name" | "slug" | "settings" | "timezone" | "locale"
    >
  > {
  branding?: Partial<OrganizationBranding> | OrganizationUpdate["branding"];
}

export interface InviteMemberData {
  email: string;
  role: OrgRole;
}

export interface UpdateMemberRoleData {
  member_id: string;
  role: OrgRole;
}

export type UpdateOrgSettingsData = Partial<
  Omit<OrgSettings, "id" | "org_id" | "created_at" | "updated_at">
>;

// =====================================================
// Permission Helpers
// =====================================================

export const ROLE_PERMISSIONS: Record<OrgRole, string[]> = {
  owner: ['*'], // Todos los permisos
  admin: ['read', 'write', 'delete', 'manage_members', 'manage_settings'],
  technician: ['read', 'write'],
  viewer: ['read'],
};

export const ROLE_LABELS: Record<OrgRole, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  technician: 'Técnico',
  viewer: 'Visor',
};

export const ROLE_DESCRIPTIONS: Record<OrgRole, string> = {
  owner: 'Control total de la organización',
  admin: 'Gestión de miembros y configuración',
  technician: 'Crear y editar entradas',
  viewer: 'Solo lectura',
};

// =====================================================
// Helper Functions
// =====================================================

export function hasPermission(role: OrgRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes('*') || permissions.includes(permission);
}

export function canManageMembers(role: OrgRole): boolean {
  return hasPermission(role, 'manage_members');
}

export function canManageSettings(role: OrgRole): boolean {
  return hasPermission(role, 'manage_settings');
}

export function isInvitationExpired(invitation: Invitation): boolean {
  return new Date(invitation.expires_at) < new Date();
}

export function isInvitationAccepted(invitation: Invitation): boolean {
  return invitation.accepted_at !== null;
}

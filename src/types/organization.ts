// =====================================================
// Organization Types - Multi-Tenant System
// =====================================================

// Roles disponibles en una organización
export type OrgRole = 'owner' | 'admin' | 'technician' | 'viewer';

// Estados de membresía
export type OrgMemberStatus = 'active' | 'invited' | 'suspended';

// Estados de suscripción
export type SubscriptionStatus =
  | 'trial'
  | 'active'
  | 'cancelled'
  | 'suspended'
  | 'past_due';

// Planes de suscripción disponibles
export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise';

// Módulos disponibles en el sistema
export type Module = 'entradas' | 'ventas' | 'compras' | 'inventario';

// =====================================================
// Organization Interface
// =====================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;

  // Configuración
  settings: Record<string, unknown>;
  branding: OrganizationBranding;

  // Suscripción
  subscription_status: SubscriptionStatus;
  subscription_plan: SubscriptionPlan;
  trial_ends_at: string | null;

  // Límites del plan
  max_users: number;
  max_entradas_per_month: number;
  modules_enabled: Module[];

  // Stripe
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;

  // Regional
  timezone: string;
  locale: string;

  // Metadata
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// =====================================================
// Organization Branding
// =====================================================

export interface OrganizationBranding {
  logo_url?: string | null;
  primary_color?: string;
  secondary_color?: string;
}

// =====================================================
// Organization Member
// =====================================================

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  status: OrgMemberStatus;

  // Invitación
  invited_by: string | null;
  invited_at: string | null;
  joined_at: string | null;

  // Metadata
  created_at: string;
  updated_at: string;

  // Datos relacionados (joins)
  user?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };

  organization?: Pick<Organization, 'id' | 'name' | 'slug'>;
}

// =====================================================
// Invitation
// =====================================================

export interface Invitation {
  id: string;
  org_id: string;
  email: string;
  role: OrgRole;
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;

  // Datos relacionados
  organization?: Pick<Organization, 'id' | 'name' | 'slug'>;
  inviter?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

// =====================================================
// Organization Settings
// =====================================================

export interface OrgSettings {
  id: string;
  org_id: string;

  // Configuraciones de Entradas
  entrada_prefix: string;
  entrada_sequence_start: number;
  entrada_default_status: string;
  entrada_estados_custom: string[] | null;

  // Facturación
  tax_id: string | null;
  tax_name: string;
  tax_rate: number;
  invoice_prefix: string;
  invoice_sequence_start: number;
  invoice_footer: string | null;

  // Email/Notificaciones
  email_notifications_enabled: boolean;
  email_from_name: string | null;
  email_from_address: string | null;
  email_signature: string | null;
  email_templates: Record<string, unknown>;

  // Branding
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;

  // Impresión
  print_header: string | null;
  print_footer: string | null;
  print_paper_size: 'letter' | 'a4' | 'ticket';

  // Campos personalizados
  custom_fields_entradas: Record<string, unknown>[];
  custom_fields_ventas: Record<string, unknown>[];
  custom_fields_compras: Record<string, unknown>[];
  custom_fields_inventario: Record<string, unknown>[];

  // Integraciones
  integrations: Record<string, unknown>;

  // Seguridad
  require_2fa: boolean;
  session_timeout_minutes: number;
  password_expiry_days: number | null;

  // Formato
  date_format: string;
  time_format: '12h' | '24h';
  currency: string;
  currency_symbol: string;
  currency_position: 'before' | 'after';
  decimal_separator: string;
  thousands_separator: string;

  // Metadata
  created_at: string;
  updated_at: string;
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
  current_user_role: OrgRole;
}

// =====================================================
// DTOs (Data Transfer Objects)
// =====================================================

export interface CreateOrganizationData {
  name: string;
  slug: string;
  subscription_plan?: SubscriptionPlan;
  timezone?: string;
  locale?: string;
}

export interface UpdateOrganizationData {
  name?: string;
  slug?: string;
  settings?: Record<string, unknown>;
  branding?: Partial<OrganizationBranding>;
  timezone?: string;
  locale?: string;
}

export interface InviteMemberData {
  email: string;
  role: OrgRole;
}

export interface UpdateMemberRoleData {
  member_id: string;
  role: OrgRole;
}

export type UpdateOrgSettingsData = Partial<Omit<OrgSettings, 'id' | 'org_id' | 'created_at' | 'updated_at'>>;

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

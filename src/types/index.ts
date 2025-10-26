// =====================================================
// Central Type Exports
// =====================================================

// Profile Types
export type { UserProfile, UpdateProfileData } from './profile';

// Entrada Types
export type {
  Entrada,
  EstadoEntrada,
  CreateEntradaData,
  UpdateEntradaData,
  EntradasFilters,
} from './entradas';

// Contact Types
export type {
  Contact,
  CreateContactData,
  UpdateContactData,
  ContactModule,
  ContactAddress,
  ContactAvailability,
  ContactsFilters,
} from './contacts';
export { CONTACT_MODULES } from './contacts';
export { CONTACT_MODULE_LABELS } from './contacts';
export { CONTACT_ALL_AVAILABILITY } from './contacts';

// Organization Types
export type {
  Organization,
  OrganizationBranding,
  OrgMember,
  OrgMemberStatus,
  OrgRole,
  OrgSettings,
  OrgUsageStats,
  OrganizationWithStats,
  Invitation,
  CreateOrganizationData,
  UpdateOrganizationData,
  InviteMemberData,
  UpdateMemberRoleData,
  UpdateOrgSettingsData,
  SubscriptionStatus,
  SubscriptionPlan,
  Module,
} from './organization';

// Subscription Types
export type {
  SubscriptionPlanDetails,
  PlanFeature,
  BillingCycle,
  PlanComparison,
} from './subscription';

// Audit Types
export type {
  AuditLog,
  AuditAction,
  AuditEntityType,
  AuditMetadata,
  AuditLogWithUser,
  AuditFilters,
} from './audit';

// Re-export helper functions
export {
  hasPermission,
  canManageMembers,
  canManageSettings,
  isInvitationExpired,
  isInvitationAccepted,
  ROLE_PERMISSIONS,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
} from './organization';

export {
  getPlanDetails,
  formatPrice,
  calculateYearlySavings,
  getYearlySavingsPercentage,
  canUpgradeTo,
  isUnlimited,
  formatLimit,
  PLAN_FREE,
  PLAN_STARTER,
  PLAN_PROFESSIONAL,
  PLAN_ENTERPRISE,
  ALL_PLANS,
} from './subscription';

export {
  getActionLabel,
  getEntityTypeLabel,
  formatAuditMessage,
  ACTION_LABELS,
  ENTITY_TYPE_LABELS,
} from './audit';

// Integration Types
export type {
  ERPConnection,
  ERPConnectionFormState,
  ERPConnectionStatus,
  ERPAuthType,
} from './integrations';

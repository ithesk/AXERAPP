import type { Tables } from "@/types/supabase";

// Tipos de acciones registradas en audit logs
export type AuditAction = Tables<"audit_logs">["action"];

// Tipos de entidades que se pueden auditar
export type AuditEntityType =
  | 'entrada'
  | 'organization'
  | 'member'
  | 'invitation'
  | 'settings'
  | 'user'
  | 'subscription';

type AuditLogRow = Tables<"audit_logs">;

// Audit Log Interface
export interface AuditLog
  extends Omit<AuditLogRow, "old_data" | "new_data" | "metadata"> {
  entity_type: AuditEntityType;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  metadata: AuditMetadata;
}

// =====================================================
// Audit Metadata
// =====================================================

export interface AuditMetadata {
  ip_address?: string;
  user_agent?: string;
  location?: string;
  device?: string;
  [key: string]: string | undefined;
}

// =====================================================
// Audit Log with User Info (enriched)
// =====================================================

export interface AuditLogWithUser extends AuditLog {
  user_email: string | null;
  user_first_name: string | null;
  user_last_name: string | null;
  org_name: string | null;
}

// =====================================================
// Audit Filters
// =====================================================

export interface AuditFilters {
  action?: AuditAction;
  entity_type?: AuditEntityType;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// =====================================================
// Helper Functions
// =====================================================

export const ACTION_LABELS: Record<AuditAction, string> = {
  created: 'Creado',
  updated: 'Actualizado',
  deleted: 'Eliminado',
  viewed: 'Visto',
  exported: 'Exportado',
  login: 'Inicio de sesión',
  logout: 'Cierre de sesión',
};

export const ENTITY_TYPE_LABELS: Record<AuditEntityType, string> = {
  entrada: 'Entrada',
  organization: 'Organización',
  member: 'Miembro',
  invitation: 'Invitación',
  settings: 'Configuración',
  user: 'Usuario',
  subscription: 'Suscripción',
};

export function getActionLabel(action: AuditAction): string {
  return ACTION_LABELS[action] || action;
}

export function getEntityTypeLabel(entityType: AuditEntityType): string {
  return ENTITY_TYPE_LABELS[entityType] || entityType;
}

export function formatAuditMessage(log: AuditLogWithUser): string {
  const userName = log.user_first_name && log.user_last_name
    ? `${log.user_first_name} ${log.user_last_name}`
    : log.user_email || 'Usuario desconocido';

  const action = getActionLabel(log.action);
  const entity = getEntityTypeLabel(log.entity_type);

  return `${userName} ${action.toLowerCase()} ${entity.toLowerCase()}`;
}

/**
 * Notifications Types
 * Types for the notification system
 */

export type NotificationType =
  | 'entrada_status_change'
  | 'new_sale'
  | 'new_contact'
  | 'team_activity'
  | 'comment_added'
  | 'assignment'
  | 'system_alert';

export type EntityType =
  | 'entrada'
  | 'venta'
  | 'contacto'
  | 'compra'
  | 'inventario';

export interface Notification {
  id: string;
  org_id: string;
  user_id: string;

  // Content
  type: NotificationType;
  title: string;
  message: string;

  // Related entity
  entity_type?: EntityType | null;
  entity_id?: string | null;

  // Actor
  actor_id?: string | null;
  actor_name?: string | null;
  actor_avatar?: string | null;

  // Metadata
  metadata: Record<string, any>;

  // Status
  is_read: boolean;
  read_at?: string | null;

  // Action
  action_url?: string | null;

  created_at: string;
  updated_at: string;
}

export interface CreateNotificationData {
  type: NotificationType;
  title: string;
  message: string;
  entity_type?: EntityType | null;
  entity_id?: string | null;
  actor_id?: string | null;
  actor_name?: string | null;
  actor_avatar?: string | null;
  action_url?: string | null;
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  is_read?: boolean;
  type?: NotificationType;
  limit?: number;
}

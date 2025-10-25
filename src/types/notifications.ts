/**
 * Notifications Types
 * Types for the notification system
 */

import type { Tables, TablesInsert } from "@/types/supabase";

type NotificationRow = Tables<"notifications">;

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

export interface Notification
  extends Omit<NotificationRow, "metadata" | "entity_type"> {
  type: NotificationType;
  entity_type: EntityType | null;
  metadata: Record<string, unknown>;
}

export interface CreateNotificationData
  extends Omit<
    TablesInsert<"notifications">,
    "id" | "org_id" | "user_id" | "created_at" | "updated_at"
  > {
  type: NotificationType;
  entity_type?: EntityType | null;
  metadata?: Record<string, unknown>;
}

export interface NotificationFilters {
  is_read?: boolean;
  type?: NotificationType;
  limit?: number;
}

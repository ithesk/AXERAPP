import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

/**
 * WhatsApp integration settings persisted per organization.
 */
export type WhatsappSettingsRow = Tables<"whatsapp_settings">;

export type WhatsappSettings = WhatsappSettingsRow;

export type WhatsappSettingsInsert = TablesInsert<"whatsapp_settings">;

export type WhatsappSettingsUpdate = TablesUpdate<"whatsapp_settings">;

/**
 * Payload used by the dashboard to create or update WhatsApp settings.
 */
export interface WhatsappSettingsUpsertInput {
  api_url: string;
  enabled: boolean;
  org_id?: string;
}

/**
 * Successful response shape returned by the WhatsApp settings API route.
 */
export interface WhatsappSettingsResponse {
  settings: WhatsappSettings | null;
}

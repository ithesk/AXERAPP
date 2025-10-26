// =====================================================
// Integrations Types
// =====================================================

export type ERPAuthType = 'api_key' | 'oauth';
export type ERPConnectionStatus = 'connected' | 'disconnected' | 'pending' | 'error';

export interface ERPConnection {
  id: string;
  org_id: string;
  provider: string;
  base_url: string;
  company_id: number | null;
  database_name: string | null;
  auth_type: ERPAuthType;
  client_id: string | null;
  client_secret: string | null;
  api_key: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  status: ERPConnectionStatus;
  last_synced_at: string | null;
  last_error: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ERPConnectionFormState {
  base_url: string;
  database_name: string;
  company_id: string;
  auth_type: ERPAuthType;
  api_key: string;
  client_id: string;
  client_secret: string;
  status: ERPConnectionStatus;
}

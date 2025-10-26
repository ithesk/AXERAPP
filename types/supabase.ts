export type Database = {
     public: {
       tables: {
         users: {
           Row: {
             id: string;
             email: string;
             created_at: string;
             updated_at: string | null;
             full_name: string | null;
             avatar_url: string | null;
             role: string;
           };
           Insert: {
             id?: string;
             email: string;
             created_at?: string;
             updated_at?: string | null;
             full_name?: string | null;
             avatar_url?: string | null;
             role?: string;
           };
           Update: {
             id?: string;
             email?: string;
             created_at?: string;
             updated_at?: string | null;
             full_name?: string | null;
             avatar_url?: string | null;
             role?: string;
           };
         };
         erp_connections: {
           Row: {
             id: string;
             org_id: string;
             provider: string;
             base_url: string;
             company_id: number | null;
             database_name: string | null;
             auth_type: 'api_key' | 'oauth';
             client_id: string | null;
             client_secret: string | null;
             api_key: string | null;
             access_token: string | null;
             refresh_token: string | null;
             token_expires_at: string | null;
             status: 'disconnected' | 'connected' | 'error' | 'pending';
             last_synced_at: string | null;
             last_error: string | null;
             metadata: Record<string, unknown>;
             created_at: string;
             updated_at: string;
           };
           Insert: {
             id?: string;
             org_id: string;
             provider?: string;
             base_url: string;
             company_id?: number | null;
             database_name?: string | null;
             auth_type?: 'api_key' | 'oauth';
             client_id?: string | null;
             client_secret?: string | null;
             api_key?: string | null;
             access_token?: string | null;
             refresh_token?: string | null;
             token_expires_at?: string | null;
             status?: 'disconnected' | 'connected' | 'error' | 'pending';
             last_synced_at?: string | null;
             last_error?: string | null;
             metadata?: Record<string, unknown>;
             created_at?: string;
             updated_at?: string;
           };
           Update: {
             id?: string;
             org_id?: string;
             provider?: string;
             base_url?: string;
             company_id?: number | null;
             database_name?: string | null;
             auth_type?: 'api_key' | 'oauth';
             client_id?: string | null;
             client_secret?: string | null;
             api_key?: string | null;
             access_token?: string | null;
             refresh_token?: string | null;
             token_expires_at?: string | null;
             status?: 'disconnected' | 'connected' | 'error' | 'pending';
             last_synced_at?: string | null;
             last_error?: string | null;
             metadata?: Record<string, unknown>;
             created_at?: string;
             updated_at?: string;
           };
         };
         // Añadir más tablas según sea necesario
       };
       views: {
         [key: string]: {
           Row: Record<string, unknown>;
           Insert: Record<string, unknown>;
           Update: Record<string, unknown>;
         };
       };
       functions: {
         [key: string]: {
           Args: Record<string, unknown>;
           Returns: unknown;
         };
       };
     };
   };

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
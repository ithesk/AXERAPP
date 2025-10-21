export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string;
          org_id: string;
          user_id: string | null;
          action:
            | 'created'
            | 'updated'
            | 'deleted'
            | 'viewed'
            | 'exported'
            | 'login'
            | 'logout';
          entity_type: string;
          entity_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id?: string | null;
          action?:
            | 'created'
            | 'updated'
            | 'deleted'
            | 'viewed'
            | 'exported'
            | 'login'
            | 'logout';
          entity_type: string;
          entity_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string | null;
          action?:
            | 'created'
            | 'updated'
            | 'deleted'
            | 'viewed'
            | 'exported'
            | 'login'
            | 'logout';
          entity_type?: string;
          entity_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      brands: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          description: string | null;
          logo_url: string | null;
          website: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          description?: string | null;
          logo_url?: string | null;
          website?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          description?: string | null;
          logo_url?: string | null;
          website?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      budget_items: {
        Row: {
          id: string;
          budget_id: string;
          item_type: 'part' | 'labor';
          description: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          sku: string | null;
          notes: string | null;
          display_order: number | null;
          created_at: string;
          updated_at: string;
          product_id: string | null;
          is_custom: boolean;
        };
        Insert: {
          id?: string;
          budget_id: string;
          item_type: 'part' | 'labor';
          description: string;
          quantity?: number;
          unit_price?: number;
          subtotal?: number;
          sku?: string | null;
          notes?: string | null;
          display_order?: number | null;
          created_at?: string;
          updated_at?: string;
          product_id?: string | null;
          is_custom?: boolean;
        };
        Update: {
          id?: string;
          budget_id?: string;
          item_type?: 'part' | 'labor';
          description?: string;
          quantity?: number;
          unit_price?: number;
          subtotal?: number;
          sku?: string | null;
          notes?: string | null;
          display_order?: number | null;
          created_at?: string;
          updated_at?: string;
          product_id?: string | null;
          is_custom?: boolean;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          entrada_id: string;
          org_id: string;
          status: 'draft' | 'sent' | 'approved' | 'rejected';
          subtotal_parts: number;
          subtotal_labor: number;
          tax_percentage: number;
          tax_amount: number;
          discount_percentage: number;
          discount_amount: number;
          total: number;
          notes: string | null;
          valid_until: string | null;
          approved_at: string | null;
          rejected_at: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          entrada_id: string;
          org_id: string;
          status?: 'draft' | 'sent' | 'approved' | 'rejected';
          subtotal_parts?: number;
          subtotal_labor?: number;
          tax_percentage?: number;
          tax_amount?: number;
          discount_percentage?: number;
          discount_amount?: number;
          total?: number;
          notes?: string | null;
          valid_until?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          entrada_id?: string;
          org_id?: string;
          status?: 'draft' | 'sent' | 'approved' | 'rejected';
          subtotal_parts?: number;
          subtotal_labor?: number;
          tax_percentage?: number;
          tax_amount?: number;
          discount_percentage?: number;
          discount_amount?: number;
          total?: number;
          notes?: string | null;
          valid_until?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          description: string | null;
          icon: string | null;
          color: string | null;
          parent_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          parent_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          parent_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      common_problems: {
        Row: {
          id: string;
          org_id: string;
          problem_text: string;
          category: string | null;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          problem_text: string;
          category?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          problem_text?: string;
          category?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          phone: string | null;
          mobile: string | null;
          email: string | null;
          is_client: boolean;
          is_vendor: boolean;
          tax_id: string | null;
          website: string | null;
          avatar_url: string | null;
          tags: string[];
          address_line1: string | null;
          address_line2: string | null;
          address_city: string | null;
          address_state: string | null;
          address_postal_code: string | null;
          address_country: string | null;
          available_in_modules: string[];
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          phone?: string | null;
          mobile?: string | null;
          email?: string | null;
          is_client?: boolean;
          is_vendor?: boolean;
          tax_id?: string | null;
          website?: string | null;
          avatar_url?: string | null;
          tags?: string[];
          address_line1?: string | null;
          address_line2?: string | null;
          address_city?: string | null;
          address_state?: string | null;
          address_postal_code?: string | null;
          address_country?: string | null;
          available_in_modules?: string[];
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          phone?: string | null;
          mobile?: string | null;
          email?: string | null;
          is_client?: boolean;
          is_vendor?: boolean;
          tax_id?: string | null;
          website?: string | null;
          avatar_url?: string | null;
          tags?: string[];
          address_line1?: string | null;
          address_line2?: string | null;
          address_city?: string | null;
          address_state?: string | null;
          address_postal_code?: string | null;
          address_country?: string | null;
          available_in_modules?: string[];
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          created_by?: string | null;
        };
        Relationships: [];
      };
      device_models: {
        Row: {
          id: string;
          org_id: string;
          model_name: string;
          brand: string | null;
          category: string | null;
          reference: string | null;
          common_issues: string[] | null;
          repair_notes: string | null;
          estimated_repair_time: number | null;
          usage_count: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          model_name: string;
          brand?: string | null;
          category?: string | null;
          reference?: string | null;
          common_issues?: string[] | null;
          repair_notes?: string | null;
          estimated_repair_time?: number | null;
          usage_count?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          model_name?: string;
          brand?: string | null;
          category?: string | null;
          reference?: string | null;
          common_issues?: string[] | null;
          repair_notes?: string | null;
          estimated_repair_time?: number | null;
          usage_count?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      entradas: {
        Row: {
          id: string;
          org_id: string;
          id_reparacion: string;
          contact_id: string | null;
          device_model_id: string | null;
          nombre_cliente: string;
          telefono: string;
          modelo: string;
          problema: string;
          problema_detalle: string | null;
          accesorios: string | null;
          observaciones: string | null;
          tecnico_asignado: string | null;
          estado:
            | 'Cotización'
            | 'Inicio reparación'
            | 'En reparación'
            | 'Reparado'
            | 'Entregado'
            | 'Cancelado';
          fecha_entrada: string;
          fecha_actualizacion: string;
          usuario_id: string | null;
          created_at: string;
          updated_at: string;
          imei_sn: string | null;
          device_passwords: string | null;
          battery_condition: string | null;
          estimado_reparacion: number | null;
          check_face_id: boolean;
          check_signal: boolean;
          check_wifi: boolean;
          check_screen: boolean;
          check_true_tone: boolean;
          check_touch: boolean;
          check_camera: boolean;
          check_microphone: boolean;
          check_speaker: boolean;
          check_charging: boolean;
          check_buttons: boolean;
          check_panic: boolean;
          check_screws: boolean;
          check_earpiece: boolean;
          check_no_sim: boolean;
          check_flash: boolean;
          check_front_camera: boolean;
        };
        Insert: {
          id?: string;
          org_id: string;
          id_reparacion?: string;
          contact_id?: string | null;
          device_model_id?: string | null;
          nombre_cliente: string;
          telefono: string;
          modelo: string;
          problema: string;
          problema_detalle?: string | null;
          accesorios?: string | null;
          observaciones?: string | null;
          tecnico_asignado?: string | null;
          estado?:
            | 'Cotización'
            | 'Inicio reparación'
            | 'En reparación'
            | 'Reparado'
            | 'Entregado'
            | 'Cancelado';
          fecha_entrada?: string;
          fecha_actualizacion?: string;
          usuario_id?: string | null;
          created_at?: string;
          updated_at?: string;
          imei_sn?: string | null;
          device_passwords?: string | null;
          battery_condition?: string | null;
          estimado_reparacion?: number | null;
          check_face_id?: boolean;
          check_signal?: boolean;
          check_wifi?: boolean;
          check_screen?: boolean;
          check_true_tone?: boolean;
          check_touch?: boolean;
          check_camera?: boolean;
          check_microphone?: boolean;
          check_speaker?: boolean;
          check_charging?: boolean;
          check_buttons?: boolean;
          check_panic?: boolean;
          check_screws?: boolean;
          check_earpiece?: boolean;
          check_no_sim?: boolean;
          check_flash?: boolean;
          check_front_camera?: boolean;
        };
        Update: {
          id?: string;
          org_id?: string;
          id_reparacion?: string;
          contact_id?: string | null;
          device_model_id?: string | null;
          nombre_cliente?: string;
          telefono?: string;
          modelo?: string;
          problema?: string;
          problema_detalle?: string | null;
          accesorios?: string | null;
          observaciones?: string | null;
          tecnico_asignado?: string | null;
          estado?:
            | 'Cotización'
            | 'Inicio reparación'
            | 'En reparación'
            | 'Reparado'
            | 'Entregado'
            | 'Cancelado';
          fecha_entrada?: string;
          fecha_actualizacion?: string;
          usuario_id?: string | null;
          created_at?: string;
          updated_at?: string;
          imei_sn?: string | null;
          device_passwords?: string | null;
          battery_condition?: string | null;
          estimado_reparacion?: number | null;
          check_face_id?: boolean;
          check_signal?: boolean;
          check_wifi?: boolean;
          check_screen?: boolean;
          check_true_tone?: boolean;
          check_touch?: boolean;
          check_camera?: boolean;
          check_microphone?: boolean;
          check_speaker?: boolean;
          check_charging?: boolean;
          check_buttons?: boolean;
          check_panic?: boolean;
          check_screws?: boolean;
          check_earpiece?: boolean;
          check_no_sim?: boolean;
          check_flash?: boolean;
          check_front_camera?: boolean;
        };
        Relationships: [];
      };
      invitations: {
        Row: {
          id: string;
          org_id: string;
          email: string;
          role: 'admin' | 'technician' | 'viewer';
          invited_by: string;
          token: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          email: string;
          role?: 'admin' | 'technician' | 'viewer';
          invited_by: string;
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          email?: string;
          role?: 'admin' | 'technician' | 'viewer';
          invited_by?: string;
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      inventory_movements: {
        Row: {
          id: string;
          org_id: string;
          product_id: string;
          movement_type:
            | 'purchase'
            | 'sale'
            | 'adjustment'
            | 'return'
            | 'budget_reserve'
            | 'budget_release'
            | 'transfer_in'
            | 'transfer_out';
          quantity: number;
          stock_before: number;
          stock_after: number;
          reference_type: string | null;
          reference_id: string | null;
          unit_cost: number | null;
          total_cost: number | null;
          notes: string | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          product_id: string;
          movement_type:
            | 'purchase'
            | 'sale'
            | 'adjustment'
            | 'return'
            | 'budget_reserve'
            | 'budget_release'
            | 'transfer_in'
            | 'transfer_out';
          quantity: number;
          stock_before?: number;
          stock_after?: number;
          reference_type?: string | null;
          reference_id?: string | null;
          unit_cost?: number | null;
          total_cost?: number | null;
          notes?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          product_id?: string;
          movement_type?:
            | 'purchase'
            | 'sale'
            | 'adjustment'
            | 'return'
            | 'budget_reserve'
            | 'budget_release'
            | 'transfer_in'
            | 'transfer_out';
          quantity?: number;
          stock_before?: number;
          stock_after?: number;
          reference_type?: string | null;
          reference_id?: string | null;
          unit_cost?: number | null;
          total_cost?: number | null;
          notes?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          entity_type: string | null;
          entity_id: string | null;
          actor_id: string | null;
          actor_name: string | null;
          actor_avatar: string | null;
          metadata: Json;
          is_read: boolean;
          read_at: string | null;
          action_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          entity_type?: string | null;
          entity_id?: string | null;
          actor_id?: string | null;
          actor_name?: string | null;
          actor_avatar?: string | null;
          metadata?: Json;
          is_read?: boolean;
          read_at?: string | null;
          action_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          actor_id?: string | null;
          actor_name?: string | null;
          actor_avatar?: string | null;
          metadata?: Json;
          is_read?: boolean;
          read_at?: string | null;
          action_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      org_members: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'technician' | 'viewer';
          status: 'active' | 'invited' | 'suspended' | 'removed';
          invited_by: string | null;
          invited_at: string | null;
          joined_at: string | null;
          left_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          role?: 'owner' | 'admin' | 'technician' | 'viewer';
          status?: 'active' | 'invited' | 'suspended' | 'removed';
          invited_by?: string | null;
          invited_at?: string | null;
          joined_at?: string | null;
          left_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string;
          role?: 'owner' | 'admin' | 'technician' | 'viewer';
          status?: 'active' | 'invited' | 'suspended' | 'removed';
          invited_by?: string | null;
          invited_at?: string | null;
          joined_at?: string | null;
          left_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      org_settings: {
        Row: {
          id: string;
          org_id: string;
          entrada_prefix: string;
          entrada_sequence_start: number;
          entrada_default_status: string;
          entrada_estados_custom: Json;
          tax_id: string | null;
          tax_name: string;
          tax_rate: number;
          invoice_prefix: string;
          invoice_sequence_start: number;
          invoice_footer: string | null;
          email_notifications_enabled: boolean;
          email_from_name: string | null;
          email_from_address: string | null;
          email_signature: string | null;
          email_templates: Json;
          logo_url: string | null;
          primary_color: string;
          secondary_color: string;
          accent_color: string;
          print_header: string | null;
          print_footer: string | null;
          print_paper_size: 'letter' | 'a4' | 'ticket';
          custom_fields_entradas: Json;
          custom_fields_ventas: Json;
          custom_fields_compras: Json;
          custom_fields_inventario: Json;
          integrations: Json;
          require_2fa: boolean;
          session_timeout_minutes: number;
          password_expiry_days: number | null;
          date_format: string;
          time_format: '12h' | '24h';
          currency: string;
          currency_symbol: string;
          currency_position: 'before' | 'after';
          decimal_separator: string;
          thousands_separator: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          entrada_prefix?: string;
          entrada_sequence_start?: number;
          entrada_default_status?: string;
          entrada_estados_custom?: Json;
          tax_id?: string | null;
          tax_name?: string;
          tax_rate?: number;
          invoice_prefix?: string;
          invoice_sequence_start?: number;
          invoice_footer?: string | null;
          email_notifications_enabled?: boolean;
          email_from_name?: string | null;
          email_from_address?: string | null;
          email_signature?: string | null;
          email_templates?: Json;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          accent_color?: string;
          print_header?: string | null;
          print_footer?: string | null;
          print_paper_size?: 'letter' | 'a4' | 'ticket';
          custom_fields_entradas?: Json;
          custom_fields_ventas?: Json;
          custom_fields_compras?: Json;
          custom_fields_inventario?: Json;
          integrations?: Json;
          require_2fa?: boolean;
          session_timeout_minutes?: number;
          password_expiry_days?: number | null;
          date_format?: string;
          time_format?: '12h' | '24h';
          currency?: string;
          currency_symbol?: string;
          currency_position?: 'before' | 'after';
          decimal_separator?: string;
          thousands_separator?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          entrada_prefix?: string;
          entrada_sequence_start?: number;
          entrada_default_status?: string;
          entrada_estados_custom?: Json;
          tax_id?: string | null;
          tax_name?: string;
          tax_rate?: number;
          invoice_prefix?: string;
          invoice_sequence_start?: number;
          invoice_footer?: string | null;
          email_notifications_enabled?: boolean;
          email_from_name?: string | null;
          email_from_address?: string | null;
          email_signature?: string | null;
          email_templates?: Json;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          accent_color?: string;
          print_header?: string | null;
          print_footer?: string | null;
          print_paper_size?: 'letter' | 'a4' | 'ticket';
          custom_fields_entradas?: Json;
          custom_fields_ventas?: Json;
          custom_fields_compras?: Json;
          custom_fields_inventario?: Json;
          integrations?: Json;
          require_2fa?: boolean;
          session_timeout_minutes?: number;
          password_expiry_days?: number | null;
          date_format?: string;
          time_format?: '12h' | '24h';
          currency?: string;
          currency_symbol?: string;
          currency_position?: 'before' | 'after';
          decimal_separator?: string;
          thousands_separator?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          settings: Json;
          branding: Json;
          subscription_status:
            | 'trial'
            | 'active'
            | 'cancelled'
            | 'suspended'
            | 'past_due';
          subscription_plan: 'free' | 'starter' | 'professional' | 'enterprise';
          trial_ends_at: string | null;
          max_users: number;
          max_entradas_per_month: number;
          modules_enabled: string[];
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          timezone: string;
          locale: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          owner_id: string;
          settings?: Json;
          branding?: Json;
          subscription_status?:
            | 'trial'
            | 'active'
            | 'cancelled'
            | 'suspended'
            | 'past_due';
          subscription_plan?: 'free' | 'starter' | 'professional' | 'enterprise';
          trial_ends_at?: string | null;
          max_users?: number;
          max_entradas_per_month?: number;
          modules_enabled?: string[];
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          timezone?: string;
          locale?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          owner_id?: string;
          settings?: Json;
          branding?: Json;
          subscription_status?:
            | 'trial'
            | 'active'
            | 'cancelled'
            | 'suspended'
            | 'past_due';
          subscription_plan?: 'free' | 'starter' | 'professional' | 'enterprise';
          trial_ends_at?: string | null;
          max_users?: number;
          max_entradas_per_month?: number;
          modules_enabled?: string[];
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          timezone?: string;
          locale?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      product_tags: {
        Row: {
          product_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          product_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          product_id?: string;
          tag_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          description: string | null;
          sku: string | null;
          product_type: 'part' | 'service';
          sale_price: number;
          cost_price: number;
          track_inventory: boolean;
          current_stock: number;
          min_stock: number;
          max_stock: number | null;
          stock_unit: string;
          category_id: string | null;
          brand_id: string | null;
          is_active: boolean;
          notes: string | null;
          image_url: string | null;
          barcode: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          description?: string | null;
          sku?: string | null;
          product_type: 'part' | 'service';
          sale_price?: number;
          cost_price?: number;
          track_inventory?: boolean;
          current_stock?: number;
          min_stock?: number;
          max_stock?: number | null;
          stock_unit?: string;
          category_id?: string | null;
          brand_id?: string | null;
          is_active?: boolean;
          notes?: string | null;
          image_url?: string | null;
          barcode?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          description?: string | null;
          sku?: string | null;
          product_type?: 'part' | 'service';
          sale_price?: number;
          cost_price?: number;
          track_inventory?: boolean;
          current_stock?: number;
          min_stock?: number;
          max_stock?: number | null;
          stock_unit?: string;
          category_id?: string | null;
          brand_id?: string | null;
          is_active?: boolean;
          notes?: string | null;
          image_url?: string | null;
          barcode?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          updated_at: string | null;
          username: string | null;
          full_name: string | null;
          email: string | null;
          avatar_url: string | null;
          website: string | null;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          bio: string | null;
          role: string | null;
          location: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          postal_code: string | null;
          tax_id: string | null;
          facebook_url: string | null;
          twitter_url: string | null;
          linkedin_url: string | null;
          instagram_url: string | null;
          current_org_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          website?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          bio?: string | null;
          role?: string | null;
          location?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          postal_code?: string | null;
          tax_id?: string | null;
          facebook_url?: string | null;
          twitter_url?: string | null;
          linkedin_url?: string | null;
          instagram_url?: string | null;
          current_org_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          website?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          bio?: string | null;
          role?: string | null;
          location?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          postal_code?: string | null;
          tax_id?: string | null;
          facebook_url?: string | null;
          twitter_url?: string | null;
          linkedin_url?: string | null;
          instagram_url?: string | null;
          current_org_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      subscription_plans: {
        Row: {
          id: 'free' | 'starter' | 'professional' | 'enterprise';
          name: string;
          description: string | null;
          price_monthly: number | null;
          price_yearly: number | null;
          stripe_price_id_monthly: string | null;
          stripe_price_id_yearly: string | null;
          max_users: number | null;
          max_entradas_per_month: number | null;
          max_storage_gb: number | null;
          modules: string[];
          features: Json;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: 'free' | 'starter' | 'professional' | 'enterprise';
          name: string;
          description?: string | null;
          price_monthly?: number | null;
          price_yearly?: number | null;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_yearly?: string | null;
          max_users?: number | null;
          max_entradas_per_month?: number | null;
          max_storage_gb?: number | null;
          modules?: string[];
          features?: Json;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: 'free' | 'starter' | 'professional' | 'enterprise';
          name?: string;
          description?: string | null;
          price_monthly?: number | null;
          price_yearly?: number | null;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_yearly?: string | null;
          max_users?: number | null;
          max_entradas_per_month?: number | null;
          max_storage_gb?: number | null;
          modules?: string[];
          features?: Json;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          color: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          color?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          color?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      whatsapp_settings: {
        Row: {
          id: string;
          org_id: string;
          api_url: string;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          api_url: string;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          api_url?: string;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      profiles_with_org: {
        Row: {
          id: string | null;
          updated_at: string | null;
          username: string | null;
          full_name: string | null;
          email: string | null;
          avatar_url: string | null;
          website: string | null;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          bio: string | null;
          role: string | null;
          location: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          postal_code: string | null;
          tax_id: string | null;
          facebook_url: string | null;
          twitter_url: string | null;
          linkedin_url: string | null;
          instagram_url: string | null;
          current_org_id: string | null;
          created_at: string | null;
          org_id: string | null;
          org_name: string | null;
          org_slug: string | null;
          org_plan: string | null;
          org_subscription_status: string | null;
          org_role: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      create_inventory_movement: {
        Args: {
          p_org_id: string;
          p_product_id: string;
          p_movement_type: string;
          p_quantity: number;
          p_reference_type?: string | null;
          p_reference_id?: string | null;
          p_unit_cost?: number | null;
          p_notes?: string | null;
          p_created_by?: string | null;
        };
        Returns: string;
      };
      release_budget_inventory: {
        Args: {
          p_budget_id: string;
          p_created_by?: string | null;
        };
        Returns: null;
      };
      reserve_budget_inventory: {
        Args: {
          p_budget_id: string;
          p_created_by?: string | null;
        };
        Returns: null;
      };
      validate_budget_stock: {
        Args: {
          p_budget_id: string;
        };
        Returns: {
          product_id: string;
          product_name: string;
          required_quantity: number;
          available_stock: number;
          missing_quantity: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

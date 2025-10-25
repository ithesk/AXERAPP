import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

export type ContactModule = "entradas" | "ventas" | "compras" | "inventario";
export type ContactAvailability = "all" | ContactModule;

export const CONTACT_MODULES: ContactModule[] = [
  "entradas",
  "ventas",
  "compras",
  "inventario",
];
export const CONTACT_ALL_AVAILABILITY: ContactAvailability = "all";

export const CONTACT_MODULE_LABELS: Record<ContactModule, string> = {
  entradas: "Entradas",
  ventas: "Ventas",
  compras: "Compras",
  inventario: "Inventario",
};

export interface ContactAddress {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

type ContactRow = Tables<"contacts">;

export interface Contact extends ContactRow {
  address: ContactAddress;
  available_in_modules: ContactAvailability[];
}

type ContactInsert = TablesInsert<"contacts">;

export interface CreateContactData
  extends Omit<
    ContactInsert,
    | "id"
    | "org_id"
    | "created_at"
    | "updated_at"
    | "deleted_at"
    | "created_by"
    | "address_line1"
    | "address_line2"
    | "address_city"
    | "address_state"
    | "address_postal_code"
    | "address_country"
  > {
  address?: ContactAddress;
  available_in_modules?: ContactAvailability[];
}

type ContactUpdate = TablesUpdate<"contacts">;

export interface UpdateContactData
  extends Omit<
    ContactUpdate,
    | "org_id"
    | "created_at"
    | "updated_at"
    | "deleted_at"
    | "created_by"
    | "address_line1"
    | "address_line2"
    | "address_city"
    | "address_state"
    | "address_postal_code"
    | "address_country"
  > {
  address?: ContactAddress;
  available_in_modules?: ContactAvailability[];
}

export interface ContactsFilters {
  module?: ContactModule | "todos";
  search?: string;
  showArchived?: boolean;
}

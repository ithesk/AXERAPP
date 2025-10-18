export type ContactModule = "entradas" | "ventas" | "compras" | "inventario";
export type ContactAvailability = "all" | ContactModule;

export const CONTACT_MODULES: ContactModule[] = ["entradas", "ventas", "compras", "inventario"];
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

export interface Contact {
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
  address: ContactAddress;
  available_in_modules: ContactAvailability[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateContactData {
  name: string;
  phone?: string;
  mobile?: string;
  email?: string;
  is_client?: boolean;
  is_vendor?: boolean;
  tax_id?: string;
  website?: string;
  avatar_url?: string;
  tags?: string[];
  address?: ContactAddress;
  available_in_modules?: ContactAvailability[];
  notes?: string;
}

export interface UpdateContactData {
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
  address?: ContactAddress;
  available_in_modules?: ContactAvailability[];
  notes?: string | null;
}

export interface ContactsFilters {
  module?: ContactModule | "todos";
  search?: string;
  showArchived?: boolean;
}

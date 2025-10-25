import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

export type Entrada = Tables<"entradas">;

export type EstadoEntrada = Entrada["estado"];

export const ESTADOS_ENTRADA: EstadoEntrada[] = [
  "Cotización",
  "Inicio reparación",
  "En reparación",
  "Reparado",
  "Entregado",
  "Cancelado",
];

export type CreateEntradaData = Omit<
  TablesInsert<"entradas">,
  "org_id" | "usuario_id"
>;

export type UpdateEntradaData = Omit<
  TablesUpdate<"entradas">,
  "org_id" | "id"
>;

export interface EntradasFilters {
  search?: string;
  estado?: EstadoEntrada | "Todos";
  fecha_desde?: string;
  fecha_hasta?: string;
}

// Tipo para entradas con datos de contacto (cuando se hace JOIN con contactos)
export interface EntradaConContacto extends Entrada {
  contacto?: {
    nombre: string;
    apellido: string;
  } | null;
}

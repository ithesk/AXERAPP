export type EstadoEntrada = "Pendiente" | "En reparación" | "Listo" | "Entregado";

export interface Entrada {
  id: string;
  org_id: string; // NUEVO: ID de la organización (multi-tenant)
  id_reparacion: string;
  contact_id?: string | null;
  device_model_id?: string | null; // NUEVO: ID del modelo de dispositivo
  nombre_cliente: string;
  telefono: string;
  modelo: string;
  problema: string;
  accesorios?: string | null;
  observaciones?: string | null;
  tecnico_asignado?: string | null;
  estado: EstadoEntrada;
  fecha_entrada: string;
  fecha_actualizacion: string;
  usuario_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEntradaData {
  contact_id?: string | null;
  device_model_id?: string | null; // NUEVO: ID del modelo de dispositivo
  nombre_cliente: string;
  telefono: string;
  modelo: string;
  problema: string;
  accesorios?: string;
  observaciones?: string;
  tecnico_asignado?: string;
  estado?: EstadoEntrada;
}

export interface UpdateEntradaData {
  contact_id?: string | null;
  device_model_id?: string | null; // NUEVO: ID del modelo de dispositivo
  nombre_cliente?: string;
  telefono?: string;
  modelo?: string;
  problema?: string;
  accesorios?: string;
  observaciones?: string;
  tecnico_asignado?: string;
  estado?: EstadoEntrada;
}

export interface EntradasFilters {
  search?: string;
  estado?: EstadoEntrada | "Todos";
  fecha_desde?: string;
  fecha_hasta?: string;
}

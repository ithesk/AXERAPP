export type EstadoEntrada =
  | "Cotización"
  | "Inicio reparación"
  | "En reparación"
  | "Reparado"
  | "Entregado"
  | "Cancelado";

export const ESTADOS_ENTRADA: EstadoEntrada[] = [
  "Cotización",
  "Inicio reparación",
  "En reparación",
  "Reparado",
  "Entregado",
  "Cancelado",
];

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
  problema_detalle?: string | null; // Descripción detallada del problema
  accesorios?: string | null;
  observaciones?: string | null;
  tecnico_asignado?: string | null;
  estado: EstadoEntrada;
  fecha_entrada: string;
  fecha_actualizacion: string;
  usuario_id?: string | null;
  created_at: string;
  updated_at: string;
  imei_sn?: string | null;
  device_passwords?: string | null;
  battery_condition?: string | null;
  estimado_reparacion?: number | null; // Estimado de costo de reparación
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
}

export interface CreateEntradaData {
  contact_id?: string | null;
  device_model_id?: string | null; // NUEVO: ID del modelo de dispositivo
  nombre_cliente: string;
  telefono: string;
  modelo: string;
  problema: string;
  problema_detalle?: string; // Descripción detallada del problema
  accesorios?: string;
  observaciones?: string;
  tecnico_asignado?: string | null;
  estado?: EstadoEntrada;
  imei_sn?: string;
  device_passwords?: string;
  battery_condition?: string;
  estimado_reparacion?: number;
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
}

export interface UpdateEntradaData {
  contact_id?: string | null;
  device_model_id?: string | null; // NUEVO: ID del modelo de dispositivo
  nombre_cliente?: string;
  telefono?: string;
  modelo?: string;
  problema?: string;
  problema_detalle?: string | null; // Descripción detallada del problema
  accesorios?: string;
  observaciones?: string;
  tecnico_asignado?: string | null;
  estado?: EstadoEntrada;
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
}

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

/**
 * Tipos para el sistema de modelos de dispositivos
 */

// Categorías comunes de dispositivos
export type DeviceCategory =
  | "smartphone"
  | "tablet"
  | "laptop"
  | "desktop"
  | "smartwatch"
  | "consola"
  | "camara"
  | "audifonos"
  | "otro";

export const DEVICE_CATEGORY_LABELS: Record<DeviceCategory, string> = {
  smartphone: "Smartphone",
  tablet: "Tablet",
  laptop: "Laptop",
  desktop: "PC de Escritorio",
  smartwatch: "Smartwatch",
  consola: "Consola de Juegos",
  camara: "Cámara",
  audifonos: "Audífonos",
  otro: "Otro",
};

// Marcas/fabricantes comunes
export const COMMON_BRANDS = [
  "Apple",
  "Samsung",
  "Huawei",
  "Xiaomi",
  "Motorola",
  "LG",
  "Sony",
  "ASUS",
  "Lenovo",
  "HP",
  "Dell",
  "Acer",
  "MSI",
  "Razer",
  "Nintendo",
  "PlayStation",
  "Xbox",
  "GoPro",
  "Canon",
  "Nikon",
  "Bose",
  "JBL",
  "Beats",
  "OnePlus",
  "Oppo",
  "Vivo",
  "Realme",
  "Google",
  "Microsoft",
  "Otro",
] as const;

// Modelo de dispositivo completo (desde la base de datos)
export interface DeviceModel {
  id: string;
  org_id: string;
  model_name: string;
  brand: string | null;
  category: string | null;
  reference: string | null;
  common_issues: string[];
  repair_notes: string | null;
  estimated_repair_time: number | null; // en minutos
  usage_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Datos para crear un nuevo modelo
export interface CreateDeviceModelData {
  model_name: string;
  brand?: string;
  category?: string;
  reference?: string;
  common_issues?: string[];
  repair_notes?: string;
  estimated_repair_time?: number;
}

// Datos para actualizar un modelo existente
export interface UpdateDeviceModelData {
  model_name?: string;
  brand?: string | null;
  category?: string | null;
  reference?: string | null;
  common_issues?: string[];
  repair_notes?: string | null;
  estimated_repair_time?: number | null;
}

// Resultado de mutaciones (crear/actualizar/eliminar)
export interface DeviceModelMutationResult {
  success: boolean;
  data?: DeviceModel;
  error?: string;
}

export interface DeviceModelDeleteResult {
  success: boolean;
  error?: string;
}

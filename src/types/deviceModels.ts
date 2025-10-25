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

import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

type DeviceModelRow = Tables<"device_models">;

// Modelo de dispositivo completo (desde la base de datos)
export interface DeviceModel extends DeviceModelRow {
  common_issues: string[] | null;
}

// Datos para crear un nuevo modelo
export type CreateDeviceModelData = Omit<
  TablesInsert<"device_models">,
  "id" | "org_id" | "created_at" | "updated_at" | "deleted_at" | "usage_count"
>;

// Datos para actualizar un modelo existente
export type UpdateDeviceModelData = Omit<
  TablesUpdate<"device_models">,
  "org_id" | "created_at" | "updated_at" | "deleted_at" | "usage_count"
>;

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

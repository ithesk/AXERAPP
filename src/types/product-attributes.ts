import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

type BrandRow = Tables<"brands">;
type CategoryRow = Tables<"categories">;
type TagRow = Tables<"tags">;
type ProductTagRow = Tables<"product_tags">;

export type Brand = BrandRow;

export type CreateBrandData = Omit<
  TablesInsert<"brands">,
  "id" | "org_id" | "created_at" | "updated_at" | "created_by"
>;

export type UpdateBrandData = Omit<
  TablesUpdate<"brands">,
  "org_id" | "created_at" | "updated_at" | "created_by"
>;

export interface Category extends CategoryRow {
  parent?: Category | null;
  children?: Category[];
}

export type CreateCategoryData = Omit<
  TablesInsert<"categories">,
  "id" | "org_id" | "created_at" | "updated_at" | "created_by"
>;

export type UpdateCategoryData = Omit<
  TablesUpdate<"categories">,
  "org_id" | "created_at" | "updated_at" | "created_by"
>;

export type Tag = TagRow;

export type CreateTagData = Omit<
  TablesInsert<"tags">,
  "id" | "org_id" | "created_at" | "updated_at" | "created_by"
>;

export type UpdateTagData = Omit<
  TablesUpdate<"tags">,
  "org_id" | "created_at" | "updated_at" | "created_by"
>;

export interface ProductTag extends ProductTagRow {
  tag?: Tag;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Colores predefinidos para tags
 */
export const TAG_COLORS = [
  { name: "Azul", value: "#3B82F6" },
  { name: "Verde", value: "#10B981" },
  { name: "Rojo", value: "#EF4444" },
  { name: "Amarillo", value: "#F59E0B" },
  { name: "Púrpura", value: "#8B5CF6" },
  { name: "Rosa", value: "#EC4899" },
  { name: "Índigo", value: "#6366F1" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Naranja", value: "#F97316" },
  { name: "Gris", value: "#6B7280" },
];

/**
 * Obtiene el nombre del color por su valor hex
 */
export function getColorName(hex: string): string {
  const color = TAG_COLORS.find((c) => c.value.toLowerCase() === hex.toLowerCase());
  return color?.name || "Personalizado";
}

/**
 * Valida si un color hex es válido
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

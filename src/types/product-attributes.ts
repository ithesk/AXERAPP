// =====================================================
// TYPES: Product Attributes (Brands, Categories, Tags)
// =====================================================

// =====================================================
// BRANDS (Marcas)
// =====================================================
export interface Brand {
  id: string;
  org_id: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  website?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface CreateBrandData {
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  is_active?: boolean;
}

export interface UpdateBrandData {
  name?: string;
  description?: string;
  logo_url?: string;
  website?: string;
  is_active?: boolean;
}

// =====================================================
// CATEGORIES (Categorías)
// =====================================================
export interface Category {
  id: string;
  org_id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  parent_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;

  // Relaciones
  parent?: Category | null;
  children?: Category[];
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parent_id?: string;
  is_active?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  parent_id?: string;
  is_active?: boolean;
}

// =====================================================
// TAGS (Etiquetas)
// =====================================================
export interface Tag {
  id: string;
  org_id: string;
  name: string;
  color: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface CreateTagData {
  name: string;
  color?: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateTagData {
  name?: string;
  color?: string;
  description?: string;
  is_active?: boolean;
}

// =====================================================
// PRODUCT TAGS (Relación)
// =====================================================
export interface ProductTag {
  product_id: string;
  tag_id: string;
  created_at: string;
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

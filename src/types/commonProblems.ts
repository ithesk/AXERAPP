/**
 * Common Problems Types
 * Types for managing the catalog of common device problems
 */

export interface CommonProblem {
  id: string;
  org_id: string;
  problem_text: string;
  category: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CreateCommonProblemData {
  problem_text: string;
  category?: string | null;
  is_active?: boolean;
  display_order?: number;
}

export interface UpdateCommonProblemData {
  problem_text?: string;
  category?: string | null;
  is_active?: boolean;
  display_order?: number;
}

export interface CommonProblemsFilters {
  category?: string;
  is_active?: boolean;
  search?: string;
}

export const COMMON_PROBLEM_CATEGORIES = [
  'Pantalla',
  'Batería',
  'Carga',
  'Botones',
  'Audio',
  'Cámaras',
  'Conectividad',
  'Software',
  'Daño Físico',
  'Sensores',
  'Servicios',
  'Otros',
] as const;

export type CommonProblemCategory = typeof COMMON_PROBLEM_CATEGORIES[number];

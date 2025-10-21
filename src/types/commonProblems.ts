import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

type CommonProblemRow = Tables<"common_problems">;

export type CommonProblem = CommonProblemRow;

export type CreateCommonProblemData = Omit<
  TablesInsert<"common_problems">,
  "id" | "org_id" | "created_at" | "updated_at" | "created_by"
>;

export type UpdateCommonProblemData = Omit<
  TablesUpdate<"common_problems">,
  "org_id" | "created_at" | "updated_at" | "created_by"
>;

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

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  CommonProblem,
  CreateCommonProblemData,
  UpdateCommonProblemData,
  CommonProblemsFilters,
} from "@/types/commonProblems";
import { useUser } from "@/context/UserContext";

interface UseCommonProblemsResult {
  problems: CommonProblem[];
  loading: boolean;
  error: string | null;
  createProblem: (
    data: CreateCommonProblemData
  ) => Promise<{ success: boolean; error?: string; data?: CommonProblem }>;
  updateProblem: (
    id: string,
    data: UpdateCommonProblemData
  ) => Promise<{ success: boolean; error?: string }>;
  deleteProblem: (id: string) => Promise<{ success: boolean; error?: string }>;
  refetch: () => void;
}

export function useCommonProblems(
  filters?: CommonProblemsFilters
): UseCommonProblemsResult {
  const { profile } = useUser();
  const [problems, setProblems] = useState<CommonProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProblems = useCallback(async () => {
    if (!profile?.org_id) {
      setProblems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      let query = supabase
        .from("common_problems")
        .select("*")
        .eq("org_id", profile.org_id);

      // Apply filters
      if (filters?.category) {
        query = query.eq("category", filters.category);
      }

      if (filters?.is_active !== undefined) {
        query = query.eq("is_active", filters.is_active);
      }

      if (filters?.search && filters.search.trim().length > 0) {
        query = query.ilike("problem_text", `%${filters.search}%`);
      }

      // Order by display_order and problem_text
      query = query.order("display_order", { ascending: true })
        .order("problem_text", { ascending: true });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error("[useCommonProblems] Error fetching:", fetchError);
        setError(fetchError.message);
        setProblems([]);
        return;
      }

      setProblems(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[useCommonProblems] Unexpected error:", err);
      setError(message);
      setProblems([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.org_id, filters?.category, filters?.is_active, filters?.search]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const createProblem = async (
    data: CreateCommonProblemData
  ): Promise<{ success: boolean; error?: string; data?: CommonProblem }> => {
    if (!profile?.org_id || !profile?.id) {
      return { success: false, error: "No organization or user found" };
    }

    try {
      const supabase = createClient();
      const { data: newProblem, error: createError } = await supabase
        .from("common_problems")
        .insert({
          org_id: profile.org_id,
          created_by: profile.id,
          problem_text: data.problem_text.trim(),
          category: data.category || null,
          is_active: data.is_active ?? true,
          display_order: data.display_order ?? 0,
        })
        .select()
        .single();

      if (createError) {
        console.error("[useCommonProblems] Create error:", createError);
        return { success: false, error: createError.message };
      }

      // Refresh the list
      await fetchProblems();

      return { success: true, data: newProblem };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[useCommonProblems] Create unexpected error:", err);
      return { success: false, error: message };
    }
  };

  const updateProblem = async (
    id: string,
    data: UpdateCommonProblemData
  ): Promise<{ success: boolean; error?: string }> => {
    if (!profile?.org_id) {
      return { success: false, error: "No organization found" };
    }

    try {
      const supabase = createClient();
      const updateData: Record<string, unknown> = {};

      if (data.problem_text !== undefined) {
        updateData.problem_text = data.problem_text.trim();
      }
      if (data.category !== undefined) {
        updateData.category = data.category;
      }
      if (data.is_active !== undefined) {
        updateData.is_active = data.is_active;
      }
      if (data.display_order !== undefined) {
        updateData.display_order = data.display_order;
      }

      const { error: updateError } = await supabase
        .from("common_problems")
        .update(updateData)
        .eq("id", id)
        .eq("org_id", profile.org_id);

      if (updateError) {
        console.error("[useCommonProblems] Update error:", updateError);
        return { success: false, error: updateError.message };
      }

      // Refresh the list
      await fetchProblems();

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[useCommonProblems] Update unexpected error:", err);
      return { success: false, error: message };
    }
  };

  const deleteProblem = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!profile?.org_id) {
      return { success: false, error: "No organization found" };
    }

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("common_problems")
        .delete()
        .eq("id", id)
        .eq("org_id", profile.org_id);

      if (deleteError) {
        console.error("[useCommonProblems] Delete error:", deleteError);
        return { success: false, error: deleteError.message };
      }

      // Refresh the list
      await fetchProblems();

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[useCommonProblems] Delete unexpected error:", err);
      return { success: false, error: message };
    }
  };

  return {
    problems,
    loading,
    error,
    createProblem,
    updateProblem,
    deleteProblem,
    refetch: fetchProblems,
  };
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "@/context/OrganizationContext";
import type { Category, CreateCategoryData, UpdateCategoryData } from "@/types/product-attributes";

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  createCategory: (data: CreateCategoryData) => Promise<{ success: boolean; data?: Category; error?: string }>;
  updateCategory: (id: string, data: UpdateCategoryData) => Promise<{ success: boolean; error?: string }>;
  deleteCategory: (id: string) => Promise<{ success: boolean; error?: string }>;
  refreshCategories: () => Promise<void>;
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentOrg } = useOrganization();
  const supabase = createClient();

  const loadCategories = useCallback(async () => {
    if (!currentOrg?.id) {
      setCategories([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("categories")
        .select("*")
        .eq("org_id", currentOrg.id)
        .order("name", { ascending: true });

      if (fetchError) throw fetchError;

      setCategories(data || []);
    } catch (err: any) {
      console.error("[useCategories] Error al cargar categorías:", err);
      setError(err.message);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id, supabase]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const createCategory = useCallback(
    async (data: CreateCategoryData) => {
      if (!currentOrg?.id) {
        return { success: false, error: "No hay organización seleccionada" };
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();

        const { data: newCategory, error: insertError } = await supabase
          .from("categories")
          .insert({
            org_id: currentOrg.id,
            name: data.name.trim(),
            description: data.description?.trim() || null,
            icon: data.icon?.trim() || null,
            color: data.color || null,
            parent_id: data.parent_id || null,
            is_active: data.is_active ?? true,
            created_by: user?.id || null,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        await loadCategories();
        return { success: true, data: newCategory };
      } catch (err: any) {
        console.error("[useCategories] Error al crear categoría:", err);
        return { success: false, error: err.message };
      }
    },
    [currentOrg?.id, supabase, loadCategories]
  );

  const updateCategory = useCallback(
    async (id: string, data: UpdateCategoryData) => {
      try {
        const updateData: any = {};

        if (data.name !== undefined) updateData.name = data.name.trim();
        if (data.description !== undefined) updateData.description = data.description?.trim() || null;
        if (data.icon !== undefined) updateData.icon = data.icon?.trim() || null;
        if (data.color !== undefined) updateData.color = data.color || null;
        if (data.parent_id !== undefined) updateData.parent_id = data.parent_id || null;
        if (data.is_active !== undefined) updateData.is_active = data.is_active;

        const { error: updateError } = await supabase
          .from("categories")
          .update(updateData)
          .eq("id", id);

        if (updateError) throw updateError;

        await loadCategories();
        return { success: true };
      } catch (err: any) {
        console.error("[useCategories] Error al actualizar categoría:", err);
        return { success: false, error: err.message };
      }
    },
    [supabase, loadCategories]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      try {
        const { error: deleteError } = await supabase
          .from("categories")
          .delete()
          .eq("id", id);

        if (deleteError) throw deleteError;

        await loadCategories();
        return { success: true };
      } catch (err: any) {
        console.error("[useCategories] Error al eliminar categoría:", err);
        return { success: false, error: err.message };
      }
    },
    [supabase, loadCategories]
  );

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshCategories: loadCategories,
  };
}

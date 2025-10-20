"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "@/context/OrganizationContext";
import type { Tag, CreateTagData, UpdateTagData } from "@/types/product-attributes";

interface UseTagsReturn {
  tags: Tag[];
  loading: boolean;
  error: string | null;
  createTag: (data: CreateTagData) => Promise<{ success: boolean; data?: Tag; error?: string }>;
  updateTag: (id: string, data: UpdateTagData) => Promise<{ success: boolean; error?: string }>;
  deleteTag: (id: string) => Promise<{ success: boolean; error?: string }>;
  refreshTags: () => Promise<void>;
}

export function useTags(): UseTagsReturn {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentOrg } = useOrganization();
  const supabase = createClient();

  const loadTags = useCallback(async () => {
    if (!currentOrg?.id) {
      setTags([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("tags")
        .select("*")
        .eq("org_id", currentOrg.id)
        .order("name", { ascending: true });

      if (fetchError) throw fetchError;

      setTags(data || []);
    } catch (err: any) {
      console.error("[useTags] Error al cargar etiquetas:", err);
      setError(err.message);
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id, supabase]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const createTag = useCallback(
    async (data: CreateTagData) => {
      if (!currentOrg?.id) {
        return { success: false, error: "No hay organización seleccionada" };
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();

        const { data: newTag, error: insertError } = await supabase
          .from("tags")
          .insert({
            org_id: currentOrg.id,
            name: data.name.trim(),
            color: data.color || "#3B82F6",
            description: data.description?.trim() || null,
            is_active: data.is_active ?? true,
            created_by: user?.id || null,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        await loadTags();
        return { success: true, data: newTag };
      } catch (err: any) {
        console.error("[useTags] Error al crear etiqueta:", err);
        return { success: false, error: err.message };
      }
    },
    [currentOrg?.id, supabase, loadTags]
  );

  const updateTag = useCallback(
    async (id: string, data: UpdateTagData) => {
      try {
        const updateData: any = {};

        if (data.name !== undefined) updateData.name = data.name.trim();
        if (data.color !== undefined) updateData.color = data.color;
        if (data.description !== undefined) updateData.description = data.description?.trim() || null;
        if (data.is_active !== undefined) updateData.is_active = data.is_active;

        const { error: updateError } = await supabase
          .from("tags")
          .update(updateData)
          .eq("id", id);

        if (updateError) throw updateError;

        await loadTags();
        return { success: true };
      } catch (err: any) {
        console.error("[useTags] Error al actualizar etiqueta:", err);
        return { success: false, error: err.message };
      }
    },
    [supabase, loadTags]
  );

  const deleteTag = useCallback(
    async (id: string) => {
      try {
        const { error: deleteError } = await supabase
          .from("tags")
          .delete()
          .eq("id", id);

        if (deleteError) throw deleteError;

        await loadTags();
        return { success: true };
      } catch (err: any) {
        console.error("[useTags] Error al eliminar etiqueta:", err);
        return { success: false, error: err.message };
      }
    },
    [supabase, loadTags]
  );

  return {
    tags,
    loading,
    error,
    createTag,
    updateTag,
    deleteTag,
    refreshTags: loadTags,
  };
}

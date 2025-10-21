"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "@/context/OrganizationContext";
import type { Brand, CreateBrandData, UpdateBrandData } from "@/types/product-attributes";

interface UseBrandsReturn {
  brands: Brand[];
  loading: boolean;
  error: string | null;
  createBrand: (data: CreateBrandData) => Promise<{ success: boolean; data?: Brand; error?: string }>;
  updateBrand: (id: string, data: UpdateBrandData) => Promise<{ success: boolean; error?: string }>;
  deleteBrand: (id: string) => Promise<{ success: boolean; error?: string }>;
  refreshBrands: () => Promise<void>;
}

export function useBrands(): UseBrandsReturn {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentOrg } = useOrganization();
  const supabase = createClient();

  // Cargar marcas
  const loadBrands = useCallback(async () => {
    if (!currentOrg?.id) {
      setBrands([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("brands")
        .select("*")
        .eq("org_id", currentOrg.id)
        .order("name", { ascending: true });

      if (fetchError) throw fetchError;

      setBrands(data || []);
    } catch (err: any) {
      console.error("[useBrands] Error al cargar marcas:", err);
      setError(err.message);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id, supabase]);

  // Cargar al montar y cuando cambie la organización
  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  // Crear marca
  const createBrand = useCallback(
    async (data: CreateBrandData) => {
      if (!currentOrg?.id) {
        return { success: false, error: "No hay organización seleccionada" };
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();

        const { data: newBrand, error: insertError } = await supabase
          .from("brands")
          .insert({
            org_id: currentOrg.id,
            name: data.name.trim(),
            description: data.description?.trim() || null,
            logo_url: data.logo_url?.trim() || null,
            website: data.website?.trim() || null,
            is_active: data.is_active ?? true,
            created_by: user?.id || null,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        await loadBrands();
        return { success: true, data: newBrand };
      } catch (err: any) {
        console.error("[useBrands] Error al crear marca:", err);
        return { success: false, error: err.message };
      }
    },
    [currentOrg?.id, supabase, loadBrands]
  );

  // Actualizar marca
  const updateBrand = useCallback(
    async (id: string, data: UpdateBrandData) => {
      if (!currentOrg?.id) {
        return { success: false, error: "No hay organización seleccionada" };
      }

      try {
        const updateData: any = {};

        if (data.name !== undefined) updateData.name = data.name.trim();
        if (data.description !== undefined) updateData.description = data.description?.trim() || null;
        if (data.logo_url !== undefined) updateData.logo_url = data.logo_url?.trim() || null;
        if (data.website !== undefined) updateData.website = data.website?.trim() || null;
        if (data.is_active !== undefined) updateData.is_active = data.is_active;

        const { error: updateError } = await supabase
          .from("brands")
          .update(updateData)
          .eq("id", id)
          .eq("org_id", currentOrg.id);

        if (updateError) throw updateError;

        await loadBrands();
        return { success: true };
      } catch (err: any) {
        console.error("[useBrands] Error al actualizar marca:", err);
        return { success: false, error: err.message };
      }
    },
    [supabase, loadBrands, currentOrg?.id]
  );

  // Eliminar marca
  const deleteBrand = useCallback(
    async (id: string) => {
      if (!currentOrg?.id) {
        return { success: false, error: "No hay organización seleccionada" };
      }

      try {
        const { error: deleteError } = await supabase
          .from("brands")
          .delete()
          .eq("id", id)
          .eq("org_id", currentOrg.id);

        if (deleteError) throw deleteError;

        await loadBrands();
        return { success: true };
      } catch (err: any) {
        console.error("[useBrands] Error al eliminar marca:", err);
        return { success: false, error: err.message };
      }
    },
    [supabase, loadBrands, currentOrg?.id]
  );

  return {
    brands,
    loading,
    error,
    createBrand,
    updateBrand,
    deleteBrand,
    refreshBrands: loadBrands,
  };
}

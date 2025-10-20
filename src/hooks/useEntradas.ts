"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useOrganization } from "@/context/OrganizationContext"; // NUEVO
import type {
  Entrada,
  CreateEntradaData,
  UpdateEntradaData,
  EntradasFilters,
} from "@/types/entradas";

export function useEntradas(filters?: EntradasFilters) {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  const { currentOrg } = useOrganization(); // NUEVO: Obtener organización actual

  // Fetch entradas
  const fetchEntradas = async () => {
    // Si no hay organización actual, no cargar nada
    if (!currentOrg) {
      setEntradas([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("entradas")
        .select("*")
        .eq("org_id", currentOrg.id) // NUEVO: Filtrar por organización
        .order("fecha_entrada", { ascending: false });

      // Apply filters
      if (filters?.estado && filters.estado !== "Todos") {
        query = query.eq("estado", filters.estado);
      }

      if (filters?.fecha_desde) {
        query = query.gte("fecha_entrada", filters.fecha_desde);
      }

      if (filters?.fecha_hasta) {
        query = query.lte("fecha_entrada", filters.fecha_hasta);
      }

      if (filters?.search && filters.search.trim() !== "") {
        // Search in multiple fields
        query = query.or(
          `nombre_cliente.ilike.%${filters.search}%,` +
          `telefono.ilike.%${filters.search}%,` +
          `modelo.ilike.%${filters.search}%,` +
          `problema.ilike.%${filters.search}%,` +
          `id_reparacion.ilike.%${filters.search}%`
        );
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setEntradas(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching entradas");
      console.error("Error fetching entradas:", err);
    } finally {
      setLoading(false);
    }
  };

  // Create entrada
  const createEntrada = async (data: CreateEntradaData) => {
    // Verificar que haya una organización actual
    if (!currentOrg) {
      const errorMessage = "No hay una organización seleccionada";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    try {
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const insertPayload = {
        ...data,
        org_id: currentOrg.id, // NUEVO: Agregar org_id
        usuario_id: user?.id,
      };

      console.debug("[useEntradas] Creando entrada", insertPayload);

      const { data: newEntrada, error: createError } = await supabase
        .from("entradas")
        .insert([insertPayload])
        .select()
        .single();

      if (createError) throw createError;

      // Refresh list
      await fetchEntradas();

      return { success: true, data: newEntrada };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error creating entrada";
      setError(errorMessage);
      console.error("[useEntradas] Error creando entrada:", {
        error: err,
        payload: data,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Update entrada
  const updateEntrada = async (id: string, updates: UpdateEntradaData) => {
    if (!currentOrg) {
      const errorMessage = "No hay una organización seleccionada";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    try {
      setError(null);

      console.log('[useEntradas] Actualizando entrada:', { id, updates });
      console.log('[useEntradas] Tipo de updates.estado:', typeof updates.estado, updates.estado);

      const sanitizedUpdates = { ...updates } as Record<string, unknown>;
      delete sanitizedUpdates.org_id;

      const { data, error: updateError } = await supabase
        .from("entradas")
        .update(sanitizedUpdates)
        .match({ id, org_id: currentOrg.id })
        .select()
        .single();

      if (updateError) {
        console.error('[useEntradas] Error de Supabase COMPLETO:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
          fullError: updateError
        });
        throw updateError;
      }

      console.log('[useEntradas] Entrada actualizada exitosamente:', data);

      // Update local state
      setEntradas((prev) =>
        prev.map((entrada) => (entrada.id === id ? data : entrada))
      );

      return { success: true, data };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error updating entrada";
      setError(errorMessage);
      console.error("[useEntradas] Error updating entrada:", {
        error: err,
        id,
        updates,
        errorName: err instanceof Error ? err.name : 'unknown',
        errorMessage: err instanceof Error ? err.message : 'unknown',
        fullError: JSON.stringify(err, null, 2)
      });
      return { success: false, error: errorMessage };
    }
  };

  // Delete entrada
  const deleteEntrada = async (id: string) => {
    if (!currentOrg) {
      const errorMessage = "No hay una organización seleccionada";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from("entradas")
        .delete()
        .match({ id, org_id: currentOrg.id });

      if (deleteError) throw deleteError;

      // Update local state
      setEntradas((prev) => prev.filter((entrada) => entrada.id !== id));

      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error deleting entrada";
      setError(errorMessage);
      console.error("Error deleting entrada:", err);
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchEntradas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentOrg?.id, // NUEVO: Recargar cuando cambie la organización
    filters?.estado,
    filters?.fecha_desde,
    filters?.fecha_hasta,
    filters?.search,
  ]);

  return {
    entradas,
    loading,
    error,
    createEntrada,
    updateEntrada,
    deleteEntrada,
    refetchEntradas: fetchEntradas,
  };
}

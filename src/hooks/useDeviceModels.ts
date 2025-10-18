import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "@/context/OrganizationContext";
import type {
  DeviceModel,
  CreateDeviceModelData,
  UpdateDeviceModelData,
  DeviceModelMutationResult,
  DeviceModelDeleteResult,
} from "@/types/deviceModels";

interface UseDeviceModelsOptions {
  includeArchived?: boolean;
}

export function useDeviceModels(options: UseDeviceModelsOptions = {}) {
  const { includeArchived = false } = options;
  const { currentOrg } = useOrganization();
  const supabase = createClient();

  const [deviceModels, setDeviceModels] = useState<DeviceModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtener todos los modelos de dispositivos de la organización
   */
  const fetchDeviceModels = useCallback(async () => {
    if (!currentOrg) {
      setDeviceModels([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("device_models")
        .select("*")
        .eq("org_id", currentOrg.id)
        .order("usage_count", { ascending: false })
        .order("model_name", { ascending: true });

      // Filtrar archivados si no se especifica lo contrario
      if (!includeArchived) {
        query = query.is("deleted_at", null);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error("Error fetching device models:", fetchError);
        setError(fetchError.message);
        return;
      }

      setDeviceModels(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      console.error("Error in fetchDeviceModels:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentOrg, includeArchived, supabase]);

  /**
   * Crear un nuevo modelo de dispositivo
   */
  const createDeviceModel = async (
    payload: CreateDeviceModelData
  ): Promise<DeviceModelMutationResult> => {
    if (!currentOrg) {
      return {
        success: false,
        error: "No hay organización seleccionada",
      };
    }

    try {
      const { data, error: createError } = await supabase
        .from("device_models")
        .insert({
          org_id: currentOrg.id,
          model_name: payload.model_name,
          brand: payload.brand || null,
          category: payload.category || null,
          reference: payload.reference || null,
          common_issues: payload.common_issues || [],
          repair_notes: payload.repair_notes || null,
          estimated_repair_time: payload.estimated_repair_time || null,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating device model:", createError);
        return {
          success: false,
          error: createError.message,
        };
      }

      // Actualizar lista local
      await fetchDeviceModels();

      return {
        success: true,
        data,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      console.error("Error in createDeviceModel:", err);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  /**
   * Actualizar un modelo de dispositivo existente
   */
  const updateDeviceModel = async (
    id: string,
    updates: UpdateDeviceModelData
  ): Promise<DeviceModelMutationResult> => {
    if (!currentOrg) {
      return {
        success: false,
        error: "No hay organización seleccionada",
      };
    }

    try {
      const { data, error: updateError } = await supabase
        .from("device_models")
        .update({
          model_name: updates.model_name,
          brand: updates.brand,
          category: updates.category,
          reference: updates.reference,
          common_issues: updates.common_issues,
          repair_notes: updates.repair_notes,
          estimated_repair_time: updates.estimated_repair_time,
        })
        .eq("id", id)
        .eq("org_id", currentOrg.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating device model:", updateError);
        return {
          success: false,
          error: updateError.message,
        };
      }

      // Actualizar lista local
      await fetchDeviceModels();

      return {
        success: true,
        data,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      console.error("Error in updateDeviceModel:", err);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  /**
   * Eliminar (soft delete) un modelo de dispositivo
   */
  const deleteDeviceModel = async (id: string): Promise<DeviceModelDeleteResult> => {
    if (!currentOrg) {
      return {
        success: false,
        error: "No hay organización seleccionada",
      };
    }

    try {
      const { error: deleteError } = await supabase
        .from("device_models")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .eq("org_id", currentOrg.id);

      if (deleteError) {
        console.error("Error deleting device model:", deleteError);
        return {
          success: false,
          error: deleteError.message,
        };
      }

      // Actualizar lista local
      await fetchDeviceModels();

      return {
        success: true,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      console.error("Error in deleteDeviceModel:", err);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // Cargar modelos al montar y cuando cambie la organización
  useEffect(() => {
    fetchDeviceModels();
  }, [fetchDeviceModels]);

  return {
    deviceModels,
    loading,
    error,
    createDeviceModel,
    updateDeviceModel,
    deleteDeviceModel,
    refetchDeviceModels: fetchDeviceModels,
  };
}

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "@/context/OrganizationContext";
import type {
  InventoryMovement,
  CreateInventoryMovementData,
  InventoryMovementsFilters,
  StockValidation,
} from "@/types/inventory";

interface UseInventoryResult {
  movements: InventoryMovement[];
  loading: boolean;
  error: string | null;
  createMovement: (data: CreateInventoryMovementData) => Promise<{ success: boolean; error?: string }>;
  deleteMovement: (id: string) => Promise<{ success: boolean; error?: string }>;
  validateBudgetStock: (budgetId: string) => Promise<{ isValid: boolean; issues: StockValidation[] }>;
  reserveBudgetInventory: (budgetId: string) => Promise<{ success: boolean; error?: string }>;
  releaseBudgetInventory: (budgetId: string) => Promise<{ success: boolean; error?: string }>;
  refetch: () => void;
}

export function useInventory(filters?: InventoryMovementsFilters): UseInventoryResult {
  const { currentOrg } = useOrganization();
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovements = useCallback(async () => {
    if (!currentOrg) {
      setMovements([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      let query = supabase
        .from("inventory_movements")
        .select("*")
        .eq("org_id", currentOrg.id)
        .order("created_at", { ascending: false });

      // Aplicar filtros
      if (filters?.product_id) {
        query = query.eq("product_id", filters.product_id);
      }

      if (filters?.movement_type) {
        query = query.eq("movement_type", filters.movement_type);
      }

      if (filters?.reference_type) {
        query = query.eq("reference_type", filters.reference_type);
      }

      if (filters?.reference_id) {
        query = query.eq("reference_id", filters.reference_id);
      }

      if (filters?.date_from) {
        query = query.gte("created_at", filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte("created_at", filters.date_to);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setMovements((data || []) as InventoryMovement[]);
    } catch (err) {
      console.error("Error fetching inventory movements:", err);
      setError(err instanceof Error ? err.message : "Error al cargar movimientos");
    } finally {
      setLoading(false);
    }
  }, [currentOrg, filters]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const createMovement = useCallback(
    async (payload: CreateInventoryMovementData): Promise<{ success: boolean; error?: string }> => {
      if (!currentOrg) {
        const message = "No hay una organización seleccionada";
        setError(message);
        return { success: false, error: message };
      }

      try {
        setError(null);

        const supabase = createClient();

        // Llamar a la función de base de datos que maneja todo
        const { error: rpcError } = await supabase.rpc("create_inventory_movement", {
          p_org_id: currentOrg.id,
          p_product_id: payload.product_id,
          p_movement_type: payload.movement_type,
          p_quantity: payload.quantity,
          p_reference_type: payload.reference_type || null,
          p_reference_id: payload.reference_id || null,
          p_unit_cost: payload.unit_cost || null,
          p_notes: payload.notes || null,
        });

        if (rpcError) throw rpcError;

        // Recargar movimientos
        await fetchMovements();

        return { success: true };
      } catch (err) {
        console.error("Error creating inventory movement:", err);
        const message = err instanceof Error ? err.message : "Error al crear movimiento";
        setError(message);
        return { success: false, error: message };
      }
    },
    [currentOrg, fetchMovements]
  );

  const deleteMovement = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      if (!currentOrg) {
        const message = "No hay una organización seleccionada";
        setError(message);
        return { success: false, error: message };
      }

      try {
        setError(null);

        const supabase = createClient();

        // Obtener el movimiento antes de eliminarlo
        const { data: movement, error: fetchError } = await supabase
          .from("inventory_movements")
          .select("*")
          .eq("id", id)
          .eq("org_id", currentOrg.id)
          .single();

        if (fetchError) throw fetchError;
        if (!movement) throw new Error("Movimiento no encontrado");

        // Eliminar el movimiento
        const { error: deleteError } = await supabase
          .from("inventory_movements")
          .delete()
          .eq("id", id)
          .eq("org_id", currentOrg.id);

        if (deleteError) throw deleteError;

        // Actualizar el stock del producto (revertir el movimiento)
        const { error: updateError } = await supabase
          .from("products")
          .update({
            current_stock: movement.stock_before,
            updated_at: new Date().toISOString(),
          })
          .eq("id", movement.product_id)
          .eq("org_id", currentOrg.id);

        if (updateError) throw updateError;

        setMovements((prev) => prev.filter((m) => m.id !== id));

        return { success: true };
      } catch (err) {
        console.error("Error deleting movement:", err);
        const message = err instanceof Error ? err.message : "Error al eliminar movimiento";
        setError(message);
        return { success: false, error: message };
      }
    },
    [currentOrg]
  );

  const validateBudgetStock = useCallback(
    async (budgetId: string): Promise<{ isValid: boolean; issues: StockValidation[] }> => {
      try {
        const supabase = createClient();

        const { data, error: rpcError } = await supabase.rpc("validate_budget_stock", {
          p_budget_id: budgetId,
        });

        if (rpcError) throw rpcError;

        const issues = (data || []) as StockValidation[];
        return {
          isValid: issues.length === 0,
          issues,
        };
      } catch (err) {
        console.error("Error validating budget stock:", err);
        return {
          isValid: false,
          issues: [],
        };
      }
    },
    []
  );

  const reserveBudgetInventory = useCallback(
    async (budgetId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        setError(null);

        const supabase = createClient();

        const { error: rpcError } = await supabase.rpc("reserve_budget_inventory", {
          p_budget_id: budgetId,
        });

        if (rpcError) throw rpcError;

        // Recargar movimientos
        await fetchMovements();

        return { success: true };
      } catch (err) {
        console.error("Error reserving budget inventory:", err);
        const message = err instanceof Error ? err.message : "Error al reservar inventario";
        setError(message);
        return { success: false, error: message };
      }
    },
    [fetchMovements]
  );

  const releaseBudgetInventory = useCallback(
    async (budgetId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        setError(null);

        const supabase = createClient();

        const { error: rpcError } = await supabase.rpc("release_budget_inventory", {
          p_budget_id: budgetId,
        });

        if (rpcError) throw rpcError;

        // Recargar movimientos
        await fetchMovements();

        return { success: true };
      } catch (err) {
        console.error("Error releasing budget inventory:", err);
        const message = err instanceof Error ? err.message : "Error al liberar inventario";
        setError(message);
        return { success: false, error: message };
      }
    },
    [fetchMovements]
  );

  return {
    movements,
    loading,
    error,
    createMovement,
    deleteMovement,
    validateBudgetStock,
    reserveBudgetInventory,
    releaseBudgetInventory,
    refetch: fetchMovements,
  };
}

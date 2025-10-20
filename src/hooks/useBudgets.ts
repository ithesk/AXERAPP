"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "@/context/OrganizationContext";
import type {
  Budget,
  BudgetWithItems,
  BudgetItem,
  CreateBudgetData,
  UpdateBudgetData,
  CreateBudgetItemData,
  UpdateBudgetItemData,
  BudgetStatus,
} from "@/types/budgets";

interface UseBudgetsReturn {
  // Estado
  loading: boolean;
  error: string | null;

  // Funciones principales
  getBudgetByEntrada: (entradaId: string) => Promise<BudgetWithItems | null>;
  createBudget: (data: CreateBudgetData) => Promise<{ success: boolean; budget?: Budget; error?: string }>;
  updateBudget: (budgetId: string, data: UpdateBudgetData) => Promise<{ success: boolean; error?: string }>;
  deleteBudget: (budgetId: string) => Promise<{ success: boolean; error?: string }>;

  // Funciones de items
  addBudgetItem: (budgetId: string, item: CreateBudgetItemData) => Promise<{ success: boolean; item?: BudgetItem; error?: string }>;
  updateBudgetItem: (itemId: string, data: UpdateBudgetItemData) => Promise<{ success: boolean; error?: string }>;
  deleteBudgetItem: (itemId: string) => Promise<{ success: boolean; error?: string }>;

  // Funciones de estado
  updateBudgetStatus: (budgetId: string, status: BudgetStatus) => Promise<{ success: boolean; error?: string }>;
  validateBudgetStock: (budgetId: string) => Promise<{ valid: boolean; errors: string[] }>;
  approveBudget: (budgetId: string) => Promise<{ success: boolean; error?: string }>;
  rejectBudget: (budgetId: string) => Promise<{ success: boolean; error?: string }>;
}

export function useBudgets(): UseBudgetsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentOrg } = useOrganization();
  const supabase = createClient();

  // =====================================================
  // OBTENER PRESUPUESTO POR ENTRADA
  // =====================================================
  const getBudgetByEntrada = useCallback(
    async (entradaId: string): Promise<BudgetWithItems | null> => {
      try {
        setLoading(true);
        setError(null);

        if (!currentOrg?.id) {
          throw new Error("No hay organización seleccionada");
        }

        // Obtener presupuesto
        const { data: budget, error: budgetError } = await supabase
          .from("budgets")
          .select("*")
          .eq("entrada_id", entradaId)
          .eq("org_id", currentOrg.id)
          .single();

        if (budgetError) {
          if (budgetError.code === "PGRST116") {
            // No existe presupuesto para esta entrada
            return null;
          }
          throw budgetError;
        }

        // Obtener items del presupuesto con productos relacionados
        const { data: items, error: itemsError } = await supabase
          .from("budget_items")
          .select(`
            *,
            product:products(*)
          `)
          .eq("budget_id", budget.id)
          .order("sort_order", { ascending: true });

        if (itemsError) throw itemsError;

        return {
          ...budget,
          items: items || [],
        } as BudgetWithItems;
      } catch (err: any) {
        console.error("[useBudgets] Error al obtener presupuesto:", err);
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [currentOrg?.id, supabase]
  );

  // =====================================================
  // CREAR PRESUPUESTO
  // =====================================================
  const createBudget = useCallback(
    async (data: CreateBudgetData) => {
      try {
        setLoading(true);
        setError(null);

        if (!currentOrg?.id) {
          throw new Error("No hay organización seleccionada");
        }

        // Verificar que la entrada existe y pertenece a la org
        const { data: entrada, error: entradaError } = await supabase
          .from("entradas")
          .select("id, org_id")
          .eq("id", data.entrada_id)
          .eq("org_id", currentOrg.id)
          .single();

        if (entradaError || !entrada) {
          throw new Error("Entrada no encontrada");
        }

        // Verificar que no exista ya un presupuesto para esta entrada
        const { data: existingBudget } = await supabase
          .from("budgets")
          .select("id")
          .eq("entrada_id", data.entrada_id)
          .single();

        if (existingBudget) {
          throw new Error("Ya existe un presupuesto para esta entrada");
        }

        // Obtener user ID
        const { data: { user } } = await supabase.auth.getUser();

        // Crear presupuesto
        const { data: budget, error: budgetError } = await supabase
          .from("budgets")
          .insert({
            entrada_id: data.entrada_id,
            org_id: currentOrg.id,
            status: "draft",
            tax_percentage: data.tax_percentage || 0,
            discount_percentage: data.discount_percentage || 0,
            notes: data.notes || null,
            valid_until: data.valid_until || null,
            created_by: user?.id || null,
          })
          .select()
          .single();

        if (budgetError) throw budgetError;

        // Crear items si se proporcionaron
        if (data.items && data.items.length > 0) {
          const itemsToInsert = data.items.map((item, index) => ({
            budget_id: budget.id,
            item_type: item.item_type,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            sku: item.sku || null,
            notes: item.notes || null,
            display_order: item.display_order ?? index,
          }));

          const { error: itemsError } = await supabase
            .from("budget_items")
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }

        return { success: true, budget };
      } catch (err: any) {
        console.error("[useBudgets] Error al crear presupuesto:", err);
        const errorMessage = err.message || "Error al crear presupuesto";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [currentOrg?.id, supabase]
  );

  // =====================================================
  // ACTUALIZAR PRESUPUESTO
  // =====================================================
  const updateBudget = useCallback(
    async (budgetId: string, data: UpdateBudgetData) => {
      try {
        setLoading(true);
        setError(null);

        const { error: updateError } = await supabase
          .from("budgets")
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq("id", budgetId);

        if (updateError) throw updateError;

        return { success: true };
      } catch (err: any) {
        console.error("[useBudgets] Error al actualizar presupuesto:", err);
        const errorMessage = err.message || "Error al actualizar presupuesto";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // =====================================================
  // ELIMINAR PRESUPUESTO
  // =====================================================
  const deleteBudget = useCallback(
    async (budgetId: string) => {
      try {
        setLoading(true);
        setError(null);

        // Los items se eliminan automáticamente por CASCADE
        const { error: deleteError } = await supabase
          .from("budgets")
          .delete()
          .eq("id", budgetId);

        if (deleteError) throw deleteError;

        return { success: true };
      } catch (err: any) {
        console.error("[useBudgets] Error al eliminar presupuesto:", err);
        const errorMessage = err.message || "Error al eliminar presupuesto";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // =====================================================
  // AGREGAR ITEM AL PRESUPUESTO
  // =====================================================
  const addBudgetItem = useCallback(
    async (budgetId: string, itemData: CreateBudgetItemData) => {
      try {
        setLoading(true);
        setError(null);

        const { data: item, error: insertError } = await supabase
          .from("budget_items")
          .insert({
            budget_id: budgetId,
            item_type: itemData.item_type,
            description: itemData.description,
            quantity: itemData.quantity,
            unit_price: itemData.unit_price,
            sku: itemData.sku || null,
            notes: itemData.notes || null,
            display_order: itemData.display_order ?? 0,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        return { success: true, item };
      } catch (err: any) {
        console.error("[useBudgets] Error al agregar item:", err);
        const errorMessage = err.message || "Error al agregar item";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // =====================================================
  // ACTUALIZAR ITEM
  // =====================================================
  const updateBudgetItem = useCallback(
    async (itemId: string, data: UpdateBudgetItemData) => {
      try {
        setLoading(true);
        setError(null);

        const { error: updateError } = await supabase
          .from("budget_items")
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq("id", itemId);

        if (updateError) throw updateError;

        return { success: true };
      } catch (err: any) {
        console.error("[useBudgets] Error al actualizar item:", err);
        const errorMessage = err.message || "Error al actualizar item";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // =====================================================
  // ELIMINAR ITEM
  // =====================================================
  const deleteBudgetItem = useCallback(
    async (itemId: string) => {
      try {
        setLoading(true);
        setError(null);

        const { error: deleteError } = await supabase
          .from("budget_items")
          .delete()
          .eq("id", itemId);

        if (deleteError) throw deleteError;

        return { success: true };
      } catch (err: any) {
        console.error("[useBudgets] Error al eliminar item:", err);
        const errorMessage = err.message || "Error al eliminar item";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // =====================================================
  // ACTUALIZAR ESTADO DEL PRESUPUESTO
  // =====================================================
  const updateBudgetStatus = useCallback(
    async (budgetId: string, status: BudgetStatus) => {
      try {
        setLoading(true);
        setError(null);

        const updateData: any = {
          status,
          updated_at: new Date().toISOString(),
        };

        // Agregar timestamp según el estado
        if (status === "approved") {
          updateData.approved_at = new Date().toISOString();
        } else if (status === "rejected") {
          updateData.rejected_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
          .from("budgets")
          .update(updateData)
          .eq("id", budgetId);

        if (updateError) throw updateError;

        return { success: true };
      } catch (err: any) {
        console.error("[useBudgets] Error al actualizar estado:", err);
        const errorMessage = err.message || "Error al actualizar estado";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // =====================================================
  // VALIDAR STOCK ANTES DE APROBAR
  // =====================================================
  const validateBudgetStock = useCallback(
    async (budgetId: string): Promise<{ valid: boolean; errors: string[] }> => {
      try {
        const { data, error } = await supabase.rpc("validate_budget_stock", {
          p_budget_id: budgetId,
        });

        if (error) throw error;

        if (!data || data.length === 0) {
          return { valid: true, errors: [] };
        }

        const errors = data.map((item: any) => {
          return `${item.product_name}: Requiere ${item.required_quantity} ${item.stock_unit || "unidades"}, disponible ${item.available_stock}`;
        });

        return { valid: false, errors };
      } catch (err: any) {
        console.error("[useBudgets] Error al validar stock:", err);
        return { valid: false, errors: ["Error al validar stock del presupuesto"] };
      }
    },
    [supabase]
  );

  // =====================================================
  // APROBAR PRESUPUESTO (con reserva de inventario)
  // =====================================================
  const approveBudget = useCallback(
    async (budgetId: string) => {
      try {
        setLoading(true);
        setError(null);

        // 1. Validar stock disponible
        const stockValidation = await validateBudgetStock(budgetId);
        if (!stockValidation.valid) {
          const errorMessage = `Stock insuficiente:\n${stockValidation.errors.join("\n")}`;
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }

        // 2. Reservar inventario (usando función SQL)
        const { error: reserveError } = await supabase.rpc("reserve_budget_inventory", {
          p_budget_id: budgetId,
        });

        if (reserveError) {
          throw new Error(`Error al reservar inventario: ${reserveError.message}`);
        }

        // 3. Actualizar estado del presupuesto
        const result = await updateBudgetStatus(budgetId, "approved");

        return result;
      } catch (err: any) {
        console.error("[useBudgets] Error al aprobar presupuesto:", err);
        const errorMessage = err.message || "Error al aprobar presupuesto";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [updateBudgetStatus, validateBudgetStock, supabase]
  );

  // =====================================================
  // RECHAZAR PRESUPUESTO (con liberación de inventario)
  // =====================================================
  const rejectBudget = useCallback(
    async (budgetId: string) => {
      try {
        setLoading(true);
        setError(null);

        // 1. Verificar si el presupuesto estaba aprobado
        const { data: budget, error: fetchError } = await supabase
          .from("budgets")
          .select("status")
          .eq("id", budgetId)
          .single();

        if (fetchError) throw fetchError;

        // 2. Si estaba aprobado, liberar inventario reservado
        if (budget?.status === "approved") {
          const { error: releaseError } = await supabase.rpc("release_budget_inventory", {
            p_budget_id: budgetId,
          });

          if (releaseError) {
            throw new Error(`Error al liberar inventario: ${releaseError.message}`);
          }
        }

        // 3. Actualizar estado del presupuesto
        const result = await updateBudgetStatus(budgetId, "rejected");

        return result;
      } catch (err: any) {
        console.error("[useBudgets] Error al rechazar presupuesto:", err);
        const errorMessage = err.message || "Error al rechazar presupuesto";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [updateBudgetStatus, supabase]
  );

  return {
    loading,
    error,
    getBudgetByEntrada,
    createBudget,
    updateBudget,
    deleteBudget,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    updateBudgetStatus,
    validateBudgetStock,
    approveBudget,
    rejectBudget,
  };
}

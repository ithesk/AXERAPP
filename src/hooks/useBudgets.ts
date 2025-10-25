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
  loading: boolean;
  error: string | null;
  getBudgetByEntrada: (entradaId: string) => Promise<BudgetWithItems | null>;
  createBudget: (
    data: CreateBudgetData
  ) => Promise<{ success: boolean; budget?: Budget; error?: string }>;
  updateBudget: (
    budgetId: string,
    data: UpdateBudgetData
  ) => Promise<{ success: boolean; error?: string }>;
  deleteBudget: (
    budgetId: string
  ) => Promise<{ success: boolean; error?: string }>;
  addBudgetItem: (
    budgetId: string,
    item: CreateBudgetItemData
  ) => Promise<{ success: boolean; item?: BudgetItem; error?: string }>;
  updateBudgetItem: (
    itemId: string,
    data: UpdateBudgetItemData
  ) => Promise<{ success: boolean; error?: string }>;
  deleteBudgetItem: (
    itemId: string
  ) => Promise<{ success: boolean; error?: string }>;
  updateBudgetStatus: (
    budgetId: string,
    status: BudgetStatus
  ) => Promise<{ success: boolean; error?: string }>;
  validateBudgetStock: (
    budgetId: string,
    options?: { orgId?: string }
  ) => Promise<{ valid: boolean; errors: string[] }>;
  approveBudget: (
    budgetId: string
  ) => Promise<{ success: boolean; error?: string }>;
  rejectBudget: (
    budgetId: string
  ) => Promise<{ success: boolean; error?: string }>;
}

type BudgetStockIssue = {
  product_id: string;
  product_name: string;
  required_quantity: number;
  available_stock: number;
  missing_quantity: number;
  stock_unit?: string | null;
};

const sanitizeBudgetItem = (raw: Record<string, unknown>): BudgetItem => {
  const { budget, ...rest } = raw;
  void budget;
  return rest as BudgetItem;
};

export function useBudgets(): UseBudgetsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentOrg } = useOrganization();
  const supabase = createClient();

  const requireOrgId = useCallback(() => {
    if (!currentOrg?.id) {
      throw new Error("No hay organización seleccionada");
    }
    return currentOrg.id;
  }, [currentOrg?.id]);

  const ensureBudgetOwnership = useCallback(
    async (budgetId: string) => {
      const orgId = requireOrgId();
      const { data, error: ownershipError } = await supabase
        .from("budgets")
        .select("id")
        .eq("id", budgetId)
        .eq("org_id", orgId)
        .single();

      if (ownershipError || !data) {
        if (ownershipError?.code === "PGRST116") {
          throw new Error("Presupuesto no encontrado");
        }
        throw ownershipError ?? new Error("No se pudo validar el presupuesto");
      }

      return { orgId, budgetId: data.id };
    },
    [requireOrgId, supabase]
  );

  const ensureBudgetItemOwnership = useCallback(
    async (itemId: string) => {
      const orgId = requireOrgId();
      const { data, error: ownershipError } = await supabase
        .from("budget_items")
        .select(
          `
            id,
            budget_id,
            budget:budgets!inner(id, org_id)
          `
        )
        .eq("id", itemId)
        .eq("budget.org_id", orgId)
        .single();

      if (ownershipError || !data) {
        if (ownershipError?.code === "PGRST116") {
          throw new Error("Item de presupuesto no encontrado");
        }
        throw ownershipError ?? new Error("No se pudo validar el item del presupuesto");
      }

      return { orgId, budgetId: data.budget_id };
    },
    [requireOrgId, supabase]
  );

  const getBudgetByEntrada = useCallback(
    async (entradaId: string): Promise<BudgetWithItems | null> => {
      try {
        setLoading(true);
        setError(null);

        const orgId = requireOrgId();

        const { data: budget, error: budgetError } = await supabase
          .from("budgets")
          .select("*")
          .eq("entrada_id", entradaId)
          .eq("org_id", orgId)
          .single();

        if (budgetError) {
          if (budgetError.code === "PGRST116") {
            return null;
          }
          throw budgetError;
        }

        const { data: items, error: itemsError } = await supabase
          .from("budget_items")
          .select(
            `
              *,
              product:products(*),
              budget:budgets!inner(id, org_id)
            `
          )
          .eq("budget_id", budget.id)
          .eq("budget.org_id", orgId)
          .order("display_order", { ascending: true });

        if (itemsError) throw itemsError;

        const sanitizedItems = (items ?? []).map((item) => sanitizeBudgetItem(item));

        return {
          ...budget,
          items: sanitizedItems,
        } as BudgetWithItems;
      } catch (err) {
        console.error("[useBudgets] Error al obtener presupuesto:", err);
        const message =
          err instanceof Error ? err.message : "Error al obtener presupuesto";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [requireOrgId, supabase]
  );

  const createBudget = useCallback(
    async (data: CreateBudgetData) => {
      try {
        setLoading(true);
        setError(null);

        const orgId = requireOrgId();

        const { data: entrada, error: entradaError } = await supabase
          .from("entradas")
          .select("id")
          .eq("id", data.entrada_id)
          .eq("org_id", orgId)
          .single();

        if (entradaError || !entrada) {
          throw new Error("Entrada no encontrada");
        }

        const { data: existingBudget, error: existingBudgetError } = await supabase
          .from("budgets")
          .select("id")
          .eq("entrada_id", data.entrada_id)
          .eq("org_id", orgId)
          .single();

        if (existingBudgetError && existingBudgetError.code !== "PGRST116") {
          throw existingBudgetError;
        }

        if (existingBudget) {
          throw new Error("Ya existe un presupuesto para esta entrada");
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const { data: budget, error: budgetError } = await supabase
          .from("budgets")
          .insert({
            entrada_id: data.entrada_id,
            org_id: orgId,
            status: "draft",
            tax_percentage: data.tax_percentage ?? 0,
            discount_percentage: data.discount_percentage ?? 0,
            notes: data.notes ?? null,
            valid_until: data.valid_until ?? null,
            created_by: user?.id ?? null,
          })
          .select()
          .single();

        if (budgetError) throw budgetError;

        if (data.items && data.items.length > 0) {
          const itemsToInsert = data.items.map((item, index) => ({
            budget_id: budget.id,
            item_type: item.item_type,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            sku: item.sku ?? null,
            notes: item.notes ?? null,
            display_order: item.display_order ?? index,
            product_id: item.product_id ?? null,
            is_custom: item.is_custom ?? !item.product_id,
          }));

          const { error: itemsError } = await supabase
            .from("budget_items")
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }

        return { success: true, budget };
      } catch (err) {
        console.error("[useBudgets] Error al crear presupuesto:", err);
        const message =
          err instanceof Error ? err.message : "Error al crear presupuesto";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [requireOrgId, supabase]
  );

  const updateBudget = useCallback(
    async (budgetId: string, data: UpdateBudgetData) => {
      try {
        setLoading(true);
        setError(null);

        const { orgId } = await ensureBudgetOwnership(budgetId);

        const { error: updateError } = await supabase
          .from("budgets")
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq("id", budgetId)
          .eq("org_id", orgId);

        if (updateError) throw updateError;

        return { success: true };
      } catch (err) {
        console.error("[useBudgets] Error al actualizar presupuesto:", err);
        const message =
          err instanceof Error ? err.message : "Error al actualizar presupuesto";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [ensureBudgetOwnership, supabase]
  );

  const deleteBudget = useCallback(
    async (budgetId: string) => {
      try {
        setLoading(true);
        setError(null);

        const { orgId } = await ensureBudgetOwnership(budgetId);

        const { error: deleteError } = await supabase
          .from("budgets")
          .delete()
          .eq("id", budgetId)
          .eq("org_id", orgId);

        if (deleteError) throw deleteError;

        return { success: true };
      } catch (err) {
        console.error("[useBudgets] Error al eliminar presupuesto:", err);
        const message =
          err instanceof Error ? err.message : "Error al eliminar presupuesto";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [ensureBudgetOwnership, supabase]
  );

  const addBudgetItem = useCallback(
    async (budgetId: string, itemData: CreateBudgetItemData) => {
      try {
        setLoading(true);
        setError(null);

        await ensureBudgetOwnership(budgetId);

        const { data: item, error: insertError } = await supabase
          .from("budget_items")
          .insert({
            budget_id: budgetId,
            item_type: itemData.item_type,
            description: itemData.description,
            quantity: itemData.quantity,
            unit_price: itemData.unit_price,
            sku: itemData.sku ?? null,
            notes: itemData.notes ?? null,
            display_order: itemData.display_order ?? 0,
            product_id: itemData.product_id ?? null,
            is_custom: itemData.is_custom ?? !itemData.product_id,
          })
          .select(
            `
              *,
              product:products(*),
              budget:budgets!inner(id, org_id)
            `
          )
          .single();

        if (insertError) throw insertError;

        return { success: true, item: sanitizeBudgetItem(item) };
      } catch (err) {
        console.error("[useBudgets] Error al agregar item:", err);
        const message = err instanceof Error ? err.message : "Error al agregar item";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [ensureBudgetOwnership, supabase]
  );

  const updateBudgetItem = useCallback(
    async (itemId: string, data: UpdateBudgetItemData) => {
      try {
        setLoading(true);
        setError(null);

        const { budgetId } = await ensureBudgetItemOwnership(itemId);

        const updates = { ...data } as Record<string, unknown>;
        delete updates.subtotal;
        delete updates.sort_order;

        const { error: updateError } = await supabase
          .from("budget_items")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", itemId)
          .eq("budget_id", budgetId);

        if (updateError) throw updateError;

        return { success: true };
      } catch (err) {
        console.error("[useBudgets] Error al actualizar item:", err);
        const message = err instanceof Error ? err.message : "Error al actualizar item";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [ensureBudgetItemOwnership, supabase]
  );

  const deleteBudgetItem = useCallback(
    async (itemId: string) => {
      try {
        setLoading(true);
        setError(null);

        const { budgetId } = await ensureBudgetItemOwnership(itemId);

        const { error: deleteError } = await supabase
          .from("budget_items")
          .delete()
          .eq("id", itemId)
          .eq("budget_id", budgetId);

        if (deleteError) throw deleteError;

        return { success: true };
      } catch (err) {
        console.error("[useBudgets] Error al eliminar item:", err);
        const message = err instanceof Error ? err.message : "Error al eliminar item";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [ensureBudgetItemOwnership, supabase]
  );

  const updateBudgetStatus = useCallback(
    async (budgetId: string, status: BudgetStatus) => {
      try {
        setLoading(true);
        setError(null);

        const { orgId } = await ensureBudgetOwnership(budgetId);

        const updateData: Partial<Budget> & {
          status: BudgetStatus;
          updated_at: string;
        } = {
          status,
          updated_at: new Date().toISOString(),
        };

        if (status === "approved") {
          updateData.approved_at = new Date().toISOString();
          updateData.rejected_at = null;
        } else if (status === "rejected") {
          updateData.rejected_at = new Date().toISOString();
          updateData.approved_at = null;
        } else {
          updateData.approved_at = null;
          updateData.rejected_at = null;
        }

        const { error: updateError } = await supabase
          .from("budgets")
          .update(updateData)
          .eq("id", budgetId)
          .eq("org_id", orgId);

        if (updateError) throw updateError;

        return { success: true };
      } catch (err) {
        console.error("[useBudgets] Error al actualizar estado:", err);
        const message = err instanceof Error ? err.message : "Error al actualizar estado";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [ensureBudgetOwnership, supabase]
  );

  const validateBudgetStock = useCallback(
    async (budgetId: string, options?: { orgId?: string }) => {
      try {
        if (!options?.orgId) {
          await ensureBudgetOwnership(budgetId);
        }

        const { data, error: rpcError } = await supabase.rpc(
          "validate_budget_stock",
          {
            p_budget_id: budgetId,
          }
        );

        if (rpcError) throw rpcError;

        const issues = (data ?? []) as BudgetStockIssue[];

        if (issues.length === 0) {
          return { valid: true, errors: [] };
        }

        const errors = issues.map((item) => {
          return `${item.product_name}: Requiere ${Number(item.required_quantity)} unidades, disponible ${Number(item.available_stock)}`;
        });

        return { valid: false, errors };
      } catch (err) {
        console.error("[useBudgets] Error al validar stock:", err);
        return {
          valid: false,
          errors: [
            err instanceof Error
              ? err.message
              : "Error al validar stock del presupuesto",
          ],
        };
      }
    },
    [ensureBudgetOwnership, supabase]
  );

  const approveBudget = useCallback(
    async (budgetId: string) => {
      try {
        setLoading(true);
        setError(null);

        const { orgId } = await ensureBudgetOwnership(budgetId);

        const stockValidation = await validateBudgetStock(budgetId, { orgId });
        if (!stockValidation.valid) {
          const message = `Stock insuficiente:\n${stockValidation.errors.join("\n")}`;
          setError(message);
          return { success: false, error: message };
        }

        const { error: reserveError } = await supabase.rpc(
          "reserve_budget_inventory",
          {
            p_budget_id: budgetId,
          }
        );

        if (reserveError) {
          throw new Error(
            `Error al reservar inventario: ${reserveError.message}`
          );
        }

        return await updateBudgetStatus(budgetId, "approved");
      } catch (err) {
        console.error("[useBudgets] Error al aprobar presupuesto:", err);
        const message =
          err instanceof Error ? err.message : "Error al aprobar presupuesto";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [ensureBudgetOwnership, supabase, updateBudgetStatus, validateBudgetStock]
  );

  const rejectBudget = useCallback(
    async (budgetId: string) => {
      try {
        setLoading(true);
        setError(null);

        const { orgId } = await ensureBudgetOwnership(budgetId);

        const { data: budget, error: fetchError } = await supabase
          .from("budgets")
          .select("status")
          .eq("id", budgetId)
          .eq("org_id", orgId)
          .single();

        if (fetchError) throw fetchError;

        if (budget?.status === "approved") {
          const { error: releaseError } = await supabase.rpc(
            "release_budget_inventory",
            {
              p_budget_id: budgetId,
            }
          );

          if (releaseError) {
            throw new Error(
              `Error al liberar inventario: ${releaseError.message}`
            );
          }
        }

        return await updateBudgetStatus(budgetId, "rejected");
      } catch (err) {
        console.error("[useBudgets] Error al rechazar presupuesto:", err);
        const message =
          err instanceof Error ? err.message : "Error al rechazar presupuesto";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [ensureBudgetOwnership, supabase, updateBudgetStatus]
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

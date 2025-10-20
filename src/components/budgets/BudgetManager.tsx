"use client";

import React, { useState, useEffect } from "react";
import { useBudgets } from "@/hooks/useBudgets";
import { useToast } from "@/context/ToastContext";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { generateBudgetPDF } from "@/lib/pdf/budgetPDF";
import type { Entrada } from "@/types/entradas";
import BudgetItemsTable from "./BudgetItemsTable";
import {
  BudgetWithItems,
  BudgetItem,
  CreateBudgetItemData,
  BudgetItemType,
  BUDGET_ITEM_TYPE_LABELS,
  BUDGET_STATUS_LABELS,
  formatCurrency,
  getBudgetStatusColor,
} from "@/types/budgets";

interface BudgetManagerProps {
  entradaId: string;
  entrada?: Entrada; // Opcional: para generar PDF con datos del cliente
  onBudgetChange?: (budget: BudgetWithItems | null) => void;
}

export default function BudgetManager({ entradaId, entrada, onBudgetChange }: BudgetManagerProps) {
  const { showToast } = useToast();
  const {
    loading,
    getBudgetByEntrada,
    createBudget,
    updateBudget,
    updateBudgetStatus,
    validateBudgetStock,
    approveBudget,
    rejectBudget,
  } = useBudgets();

  const [budget, setBudget] = useState<BudgetWithItems | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [notes, setNotes] = useState("");

  // Cargar presupuesto al montar
  useEffect(() => {
    loadBudget();
  }, [entradaId]);

  const loadBudget = async () => {
    const budgetData = await getBudgetByEntrada(entradaId);
    setBudget(budgetData);

    if (budgetData) {
      setNotes(budgetData.notes || "");
    }

    onBudgetChange?.(budgetData);
  };

  // =====================================================
  // CREAR PRESUPUESTO INICIAL
  // =====================================================
  const handleCreateBudget = async () => {
    setIsCreating(true);

    const result = await createBudget({
      entrada_id: entradaId,
      tax_percentage: 18, // ITBIS por defecto en RD
      discount_percentage: 0,
      notes: "Presupuesto de reparación",
    });

    setIsCreating(false);

    if (result.success) {
      showToast("success", "Presupuesto creado", "Ahora puedes agregar piezas y mano de obra");
      await loadBudget();
    } else {
      showToast("error", "Error", result.error || "No se pudo crear el presupuesto");
    }
  };

  // =====================================================
  // ACTUALIZAR NOTAS
  // =====================================================
  const handleUpdateNotes = async () => {
    if (!budget) return;

    const result = await updateBudget(budget.id, {
      notes: notes.trim() || null,
    });

    if (result.success) {
      showToast("success", "Actualizado", "Las notas se guardaron correctamente");
      await loadBudget();
    } else {
      showToast("error", "Error", result.error || "No se pudieron guardar las notas");
    }
  };

  // =====================================================
  // CAMBIAR ESTADO
  // =====================================================
  const handleSendBudget = async () => {
    if (!budget) return;

    const result = await updateBudgetStatus(budget.id, "sent");

    if (result.success) {
      showToast("success", "Presupuesto enviado", "El presupuesto se marcó como enviado");
      await loadBudget();
    } else {
      showToast("error", "Error", result.error || "No se pudo enviar");
    }
  };

  const handleApproveBudget = async () => {
    if (!budget) return;

    // Confirmar acción
    if (!confirm("¿Aprobar este presupuesto? Se reservará el inventario necesario.")) {
      return;
    }

    const result = await approveBudget(budget.id);

    if (result.success) {
      showToast("success", "Presupuesto aprobado", "El presupuesto fue aprobado y el inventario ha sido reservado");
      await loadBudget();
    } else {
      showToast("error", "Error al aprobar", result.error || "No se pudo aprobar el presupuesto");
    }
  };

  const handleRejectBudget = async () => {
    if (!budget) return;

    // Confirmar acción
    const wasApproved = budget.status === "approved";
    const confirmMessage = wasApproved
      ? "¿Rechazar este presupuesto? Se liberará el inventario reservado."
      : "¿Rechazar este presupuesto?";

    if (!confirm(confirmMessage)) {
      return;
    }

    const result = await rejectBudget(budget.id);

    if (result.success) {
      const message = wasApproved
        ? "El presupuesto fue rechazado y el inventario ha sido liberado"
        : "El presupuesto fue rechazado";
      showToast("info", "Presupuesto rechazado", message);
      await loadBudget();
    } else {
      showToast("error", "Error al rechazar", result.error || "No se pudo rechazar el presupuesto");
    }
  };

  // =====================================================
  // EXPORTAR PDF
  // =====================================================
  const handleExportPDF = () => {
    if (!budget || !entrada) {
      showToast("error", "Error", "No se puede generar el PDF sin datos completos");
      return;
    }

    try {
      const pdf = generateBudgetPDF({
        budget,
        entrada,
        orgName: "AXER",
        // Aquí puedes agregar más datos de la organización si los tienes
      });

      // Descargar el PDF
      pdf.save(`Presupuesto-${entrada.id_reparacion}.pdf`);
      showToast("success", "PDF generado", "El presupuesto se descargó correctamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      showToast("error", "Error", "No se pudo generar el PDF");
    }
  };

  // =====================================================
  // RENDER: Sin presupuesto
  // =====================================================
  if (!budget && !loading) {
    return (
      <div className="p-12 text-center border border-gray-200 rounded-2xl bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-brand-100 dark:bg-brand-900/30">
            <svg className="w-8 h-8 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
            Sin presupuesto
          </h3>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            Esta reparación aún no tiene un presupuesto. Crea uno para agregar piezas y mano de obra.
          </p>
          <Button
            onClick={handleCreateBudget}
            disabled={isCreating}
            size="sm"
          >
            {isCreating ? "Creando..." : "Crear Presupuesto"}
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !budget) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Cargando presupuesto...</p>
        </div>
      </div>
    );
  }

  // Función para actualizar todos los items del presupuesto
  const handleItemsChange = async (updatedItems: BudgetItem[]) => {
    // Esta función maneja cambios en tiempo real de la tabla
    // Por ahora solo actualiza localmente, pero podría sincronizar con el backend
    setBudget((prev) => (prev ? { ...prev, items: updatedItems } : null));
  };

  return (
    <div className="space-y-6">
      {/* Header con estado y acciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Presupuesto
          </h3>
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getBudgetStatusColor(budget.status)}`}>
            {BUDGET_STATUS_LABELS[budget.status]}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón de exportar PDF - siempre visible */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportPDF}
            disabled={!entrada}
            title="Descargar presupuesto en PDF"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar PDF
          </Button>

          {budget.status === "draft" && (
            <Button size="sm" variant="outline" onClick={handleSendBudget}>
              Enviar a Cliente
            </Button>
          )}
          {budget.status === "sent" && (
            <>
              <Button size="sm" variant="outline" onClick={handleRejectBudget}>
                Rechazar
              </Button>
              <Button size="sm" onClick={handleApproveBudget}>
                Aprobar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabla de Items - Nueva Interfaz Excel */}
      <div className="p-4 border border-gray-200 rounded-xl dark:border-gray-800 bg-white dark:bg-white/[0.03]">
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Items del Presupuesto
          </h4>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Doble clic en cualquier celda para editar. Presiona Enter, Tab o Esc para navegar.
          </p>
        </div>

        <BudgetItemsTable
          items={budget.items || []}
          onItemsChange={handleItemsChange}
          disabled={budget.status !== "draft"}
        />
      </div>

      {/* Notas del presupuesto */}
      {budget.status === "draft" && (
        <div className="p-4 border border-gray-200 rounded-xl dark:border-gray-800 bg-white dark:bg-white/[0.03]">
          <h4 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Notas del Presupuesto
          </h4>

          <div className="space-y-4">
            <div>
              <Label>Notas adicionales (opcional)</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                placeholder="Información adicional para el presupuesto..."
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleUpdateNotes}
                size="sm"
                variant="outline"
              >
                Guardar Notas
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

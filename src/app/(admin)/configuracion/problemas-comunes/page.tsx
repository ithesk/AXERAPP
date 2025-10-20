"use client";

import React, { useState, useMemo } from "react";
import { useCommonProblems } from "@/hooks/useCommonProblems";
import type {
  CommonProblem,
  CreateCommonProblemData,
  UpdateCommonProblemData,
  CommonProblemCategory,
} from "@/types/commonProblems";
import { COMMON_PROBLEM_CATEGORIES } from "@/types/commonProblems";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/context/ToastContext";
import { PlusIcon } from "@/icons";

export default function ProblemasomunesPage() {
  const [filters, setFilters] = useState<{
    category?: string;
    is_active?: boolean;
    search?: string;
  }>({});

  const { problems, loading, error, createProblem, updateProblem, deleteProblem, refetch } =
    useCommonProblems(filters);

  const { showToast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<CommonProblem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Estadísticas
  const stats = useMemo(() => {
    const all = problems;
    const active = problems.filter((p) => p.is_active);
    const byCategory = problems.reduce((acc, p) => {
      const cat = p.category || "Sin categoría";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: all.length,
      active: active.length,
      inactive: all.length - active.length,
      byCategory,
    };
  }, [problems]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este problema común?")) {
      return;
    }

    setDeletingId(id);
    const result = await deleteProblem(id);
    setDeletingId(null);

    if (result.success) {
      showToast("success", "Problema eliminado", "El problema común se eliminó exitosamente.");
    } else {
      showToast("error", "Error al eliminar", result.error || "No se pudo eliminar el problema.");
    }
  };

  const handleToggleActive = async (problem: CommonProblem) => {
    const result = await updateProblem(problem.id, {
      is_active: !problem.is_active,
    });

    if (result.success) {
      showToast(
        "success",
        problem.is_active ? "Problema desactivado" : "Problema activado",
        `El problema se ${problem.is_active ? "desactivó" : "activó"} correctamente.`
      );
    } else {
      showToast("error", "Error al actualizar", result.error || "No se pudo actualizar el estado.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Problemas Comunes
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestiona el catálogo de problemas comunes para autocompletado
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40 hover:scale-105 active:scale-95"
        >
          <PlusIcon />
          Nuevo Problema
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="p-4 border border-gray-200 rounded-xl bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-xl bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Activos</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-xl bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactivos</p>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-400">{stats.inactive}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border border-gray-200 rounded-2xl bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Filtros</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Search */}
          <div>
            <label className="block mb-2 text-xs font-semibold text-gray-600 uppercase dark:text-gray-400">
              Búsqueda
            </label>
            <input
              type="text"
              placeholder="Buscar problema..."
              value={filters.search || ""}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block mb-2 text-xs font-semibold text-gray-600 uppercase dark:text-gray-400">
              Categoría
            </label>
            <select
              value={filters.category || ""}
              onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Todas las categorías</option>
              {COMMON_PROBLEM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block mb-2 text-xs font-semibold text-gray-600 uppercase dark:text-gray-400">
              Estado
            </label>
            <select
              value={
                filters.is_active === undefined ? "" : filters.is_active ? "active" : "inactive"
              }
              onChange={(e) =>
                setFilters({
                  ...filters,
                  is_active: e.target.value === "" ? undefined : e.target.value === "active",
                })
              }
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24 border border-gray-200 rounded-2xl bg-white/50 dark:bg-white/[0.02] dark:border-gray-800">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-t-transparent rounded-full border-brand-500 animate-spin"></div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Cargando problemas...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-8 border border-red-200 rounded-2xl bg-red-50 dark:bg-red-500/10 dark:border-red-500/20">
          <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Error: {error}</span>
          </div>
        </div>
      ) : problems.length === 0 ? (
        <div className="py-24 text-center border border-gray-200 rounded-2xl bg-white/50 dark:bg-white/[0.02] dark:border-gray-800">
          <svg className="w-20 h-20 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
            No hay problemas comunes
          </h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            {filters.search || filters.category || filters.is_active !== undefined
              ? "No se encontraron resultados con los filtros aplicados"
              : "Comienza agregando tu primer problema común"}
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40"
          >
            <PlusIcon />
            Crear primer problema
          </button>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-2xl bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 dark:bg-gray-800/80">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-600 uppercase dark:text-gray-300">
                    Problema
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-600 uppercase dark:text-gray-300">
                    Categoría
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-600 uppercase dark:text-gray-300">
                    Orden
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-center text-gray-600 uppercase dark:text-gray-300">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-right text-gray-600 uppercase dark:text-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {problems.map((problem) => (
                  <tr
                    key={problem.id}
                    className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {problem.problem_text}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                        {problem.category || "Sin categoría"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {problem.display_order}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(problem)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                          problem.is_active
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/20"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        {problem.is_active ? "Activo" : "Inactivo"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingProblem(problem)}
                          className="p-2 text-blue-600 transition-all rounded-lg hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(problem.id)}
                          disabled={deletingId === problem.id}
                          className="p-2 text-red-600 transition-all rounded-lg hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 disabled:opacity-50"
                          title="Eliminar"
                        >
                          {deletingId === problem.id ? (
                            <div className="w-4 h-4 border-2 border-t-transparent border-red-600 rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProblemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={createProblem}
        onRefetch={refetch}
      />
      {editingProblem && (
        <ProblemModal
          isOpen={!!editingProblem}
          onClose={() => setEditingProblem(null)}
          problem={editingProblem}
          onUpdate={updateProblem}
          onRefetch={refetch}
        />
      )}
    </div>
  );
}

interface ProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem?: CommonProblem;
  onCreate?: (data: CreateCommonProblemData) => Promise<{ success: boolean; error?: string; data?: CommonProblem }>;
  onUpdate?: (id: string, data: UpdateCommonProblemData) => Promise<{ success: boolean; error?: string }>;
  onRefetch: () => void;
}

function ProblemModal({ isOpen, onClose, problem, onCreate, onUpdate, onRefetch }: ProblemModalProps) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<{
    problem_text: string;
    category: string;
    is_active: boolean;
    display_order: number;
  }>({
    problem_text: problem?.problem_text || "",
    category: problem?.category || "",
    is_active: problem?.is_active ?? true,
    display_order: problem?.display_order ?? 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.problem_text.trim()) {
      showToast("error", "Campo requerido", "El texto del problema es obligatorio.");
      return;
    }

    setSaving(true);

    if (problem && onUpdate) {
      // Update existing
      const result = await onUpdate(problem.id, {
        problem_text: formData.problem_text,
        category: formData.category || null,
        is_active: formData.is_active,
        display_order: formData.display_order,
      });

      if (result.success) {
        showToast("success", "Problema actualizado", "El problema se actualizó correctamente.");
        onRefetch();
        onClose();
      } else {
        showToast("error", "Error al actualizar", result.error || "No se pudo actualizar el problema.");
      }
    } else if (onCreate) {
      // Create new
      const result = await onCreate({
        problem_text: formData.problem_text,
        category: formData.category || null,
        is_active: formData.is_active,
        display_order: formData.display_order,
      });

      if (result.success) {
        showToast("success", "Problema creado", "El problema se creó correctamente.");
        onRefetch();
        onClose();
      } else {
        showToast("error", "Error al crear", result.error || "No se pudo crear el problema.");
      }
    }

    setSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl">
      <div className="p-6">
        <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          {problem ? "Editar Problema" : "Nuevo Problema"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Texto del Problema <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.problem_text}
              onChange={(e) => setFormData({ ...formData, problem_text: e.target.value })}
              required
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              placeholder="Ej: Pantalla rota o fisurada"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Categoría
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Sin categoría</option>
              {COMMON_PROBLEM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Orden de visualización
            </label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              placeholder="0"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Menor número aparece primero en el autocompletado
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Activo (visible en autocompletado)
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : problem ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

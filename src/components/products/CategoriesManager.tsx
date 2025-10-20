"use client";

import React, { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useToast } from "@/context/ToastContext";
import Button from "@/components/ui/button/Button";
import type { Category, CreateCategoryData } from "@/types/product-attributes";
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons";

export default function CategoriesManager() {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories();
  const { showToast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateCategoryData>({
    name: "",
    description: "",
    color: "#3B82F6",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast("error", "Error", "El nombre es requerido");
      return;
    }

    if (editingId) {
      const result = await updateCategory(editingId, formData);
      if (result.success) {
        showToast("success", "Categoría actualizada", `"${formData.name}" ha sido actualizada`);
        resetForm();
      } else {
        showToast("error", "Error", result.error || "No se pudo actualizar");
      }
    } else {
      const result = await createCategory(formData);
      if (result.success) {
        showToast("success", "Categoría creada", `"${formData.name}" ha sido creada`);
        resetForm();
      } else {
        showToast("error", "Error", result.error || "No se pudo crear");
      }
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color || "#3B82F6",
    });
    setIsCreating(true);
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`¿Eliminar la categoría "${category.name}"?`)) return;

    const result = await deleteCategory(category.id);
    if (result.success) {
      showToast("success", "Categoría eliminada", `"${category.name}" ha sido eliminada`);
    } else {
      showToast("error", "Error", result.error || "No se pudo eliminar");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", color: "#3B82F6" });
    setEditingId(null);
    setIsCreating(false);
  };

  if (loading) return <div className="text-center py-8">Cargando categorías...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Gestión de Categorías
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Organiza tus productos por categorías
          </p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} size="sm">
            <PlusIcon className="w-4 h-4 mr-2" />
            Nueva Categoría
          </Button>
        )}
      </div>

      {isCreating && (
        <div className="p-6 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Editar Categoría" : "Nueva Categoría"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-brand-500"
                  placeholder="Ej: Electrónica, Repuestos..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 px-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-brand-500"
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button type="submit">{editingId ? "Actualizar" : "Crear"}</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        {categories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay categorías. Crea tu primera categoría.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Color</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Descripción</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-6 py-4">
                    <div
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: cat.color || "#3B82F6" }}
                    />
                  </td>
                  <td className="px-6 py-4 font-medium">{cat.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {cat.description || "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded"
                      >
                        <TrashBinIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

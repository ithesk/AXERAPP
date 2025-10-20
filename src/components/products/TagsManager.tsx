"use client";

import React, { useState } from "react";
import { useTags } from "@/hooks/useTags";
import { useToast } from "@/context/ToastContext";
import Button from "@/components/ui/button/Button";
import type { Tag, CreateTagData } from "@/types/product-attributes";
import { TAG_COLORS } from "@/types/product-attributes";
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons";

export default function TagsManager() {
  const { tags, loading, createTag, updateTag, deleteTag } = useTags();
  const { showToast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateTagData>({
    name: "",
    color: "#3B82F6",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast("error", "Error", "El nombre es requerido");
      return;
    }

    if (editingId) {
      const result = await updateTag(editingId, formData);
      if (result.success) {
        showToast("success", "Etiqueta actualizada", `"${formData.name}" ha sido actualizada`);
        resetForm();
      } else {
        showToast("error", "Error", result.error || "No se pudo actualizar");
      }
    } else {
      const result = await createTag(formData);
      if (result.success) {
        showToast("success", "Etiqueta creada", `"${formData.name}" ha sido creada`);
        resetForm();
      } else {
        showToast("error", "Error", result.error || "No se pudo crear");
      }
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setFormData({
      name: tag.name,
      color: tag.color,
      description: tag.description || "",
    });
    setIsCreating(true);
  };

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`¿Eliminar la etiqueta "${tag.name}"?`)) return;

    const result = await deleteTag(tag.id);
    if (result.success) {
      showToast("success", "Etiqueta eliminada", `"${tag.name}" ha sido eliminada`);
    } else {
      showToast("error", "Error", result.error || "No se pudo eliminar");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", color: "#3B82F6", description: "" });
    setEditingId(null);
    setIsCreating(false);
  };

  if (loading) return <div className="text-center py-8">Cargando etiquetas...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Gestión de Etiquetas
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Etiquetas reutilizables para clasificar productos
          </p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} size="sm">
            <PlusIcon className="w-4 h-4 mr-2" />
            Nueva Etiqueta
          </Button>
        )}
      </div>

      {isCreating && (
        <div className="p-6 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Editar Etiqueta" : "Nueva Etiqueta"}
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
                  placeholder="Ej: Nuevo, Promoción, Premium..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="flex gap-2">
                  {TAG_COLORS.slice(0, 6).map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c.value })}
                      className={`w-10 h-10 rounded border-2 ${
                        formData.color === c.value ? "border-gray-900 dark:border-white" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-10 h-10 rounded border"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button type="submit">{editingId ? "Actualizar" : "Crear"}</Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No hay etiquetas. Crea tu primera etiqueta.
          </div>
        ) : (
          tags.map((tag) => (
            <div
              key={tag.id}
              className="p-4 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="px-3 py-1 rounded-full text-white text-sm font-medium"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(tag)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tag)}
                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded"
                  >
                    <TrashBinIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {tag.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400">{tag.description}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

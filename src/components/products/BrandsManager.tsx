"use client";

import React, { useState } from "react";
import { useBrands } from "@/hooks/useBrands";
import { useToast } from "@/context/ToastContext";
import Button from "@/components/ui/button/Button";
import type { Brand, CreateBrandData } from "@/types/product-attributes";
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons";

export default function BrandsManager() {
  const { brands, loading, createBrand, updateBrand, deleteBrand } = useBrands();
  const { showToast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateBrandData>({
    name: "",
    description: "",
    website: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast("error", "Error", "El nombre es requerido");
      return;
    }

    if (editingId) {
      const result = await updateBrand(editingId, formData);
      if (result.success) {
        showToast("success", "Marca actualizada", `"${formData.name}" ha sido actualizada`);
        resetForm();
      } else {
        showToast("error", "Error", result.error || "No se pudo actualizar la marca");
      }
    } else {
      const result = await createBrand(formData);
      if (result.success) {
        showToast("success", "Marca creada", `"${formData.name}" ha sido creada`);
        resetForm();
      } else {
        showToast("error", "Error", result.error || "No se pudo crear la marca");
      }
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingId(brand.id);
    setFormData({
      name: brand.name,
      description: brand.description || "",
      website: brand.website || "",
    });
    setIsCreating(true);
  };

  const handleDelete = async (brand: Brand) => {
    if (!confirm(`¿Eliminar la marca "${brand.name}"?`)) return;

    const result = await deleteBrand(brand.id);
    if (result.success) {
      showToast("success", "Marca eliminada", `"${brand.name}" ha sido eliminada`);
    } else {
      showToast("error", "Error", result.error || "No se pudo eliminar la marca");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", website: "" });
    setEditingId(null);
    setIsCreating(false);
  };

  if (loading) {
    return <div className="text-center py-8">Cargando marcas...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Gestión de Marcas
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Administra las marcas de tus productos
          </p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} size="sm">
            <PlusIcon className="w-4 h-4 mr-2" />
            Nueva Marca
          </Button>
        )}
      </div>

      {/* Formulario */}
      {isCreating && (
        <div className="p-6 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            {editingId ? "Editar Marca" : "Nueva Marca"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  placeholder="Ej: Samsung, Apple, HP..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sitio Web
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                rows={3}
                placeholder="Información adicional sobre la marca..."
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingId ? "Actualizar" : "Crear"} Marca
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de marcas */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        {brands.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No hay marcas registradas. Crea tu primera marca.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                    Sitio Web
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {brands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900 dark:text-white/90">
                        {brand.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {brand.description || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {brand.website ? (
                        <a
                          href={brand.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-brand-600 hover:underline dark:text-brand-400"
                        >
                          {brand.website}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(brand)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(brand)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                          title="Eliminar"
                        >
                          <TrashBinIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Marcas</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white/90 mt-1">
            {brands.length}
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Marcas Activas</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {brands.filter((b) => b.is_active).length}
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Con Sitio Web</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {brands.filter((b) => b.website).length}
          </div>
        </div>
      </div>
    </div>
  );
}

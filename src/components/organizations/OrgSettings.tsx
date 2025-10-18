"use client";

import { useState } from "react";
import { useOrganization } from "@/context/OrganizationContext";
import { Building2, Save, Trash2, AlertTriangle } from "lucide-react";
import type { UpdateOrganizationData } from "@/types/organization";

export function OrgSettings() {
  const {
    currentOrg,
    hasPermission,
    updateOrganization,
    deleteOrganization,
  } = useOrganization();

  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const canManageSettings = hasPermission("manage_settings");
  const isOwner = hasPermission("*");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentOrg || !canManageSettings) return;

    const formData = new FormData(e.currentTarget);
    const data: UpdateOrganizationData = {
      name: formData.get("name") as string,
      settings: {
        timezone: formData.get("timezone") as string,
        locale: formData.get("locale") as string,
      },
      branding: {
        primary_color: formData.get("primary_color") as string,
        secondary_color: formData.get("secondary_color") as string,
      },
    };

    setIsSaving(true);
    try {
      await updateOrganization(data);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentOrg || deleteConfirmText !== currentOrg.name) return;

    await deleteOrganization();
    setShowDeleteDialog(false);
  };

  if (!currentOrg) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          Selecciona una organización para ver la configuración
        </p>
      </div>
    );
  }

  if (!canManageSettings) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">
              Sin permisos
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              No tienes permisos para modificar la configuración de esta organización.
              Contacta al administrador.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Configuración de Organización</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Administra la configuración de {currentOrg.name}
        </p>
      </div>

      {/* General Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Información General
          </h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Nombre de la Organización
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={currentOrg.name}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium mb-2">
                Identificador Único (slug)
              </label>
              <input
                id="slug"
                type="text"
                value={currentOrg.slug}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                El identificador único no se puede modificar
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="timezone"
                  className="block text-sm font-medium mb-2"
                >
                  Zona Horaria
                </label>
                <select
                  id="timezone"
                  name="timezone"
                  defaultValue={currentOrg.timezone || "America/Mexico_City"}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="America/Mexico_City">
                    Ciudad de México (GMT-6)
                  </option>
                  <option value="America/Monterrey">Monterrey (GMT-6)</option>
                  <option value="America/Cancun">Cancún (GMT-5)</option>
                  <option value="America/Tijuana">Tijuana (GMT-8)</option>
                  <option value="America/Chihuahua">Chihuahua (GMT-7)</option>
                </select>
              </div>

              <div>
                <label htmlFor="locale" className="block text-sm font-medium mb-2">
                  Idioma
                </label>
                <select
                  id="locale"
                  name="locale"
                  defaultValue={currentOrg.locale || "es"}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Branding Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">Personalización</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="primary_color"
                className="block text-sm font-medium mb-2"
              >
                Color Primario
              </label>
              <div className="flex gap-2">
                <input
                  id="primary_color"
                  name="primary_color"
                  type="color"
                  defaultValue={
                    currentOrg.branding?.primary_color || "#3B82F6"
                  }
                  className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={currentOrg.branding?.primary_color || "#3B82F6"}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="secondary_color"
                className="block text-sm font-medium mb-2"
              >
                Color Secundario
              </label>
              <div className="flex gap-2">
                <input
                  id="secondary_color"
                  name="secondary_color"
                  type="color"
                  defaultValue={
                    currentOrg.branding?.secondary_color || "#10B981"
                  }
                  className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={currentOrg.branding?.secondary_color || "#10B981"}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Info (Read-only) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">Suscripción Actual</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Plan</p>
              <p className="font-medium capitalize mt-1">
                {currentOrg.subscription_plan}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
              <p className="font-medium capitalize mt-1">
                {currentOrg.subscription_status}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Usuarios Máximos
              </p>
              <p className="font-medium mt-1">{currentOrg.max_users}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Entradas por Mes
              </p>
              <p className="font-medium mt-1">
                {currentOrg.max_entradas_per_month}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Módulos Habilitados
            </p>
            <div className="flex gap-2 mt-2">
              {currentOrg.modules_enabled?.map((module) => (
                <span
                  key={module}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                >
                  {module}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      {isOwner && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
            Zona de Peligro
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            Una vez eliminada la organización, no hay vuelta atrás. Por favor,
            ten cuidado.
          </p>

          <button
            onClick={() => setShowDeleteDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar Organización
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowDeleteDialog(false)}
          />

          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Eliminar Organización</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Esta acción es permanente y no se puede deshacer
                  </p>
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Se eliminarán permanentemente:
                </p>
                <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 mt-2 space-y-1">
                  <li>Todos los datos de la organización</li>
                  <li>Todos los miembros serán removidos</li>
                  <li>Todas las entradas y registros</li>
                  <li>La suscripción será cancelada</li>
                </ul>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Para confirmar, escribe el nombre de la organización:{" "}
                  <span className="font-bold">{currentOrg.name}</span>
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={currentOrg.name}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDeleteConfirmText("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirmText !== currentOrg.name}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Eliminar Permanentemente
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

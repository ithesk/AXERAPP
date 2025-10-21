"use client";

import { useState } from "react";
import { useOrganization } from "@/context/OrganizationContext";
import {
  Building2,
  Check,
  ChevronsUpDown,
  PlusCircle,
  Settings,
} from "lucide-react";

export function OrgSwitcher() {
  const {
    currentOrg,
    userOrganizations,
    loading,
    switchOrganization,
    createOrganization,
  } = useOrganization();

  const [isOpen, setIsOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleSwitchOrg = async (orgId: string) => {
    await switchOrganization(orgId);
    setIsOpen(false);
  };

  const handleCreateOrg = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    if (!name) return;

    setCreateLoading(true);
    setCreateError(null);
    try {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      await createOrganization({ name, slug });
      setShowCreateDialog(false);
      setCreateError(null);
      e.currentTarget.reset();
    } catch (error: unknown) {
      console.error("Error creating organization:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al crear la organización";
      setCreateError(errorMessage);
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="h-8 w-8 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Selector de organización */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary/10 dark:bg-primary/20">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {currentOrg?.name || "Sin organización"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {currentOrg?.subscription_plan || "free"}
          </p>
        </div>
        <ChevronsUpDown className="h-4 w-4 text-gray-400" />
      </button>

      {/* Dropdown de organizaciones */}
      {isOpen && (
        <>
          {/* Overlay para cerrar al hacer click fuera */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu dropdown */}
          <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-2">
              <p className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                Mis Organizaciones
              </p>

              {/* Lista de organizaciones */}
              <div className="space-y-1">
                {userOrganizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleSwitchOrg(org.id)}
                    className="flex items-center gap-2 w-full px-2 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    <div className="flex items-center justify-center h-6 w-6 rounded bg-primary/10 dark:bg-primary/20">
                      <Building2 className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{org.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {org.subscription_plan}
                      </p>
                    </div>
                    {currentOrg?.id === org.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* Opciones adicionales */}
            <div className="p-2 space-y-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowCreateDialog(true);
                }}
                className="flex items-center gap-2 w-full px-2 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-sm"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Crear organización</span>
              </button>

              {currentOrg && (
                <a
                  href={`/configuracion/organizacion`}
                  className="flex items-center gap-2 w-full px-2 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-sm"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  <span>Configuración</span>
                </a>
              )}
            </div>
          </div>
        </>
      )}

      {/* Dialog para crear organización */}
      {showCreateDialog && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => {
              if (!createLoading) {
                setShowCreateDialog(false);
                setCreateError(null);
              }
            }}
          />

          {/* Dialog */}
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4">
                Crear Nueva Organización
              </h2>

              <form onSubmit={handleCreateOrg} className="space-y-4">
                {/* Error message */}
                {createError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {createError}
                    </p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="org-name"
                    className="block text-sm font-medium mb-2"
                  >
                    Nombre de la Organización
                  </label>
                  <input
                    id="org-name"
                    name="name"
                    type="text"
                    required
                    disabled={createLoading}
                    placeholder="Mi Empresa"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Se generará un identificador único automáticamente
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateDialog(false);
                      setCreateError(null);
                    }}
                    disabled={createLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {createLoading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creando...
                      </>
                    ) : (
                      "Crear Organización"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

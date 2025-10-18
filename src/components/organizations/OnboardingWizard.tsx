"use client";

import { useState } from "react";
import { useOrganization } from "@/context/OrganizationContext";
import { Building2, ArrowRight, CheckCircle2 } from "lucide-react";

export function OnboardingWizard() {
  const { createOrganization } = useOrganization();
  const [step, setStep] = useState<"welcome" | "create">("welcome");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateOrg = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    if (!name) return;

    setLoading(true);
    setError(null);

    try {
      const slug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      await createOrganization({ name, slug });
      // La organización se creó exitosamente
      // El OrganizationContext la detectará automáticamente
    } catch (err: any) {
      console.error("Error creating organization:", err);
      setError(err?.message || "Error al crear la organización");
      setLoading(false);
    }
  };

  if (step === "welcome") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center py-8">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 sm:p-8">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Building2 className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
              ¡Bienvenido a AXER!
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center mb-4">
              Para comenzar, necesitas crear tu primera organización
            </p>

            {/* Features */}
            <div className="space-y-2.5 mb-6">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Gestiona tu negocio</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Organiza entradas, ventas y más
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Invita a tu equipo</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Colabora con tus empleados
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Acceso desde cualquier lugar</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Datos seguros en la nube
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => setStep("create")}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-lg"
            >
              Crear mi Organización
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center py-8">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 sm:p-8">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Building2 className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
            Crea tu Organización
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center mb-6">
            Escribe el nombre de tu negocio o empresa
          </p>

          {/* Form */}
          <form onSubmit={handleCreateOrg} className="space-y-5">
            {/* Error message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="org-name"
                className="block text-sm font-medium mb-2 text-gray-900 dark:text-white"
              >
                Nombre de la Organización
              </label>
              <input
                id="org-name"
                name="name"
                type="text"
                required
                autoFocus
                disabled={loading}
                placeholder="Ej: Taller Mecánico López"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Podrás cambiar esto más tarde en la configuración
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("welcome")}
                disabled={loading}
                className="flex-1 px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    Crear
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Help text */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-5">
            Al crear una organización, aceptas nuestros términos de servicio
          </p>
        </div>
      </div>
    </div>
  );
}

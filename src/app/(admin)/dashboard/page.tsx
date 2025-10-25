"use client";

import React, { useState } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { useToast } from '@/context/ToastContext';
import DashboardGrid from '@/components/dashboard/DashboardGrid';
import CustomizeDashboardModal from '@/components/dashboard/CustomizeDashboardModal';
import Button from '@/components/ui/button/Button';
import { Settings, Eye, EyeOff, RotateCcw } from 'lucide-react';
import type { WidgetType } from '@/types/dashboard';

export default function Dashboard() {
  const {
    widgets,
    layout,
    isLoading,
    isEditMode,
    setIsEditMode,
    updateLayout,
    addWidget,
    removeWidget,
    resetToDefault,
  } = useDashboard();

  const { showToast } = useToast();
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  const handleAddWidget = async (widgetType: WidgetType): Promise<boolean> => {
    const success = await addWidget(widgetType);
    if (success) {
      showToast('success', 'Widget agregado', 'El widget se agregó correctamente al dashboard');
    } else {
      showToast('error', 'Error', 'No se pudo agregar el widget');
    }
    return success;
  };

  const handleRemoveWidget = async (widgetId: string) => {
    const success = await removeWidget(widgetId);
    if (success) {
      showToast('success', 'Widget eliminado', 'El widget se eliminó correctamente');
    } else {
      showToast('error', 'Error', 'No se pudo eliminar el widget');
    }
  };

  const handleResetDashboard = async (): Promise<boolean> => {
    const success = await resetToDefault();
    if (success) {
      showToast('success', 'Dashboard restablecido', 'Se restauró la configuración por defecto');
    } else {
      showToast('error', 'Error', 'No se pudo restablecer el dashboard');
    }
    return success;
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      showToast('info', 'Modo vista', 'Los cambios se guardaron automáticamente');
    } else {
      showToast('info', 'Modo edición', 'Arrastra y redimensiona los widgets');
    }
    setIsEditMode(!isEditMode);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-brand-500 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isEditMode
              ? 'Modo edición: Arrastra para reorganizar, redimensiona los widgets'
              : 'Vista general de tu negocio'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={toggleEditMode}
            variant={isEditMode ? 'primary' : 'outline'}
            size="md"
            startIcon={isEditMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          >
            {isEditMode ? 'Guardar cambios' : 'Editar'}
          </Button>

          <Button
            onClick={() => setShowCustomizeModal(true)}
            variant="outline"
            size="md"
            startIcon={<Settings className="w-4 h-4" />}
          >
            Personalizar
          </Button>

          {isEditMode && (
            <Button
              onClick={async () => {
                if (confirm('¿Restablecer dashboard a configuración por defecto?')) {
                  await handleResetDashboard();
                  setIsEditMode(false);
                }
              }}
              variant="outline"
              size="md"
              startIcon={<RotateCcw className="w-4 h-4" />}
            >
              Restablecer
            </Button>
          )}
        </div>
      </div>

      {/* Banner informativo en modo edición */}
      {isEditMode && (
        <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-brand-600 dark:text-brand-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-brand-900 dark:text-brand-100">
                Modo de edición activado
              </h3>
              <p className="text-sm text-brand-700 dark:text-brand-300 mt-1">
                Arrastra los widgets para reorganizarlos, redimensiónalos desde las esquinas,
                o elimínalos haciendo hover y clic en el botón X. Los cambios se guardan automáticamente.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid de widgets personalizables */}
      <DashboardGrid
        widgets={widgets}
        layout={layout}
        isEditMode={isEditMode}
        onLayoutChange={updateLayout}
        onRemoveWidget={handleRemoveWidget}
      />

      {/* Modal de personalización */}
      <CustomizeDashboardModal
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        onAddWidget={handleAddWidget}
        onResetDashboard={handleResetDashboard}
        currentWidgets={widgets.map((w) => w.id)}
      />
    </div>
  );
}

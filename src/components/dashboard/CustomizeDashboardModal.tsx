"use client";

import React, { useState } from 'react';
import { X, Plus, Search } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { WIDGET_METADATA, type WidgetType } from '@/types/dashboard';

interface CustomizeDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (widgetType: WidgetType) => Promise<boolean>;
  onResetDashboard: () => Promise<boolean>;
  currentWidgets: string[]; // IDs de widgets actuales
}

export default function CustomizeDashboardModal({
  isOpen,
  onClose,
  onAddWidget,
  onResetDashboard,
  currentWidgets,
}: CustomizeDashboardModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'metrics', label: 'Métricas' },
    { id: 'charts', label: 'Gráficos' },
    { id: 'lists', label: 'Listas' },
    { id: 'analytics', label: 'Análisis' },
  ];

  const availableWidgets = Object.values(WIDGET_METADATA).filter((widget) => {
    const matchesSearch =
      widget.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      widget.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || widget.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleAddWidget = async (widgetType: WidgetType) => {
    setIsAdding(true);
    const success = await onAddWidget(widgetType);
    setIsAdding(false);

    if (success) {
      // Opcional: mostrar notificación de éxito
    }
  };

  const handleResetDashboard = async () => {
    if (confirm('¿Estás seguro de que deseas restablecer el dashboard a su configuración por defecto? Se perderán todos los cambios personalizados.')) {
      const success = await onResetDashboard();
      if (success) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Personalizar Dashboard
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Agrega, reorganiza o elimina widgets según tus necesidades
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar widgets..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {/* Filtros de categoría */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de widgets disponibles */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableWidgets.map((widget) => (
              <div
                key={widget.type}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-brand-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {widget.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {widget.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {widget.defaultWidth} × {widget.defaultHeight}
                  </span>
                  <Button
                    onClick={() => handleAddWidget(widget.type)}
                    disabled={isAdding}
                    size="sm"
                    variant="primary"
                    startIcon={<Plus className="w-4 h-4" />}
                  >
                    Agregar
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {availableWidgets.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No se encontraron widgets
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handleResetDashboard}
            variant="outline"
            size="md"
          >
            Restablecer por defecto
          </Button>
          <Button onClick={onClose} variant="primary" size="md">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

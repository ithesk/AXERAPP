"use client";

import React, { useState } from 'react';
import { useLabelConfig } from '@/hooks/useLabelConfig';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/button/Button';
import {
  LABEL_SIZES,
  LABEL_TEMPLATES,
  FIELD_LABELS,
  type LabelSize,
  type LabelTemplate,
  type LabelField,
  type LabelConfiguration,
} from '@/types/labelConfig';
import {
  Settings,
  Printer,
  Save,
  RotateCcw,
  Download,
  Upload,
  Eye,
  Plus,
  Trash2,
} from 'lucide-react';

type TabType = 'template' | 'fields' | 'style' | 'printer';

export default function LabelConfigurationPanel() {
  const { showToast } = useToast();
  const {
    labelConfig,
    printerConfig,
    savedConfigs,
    saveLabelConfig,
    savePrinterConfig,
    saveAsTemplate,
    deleteTemplate,
    loadTemplate,
    resetToDefault,
    exportConfig,
    importConfig,
  } = useLabelConfig();

  const [activeTab, setActiveTab] = useState<TabType>('template');
  const [localConfig, setLocalConfig] = useState<LabelConfiguration>(labelConfig);
  const [templateName, setTemplateName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  /**
   * Actualizar configuración local
   */
  const updateConfig = (updates: Partial<LabelConfiguration>) => {
    setLocalConfig({ ...localConfig, ...updates });
  };

  /**
   * Guardar configuración
   */
  const handleSave = () => {
    const result = saveLabelConfig(localConfig);
    if (result.success) {
      showToast('success', 'Guardado', 'Configuración guardada correctamente');
    } else {
      showToast('error', 'Error', result.error || 'Error al guardar');
    }
  };

  /**
   * Guardar como plantilla
   */
  const handleSaveAsTemplate = () => {
    if (!templateName.trim()) {
      showToast('warning', 'Nombre requerido', 'Ingresa un nombre para la plantilla');
      return;
    }

    const result = saveAsTemplate(localConfig, templateName);
    if (result.success) {
      showToast('success', 'Plantilla guardada', `Plantilla "${templateName}" creada`);
      setTemplateName('');
      setShowSaveDialog(false);
    } else {
      showToast('error', 'Error', result.error || 'Error al guardar plantilla');
    }
  };

  /**
   * Restablecer valores por defecto
   */
  const handleReset = () => {
    if (confirm('¿Deseas restablecer la configuración por defecto?')) {
      const result = resetToDefault();
      if (result.success) {
        window.location.reload();
      }
    }
  };

  /**
   * Importar configuración
   */
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importConfig(file);
    if (result.success) {
      showToast('success', 'Importado', 'Configuración importada correctamente');
      if (result.config) {
        setLocalConfig(result.config);
      }
    } else {
      showToast('error', 'Error', result.error || 'Error al importar');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Configuración de Etiquetas
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Personaliza el formato y contenido de las etiquetas de impresión
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleReset} variant="outline" size="sm" startIcon={<RotateCcw className="h-4 w-4" />}>
            Restablecer
          </Button>
          <Button onClick={exportConfig} variant="outline" size="sm" startIcon={<Download className="h-4 w-4" />}>
            Exportar
          </Button>
          <label>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Button variant="outline" size="sm" startIcon={<Upload className="h-4 w-4" />}>
              Importar
            </Button>
          </label>
          <Button onClick={handleSave} variant="primary" size="sm" startIcon={<Save className="h-4 w-4" />}>
            Guardar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { id: 'template', label: 'Plantilla y Tamaño', icon: Settings },
            { id: 'fields', label: 'Campos', icon: Eye },
            { id: 'style', label: 'Estilos', icon: Printer },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        {activeTab === 'template' && (
          <TemplateTab config={localConfig} updateConfig={updateConfig} />
        )}
        {activeTab === 'fields' && (
          <FieldsTab config={localConfig} updateConfig={updateConfig} />
        )}
        {activeTab === 'style' && (
          <StyleTab config={localConfig} updateConfig={updateConfig} />
        )}
      </div>

      {/* Plantillas Guardadas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Plantillas Guardadas
          </h3>
          <Button
            onClick={() => setShowSaveDialog(!showSaveDialog)}
            variant="outline"
            size="sm"
            startIcon={<Plus className="h-4 w-4" />}
          >
            Nueva Plantilla
          </Button>
        </div>

        {showSaveDialog && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de la plantilla
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ej: Etiqueta compacta personalizada"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
              />
              <Button onClick={handleSaveAsTemplate} size="sm">
                Guardar
              </Button>
              <Button onClick={() => setShowSaveDialog(false)} variant="outline" size="sm">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {savedConfigs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No hay plantillas guardadas. Crea una plantilla personalizada para usarla después.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedConfigs.map((config) => (
              <div
                key={config.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-brand-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {config.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {LABEL_SIZES[config.size].name} • {LABEL_TEMPLATES[config.template].name}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('¿Eliminar esta plantilla?')) {
                        deleteTemplate(config.id!);
                      }
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  onClick={() => {
                    loadTemplate(config.id!);
                    setLocalConfig(config);
                    showToast('success', 'Cargado', `Plantilla "${config.name}" cargada`);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                >
                  Usar esta plantilla
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Tab: Plantilla y Tamaño
 */
function TemplateTab({
  config,
  updateConfig,
}: {
  config: LabelConfiguration;
  updateConfig: (updates: Partial<LabelConfiguration>) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Selección de Tamaño */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Tamaño de Etiqueta
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.values(LABEL_SIZES).map((size) => (
            <button
              key={size.id}
              onClick={() => updateConfig({ size: size.id })}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                config.size === size.id
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {size.name}
                </span>
                {size.recommended && (
                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded">
                    Recomendado
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {size.description}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {size.widthMM}mm × {size.heightMM}mm
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Selección de Plantilla */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Plantilla de Diseño
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(LABEL_TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              onClick={() => updateConfig({ template: key as LabelTemplate })}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                config.template === key
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-900 dark:text-white mb-1">
                {template.name}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {template.description}
              </p>
              {template.requiresQR && (
                <span className="inline-block text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded mt-2">
                  Con QR
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Tab: Campos
 */
function FieldsTab({
  config,
  updateConfig,
}: {
  config: LabelConfiguration;
  updateConfig: (updates: Partial<LabelConfiguration>) => void;
}) {
  const toggleField = (fieldName: LabelField) => {
    const updatedFields = config.fields.map((f) =>
      f.field === fieldName ? { ...f, enabled: !f.enabled } : f
    );
    updateConfig({ fields: updatedFields });
  };

  const addField = (fieldName: LabelField) => {
    if (!config.fields.find((f) => f.field === fieldName)) {
      updateConfig({
        fields: [...config.fields, { field: fieldName, enabled: true }],
      });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Selecciona qué información deseas incluir en la etiqueta
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(FIELD_LABELS).map(([key, label]) => {
          const field = config.fields.find((f) => f.field === key);
          const isEnabled = field?.enabled ?? false;

          return (
            <div
              key={key}
              className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                isEnabled
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {label}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => {
                    if (field) {
                      toggleField(key as LabelField);
                    } else {
                      addField(key as LabelField);
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Tab: Estilos
 */
function StyleTab({
  config,
  updateConfig,
}: {
  config: LabelConfiguration;
  updateConfig: (updates: Partial<LabelConfiguration>) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Tamaño de QR */}
      {config.fields.some((f) => f.field === 'qr_code' && f.enabled) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tamaño del Código QR: {config.qrCodeStyle?.size || 30}mm
          </label>
          <input
            type="range"
            min="20"
            max="50"
            value={config.qrCodeStyle?.size || 30}
            onChange={(e) =>
              updateConfig({
                qrCodeStyle: {
                  ...config.qrCodeStyle!,
                  size: parseInt(e.target.value),
                },
              })
            }
            className="w-full"
          />
        </div>
      )}

      {/* Tamaños de fuente */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Encabezado
          </label>
          <input
            type="number"
            min="6"
            max="16"
            value={config.headerStyle?.fontSize || 10}
            onChange={(e) =>
              updateConfig({
                headerStyle: {
                  ...config.headerStyle!,
                  fontSize: parseInt(e.target.value),
                },
              })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cuerpo
          </label>
          <input
            type="number"
            min="5"
            max="12"
            value={config.bodyStyle?.fontSize || 7}
            onChange={(e) =>
              updateConfig({
                bodyStyle: {
                  ...config.bodyStyle!,
                  fontSize: parseInt(e.target.value),
                },
              })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pie
          </label>
          <input
            type="number"
            min="4"
            max="10"
            value={config.footerStyle?.fontSize || 5}
            onChange={(e) =>
              updateConfig({
                footerStyle: {
                  ...config.footerStyle!,
                  fontSize: parseInt(e.target.value),
                },
              })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* Márgenes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Márgenes (mm)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['top', 'right', 'bottom', 'left'].map((side) => (
            <div key={side}>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 capitalize">
                {side === 'top' ? 'Superior' : side === 'right' ? 'Derecho' : side === 'bottom' ? 'Inferior' : 'Izquierdo'}
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={config.margins[side as keyof typeof config.margins]}
                onChange={(e) =>
                  updateConfig({
                    margins: {
                      ...config.margins,
                      [side]: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Espaciado entre líneas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Espaciado entre líneas: {config.lineSpacing}mm
        </label>
        <input
          type="range"
          min="1"
          max="6"
          value={config.lineSpacing}
          onChange={(e) => updateConfig({ lineSpacing: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Mostrar borde */}
      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          Mostrar borde en la etiqueta
        </span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.showBorder}
            onChange={(e) => updateConfig({ showBorder: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
        </label>
      </div>
    </div>
  );
}

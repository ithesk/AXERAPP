/**
 * Hook para gestionar configuraciones de etiquetas
 */

import { useState, useEffect, useCallback } from 'react';
import type { LabelConfiguration, PrinterConfiguration } from '@/types/labelConfig';
import { DEFAULT_LABEL_CONFIG } from '@/types/labelConfig';

const STORAGE_KEY_LABEL = 'axer_label_config';
const STORAGE_KEY_PRINTER = 'axer_printer_config';

export function useLabelConfig() {
  const [labelConfig, setLabelConfig] = useState<LabelConfiguration>(DEFAULT_LABEL_CONFIG);
  const [printerConfig, setPrinterConfig] = useState<PrinterConfiguration | null>(null);
  const [savedConfigs, setSavedConfigs] = useState<LabelConfiguration[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Cargar configuración desde localStorage
   */
  const loadConfig = useCallback(() => {
    try {
      setLoading(true);

      // Cargar configuración de etiqueta actual
      const savedLabelConfig = localStorage.getItem(STORAGE_KEY_LABEL);
      if (savedLabelConfig) {
        const parsed = JSON.parse(savedLabelConfig);
        setLabelConfig({ ...DEFAULT_LABEL_CONFIG, ...parsed });
      }

      // Cargar configuración de impresora
      const savedPrinterConfig = localStorage.getItem(STORAGE_KEY_PRINTER);
      if (savedPrinterConfig) {
        setPrinterConfig(JSON.parse(savedPrinterConfig));
      }

      // Cargar configuraciones guardadas
      const savedConfigsData = localStorage.getItem(STORAGE_KEY_LABEL + '_saved');
      if (savedConfigsData) {
        setSavedConfigs(JSON.parse(savedConfigsData));
      }
    } catch (error) {
      console.error('Error loading label config:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Guardar configuración de etiqueta
   */
  const saveLabelConfig = useCallback((config: LabelConfiguration) => {
    try {
      const configToSave = {
        ...config,
        updated_at: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY_LABEL, JSON.stringify(configToSave));
      setLabelConfig(configToSave);

      return { success: true, config: configToSave };
    } catch (error) {
      console.error('Error saving label config:', error);
      return { success: false, error: 'Error al guardar la configuración' };
    }
  }, []);

  /**
   * Guardar configuración de impresora
   */
  const savePrinterConfig = useCallback((config: PrinterConfiguration) => {
    try {
      const configToSave = {
        ...config,
        updated_at: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY_PRINTER, JSON.stringify(configToSave));
      setPrinterConfig(configToSave);

      return { success: true, config: configToSave };
    } catch (error) {
      console.error('Error saving printer config:', error);
      return { success: false, error: 'Error al guardar la configuración de impresora' };
    }
  }, []);

  /**
   * Guardar una configuración como plantilla
   */
  const saveAsTemplate = useCallback((config: LabelConfiguration, name: string) => {
    try {
      const newConfig = {
        ...config,
        id: `template_${Date.now()}`,
        name,
        isDefault: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedConfigs = [...savedConfigs, newConfig];
      localStorage.setItem(STORAGE_KEY_LABEL + '_saved', JSON.stringify(updatedConfigs));
      setSavedConfigs(updatedConfigs);

      return { success: true, config: newConfig };
    } catch (error) {
      console.error('Error saving template:', error);
      return { success: false, error: 'Error al guardar la plantilla' };
    }
  }, [savedConfigs]);

  /**
   * Eliminar una plantilla guardada
   */
  const deleteTemplate = useCallback((id: string) => {
    try {
      const updatedConfigs = savedConfigs.filter((c) => c.id !== id);
      localStorage.setItem(STORAGE_KEY_LABEL + '_saved', JSON.stringify(updatedConfigs));
      setSavedConfigs(updatedConfigs);

      return { success: true };
    } catch (error) {
      console.error('Error deleting template:', error);
      return { success: false, error: 'Error al eliminar la plantilla' };
    }
  }, [savedConfigs]);

  /**
   * Cargar una plantilla
   */
  const loadTemplate = useCallback((id: string) => {
    const template = savedConfigs.find((c) => c.id === id);
    if (template) {
      setLabelConfig(template);
      return { success: true, config: template };
    }
    return { success: false, error: 'Plantilla no encontrada' };
  }, [savedConfigs]);

  /**
   * Restablecer a configuración por defecto
   */
  const resetToDefault = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY_LABEL);
      setLabelConfig(DEFAULT_LABEL_CONFIG);
      return { success: true };
    } catch (error) {
      console.error('Error resetting config:', error);
      return { success: false, error: 'Error al restablecer configuración' };
    }
  }, []);

  /**
   * Exportar configuración
   */
  const exportConfig = useCallback(() => {
    try {
      const dataStr = JSON.stringify(labelConfig, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `label-config-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Error exporting config:', error);
      return { success: false, error: 'Error al exportar configuración' };
    }
  }, [labelConfig]);

  /**
   * Importar configuración
   */
  const importConfig = useCallback((file: File) => {
    return new Promise<{ success: boolean; config?: LabelConfiguration; error?: string }>((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const imported = JSON.parse(content);
          const validatedConfig = { ...DEFAULT_LABEL_CONFIG, ...imported };

          setLabelConfig(validatedConfig);
          localStorage.setItem(STORAGE_KEY_LABEL, JSON.stringify(validatedConfig));

          resolve({ success: true, config: validatedConfig });
        } catch (error) {
          console.error('Error importing config:', error);
          resolve({ success: false, error: 'Error al importar configuración' });
        }
      };

      reader.onerror = () => {
        resolve({ success: false, error: 'Error al leer el archivo' });
      };

      reader.readAsText(file);
    });
  }, []);

  // Cargar al montar
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    // Estado
    labelConfig,
    printerConfig,
    savedConfigs,
    loading,

    // Acciones
    saveLabelConfig,
    savePrinterConfig,
    saveAsTemplate,
    deleteTemplate,
    loadTemplate,
    resetToDefault,
    exportConfig,
    importConfig,
    refreshConfig: loadConfig,
  };
}

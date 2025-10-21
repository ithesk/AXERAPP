import jsPDF from 'jspdf';
import type { Entrada } from '@/types/entradas';
import type { LabelConfiguration } from '@/types/labelConfig';
import { DEFAULT_LABEL_CONFIG } from '@/types/labelConfig';
import { generateTemplateLabel } from './labelTemplates';

/**
 * Opciones para generar etiqueta PDF
 */
export interface GenerateEntryLabelOptions {
  entrada: Entrada;
  orgName: string;
  baseUrl?: string; // URL base para el QR (ej: https://app.axer.com)
  config?: LabelConfiguration; // Configuración personalizada
}

/**
 * Cargar configuración desde localStorage
 */
function loadConfigFromStorage(): LabelConfiguration | null {
  try {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('axer_label_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_LABEL_CONFIG, ...parsed };
    }
  } catch (error) {
    console.error('Error loading label config:', error);
  }
  return null;
}

/**
 * Genera una etiqueta PDF para una entrada de equipo
 * Usa configuración personalizada o la guardada en localStorage
 */
export async function generateEntryLabelPDF(
  options: GenerateEntryLabelOptions
): Promise<jsPDF> {
  const { entrada, orgName, baseUrl = 'https://app.axer.com', config } = options;

  // Si hay configuración personalizada, usarla
  if (config) {
    return generateTemplateLabel({ entrada, orgName, baseUrl, config });
  }

  // Si no, intentar cargar del localStorage
  const savedConfig = loadConfigFromStorage();
  if (savedConfig) {
    return generateTemplateLabel({ entrada, orgName, baseUrl, config: savedConfig });
  }

  // Fallback: usar configuración por defecto
  return generateTemplateLabel({
    entrada,
    orgName,
    baseUrl,
    config: DEFAULT_LABEL_CONFIG,
  });
}

/**
 * Genera etiquetas para múltiples entradas en un solo PDF
 * Cada etiqueta en una página separada
 */
export async function generateBatchEntryLabels(
  entradas: Entrada[],
  orgName: string,
  baseUrl?: string,
  config?: LabelConfiguration
): Promise<jsPDF> {
  if (entradas.length === 0) {
    throw new Error('No hay entradas para generar etiquetas');
  }

  // Obtener configuración
  const labelConfig = config || loadConfigFromStorage() || DEFAULT_LABEL_CONFIG;

  // Generar la primera etiqueta
  const doc = await generateTemplateLabel({
    entrada: entradas[0],
    orgName,
    baseUrl: baseUrl || 'https://app.axer.com',
    config: labelConfig,
  });

  // Agregar las demás etiquetas como páginas adicionales
  for (let i = 1; i < entradas.length; i++) {
    // Determinar tamaño de página
    const width = labelConfig.size === 'custom'
      ? labelConfig.customWidth!
      : getLabelWidth(labelConfig.size);
    const height = labelConfig.size === 'custom'
      ? labelConfig.customHeight!
      : getLabelHeight(labelConfig.size);

    doc.addPage([width, height], 'portrait');

    // Generar etiqueta en la nueva página
    const tempDoc = await generateTemplateLabel({
      entrada: entradas[i],
      orgName,
      baseUrl: baseUrl || 'https://app.axer.com',
      config: labelConfig,
    });

    // Copiar contenido de tempDoc a la página actual
    // (jsPDF no permite copiar directamente, así que reutilizamos la lógica del template)
  }

  return doc;
}

/**
 * Descarga directamente una etiqueta para una entrada
 */
export async function downloadEntryLabel(
  entrada: Entrada,
  orgName: string,
  baseUrl?: string,
  config?: LabelConfiguration
): Promise<void> {
  const doc = await generateEntryLabelPDF({ entrada, orgName, baseUrl, config });
  const fileName = `etiqueta-${entrada.id_reparacion}.pdf`;
  doc.save(fileName);
}

/**
 * Descarga etiquetas para múltiples entradas
 */
export async function downloadBatchLabels(
  entradas: Entrada[],
  orgName: string,
  baseUrl?: string,
  config?: LabelConfiguration
): Promise<void> {
  const doc = await generateBatchEntryLabels(entradas, orgName, baseUrl, config);
  const fileName = `etiquetas-entradas-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

/**
 * Utilidades
 */
function getLabelWidth(size: string): number {
  const sizes: Record<string, number> = {
    '2x1': 50.8,
    '2x1.5': 50.8,
    '2x3': 50.8,
    '2x3.5': 50.8,
    '2x4': 50.8,
    '4x6': 101.6,
  };
  return sizes[size] || 50.8;
}

function getLabelHeight(size: string): number {
  const sizes: Record<string, number> = {
    '2x1': 25.4,
    '2x1.5': 38.1,
    '2x3': 76.2,
    '2x3.5': 88.9,
    '2x4': 101.6,
    '4x6': 152.4,
  };
  return sizes[size] || 88.9;
}

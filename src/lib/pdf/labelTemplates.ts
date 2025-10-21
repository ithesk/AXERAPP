/**
 * Generadores de plantillas prediseñadas para etiquetas
 */

import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import type { Entrada } from '@/types/entradas';
import type { LabelConfiguration, LabelTemplate } from '@/types/labelConfig';

interface GenerateTemplateLabelParams {
  entrada: Entrada;
  orgName: string;
  baseUrl: string;
  config: LabelConfiguration;
}

/**
 * Generar etiqueta según plantilla seleccionada
 */
export async function generateTemplateLabel(
  params: GenerateTemplateLabelParams
): Promise<jsPDF> {
  const { config } = params;

  switch (config.template) {
    case 'standard':
      return generateStandardLabel(params);
    case 'compact':
      return generateCompactLabel(params);
    case 'minimal':
      return generateMinimalLabel(params);
    case 'detailed':
      return generateDetailedLabel(params);
    case 'qr-only':
      return generateQROnlyLabel(params);
    case 'barcode':
      return generateBarcodeLabel(params);
    case 'custom':
      return generateCustomLabel(params);
    default:
      return generateStandardLabel(params);
  }
}

/**
 * PLANTILLA ESTÁNDAR - Con QR, info completa
 */
async function generateStandardLabel(params: GenerateTemplateLabelParams): Promise<jsPDF> {
  const { entrada, orgName, baseUrl, config } = params;

  const width = config.size === 'custom' ? config.customWidth! : getLabelWidth(config.size);
  const height = config.size === 'custom' ? config.customHeight! : getLabelHeight(config.size);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [width, height],
  });

  let y = config.margins.top;
  const centerX = width / 2;
  const contentWidth = width - config.margins.left - config.margins.right;

  // 1. Número de entrada (header)
  if (isFieldEnabled(config, 'entry_number')) {
    doc.setFontSize(config.headerStyle?.fontSize || 10);
    doc.setFont('helvetica', config.headerStyle?.fontWeight || 'bold');
    doc.text(`#${entrada.id_reparacion}`, centerX, y, { align: 'center' });
    y += config.lineSpacing + 3;

    // Línea separadora
    if (config.showBorder) {
      doc.setLineWidth(0.2);
      doc.line(config.margins.left, y, width - config.margins.right, y);
      y += 2;
    }
  }

  // 2. Nombre de empresa
  if (isFieldEnabled(config, 'company_name')) {
    doc.setFontSize(config.bodyStyle?.fontSize || 7);
    doc.setFont('helvetica', 'normal');
    const orgLines = doc.splitTextToSize(orgName.toUpperCase(), contentWidth);
    doc.text(orgLines, centerX, y, { align: 'center' });
    y += orgLines.length * config.lineSpacing + 2;
  }

  // 3. QR Code
  if (isFieldEnabled(config, 'qr_code')) {
    const qrUrl = `${baseUrl}/entradas/${entrada.id}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 200,
      margin: config.qrCodeStyle?.margin || 1,
      errorCorrectionLevel: config.qrCodeStyle?.errorCorrection || 'M',
    });

    const qrSize = config.qrCodeStyle?.size || 30;
    const qrX = (width - qrSize) / 2;
    doc.addImage(qrDataUrl, 'PNG', qrX, y, qrSize, qrSize);
    y += qrSize + 3;
  }

  // 4. Modelo
  if (isFieldEnabled(config, 'device_model')) {
    doc.setFontSize(config.bodyStyle?.fontSize || 7);
    doc.setFont('helvetica', 'bold');
    doc.text('MODELO:', config.margins.left, y);
    y += 2.5;

    doc.setFont('helvetica', 'normal');
    const modelLines = doc.splitTextToSize(entrada.modelo.toUpperCase(), contentWidth);
    doc.text(modelLines, centerX, y, { align: 'center' });
    y += modelLines.length * config.lineSpacing + 2;
  }

  // 5. IMEI/SN
  if (isFieldEnabled(config, 'imei_serial') && entrada.imei_sn) {
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text('IMEI/SN:', config.margins.left, y);
    y += 2;

    doc.setFont('helvetica', 'normal');
    const imeiLines = doc.splitTextToSize(entrada.imei_sn, contentWidth);
    doc.text(imeiLines, centerX, y, { align: 'center' });
    y += imeiLines.length * 2.5 + 1.5;
  }

  // 6. Fecha
  if (isFieldEnabled(config, 'entry_date')) {
    doc.setFontSize(config.footerStyle?.fontSize || 6);
    doc.setFont('helvetica', 'normal');
    const fecha = new Date(entrada.fecha_entrada).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    doc.text(`Fecha: ${fecha}`, centerX, y, { align: 'center' });
    y += 3;
  }

  // 7. Cliente
  if (isFieldEnabled(config, 'customer_name')) {
    doc.setFontSize(5);
    const clienteLines = doc.splitTextToSize(entrada.nombre_cliente.toUpperCase(), contentWidth);
    doc.text(clienteLines, centerX, y, { align: 'center' });
  }

  return doc;
}

/**
 * PLANTILLA COMPACTA - Sin QR
 */
async function generateCompactLabel(params: GenerateTemplateLabelParams): Promise<jsPDF> {
  const { entrada, orgName, config } = params;

  const width = config.size === 'custom' ? config.customWidth! : getLabelWidth(config.size);
  const height = config.size === 'custom' ? config.customHeight! : getLabelHeight(config.size);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [width, height],
  });

  let y = config.margins.top;
  const centerX = width / 2;
  const contentWidth = width - config.margins.left - config.margins.right;

  // Número de entrada
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`#${entrada.id_reparacion}`, centerX, y, { align: 'center' });
  y += 6;

  // Empresa
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(orgName.toUpperCase(), centerX, y, { align: 'center' });
  y += 5;

  // Modelo
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const modelLines = doc.splitTextToSize(entrada.modelo.toUpperCase(), contentWidth);
  doc.text(modelLines, centerX, y, { align: 'center' });
  y += modelLines.length * 4 + 2;

  // Fecha
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const fecha = new Date(entrada.fecha_entrada).toLocaleDateString('es-MX');
  doc.text(fecha, centerX, y, { align: 'center' });
  y += 4;

  // Cliente
  doc.setFontSize(6);
  const clienteLines = doc.splitTextToSize(entrada.nombre_cliente, contentWidth);
  doc.text(clienteLines, centerX, y, { align: 'center' });

  return doc;
}

/**
 * PLANTILLA MÍNIMA - Solo ID y modelo
 */
async function generateMinimalLabel(params: GenerateTemplateLabelParams): Promise<jsPDF> {
  const { entrada, config } = params;

  const width = config.size === 'custom' ? config.customWidth! : getLabelWidth(config.size);
  const height = config.size === 'custom' ? config.customHeight! : getLabelHeight(config.size);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [width, height],
  });

  const centerX = width / 2;
  const centerY = height / 2;

  // Número de entrada (centrado verticalmente)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`#${entrada.id_reparacion}`, centerX, centerY - 4, { align: 'center' });

  // Modelo
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const contentWidth = width - config.margins.left - config.margins.right;
  const modelLines = doc.splitTextToSize(entrada.modelo, contentWidth);
  doc.text(modelLines, centerX, centerY + 2, { align: 'center' });

  return doc;
}

/**
 * PLANTILLA DETALLADA - Máxima información
 */
async function generateDetailedLabel(params: GenerateTemplateLabelParams): Promise<jsPDF> {
  const { entrada, orgName, baseUrl, config } = params;

  const width = config.size === 'custom' ? config.customWidth! : getLabelWidth(config.size);
  const height = config.size === 'custom' ? config.customHeight! : getLabelHeight(config.size);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [width, height],
  });

  let y = config.margins.top;
  const centerX = width / 2;
  const contentWidth = width - config.margins.left - config.margins.right;

  // Header con empresa y entrada
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(orgName.toUpperCase(), centerX, y, { align: 'center' });
  y += 5;

  doc.setFontSize(12);
  doc.text(`#${entrada.id_reparacion}`, centerX, y, { align: 'center' });
  y += 7;

  // QR Code
  const qrUrl = `${baseUrl}/entradas/${entrada.id}`;
  const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 200, margin: 1 });
  const qrSize = 25;
  doc.addImage(qrDataUrl, 'PNG', (width - qrSize) / 2, y, qrSize, qrSize);
  y += qrSize + 4;

  // Información del dispositivo
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('EQUIPO:', config.margins.left, y);
  doc.setFont('helvetica', 'normal');
  doc.text(entrada.modelo, config.margins.left + 15, y);
  y += 4;

  if (entrada.imei_sn) {
    doc.setFont('helvetica', 'bold');
    doc.text('IMEI/SN:', config.margins.left, y);
    doc.setFont('helvetica', 'normal');
    doc.text(entrada.imei_sn, config.margins.left + 15, y);
    y += 4;
  }

  // Cliente
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE:', config.margins.left, y);
  doc.setFont('helvetica', 'normal');
  const clienteLines = doc.splitTextToSize(entrada.nombre_cliente, contentWidth - 15);
  doc.text(clienteLines, config.margins.left + 15, y);
  y += clienteLines.length * 3.5 + 2;

  doc.setFont('helvetica', 'bold');
  doc.text('TEL:', config.margins.left, y);
  doc.setFont('helvetica', 'normal');
  doc.text(entrada.telefono, config.margins.left + 15, y);
  y += 4;

  // Estado y técnico
  doc.setFont('helvetica', 'bold');
  doc.text('ESTADO:', config.margins.left, y);
  doc.setFont('helvetica', 'normal');
  doc.text(entrada.estado, config.margins.left + 15, y);
  y += 4;

  if (entrada.tecnico_asignado) {
    doc.setFont('helvetica', 'bold');
    doc.text('TÉCNICO:', config.margins.left, y);
    doc.setFont('helvetica', 'normal');
    doc.text(entrada.tecnico_asignado, config.margins.left + 15, y);
    y += 4;
  }

  // Problema
  doc.setFont('helvetica', 'bold');
  doc.text('PROBLEMA:', config.margins.left, y);
  y += 3;
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  const problemLines = doc.splitTextToSize(entrada.problema, contentWidth);
  doc.text(problemLines, config.margins.left, y);
  y += problemLines.length * 2.5 + 2;

  // Fecha
  doc.setFontSize(6);
  const fecha = new Date(entrada.fecha_entrada).toLocaleDateString('es-MX');
  doc.text(`Fecha: ${fecha}`, centerX, y, { align: 'center' });

  return doc;
}

/**
 * PLANTILLA QR GRANDE - Solo QR y número
 */
async function generateQROnlyLabel(params: GenerateTemplateLabelParams): Promise<jsPDF> {
  const { entrada, baseUrl, config } = params;

  const width = config.size === 'custom' ? config.customWidth! : getLabelWidth(config.size);
  const height = config.size === 'custom' ? config.customHeight! : getLabelHeight(config.size);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [width, height],
  });

  const centerX = width / 2;
  const centerY = height / 2;

  // Número de entrada arriba
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`#${entrada.id_reparacion}`, centerX, config.margins.top + 5, { align: 'center' });

  // QR Code grande centrado
  const qrUrl = `${baseUrl}/entradas/${entrada.id}`;
  const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 300, margin: 0 });
  const qrSize = Math.min(width, height) * 0.6;
  const qrX = (width - qrSize) / 2;
  const qrY = centerY - qrSize / 2 + 3;

  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

  return doc;
}

/**
 * PLANTILLA CON CÓDIGO DE BARRAS
 */
async function generateBarcodeLabel(params: GenerateTemplateLabelParams): Promise<jsPDF> {
  const { entrada, orgName, config } = params;

  const width = config.size === 'custom' ? config.customWidth! : getLabelWidth(config.size);
  const height = config.size === 'custom' ? config.customHeight! : getLabelHeight(config.size);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [width, height],
  });

  let y = config.margins.top;
  const centerX = width / 2;
  const contentWidth = width - config.margins.left - config.margins.right;

  // Número de entrada
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`#${entrada.id_reparacion}`, centerX, y, { align: 'center' });
  y += 6;

  // Empresa
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(orgName.toUpperCase(), centerX, y, { align: 'center' });
  y += 5;

  // Código de barras (simulado - aquí podrías integrar una librería de barcode)
  // Por ahora, mostramos el ID como texto
  doc.setFontSize(8);
  doc.setFont('courier', 'bold');
  doc.text(`|||| ${entrada.id_reparacion} ||||`, centerX, y, { align: 'center' });
  y += 8;

  // Modelo
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const modelLines = doc.splitTextToSize(entrada.modelo.toUpperCase(), contentWidth);
  doc.text(modelLines, centerX, y, { align: 'center' });
  y += modelLines.length * 4 + 3;

  // Fecha
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  const fecha = new Date(entrada.fecha_entrada).toLocaleDateString('es-MX');
  doc.text(fecha, centerX, y, { align: 'center' });

  return doc;
}

/**
 * PLANTILLA PERSONALIZADA
 */
async function generateCustomLabel(params: GenerateTemplateLabelParams): Promise<jsPDF> {
  // Por ahora usa la plantilla estándar, pero con los campos configurados por el usuario
  return generateStandardLabel(params);
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

function isFieldEnabled(config: LabelConfiguration, fieldName: string): boolean {
  return config.fields.some((f) => f.field === fieldName && f.enabled);
}

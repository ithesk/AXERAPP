import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import type { Entrada } from '@/types/entradas';

/**
 * Opciones para generar ticket de punto de venta
 */
export interface GeneratePOSTicketOptions {
  entrada: Entrada;
  orgName: string;
  orgLogo?: string; // URL o data URI del logo
  baseUrl?: string; // URL base para el QR
}

/**
 * Genera un ticket térmico de punto de venta (80mm de ancho)
 * Formato optimizado para impresoras térmicas POS
 */
export async function generatePOSTicket(
  options: GeneratePOSTicketOptions
): Promise<jsPDF> {
  const { entrada, orgName, orgLogo, baseUrl = 'https://app.axer.com' } = options;

  // Tamaño de ticket térmico: 80mm de ancho
  const ticketWidth = 80; // mm
  const margin = 5; // mm
  const contentWidth = ticketWidth - (margin * 2);

  // Crear PDF con altura dinámica (empezamos con estimado)
  const doc = new jsPDF({
    unit: 'mm',
    format: [ticketWidth, 297], // Altura estimada, se ajustará
    orientation: 'portrait',
  });

  let yPos = margin;

  // Función auxiliar para dibujar línea doble
  const drawDoubleLine = (y: number) => {
    doc.setLineWidth(0.5);
    doc.line(margin, y, ticketWidth - margin, y);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 0.8, ticketWidth - margin, y + 0.8);
  };

  // ============================================
  // 1. LOGO (si existe)
  // ============================================
  if (orgLogo) {
    try {
      const logoWidth = 30;
      const logoHeight = 15;
      const logoX = (ticketWidth - logoWidth) / 2;
      doc.addImage(orgLogo, 'PNG', logoX, yPos, logoWidth, logoHeight);
      yPos += logoHeight + 3;
    } catch (error) {
      console.error('Error al agregar logo:', error);
    }
  }

  // ============================================
  // 2. TÍTULO - HOJA DE ENTRADA
  // ============================================
  // Caja con fondo oscuro para el título
  const titleBoxHeight = 10;
  doc.setFillColor(40, 40, 40);
  doc.rect(margin, yPos, contentWidth, titleBoxHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const title = 'HOJA DE ENTRADA';
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (ticketWidth - titleWidth) / 2, yPos + 6.5);

  yPos += titleBoxHeight + 2;
  doc.setTextColor(0, 0, 0);

  // Nombre de la organización
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const orgWidth = doc.getTextWidth(orgName);
  doc.text(orgName, (ticketWidth - orgWidth) / 2, yPos);
  yPos += 5;

  drawDoubleLine(yPos);
  yPos += 4;

  // ============================================
  // 3. INFORMACIÓN DEL CLIENTE
  // ============================================
  // Header de sección con fondo gris
  doc.setFillColor(220, 220, 220);
  doc.rect(margin, yPos, contentWidth, 6, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL CLIENTE', margin + 1, yPos + 4);
  yPos += 7;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');

  // Cliente
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', margin + 1, yPos);
  doc.setFont('helvetica', 'normal');
  const clientText = wrapText(doc, entrada.nombre_cliente, contentWidth - 18);
  doc.text(clientText, margin + 18, yPos);
  yPos += 4.5 * Math.max(1, Math.ceil(clientText.length / 45));

  // Teléfono
  doc.setFont('helvetica', 'bold');
  doc.text('Teléfono:', margin + 1, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(entrada.telefono, margin + 18, yPos);
  yPos += 4.5;

  // Fecha y Hora
  const fechaEntrada = new Date(entrada.fecha_entrada);
  const fechaStr = fechaEntrada.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaStr = fechaEntrada.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  doc.setFont('helvetica', 'bold');
  doc.text('Fecha:', margin + 1, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(fechaStr, margin + 18, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('Hora:', margin + 38, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(horaStr, margin + 50, yPos);
  yPos += 5;

  drawDoubleLine(yPos);
  yPos += 4;

  // ============================================
  // 4. DATOS DEL EQUIPO
  // ============================================
  // Header de sección con fondo gris
  doc.setFillColor(220, 220, 220);
  doc.rect(margin, yPos, contentWidth, 6, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL EQUIPO', margin + 1, yPos + 4);
  yPos += 7;

  // ID Reparación (destacado con caja y patrón)
  const idBoxHeight = 8;
  // Patrón de líneas diagonales para resaltar (visible en térmicas)
  doc.setFillColor(240, 240, 240); // Gris muy claro
  doc.rect(margin, yPos, contentWidth, idBoxHeight, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.7);
  doc.rect(margin, yPos, contentWidth, idBoxHeight, 'S');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('ID REPARACIÓN:', margin + 2, yPos + 3.5);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const idWidth = doc.getTextWidth(entrada.id_reparacion);
  doc.text(entrada.id_reparacion, (ticketWidth - idWidth) / 2, yPos + 6.5);
  yPos += idBoxHeight + 3;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setDrawColor(0);

  // Modelo
  doc.setFont('helvetica', 'bold');
  doc.text('Modelo:', margin + 1, yPos);
  doc.setFont('helvetica', 'normal');
  const modeloText = wrapText(doc, entrada.modelo, contentWidth - 18);
  doc.text(modeloText, margin + 18, yPos);
  yPos += 4.5 * Math.max(1, Math.ceil(modeloText.length / 45));

  // IMEI/SN
  if (entrada.imei_sn) {
    doc.setFont('helvetica', 'bold');
    doc.text('IMEI/SN:', margin + 1, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(entrada.imei_sn, margin + 18, yPos);
    yPos += 4.5;
  }

  // Problema reportado
  doc.setFont('helvetica', 'bold');
  doc.text('Problema:', margin + 1, yPos);
  doc.setFont('helvetica', 'normal');
  const problemaText = wrapText(doc, entrada.problema, contentWidth - 18);
  const problemaLines = problemaText.split('\n');
  doc.text(problemaLines[0], margin + 18, yPos);
  yPos += 4.5;

  if (problemaLines.length > 1) {
    for (let i = 1; i < problemaLines.length; i++) {
      doc.text(problemaLines[i], margin + 1, yPos);
      yPos += 4.5;
    }
  }

  // Accesorios
  if (entrada.accesorios) {
    doc.setFont('helvetica', 'bold');
    doc.text('Accesorios:', margin + 1, yPos);
    doc.setFont('helvetica', 'normal');
    const accText = wrapText(doc, entrada.accesorios, contentWidth - 18);
    const accLines = accText.split('\n');
    doc.text(accLines[0], margin + 18, yPos);
    yPos += 4.5;

    if (accLines.length > 1) {
      for (let i = 1; i < accLines.length; i++) {
        doc.text(accLines[i], margin + 1, yPos);
        yPos += 4.5;
      }
    }
  }

  // Contraseñas
  if (entrada.device_passwords) {
    doc.setFont('helvetica', 'bold');
    doc.text('Contraseña:', margin + 1, yPos);
    doc.setFont('helvetica', 'normal');
    // Mostrar asteriscos en lugar de puntos para mejor visibilidad en térmicas
    doc.text('*'.repeat(Math.min(entrada.device_passwords.length, 15)), margin + 18, yPos);
    yPos += 4.5;
  }

  yPos += 2;
  drawDoubleLine(yPos);
  yPos += 4;

  // ============================================
  // 5. TEST DE FUNCIONAMIENTO - MEJORADO
  // ============================================
  // Header de sección con fondo gris
  doc.setFillColor(220, 220, 220);
  doc.rect(margin, yPos, contentWidth, 6, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TEST DE FUNCIONAMIENTO', margin + 1, yPos + 4);
  yPos += 7;

  const checks = [
    { key: 'check_screen', label: 'Pantalla', value: entrada.check_screen },
    { key: 'check_touch', label: 'Touch', value: entrada.check_touch },
    { key: 'check_face_id', label: 'Face ID', value: entrada.check_face_id },
    { key: 'check_camera', label: 'Cámara', value: entrada.check_camera },
    { key: 'check_front_camera', label: 'Cám. Frontal', value: entrada.check_front_camera },
    { key: 'check_flash', label: 'Flash', value: entrada.check_flash },
    { key: 'check_microphone', label: 'Micrófono', value: entrada.check_microphone },
    { key: 'check_speaker', label: 'Bocina', value: entrada.check_speaker },
    { key: 'check_earpiece', label: 'Auricular', value: entrada.check_earpiece },
    { key: 'check_charging', label: 'Carga', value: entrada.check_charging },
    { key: 'check_buttons', label: 'Botones', value: entrada.check_buttons },
    { key: 'check_wifi', label: 'WiFi', value: entrada.check_wifi },
    { key: 'check_signal', label: 'Señal', value: entrada.check_signal },
    { key: 'check_true_tone', label: 'True Tone', value: entrada.check_true_tone },
  ];

  doc.setFontSize(7);

  // Mostrar checks en dos columnas con cajas visuales
  const colWidth = contentWidth / 2;
  const checkBoxSize = 3.5;
  const checkHeight = 5;
  let col = 0;
  let rowYPos = yPos;

  checks.forEach((check) => {
    const xOffset = margin + (col * colWidth);

    // Dibujar checkbox optimizado para impresoras térmicas B/N
    if (check.value) {
      // ✓ Funciona OK - NEGRO SÓLIDO (se verá oscuro en térmica)
      doc.setFillColor(0, 0, 0); // Negro
      doc.rect(xOffset, rowYPos - 2.5, checkBoxSize, checkBoxSize, 'F');

      // Checkmark blanco
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('✓', xOffset + 0.5, rowYPos);
    } else {
      // ✗ No funciona - BLANCO CON BORDE (se verá claro en térmica)
      doc.setFillColor(255, 255, 255); // Blanco
      doc.rect(xOffset, rowYPos - 2.5, checkBoxSize, checkBoxSize, 'F');
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(xOffset, rowYPos - 2.5, checkBoxSize, checkBoxSize, 'S');

      // X negra
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('✗', xOffset + 0.5, rowYPos);
    }

    // Texto del label
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(check.label, xOffset + checkBoxSize + 1.5, rowYPos);

    col++;
    if (col >= 2) {
      col = 0;
      rowYPos += checkHeight;
    }
  });

  if (col !== 0) {
    rowYPos += checkHeight;
  }

  yPos = rowYPos + 2;

  // Leyenda optimizada para térmicas B/N
  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');

  // OK - Negro sólido
  doc.setFillColor(0, 0, 0);
  doc.rect(margin, yPos - 1.5, 2.5, 2.5, 'F');
  doc.setTextColor(0, 0, 0);
  doc.text('■ = Funciona OK', margin + 4, yPos);

  // NO OK - Blanco con borde
  doc.setFillColor(255, 255, 255);
  doc.rect(margin + 25, yPos - 1.5, 2.5, 2.5, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(margin + 25, yPos - 1.5, 2.5, 2.5, 'S');
  doc.text('□ = No funciona', margin + 29, yPos);

  yPos += 4;
  drawDoubleLine(yPos);
  yPos += 4;

  // ============================================
  // 6. CÓDIGOS QR Y BARCODE
  // ============================================
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, contentWidth, 6, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const codigosText = 'CÓDIGOS DE SEGUIMIENTO';
  const codigosWidth = doc.getTextWidth(codigosText);
  doc.text(codigosText, (ticketWidth - codigosWidth) / 2, yPos + 4);
  yPos += 8;

  // Generar QR Code
  const qrUrl = `${baseUrl}/entrada/${entrada.id}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const qrSize = 28; // mm - Más grande
    const qrX = (ticketWidth - qrSize) / 2;

    // Borde alrededor del QR
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(qrX - 1, yPos - 1, qrSize + 2, qrSize + 2, 'S');

    doc.addImage(qrDataUrl, 'PNG', qrX, yPos, qrSize, qrSize);
    yPos += qrSize + 2;

    // Texto del QR
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    const qrText = 'Escanea para ver detalles';
    const qrTextWidth = doc.getTextWidth(qrText);
    doc.text(qrText, (ticketWidth - qrTextWidth) / 2, yPos);
    yPos += 5;

  } catch (error) {
    console.error('Error generando QR:', error);
  }

  // Generar Barcode
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, entrada.id_reparacion, {
      format: 'CODE128',
      width: 2,
      height: 50,
      displayValue: true,
      fontSize: 14,
      margin: 0,
      background: '#ffffff',
      lineColor: '#000000',
    });

    const barcodeDataUrl = canvas.toDataURL('image/png');
    const barcodeWidth = 65;
    const barcodeHeight = 18;
    const barcodeX = (ticketWidth - barcodeWidth) / 2;

    // Borde alrededor del barcode
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(barcodeX - 1, yPos - 1, barcodeWidth + 2, barcodeHeight + 2, 'S');

    doc.addImage(barcodeDataUrl, 'PNG', barcodeX, yPos, barcodeWidth, barcodeHeight);
    yPos += barcodeHeight + 4;

  } catch (error) {
    console.error('Error generando código de barras:', error);
    // Fallback: mostrar ID como texto
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const idWidth = doc.getTextWidth(entrada.id_reparacion);
    doc.text(entrada.id_reparacion, (ticketWidth - idWidth) / 2, yPos);
    yPos += 6;
  }

  drawDoubleLine(yPos);
  yPos += 4;

  // ============================================
  // 7. FOOTER - TÉRMINOS Y CONDICIONES
  // ============================================
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  const termsTitle = 'TÉRMINOS Y CONDICIONES';
  const termsTitleWidth = doc.getTextWidth(termsTitle);
  doc.text(termsTitle, (ticketWidth - termsTitleWidth) / 2, yPos);
  yPos += 4;

  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');

  const footerText = [
    '• El cliente es responsable de respaldar su información',
    '• Plazo máximo de retiro: 30 días',
    '• Después de 30 días se cobrará almacenaje',
    '• No nos hacemos responsables por datos perdidos',
    '• Presentar este ticket al retirar el equipo',
  ];

  footerText.forEach(line => {
    doc.text(line, margin + 1, yPos);
    yPos += 3;
  });

  yPos += 2;
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, ticketWidth - margin, yPos);
  yPos += 3;

  // Fecha de impresión
  doc.setFontSize(5);
  doc.setFont('helvetica', 'italic');
  const printDate = new Date().toLocaleString('es-ES');
  const printText = `Impreso: ${printDate}`;
  const printWidth = doc.getTextWidth(printText);
  doc.text(printText, (ticketWidth - printWidth) / 2, yPos);
  yPos += 5;

  return doc;
}

/**
 * Función auxiliar para envolver texto
 */
function wrapText(doc: jsPDF, text: string, maxWidth: number): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = doc.getTextWidth(testLine);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join('\n');
}

/**
 * Descarga directamente un ticket POS para una entrada
 */
export async function downloadPOSTicket(
  entrada: Entrada,
  orgName: string,
  orgLogo?: string,
  baseUrl?: string
): Promise<void> {
  const doc = await generatePOSTicket({ entrada, orgName, orgLogo, baseUrl });
  const fileName = `ticket-${entrada.id_reparacion}.pdf`;
  doc.save(fileName);
}

/**
 * Abre el ticket en una nueva ventana para imprimir directamente
 */
export async function printPOSTicket(
  entrada: Entrada,
  orgName: string,
  orgLogo?: string,
  baseUrl?: string
): Promise<void> {
  const doc = await generatePOSTicket({ entrada, orgName, orgLogo, baseUrl });

  // Abrir en nueva ventana para imprimir
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);

  const printWindow = window.open(pdfUrl, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

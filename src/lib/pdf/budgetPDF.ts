import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { BudgetWithItems } from "@/types/budgets";
import type { Entrada } from "@/types/entradas";

interface GenerateBudgetPDFOptions {
  budget: BudgetWithItems;
  entrada: Entrada;
  orgName?: string;
  orgAddress?: string;
  orgPhone?: string;
  orgEmail?: string;
}

export function generateBudgetPDF(options: GenerateBudgetPDFOptions): jsPDF {
  const { budget, entrada, orgName = "AXER", orgAddress = "", orgPhone = "", orgEmail = "" } = options;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPosition = 20;

  // ========================================
  // HEADER - Logo y datos de la empresa
  // ========================================
  doc.setFillColor(37, 99, 235); // Brand color
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(orgName, 15, 20);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (orgAddress) doc.text(orgAddress, 15, 27);
  if (orgPhone) doc.text(`Tel: ${orgPhone}`, 15, 32);
  if (orgEmail) doc.text(`Email: ${orgEmail}`, 15, 37);

  // Título del documento
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("PRESUPUESTO", pageWidth - 15, 20, { align: "right" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`ID: ${entrada.id_reparacion}`, pageWidth - 15, 27, { align: "right" });

  const today = new Date().toLocaleDateString("es-DO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Fecha: ${today}`, pageWidth - 15, 32, { align: "right" });

  if (budget.valid_until) {
    const validDate = new Date(budget.valid_until).toLocaleDateString("es-DO");
    doc.text(`Válido hasta: ${validDate}`, pageWidth - 15, 37, { align: "right" });
  }

  yPosition = 50;

  // ========================================
  // INFORMACIÓN DEL CLIENTE
  // ========================================
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(243, 244, 246);
  doc.rect(15, yPosition, pageWidth - 30, 30, "F");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DATOS DEL CLIENTE", 20, yPosition + 7);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Cliente: ${entrada.nombre_cliente}`, 20, yPosition + 14);
  doc.text(`Teléfono: ${entrada.telefono}`, 20, yPosition + 20);
  doc.text(`Dispositivo: ${entrada.modelo}`, 20, yPosition + 26);

  yPosition += 40;

  // ========================================
  // DESCRIPCIÓN DEL PROBLEMA
  // ========================================
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPCIÓN DEL PROBLEMA", 15, yPosition);
  yPosition += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const problemLines = doc.splitTextToSize(entrada.problema, pageWidth - 30);
  doc.text(problemLines, 15, yPosition);
  yPosition += problemLines.length * 5 + 10;

  // ========================================
  // TABLA DE PIEZAS
  // ========================================
  const partItems = budget.items.filter(item => item.item_type === "part");

  if (partItems.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("PIEZAS", 15, yPosition);
    yPosition += 5;

    autoTable(doc, {
      startY: yPosition,
      head: [["Descripción", "SKU", "Cant.", "Precio Unit.", "Subtotal"]],
      body: partItems.map(item => [
        item.description,
        item.sku || "-",
        item.quantity.toString(),
        `RD$ ${item.unit_price.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`,
        `RD$ ${item.subtotal.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`,
      ]),
      foot: [[
        "",
        "",
        "",
        "Subtotal Piezas:",
        `RD$ ${budget.subtotal_parts.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`,
      ]],
      theme: "striped",
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      footStyles: {
        fillColor: [243, 244, 246],
        textColor: 0,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20, halign: "center" },
        3: { cellWidth: 30, halign: "right" },
        4: { cellWidth: 35, halign: "right" },
      },
      margin: { left: 15, right: 15 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // ========================================
  // TABLA DE MANO DE OBRA
  // ========================================
  const laborItems = budget.items.filter(item => item.item_type === "labor");

  if (laborItems.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("MANO DE OBRA", 15, yPosition);
    yPosition += 5;

    autoTable(doc, {
      startY: yPosition,
      head: [["Descripción", "Cant.", "Precio Unit.", "Subtotal"]],
      body: laborItems.map(item => [
        item.description,
        item.quantity.toString(),
        `RD$ ${item.unit_price.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`,
        `RD$ ${item.subtotal.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`,
      ]),
      foot: [[
        "",
        "",
        "Subtotal M.O.:",
        `RD$ ${budget.subtotal_labor.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`,
      ]],
      theme: "striped",
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      footStyles: {
        fillColor: [243, 244, 246],
        textColor: 0,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 110 },
        1: { cellWidth: 20, halign: "center" },
        2: { cellWidth: 30, halign: "right" },
        3: { cellWidth: 35, halign: "right" },
      },
      margin: { left: 15, right: 15 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // ========================================
  // RESUMEN DE TOTALES
  // ========================================
  const summaryX = pageWidth - 80;

  doc.setFillColor(243, 244, 246);
  doc.rect(summaryX - 5, yPosition, 75, 50, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  yPosition += 8;
  doc.text("Subtotal:", summaryX, yPosition);
  doc.text(
    `RD$ ${(budget.subtotal_parts + budget.subtotal_labor).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`,
    pageWidth - 20,
    yPosition,
    { align: "right" }
  );

  if (budget.tax_percentage > 0) {
    yPosition += 8;
    doc.text(`Impuesto (${budget.tax_percentage}%):`, summaryX, yPosition);
    doc.text(
      `RD$ ${budget.tax_amount.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`,
      pageWidth - 20,
      yPosition,
      { align: "right" }
    );
  }

  if (budget.discount_percentage > 0) {
    yPosition += 8;
    doc.text(`Descuento (${budget.discount_percentage}%):`, summaryX, yPosition);
    doc.setTextColor(220, 38, 38);
    doc.text(
      `-RD$ ${budget.discount_amount.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`,
      pageWidth - 20,
      yPosition,
      { align: "right" }
    );
    doc.setTextColor(0, 0, 0);
  }

  // Línea separadora
  yPosition += 5;
  doc.setLineWidth(0.5);
  doc.line(summaryX, yPosition, pageWidth - 15, yPosition);

  // TOTAL
  yPosition += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", summaryX, yPosition);
  doc.setTextColor(37, 99, 235);
  doc.text(
    `RD$ ${budget.total.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`,
    pageWidth - 20,
    yPosition,
    { align: "right" }
  );
  doc.setTextColor(0, 0, 0);

  yPosition += 15;

  // ========================================
  // NOTAS
  // ========================================
  if (budget.notes) {
    yPosition += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("NOTAS:", 15, yPosition);
    yPosition += 5;

    doc.setFont("helvetica", "normal");
    const notesLines = doc.splitTextToSize(budget.notes, pageWidth - 30);
    doc.text(notesLines, 15, yPosition);
    yPosition += notesLines.length * 4;
  }

  // ========================================
  // FOOTER
  // ========================================
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(128, 128, 128);
  doc.text(
    "Este presupuesto es válido únicamente para el servicio descrito arriba.",
    pageWidth / 2,
    pageHeight - 20,
    { align: "center" }
  );
  doc.text(
    "Los precios pueden variar según disponibilidad de piezas.",
    pageWidth / 2,
    pageHeight - 15,
    { align: "center" }
  );

  return doc;
}

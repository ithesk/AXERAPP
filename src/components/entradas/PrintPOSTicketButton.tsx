import React, { useState } from 'react';
import { Printer, Receipt } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { useToast } from '@/context/ToastContext';
import { downloadPOSTicket, printPOSTicket } from '@/lib/pdf/posTicketPDF';
import type { Entrada } from '@/types/entradas';
import { useOrganization } from '@/context/OrganizationContext';

interface PrintPOSTicketButtonProps {
  entrada: Entrada;
  variant?: 'primary' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  mode?: 'download' | 'print'; // Modo de impresión
}

/**
 * Botón para imprimir/descargar ticket de punto de venta (térmico 80mm)
 */
export function PrintPOSTicketButton({
  entrada,
  variant = 'outline',
  size = 'md',
  className = '',
  mode = 'print',
}: PrintPOSTicketButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { showToast } = useToast();
  const { currentOrg } = useOrganization();

  const handlePrint = async () => {
    if (!currentOrg) {
      showToast('error', 'Error', 'No se pudo obtener información de la organización');
      return;
    }

    setIsGenerating(true);

    try {
      const baseUrl = window.location.origin;

      if (mode === 'print') {
        // Abrir para imprimir directamente
        await printPOSTicket(
          entrada,
          currentOrg.name,
          undefined, // Logo opcional
          baseUrl
        );
        showToast('success', 'Ticket generado', 'El ticket está listo para imprimir');
      } else {
        // Descargar PDF
        await downloadPOSTicket(
          entrada,
          currentOrg.name,
          undefined, // Logo opcional
          baseUrl
        );
        showToast('success', 'Ticket descargado', 'El ticket se descargó correctamente');
      }
    } catch (error) {
      console.error('Error al generar ticket:', error);
      showToast('error', 'Error', 'No se pudo generar el ticket. Inténtalo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handlePrint}
      disabled={isGenerating}
      variant={variant}
      size={size}
      className={className}
      startIcon={mode === 'print' ? <Printer className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
    >
      {isGenerating
        ? 'Generando...'
        : mode === 'print'
        ? 'Ticket POS'
        : 'Descargar Ticket'}
    </Button>
  );
}

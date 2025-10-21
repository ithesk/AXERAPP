import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { useToast } from '@/context/ToastContext';
import { downloadEntryLabel } from '@/lib/pdf/entryLabelPDF';
import type { Entrada } from '@/types/entradas';
import { useOrganization } from '@/context/OrganizationContext';

interface PrintLabelButtonProps {
  entrada: Entrada;
  variant?: 'primary' | 'outline';
  size?: 'sm' | 'md';
  showText?: boolean;
  className?: string;
}

/**
 * Botón para imprimir/descargar etiqueta PDF de una entrada
 */
export function PrintLabelButton({
  entrada,
  variant = 'outline',
  size = 'sm',
  showText = true,
  className = '',
}: PrintLabelButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { showToast } = useToast();
  const { currentOrg } = useOrganization();

  const handlePrintLabel = async () => {
    if (!currentOrg) {
      showToast('error', 'Error', 'No se pudo obtener información de la organización');
      return;
    }

    setIsGenerating(true);

    try {
      // Generar y descargar el PDF
      await downloadEntryLabel(
        entrada,
        currentOrg.name,
        window.location.origin
      );

      showToast('success', 'Etiqueta generada', `Etiqueta para ${entrada.id_reparacion} descargada correctamente`);
    } catch (error) {
      console.error('Error al generar etiqueta:', error);
      showToast('error', 'Error', 'No se pudo generar la etiqueta. Inténtalo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handlePrintLabel}
      disabled={isGenerating}
      variant={variant}
      size={size}
      className={className}
      startIcon={<Printer className="h-4 w-4" />}
    >
      {showText && (isGenerating ? 'Generando...' : 'Imprimir etiqueta')}
    </Button>
  );
}

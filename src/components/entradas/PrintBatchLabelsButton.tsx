import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { useToast } from '@/context/ToastContext';
import { downloadBatchLabels } from '@/lib/pdf/entryLabelPDF';
import type { Entrada } from '@/types/entradas';
import { useOrganization } from '@/context/OrganizationContext';

interface PrintBatchLabelsButtonProps {
  entradas: Entrada[];
  variant?: 'primary' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Botón para imprimir/descargar etiquetas en lote para múltiples entradas
 */
export function PrintBatchLabelsButton({
  entradas,
  variant = 'outline',
  size = 'md',
  className = '',
}: PrintBatchLabelsButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { showToast } = useToast();
  const { currentOrg } = useOrganization();

  const handlePrintBatch = async () => {
    if (entradas.length === 0) {
      showToast('warning', 'Sin entradas', 'Selecciona al menos una entrada para imprimir etiquetas');
      return;
    }

    if (!currentOrg) {
      showToast('error', 'Error', 'No se pudo obtener información de la organización');
      return;
    }

    setIsGenerating(true);

    try {
      // Generar y descargar el PDF con todas las etiquetas
      await downloadBatchLabels(
        entradas,
        currentOrg.name,
        window.location.origin
      );

      showToast('success', 'Etiquetas generadas', `Se generaron ${entradas.length} etiqueta(s) correctamente`);
    } catch (error) {
      console.error('Error al generar etiquetas en lote:', error);
      showToast('error', 'Error', 'No se pudieron generar las etiquetas. Inténtalo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const isDisabled = entradas.length === 0 || isGenerating;

  return (
    <Button
      onClick={handlePrintBatch}
      disabled={isDisabled}
      variant={variant}
      size={size}
      className={className}
      startIcon={<Printer className="h-4 w-4" />}
    >
      {isGenerating
        ? 'Generando...'
        : `Imprimir ${entradas.length} etiqueta${entradas.length !== 1 ? 's' : ''}`}
    </Button>
  );
}

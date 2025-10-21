/**
 * EJEMPLO DE USO: Cómo imprimir una etiqueta individual
 *
 * Este archivo muestra diferentes formas de usar el sistema de etiquetas
 */

import React from 'react';
import { Printer } from 'lucide-react';
import { downloadEntryLabel } from '@/lib/pdf/entryLabelPDF';
import { useOrganization } from '@/context/OrganizationContext';
import type { Entrada } from '@/types/entradas';

// ============================================
// EJEMPLO 1: Botón Simple
// ============================================

export function EjemploBotonSimple({ entrada }: { entrada: Entrada }) {
  const { currentOrg } = useOrganization();

  const handlePrint = async () => {
    if (!currentOrg) {
      alert('No hay organización cargada');
      return;
    }

    await downloadEntryLabel(
      entrada,
      currentOrg.name,
      window.location.origin
    );
  };

  return (
    <button onClick={handlePrint}>
      🖨️ Imprimir Etiqueta
    </button>
  );
}

// ============================================
// EJEMPLO 2: Con Loading State
// ============================================

export function EjemploConLoading({ entrada }: { entrada: Entrada }) {
  const [loading, setLoading] = React.useState(false);
  const { currentOrg } = useOrganization();

  const handlePrint = async () => {
    if (!currentOrg) return;

    setLoading(true);
    try {
      await downloadEntryLabel(
        entrada,
        currentOrg.name,
        window.location.origin
      );
      alert('Etiqueta descargada correctamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al generar la etiqueta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handlePrint} disabled={loading}>
      {loading ? '⏳ Generando...' : '🖨️ Imprimir'}
    </button>
  );
}

// ============================================
// EJEMPLO 3: En una Tarjeta de Entrada
// ============================================

export function TarjetaEntrada({ entrada }: { entrada: Entrada }) {
  const { currentOrg } = useOrganization();

  return (
    <div className="border rounded-lg p-4">
      <h3>{entrada.nombre_cliente}</h3>
      <p>ID: {entrada.id_reparacion}</p>
      <p>Modelo: {entrada.modelo}</p>

      <button
        onClick={() => {
          if (currentOrg) {
            downloadEntryLabel(entrada, currentOrg.name, window.location.origin);
          }
        }}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        <Printer className="inline mr-2 h-4 w-4" />
        Imprimir Etiqueta
      </button>
    </div>
  );
}

// ============================================
// EJEMPLO 4: Usar la Función Directamente (sin componente)
// ============================================

// En cualquier parte de tu código:
async function imprimirEtiquetaManual() {
  // Obtén la entrada de donde sea que la tengas
  const entrada: Entrada = {
    id: "abc123",
    org_id: "org-1",
    id_reparacion: "REP-001",
    nombre_cliente: "Juan Pérez",
    telefono: "555-1234",
    modelo: "iPhone 13 Pro",
    problema: "Pantalla rota",
    estado: "En reparación",
    fecha_entrada: new Date().toISOString(),
    fecha_actualizacion: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    imei_sn: "123456789012345",
    // ... otros campos requeridos
    check_face_id: false,
    check_signal: true,
    check_wifi: true,
    check_screen: false,
    check_true_tone: false,
    check_touch: false,
    check_camera: true,
    check_microphone: true,
    check_speaker: true,
    check_charging: true,
    check_buttons: true,
    check_panic: false,
    check_screws: true,
    check_earpiece: true,
    check_no_sim: false,
    check_flash: true,
    check_front_camera: true,
  };

  // Importa la función
  const { downloadEntryLabel } = await import('@/lib/pdf/entryLabelPDF');

  // Llama la función
  await downloadEntryLabel(
    entrada,
    'Mi Empresa',
    'https://app.axer.com'
  );

  console.log('Etiqueta descargada!');
}

// ============================================
// EJEMPLO 5: Múltiples Etiquetas Individuales
// ============================================

export function ImprimirVariasEtiquetas({ entradas }: { entradas: Entrada[] }) {
  const { currentOrg } = useOrganization();
  const [progreso, setProgreso] = React.useState(0);

  const handlePrintAll = async () => {
    if (!currentOrg) return;

    for (let i = 0; i < entradas.length; i++) {
      await downloadEntryLabel(
        entradas[i],
        currentOrg.name,
        window.location.origin
      );
      setProgreso(i + 1);

      // Pequeña pausa entre descargas
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    alert(`${entradas.length} etiquetas descargadas`);
    setProgreso(0);
  };

  return (
    <div>
      <button onClick={handlePrintAll}>
        Imprimir {entradas.length} etiquetas (una por una)
      </button>
      {progreso > 0 && (
        <p>Descargando {progreso} de {entradas.length}...</p>
      )}
    </div>
  );
}

// ============================================
// EJEMPLO 6: Generar sin Descargar (obtener el PDF)
// ============================================

async function obtenerPDFSinDescargar(entrada: Entrada) {
  const { generateEntryLabelPDF } = await import('@/lib/pdf/entryLabelPDF');

  // Genera el PDF pero no lo descarga
  const pdf = await generateEntryLabelPDF({
    entrada,
    orgName: 'Mi Empresa',
    baseUrl: 'https://app.axer.com'
  });

  // Ahora puedes hacer lo que quieras con el PDF:

  // 1. Obtener como Blob
  const blob = pdf.output('blob');

  // 2. Obtener como Data URL
  const dataUrl = pdf.output('dataurlstring');

  // 3. Obtener como ArrayBuffer
  const arrayBuffer = pdf.output('arraybuffer');

  // 4. Enviarlo por API/email/etc
  const formData = new FormData();
  formData.append('etiqueta', blob, `etiqueta-${entrada.id_reparacion}.pdf`);
  // await fetch('/api/enviar-etiqueta', { method: 'POST', body: formData });

  return pdf;
}

// ============================================
// USO RECOMENDADO: El componente que ya creamos
// ============================================

/**
 * La forma MÁS FÁCIL es usar el componente PrintLabelButton que ya creamos:
 */
import { PrintLabelButton } from '@/components/entradas/PrintLabelButton';

export function UsoRecomendado({ entrada }: { entrada: Entrada }) {
  return (
    <div>
      <h2>Detalles de la Entrada</h2>
      <p>Cliente: {entrada.nombre_cliente}</p>
      <p>Modelo: {entrada.modelo}</p>

      {/* Este botón hace todo el trabajo por ti */}
      <PrintLabelButton
        entrada={entrada}
        variant="outline"
        size="sm"
        showText={true}
      />
    </div>
  );
}

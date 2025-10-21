# Sistema de Etiquetas para Entradas

## Descripción

Sistema de generación de etiquetas en PDF para equipos ingresados, optimizado para impresoras de etiquetas de 2 pulgadas (50.8mm) de ancho.

## Características

### Contenido de la Etiqueta

Cada etiqueta incluye:

1. **Número de Entrada** - ID de reparación destacado (#ENTRADA)
2. **Nombre de la Empresa** - Nombre de la organización
3. **Código QR** - Enlace directo a la entrada en el sistema
4. **Modelo del Equipo** - Modelo del dispositivo
5. **IMEI/Serial** - Número de serie (si está disponible)
6. **Fecha de Entrada** - Fecha de ingreso del equipo
7. **Nombre del Cliente** - En texto pequeño al final

### Dimensiones

- **Ancho:** 2 pulgadas (50.8mm)
- **Alto:** ~3.5 pulgadas (90mm) - Variable según contenido
- **Formato:** PDF optimizado para impresoras térmicas

## Uso

### Imprimir Etiqueta Individual

En el modal de detalle de una entrada, encontrarás el botón **"Imprimir etiqueta"** en la esquina superior derecha junto al nombre del cliente.

```tsx
// El botón se muestra así:
<PrintLabelButton entrada={entrada} variant="outline" size="sm" />
```

Al hacer clic:
1. Se genera el PDF con la etiqueta
2. Se descarga automáticamente con el nombre: `etiqueta-{ID_REPARACION}.pdf`
3. Puedes imprimirlo directamente en tu impresora de etiquetas

### Imprimir Etiquetas en Lote

En la página principal de Entradas, junto al botón "Nueva Entrada", verás el botón **"Imprimir X etiquetas"** (donde X es el número de entradas actuales).

```tsx
// El botón se muestra así:
<PrintBatchLabelsButton entradas={sortedEntradas} variant="outline" size="md" />
```

Al hacer clic:
1. Se generan todas las etiquetas en un solo PDF
2. Cada etiqueta en una página separada
3. Se descarga con el nombre: `etiquetas-entradas-YYYY-MM-DD.pdf`
4. Imprime el documento completo para obtener todas las etiquetas

## Código QR

El código QR contiene un enlace directo a la entrada en el sistema:

```
https://app.axer.com/entradas/{ID_ENTRADA}
```

- **Nivel de corrección de errores:** M (Medium)
- **Tamaño:** 30mm x 30mm
- **Escaneable** desde dispositivos móviles

Esto permite al personal:
- Acceder rápidamente a los detalles de la entrada
- Verificar el estado del equipo
- Actualizar información desde el taller

## Configuración de Impresora

### Impresoras Compatibles

El sistema está optimizado para impresoras de etiquetas térmicas de 2 pulgadas, como:

- Brother QL-800
- DYMO LabelWriter 450
- Zebra GC420t/d
- TSC TTP-225
- Godex G500

### Configuración Recomendada

1. **Papel:**
   - Ancho: 2 pulgadas (50.8mm)
   - Largo: 3.5-4 pulgadas (89-102mm)
   - Material: Papel térmico o papel normal con transferencia térmica

2. **Configuración de Impresión:**
   - Orientación: Vertical (Portrait)
   - Márgenes: 0mm (sin márgenes)
   - Escala: 100% (tamaño real)
   - Calidad: Alta

3. **Driver de Impresora:**
   - Configurar tamaño personalizado: 50.8mm x 90mm
   - Deshabilitar márgenes automáticos
   - Activar modo de alta densidad para mejor calidad del QR

## Archivos del Sistema

### Generador de PDF

**Ubicación:** `src/lib/pdf/entryLabelPDF.ts`

Funciones principales:

```typescript
// Generar etiqueta individual
generateEntryLabelPDF(options: GenerateEntryLabelOptions): Promise<jsPDF>

// Generar etiquetas en lote
generateBatchEntryLabels(entradas: Entrada[], orgName: string, baseUrl?: string): Promise<jsPDF>

// Descargar etiqueta individual
downloadEntryLabel(entrada: Entrada, orgName: string, baseUrl?: string): Promise<void>

// Descargar etiquetas en lote
downloadBatchLabels(entradas: Entrada[], orgName: string, baseUrl?: string): Promise<void>
```

### Componentes React

**PrintLabelButton:** `src/components/entradas/PrintLabelButton.tsx`
- Botón para imprimir etiqueta individual
- Props: `entrada`, `variant`, `size`, `showText`, `className`

**PrintBatchLabelsButton:** `src/components/entradas/PrintBatchLabelsButton.tsx`
- Botón para imprimir etiquetas en lote
- Props: `entradas`, `variant`, `size`, `className`

### Integración

**DetalleEntradaModal:** `src/components/entradas/DetalleEntradaModal.tsx`
- Incluye botón de impresión individual

**Página de Entradas:** `src/app/(admin)/entradas/page.tsx`
- Incluye botón de impresión en lote

## Dependencias

```json
{
  "jspdf": "^3.0.3",
  "jspdf-autotable": "^5.0.2",
  "qrcode": "^1.5.4",
  "@types/qrcode": "^1.5.5"
}
```

## Personalización

### Cambiar Dimensiones

Edita en `entryLabelPDF.ts`:

```typescript
const labelWidth = 50.8;  // Ancho en mm
const labelHeight = 90;   // Alto en mm
```

### Cambiar Tamaño del QR

```typescript
const qrSize = 30; // Tamaño en mm
```

### Cambiar URL Base

Por defecto usa `window.location.origin`. Para cambiar:

```typescript
await downloadEntryLabel(entrada, orgName, 'https://tu-dominio.com');
```

### Personalizar Contenido

Modifica la función `generateEntryLabelPDF()` para:
- Agregar logo de la empresa
- Cambiar fuentes y tamaños
- Incluir campos adicionales
- Modificar diseño y distribución

## Solución de Problemas

### El QR no se escanea

- Aumenta el tamaño del QR (edita `qrSize`)
- Verifica que la impresora esté en modo de alta densidad
- Asegúrate de que el papel sea de buena calidad

### La etiqueta se corta

- Verifica que el tamaño del papel en la impresora coincida con `labelHeight`
- Ajusta `labelHeight` para que sea ligeramente menor

### Texto muy pequeño

- Aumenta los valores de `setFontSize()` en el código
- Reduce la cantidad de información mostrada

### PDF no se descarga

- Verifica la consola del navegador por errores
- Comprueba que la organización esté cargada (`currentOrg`)
- Verifica permisos de descarga en el navegador

## Ejemplos de Uso

### Desde un Componente

```tsx
import { downloadEntryLabel } from '@/lib/pdf/entryLabelPDF';

const handlePrint = async () => {
  await downloadEntryLabel(
    entrada,
    'Mi Empresa',
    'https://app.miempresa.com'
  );
};
```

### Generar sin Descargar

```tsx
import { generateEntryLabelPDF } from '@/lib/pdf/entryLabelPDF';

const pdf = await generateEntryLabelPDF({
  entrada,
  orgName: 'Mi Empresa',
  baseUrl: 'https://app.miempresa.com'
});

// Usar el PDF (ej: enviar por email, mostrar preview, etc)
const blob = pdf.output('blob');
```

## Mejoras Futuras

- [ ] Preview de etiqueta antes de imprimir
- [ ] Selección de etiquetas específicas para impresión en lote
- [ ] Soporte para diferentes tamaños de etiquetas
- [ ] Plantillas personalizables de etiquetas
- [ ] Logo de la empresa en la etiqueta
- [ ] Código de barras alternativo (Code 128, etc)
- [ ] Impresión directa sin descarga (usando Web Print API)

## Soporte

Para dudas o problemas con el sistema de etiquetas, contacta al equipo de desarrollo o revisa la documentación en:
- Repositorio: [GitHub](https://github.com/tu-repo)
- Documentación: [Docs](https://docs.axer.com)

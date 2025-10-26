# Sistema de Impresión de Tickets POS (Punto de Venta)

## Descripción General

Sistema de generación de tickets térmicos optimizados para impresoras de punto de venta (formato 80mm). Genera hojas de entrada **profesionales y visualmente atractivas** con toda la información del dispositivo, cliente, códigos de seguimiento y un **checklist de funcionamiento con código de colores**.

## ✨ Características Visuales Optimizadas para Térmicas

### 🖨️ Diseño Optimizado para Impresoras Térmicas B/N

Este ticket está **específicamente diseñado para impresoras térmicas blanco y negro**. No depende de colores, usa contraste y sombreado:

- **Checkboxes con sombreado B/N**:
  - ■ **Negro sólido con ✓ blanco** = Funciona correctamente
  - □ **Blanco con borde y ✗ negra** = No funciona / Problema
- **Secciones con fondos grises**: Headers de sección claramente diferenciados
- **Título con fondo negro**: Header principal destacado con texto blanco
- **ID de reparación destacado**: Caja con borde grueso que resalta el ID
- **Líneas dobles decorativas**: Separadores elegantes entre secciones
- **Bordes en códigos**: QR y código de barras con marcos profesionales
- **Leyenda clara**: Explicación del significado de los símbolos ■ y □

## Características Principales

### 📄 Formato del Ticket

El ticket incluye las siguientes secciones:

1. **Logo de la Organización** (opcional)
   - Centrado en la parte superior
   - Tamaño optimizado para tickets

2. **Encabezado**
   - Título: "HOJA DE ENTRADA"
   - Nombre de la organización

3. **Datos del Cliente**
   - Nombre completo
   - Teléfono de contacto
   - Fecha y hora de entrada

4. **Datos del Equipo**
   - ID de reparación (destacado)
   - Modelo del dispositivo
   - IMEI/Número de serie
   - Problema reportado
   - Accesorios incluidos
   - Contraseñas del dispositivo

5. **Test de Funcionamiento** ⭐ OPTIMIZADO PARA TÉRMICAS
   - **Checkboxes con sombreado B/N**:
     - ■ **Negro sólido con ✓ blanco** = Funciona correctamente
     - □ **Blanco con borde negro y ✗** = No funciona / Problema
   - **Contraste optimizado**: Se distingue perfectamente en impresoras térmicas
   - **Leyenda incluida**: Símbolos ■ y □ explicados claramente
   - Organizado en dos columnas para mejor legibilidad
   - Incluye todos los componentes probados:
     - Pantalla, Touch, Face ID
     - Cámaras (frontal y trasera)
     - Flash, Micrófono, Bocina
     - Auricular, Carga, Botones
     - WiFi, Señal, True Tone

6. **Códigos de Seguimiento**
   - **Código QR**: Link directo a la entrada en el sistema
   - **Código de Barras**: ID de reparación en formato CODE128

7. **Términos y Condiciones**
   - Políticas de la empresa
   - Responsabilidades del cliente
   - Tiempos de almacenaje

8. **Footer**
   - Fecha y hora de impresión

## Uso

### Desde el Modal de Detalle de Entrada

1. Abre cualquier entrada haciendo clic en ella
2. En el header del modal encontrarás dos botones:
   - **"Etiqueta"**: Genera etiqueta adhesiva pequeña
   - **"Ticket POS"**: Genera ticket térmico completo

### Programáticamente

```typescript
import { downloadPOSTicket, printPOSTicket } from '@/lib/pdf/posTicketPDF';
import type { Entrada } from '@/types/entradas';

// Para descargar el ticket
await downloadPOSTicket(
  entrada,
  'Nombre de la Organización',
  logoDataUrl, // opcional
  'https://app.example.com' // URL base para QR
);

// Para imprimir directamente
await printPOSTicket(
  entrada,
  'Nombre de la Organización',
  logoDataUrl, // opcional
  'https://app.example.com' // URL base para QR
);
```

### Componente React

```tsx
import { PrintPOSTicketButton } from '@/components/entradas/PrintPOSTicketButton';

// Modo impresión (abre diálogo de impresión)
<PrintPOSTicketButton
  entrada={entrada}
  mode="print"
  variant="outline"
  size="sm"
/>

// Modo descarga (guarda PDF)
<PrintPOSTicketButton
  entrada={entrada}
  mode="download"
  variant="primary"
  size="md"
/>
```

## Especificaciones Técnicas

### Dimensiones del Ticket

- **Ancho**: 80mm (estándar para impresoras térmicas)
- **Alto**: Dinámico según contenido
- **Márgenes**: 5mm en todos los lados

### Códigos Generados

#### Código QR
- **Contenido**: URL de la entrada (`baseUrl/entrada/{id}`)
- **Tamaño**: 25mm x 25mm
- **Corrección de errores**: Nivel M (15%)
- **Formato**: PNG embebido en PDF

#### Código de Barras
- **Formato**: CODE128
- **Contenido**: ID de reparación
- **Tamaño**: 60mm x 15mm
- **Incluye valor legible**: Sí

### Tipografía y Colores

- **Fuente**: Helvetica (incluida en jsPDF)
- **Tamaños**:
  - Título: 14pt bold (blanco sobre negro)
  - ID Reparación: 11pt bold
  - Secciones: 8pt bold
  - Contenido: 7.5pt normal
  - Checklist: 7pt normal
  - Footer: 6pt y 5pt

- **Tonos optimizados para térmicas B/N**:
  - **Negro sólido (0,0,0)**: Título principal y checkboxes OK
  - **Gris claro (220,220,220)**: Fondos de headers de sección
  - **Gris muy claro (240,240,240)**: Caja del ID y sección de códigos
  - **Blanco con borde**: Checkboxes de funciones con problemas
  - **Símbolos de alto contraste**: ✓ (check) y ✗ (cross) claramente visibles

## Configuración de Impresora

### Impresoras Térmicas Recomendadas

- Ancho de papel: 80mm (3.15 pulgadas)
- Velocidad: Alta (200-250 mm/s)
- Resolución: 203 dpi mínimo
- Conectividad: USB, Bluetooth, o Red

### Marcas Compatibles

- Epson TM-T20
- Star TSP143
- Bixolon SRP-330
- Zebra GK420t
- Citizen CT-S310
- Cualquier impresora térmica de 80mm

### Configuración Recomendada

```javascript
// En el diálogo de impresión del navegador:
- Tamaño de papel: Personalizado (80mm x altura automática)
- Márgenes: Ninguno
- Escala: 100%
- Orientación: Vertical
```

## Dependencias

```json
{
  "jspdf": "^2.5.x",
  "qrcode": "^1.5.x",
  "jsbarcode": "^3.11.x"
}
```

## Archivos del Sistema

### Generación de PDF
- **Ubicación**: `/src/lib/pdf/posTicketPDF.ts`
- **Funciones principales**:
  - `generatePOSTicket()`: Genera el documento PDF
  - `downloadPOSTicket()`: Descarga directamente
  - `printPOSTicket()`: Abre diálogo de impresión

### Componente de Botón
- **Ubicación**: `/src/components/entradas/PrintPOSTicketButton.tsx`
- **Props**:
  - `entrada`: Objeto Entrada requerido
  - `variant`: 'primary' | 'outline'
  - `size`: 'sm' | 'md'
  - `mode`: 'print' | 'download'

### Integración en Modales
- `/src/components/entradas/DetalleEntradaModalOptimized.tsx`
- `/src/components/entradas/DetalleEntradaModalWithBudget.tsx`

## Personalización

### Agregar Logo

```typescript
// Convertir imagen a base64 o usar URL
const logoDataUrl = 'data:image/png;base64,...';

await downloadPOSTicket(
  entrada,
  orgName,
  logoDataUrl, // Pasa el logo aquí
  baseUrl
);
```

### Modificar Términos y Condiciones

Edita el array `footerText` en `/src/lib/pdf/posTicketPDF.ts`:

```typescript
const footerText = [
  'TÉRMINOS Y CONDICIONES',
  '',
  '• Tu término personalizado 1',
  '• Tu término personalizado 2',
  // ...
];
```

### Ajustar Checklist

Modifica el array `checks` para agregar/quitar elementos:

```typescript
const checks = [
  { key: 'check_screen', label: 'Pantalla', value: entrada.check_screen },
  { key: 'check_custom', label: 'Nuevo Check', value: entrada.check_custom },
  // ...
];
```

## Solución de Problemas

### El QR no se escanea correctamente
- Aumenta el tamaño del QR modificando `qrSize` en el código
- Verifica que el nivel de corrección de errores sea adecuado

### El código de barras no se lee
- Asegúrate de usar una impresora con resolución mínima de 203 dpi
- Verifica que el formato CODE128 sea compatible con tu lector

### El ticket se corta en la impresión
- Ajusta el tamaño de papel en la configuración de impresión
- Verifica que los márgenes estén en 0

### Fuentes no se ven correctamente
- Helvetica está incluida en jsPDF por defecto
- Si quieres usar fuentes personalizadas, debes agregarlas manualmente

## Mejoras Futuras

- [ ] Soporte para múltiples idiomas
- [ ] Plantillas personalizables por organización
- [ ] Vista previa antes de imprimir
- [ ] Impresión por lotes
- [ ] Soporte para diferentes anchos de papel (58mm, 80mm)
- [ ] Integración directa con impresoras (sin diálogo del navegador)
- [ ] Estadísticas de impresiones

## Licencia

Este módulo es parte del sistema AXER y está sujeto a la misma licencia del proyecto principal.

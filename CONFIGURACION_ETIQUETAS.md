# Sistema de Configuración de Etiquetas

## 📋 Descripción General

Sistema completo de configuración personalizable para etiquetas de impresión, que permite a los usuarios seleccionar entre múltiples formatos prediseñados, personalizar campos, estilos y guardar configuraciones reutilizables.

## 🎯 Características Principales

### 1. **Múltiples Tamaños de Etiqueta**

| Tamaño | Dimensiones | Uso Recomendado |
|--------|-------------|-----------------|
| 2" × 1" | 50.8mm × 25.4mm | Inventario básico, etiquetas muy pequeñas |
| 2" × 1.5" | 50.8mm × 38.1mm | Etiquetas compactas con datos mínimos |
| 2" × 3" | 50.8mm × 76.2mm | Etiquetas medianas con QR pequeño |
| **2" × 3.5"** | **50.8mm × 88.9mm** | **Estándar (Recomendado)** |
| 2" × 4" | 50.8mm × 101.6mm | Etiquetas grandes con información detallada |
| 4" × 6" | 101.6mm × 152.4mm | Etiquetas extra grandes, máxima información |
| Personalizado | Variable | Define tu propio tamaño |

### 2. **Plantillas Prediseñadas**

#### **Estándar** (Recomendada)
- ✅ Código QR grande y escaneable
- ✅ Número de entrada destacado
- ✅ Información completa del equipo
- ✅ IMEI/Serial si está disponible
- ✅ Fecha y cliente
- 📏 Tamaño recomendado: 2" × 3.5" o 2" × 4"

#### **Compacta**
- ❌ Sin código QR
- ✅ Solo información esencial
- ✅ Perfecta para espacios reducidos
- 📏 Tamaño recomendado: 2" × 1.5" o 2" × 3"

#### **Minimalista**
- ❌ Sin QR
- ✅ Solo ID y modelo del equipo
- ✅ Ultra compacta
- 📏 Tamaño recomendado: 2" × 1" o 2" × 1.5"

#### **Detallada**
- ✅ Código QR
- ✅ Toda la información disponible
- ✅ Cliente, teléfono, técnico, estado, problema
- ✅ Ideal para etiquetas grandes
- 📏 Tamaño recomendado: 4" × 6"

#### **QR Grande**
- ✅ Código QR enorme y fácil de escanear
- ✅ Solo número de entrada
- ✅ Máxima facilidad de escaneado
- 📏 Tamaño recomendado: 2" × 3" o 2" × 3.5"

#### **Código de Barras**
- ✅ Código de barras lineal
- ❌ Sin QR
- ✅ Compatible con escáneres tradicionales
- 📏 Tamaño recomendado: 2" × 3.5" o 2" × 4"

#### **Personalizada**
- ✅ Define tus propios campos
- ✅ Máxima flexibilidad
- ✅ Guarda múltiples configuraciones
- 📏 Tamaño: A tu elección

### 3. **Campos Configurables** (17 disponibles)

- ✅ Número de Entrada
- ✅ Logo de Empresa
- ✅ Nombre de Empresa
- ✅ Código QR
- ✅ Código de Barras
- ✅ Modelo del Equipo
- ✅ IMEI/Serial
- ✅ Fecha de Entrada
- ✅ Nombre del Cliente
- ✅ Teléfono del Cliente
- ✅ Técnico Asignado
- ✅ Estado
- ✅ Problema
- ✅ Accesorios
- ✅ 3 Campos Personalizados

### 4. **Personalización de Estilos**

#### Tamaños de Fuente
- **Encabezado:** 6pt - 16pt
- **Cuerpo:** 5pt - 12pt
- **Pie:** 4pt - 10pt

#### Código QR
- **Tamaño:** 20mm - 50mm
- **Nivel de corrección:** L, M, Q, H
- **Margen:** Configurable
- **Colores:** Personalizables

#### Márgenes y Espaciado
- **Márgenes:** 0mm - 10mm (superior, inferior, izquierdo, derecho)
- **Espaciado entre líneas:** 1mm - 6mm
- **Borde opcional:** Activar/desactivar

## 🚀 Cómo Usar

### Acceder a la Configuración

1. **Navega a:** Configuración → Etiquetas
   ```
   /configuracion/etiquetas
   ```

2. O usa el menú lateral:
   ```
   Configuración > Integraciones > Etiquetas
   ```

### Configurar una Etiqueta

#### **Paso 1: Seleccionar Tamaño**
1. Haz clic en la pestaña "Plantilla y Tamaño"
2. Elige el tamaño de tu etiqueta
3. El tamaño recomendado es **2" × 3.5"** (marcado con badge verde)

#### **Paso 2: Elegir Plantilla**
1. Selecciona una de las 7 plantillas prediseñadas
2. Lee la descripción para entender qué incluye cada una
3. Las plantillas que requieren QR están marcadas

#### **Paso 3: Personalizar Campos**
1. Ve a la pestaña "Campos"
2. Activa/desactiva los campos que desees incluir
3. Usa los toggles para habilitar o deshabilitar cada campo

#### **Paso 4: Ajustar Estilos** (Opcional)
1. Ve a la pestaña "Estilos"
2. Ajusta el tamaño del QR con el slider
3. Modifica los tamaños de fuente
4. Configura los márgenes
5. Ajusta el espaciado entre líneas
6. Activa/desactiva el borde

#### **Paso 5: Guardar**
1. Haz clic en el botón "Guardar" (esquina superior derecha)
2. Tu configuración se aplica automáticamente
3. Todas las etiquetas futuras usarán esta configuración

### Guardar como Plantilla Personalizada

1. Después de configurar tu etiqueta ideal
2. Haz clic en "Nueva Plantilla" en la sección de plantillas guardadas
3. Dale un nombre descriptivo (ej: "Etiqueta compacta para iPhone")
4. Haz clic en "Guardar"
5. Ahora puedes cargar esta plantilla cuando quieras

### Usar una Plantilla Guardada

1. Encuentra la plantilla en la lista de "Plantillas Guardadas"
2. Haz clic en "Usar esta plantilla"
3. La configuración se carga automáticamente
4. Haz los ajustes finales si es necesario
5. Guarda para aplicar

### Exportar/Importar Configuración

#### **Exportar**
1. Haz clic en "Exportar"
2. Se descarga un archivo JSON con tu configuración
3. Compártelo con tu equipo o guárdalo como backup

#### **Importar**
1. Haz clic en "Importar"
2. Selecciona el archivo JSON previamente exportado
3. La configuración se carga inmediatamente

### Restablecer a Valores por Defecto

1. Haz clic en "Restablecer"
2. Confirma la acción
3. Vuelve a la configuración estándar

## 💾 Almacenamiento

### LocalStorage
- **Clave:** `axer_label_config`
- **Formato:** JSON
- **Persistencia:** Navegador local
- **Tamaño:** ~5KB aproximadamente

### Plantillas Guardadas
- **Clave:** `axer_label_config_saved`
- **Formato:** Array de configuraciones
- **Límite:** Sin límite (hasta capacidad del navegador)

## 📂 Estructura de Archivos

```
src/
├── types/
│   └── labelConfig.ts              # Tipos TypeScript completos
├── hooks/
│   └── useLabelConfig.ts           # Hook de gestión de configuración
├── lib/
│   └── pdf/
│       ├── entryLabelPDF.ts        # Generador principal (actualizado)
│       └── labelTemplates.ts       # Generadores de plantillas
├── components/
│   └── settings/
│       └── LabelConfigurationPanel.tsx  # Panel de configuración UI
└── app/
    └── (admin)/
        └── configuracion/
            └── etiquetas/
                └── page.tsx        # Página de configuración
```

## 🎨 Componentes UI

### LabelConfigurationPanel

**Ubicación:** `src/components/settings/LabelConfigurationPanel.tsx`

**Props:** Ninguna (usa hook interno)

**Características:**
- 3 pestañas: Plantilla, Campos, Estilos
- Guardado automático en localStorage
- Soporte para múltiples configuraciones
- Import/Export de configuración
- Preview visual (próximamente)

**Uso:**
```tsx
import LabelConfigurationPanel from '@/components/settings/LabelConfigurationPanel';

function ConfigPage() {
  return <LabelConfigurationPanel />;
}
```

## 🔧 Hooks y Utilidades

### useLabelConfig

**Ubicación:** `src/hooks/useLabelConfig.ts`

**Retorna:**
```typescript
{
  // Estado
  labelConfig: LabelConfiguration,
  printerConfig: PrinterConfiguration | null,
  savedConfigs: LabelConfiguration[],
  loading: boolean,

  // Acciones
  saveLabelConfig: (config) => Result,
  savePrinterConfig: (config) => Result,
  saveAsTemplate: (config, name) => Result,
  deleteTemplate: (id) => Result,
  loadTemplate: (id) => Result,
  resetToDefault: () => Result,
  exportConfig: () => Result,
  importConfig: (file) => Promise<Result>,
  refreshConfig: () => void,
}
```

**Ejemplo de uso:**
```tsx
const {
  labelConfig,
  saveLabelConfig,
  savedConfigs
} = useLabelConfig();

// Modificar configuración
const newConfig = { ...labelConfig, size: '4x6' };
saveLabelConfig(newConfig);

// Guardar como plantilla
saveAsTemplate(labelConfig, 'Mi plantilla personalizada');
```

## 📊 Tipos TypeScript

### LabelConfiguration

```typescript
interface LabelConfiguration {
  id?: string;
  org_id?: string;
  name: string;

  // Tamaño
  size: LabelSize;
  customWidth?: number;
  customHeight?: number;

  // Plantilla
  template: LabelTemplate;

  // Campos
  fields: FieldConfig[];

  // Estilos
  qrCodeStyle?: QRCodeStyle;
  headerStyle?: TextStyle;
  bodyStyle?: TextStyle;
  footerStyle?: TextStyle;

  // Márgenes
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  lineSpacing: number;

  // Opciones
  showBorder: boolean;
  borderColor?: string;
  backgroundColor?: string;

  // Metadata
  isDefault: boolean;
  created_at?: string;
  updated_at?: string;
}
```

## 🔄 Flujo de Trabajo

```
Usuario → Panel de Configuración → Selecciona Plantilla
                ↓
        Personaliza Campos y Estilos
                ↓
          Guarda Configuración
                ↓
        localStorage (navegador)
                ↓
    Al imprimir etiqueta → Carga configuración → Genera PDF
```

## ⚙️ Configuración Avanzada

### Plantilla Personalizada Completa

```typescript
const miPlantilla: LabelConfiguration = {
  name: 'Etiqueta Premium',
  size: '2x4',
  template: 'custom',
  fields: [
    { field: 'entry_number', enabled: true },
    { field: 'company_logo', enabled: true },
    { field: 'qr_code', enabled: true },
    { field: 'device_model', enabled: true },
    { field: 'imei_serial', enabled: true },
    { field: 'customer_name', enabled: true },
    { field: 'technician', enabled: true },
  ],
  qrCodeStyle: {
    size: 35,
    errorCorrection: 'H',
    margin: 2,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  headerStyle: {
    fontSize: 12,
    fontFamily: 'helvetica',
    fontWeight: 'bold',
    color: '#000000',
    alignment: 'center',
  },
  bodyStyle: {
    fontSize: 8,
    fontFamily: 'helvetica',
    fontWeight: 'normal',
    color: '#333333',
    alignment: 'center',
  },
  margins: {
    top: 4,
    right: 4,
    bottom: 4,
    left: 4,
  },
  lineSpacing: 4,
  showBorder: true,
  borderColor: '#CCCCCC',
  isDefault: false,
};
```

## 🐛 Solución de Problemas

### La configuración no se guarda
**Causa:** LocalStorage deshabilitado o lleno
**Solución:** Habilita localStorage o limpia datos antiguos

### Las etiquetas se ven mal
**Causa:** Configuración incompatible con tamaño
**Solución:** Usa plantillas recomendadas para cada tamaño

### El QR no se escanea
**Causa:** QR muy pequeño o nivel de corrección bajo
**Solución:** Aumenta tamaño del QR y usa nivel de corrección 'M' o 'H'

### Texto cortado
**Causa:** Márgenes muy grandes o fuentes muy grandes
**Solución:** Reduce márgenes o tamaños de fuente

## 🚀 Próximas Mejoras

- [ ] Vista previa en tiempo real
- [ ] Editor visual drag & drop
- [ ] Más plantillas prediseñadas
- [ ] Soporte para logos personalizados
- [ ] Sincronización con base de datos (multi-usuario)
- [ ] Impresión directa (sin descarga)
- [ ] Templates por categoría de equipo
- [ ] Soporte para códigos de barras Code128
- [ ] Temas de color personalizados
- [ ] Exportar como imagen PNG/SVG

## 📞 Soporte

Para dudas o problemas:
- Documentación: Este archivo
- Código fuente: Ver archivos mencionados arriba
- GitHub Issues: [Reportar problema](https://github.com/tu-repo/issues)

---

**Versión:** 1.0.0
**Última actualización:** 2025-01-21

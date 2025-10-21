/**
 * Tipos para configuración de etiquetas de impresión
 */

/**
 * Tamaños de etiqueta disponibles
 */
export type LabelSize =
  | '2x1'        // 2" x 1" (50.8mm x 25.4mm) - Pequeña
  | '2x1.5'      // 2" x 1.5" (50.8mm x 38.1mm) - Pequeña-Mediana
  | '2x3'        // 2" x 3" (50.8mm x 76.2mm) - Mediana
  | '2x3.5'      // 2" x 3.5" (50.8mm x 88.9mm) - Estándar (por defecto)
  | '2x4'        // 2" x 4" (50.8mm x 101.6mm) - Grande
  | '4x6'        // 4" x 6" (101.6mm x 152.4mm) - Extra grande
  | 'custom';    // Tamaño personalizado

/**
 * Información de cada tamaño
 */
export interface LabelSizeInfo {
  id: LabelSize;
  name: string;
  description: string;
  widthMM: number;
  heightMM: number;
  widthInch: number;
  heightInch: number;
  recommended: boolean;
}

/**
 * Plantillas prediseñadas
 */
export type LabelTemplate =
  | 'standard'      // Estándar con QR
  | 'compact'       // Compacta sin QR
  | 'minimal'       // Mínima (solo ID y modelo)
  | 'detailed'      // Detallada con todos los campos
  | 'qr-only'       // Solo QR grande
  | 'barcode'       // Con código de barras en lugar de QR
  | 'custom';       // Personalizada

/**
 * Información de plantilla
 */
export interface LabelTemplateInfo {
  id: LabelTemplate;
  name: string;
  description: string;
  preview: string; // URL de imagen de preview
  fields: LabelField[];
  requiresQR: boolean;
  requiresBarcode: boolean;
  recommendedSize: LabelSize[];
}

/**
 * Campos que pueden ir en la etiqueta
 */
export type LabelField =
  | 'entry_number'    // Número de entrada
  | 'company_logo'    // Logo de empresa
  | 'company_name'    // Nombre de empresa
  | 'qr_code'         // Código QR
  | 'barcode'         // Código de barras
  | 'device_model'    // Modelo del equipo
  | 'imei_serial'     // IMEI/Serial
  | 'entry_date'      // Fecha de entrada
  | 'customer_name'   // Nombre del cliente
  | 'customer_phone'  // Teléfono del cliente
  | 'technician'      // Técnico asignado
  | 'status'          // Estado de la entrada
  | 'problem'         // Problema reportado
  | 'accessories'     // Accesorios
  | 'custom_field_1'  // Campo personalizado 1
  | 'custom_field_2'  // Campo personalizado 2
  | 'custom_field_3'; // Campo personalizado 3

/**
 * Estilo de QR Code
 */
export interface QRCodeStyle {
  size: number;           // Tamaño en mm
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
  margin: number;
  color: string;          // Color del QR
  backgroundColor: string;
}

/**
 * Estilo de texto
 */
export interface TextStyle {
  fontSize: number;
  fontFamily: 'helvetica' | 'times' | 'courier';
  fontWeight: 'normal' | 'bold';
  color: string;
  alignment: 'left' | 'center' | 'right';
}

/**
 * Configuración de campo individual
 */
export interface FieldConfig {
  field: LabelField;
  enabled: boolean;
  label?: string;           // Etiqueta personalizada
  style?: Partial<TextStyle>;
  position?: {
    x?: number;
    y?: number;
  };
}

/**
 * Configuración completa de etiqueta
 */
export interface LabelConfiguration {
  id?: string;
  org_id?: string;
  name: string;              // Nombre de la configuración

  // Tamaño
  size: LabelSize;
  customWidth?: number;      // Si size === 'custom'
  customHeight?: number;     // Si size === 'custom'

  // Plantilla
  template: LabelTemplate;

  // Campos
  fields: FieldConfig[];

  // Estilos
  qrCodeStyle?: QRCodeStyle;
  headerStyle?: TextStyle;
  bodyStyle?: TextStyle;
  footerStyle?: TextStyle;

  // Márgenes y espaciado
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  lineSpacing: number;

  // Opciones avanzadas
  showBorder: boolean;
  borderColor?: string;
  backgroundColor?: string;

  // Metadata
  isDefault: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Configuración de impresora
 */
export interface PrinterConfiguration {
  id?: string;
  org_id?: string;

  name: string;
  printerModel?: string;     // Ej: "Brother QL-800"
  printerType: 'thermal' | 'laser' | 'inkjet';

  // Configuración de impresión
  dpi: number;               // 203, 300, 600
  orientation: 'portrait' | 'landscape';

  // Preferencias
  defaultLabelConfig?: string; // ID de LabelConfiguration

  created_at?: string;
  updated_at?: string;
}

/**
 * Tamaños predefinidos
 */
export const LABEL_SIZES: Record<LabelSize, LabelSizeInfo> = {
  '2x1': {
    id: '2x1',
    name: '2" × 1"',
    description: 'Pequeña - Ideal para inventario',
    widthMM: 50.8,
    heightMM: 25.4,
    widthInch: 2,
    heightInch: 1,
    recommended: false,
  },
  '2x1.5': {
    id: '2x1.5',
    name: '2" × 1.5"',
    description: 'Pequeña-Mediana - Solo datos básicos',
    widthMM: 50.8,
    heightMM: 38.1,
    widthInch: 2,
    heightInch: 1.5,
    recommended: false,
  },
  '2x3': {
    id: '2x3',
    name: '2" × 3"',
    description: 'Mediana - Con QR pequeño',
    widthMM: 50.8,
    heightMM: 76.2,
    widthInch: 2,
    heightInch: 3,
    recommended: false,
  },
  '2x3.5': {
    id: '2x3.5',
    name: '2" × 3.5"',
    description: 'Estándar - Recomendado',
    widthMM: 50.8,
    heightMM: 88.9,
    widthInch: 2,
    heightInch: 3.5,
    recommended: true,
  },
  '2x4': {
    id: '2x4',
    name: '2" × 4"',
    description: 'Grande - Información detallada',
    widthMM: 50.8,
    heightMM: 101.6,
    widthInch: 2,
    heightInch: 4,
    recommended: false,
  },
  '4x6': {
    id: '4x6',
    name: '4" × 6"',
    description: 'Extra Grande - Máxima información',
    widthMM: 101.6,
    heightMM: 152.4,
    widthInch: 4,
    heightInch: 6,
    recommended: false,
  },
  'custom': {
    id: 'custom',
    name: 'Personalizado',
    description: 'Define tu propio tamaño',
    widthMM: 50.8,
    heightMM: 90,
    widthInch: 2,
    heightInch: 3.54,
    recommended: false,
  },
};

/**
 * Plantillas predefinidas
 */
export const LABEL_TEMPLATES: Record<LabelTemplate, Partial<LabelTemplateInfo>> = {
  standard: {
    id: 'standard',
    name: 'Estándar',
    description: 'Etiqueta completa con QR, ideal para la mayoría de casos',
    fields: ['entry_number', 'company_name', 'qr_code', 'device_model', 'imei_serial', 'entry_date', 'customer_name'],
    requiresQR: true,
    requiresBarcode: false,
    recommendedSize: ['2x3.5', '2x4'],
  },
  compact: {
    id: 'compact',
    name: 'Compacta',
    description: 'Sin QR, solo información esencial',
    fields: ['entry_number', 'company_name', 'device_model', 'entry_date', 'customer_name'],
    requiresQR: false,
    requiresBarcode: false,
    recommendedSize: ['2x1.5', '2x3'],
  },
  minimal: {
    id: 'minimal',
    name: 'Minimalista',
    description: 'Solo ID y modelo del equipo',
    fields: ['entry_number', 'device_model', 'entry_date'],
    requiresQR: false,
    requiresBarcode: false,
    recommendedSize: ['2x1', '2x1.5'],
  },
  detailed: {
    id: 'detailed',
    name: 'Detallada',
    description: 'Toda la información disponible',
    fields: [
      'entry_number',
      'company_logo',
      'company_name',
      'qr_code',
      'device_model',
      'imei_serial',
      'entry_date',
      'customer_name',
      'customer_phone',
      'technician',
      'status',
      'problem',
    ],
    requiresQR: true,
    requiresBarcode: false,
    recommendedSize: ['4x6'],
  },
  'qr-only': {
    id: 'qr-only',
    name: 'QR Grande',
    description: 'Solo código QR grande y número de entrada',
    fields: ['entry_number', 'qr_code'],
    requiresQR: true,
    requiresBarcode: false,
    recommendedSize: ['2x3', '2x3.5'],
  },
  barcode: {
    id: 'barcode',
    name: 'Código de Barras',
    description: 'Con código de barras en lugar de QR',
    fields: ['entry_number', 'company_name', 'barcode', 'device_model', 'entry_date'],
    requiresQR: false,
    requiresBarcode: true,
    recommendedSize: ['2x3.5', '2x4'],
  },
  custom: {
    id: 'custom',
    name: 'Personalizada',
    description: 'Define tus propios campos',
    fields: [],
    requiresQR: false,
    requiresBarcode: false,
    recommendedSize: ['2x3.5'],
  },
};

/**
 * Configuración por defecto
 */
export const DEFAULT_LABEL_CONFIG: LabelConfiguration = {
  name: 'Configuración por defecto',
  size: '2x3.5',
  template: 'standard',
  fields: [
    { field: 'entry_number', enabled: true },
    { field: 'company_name', enabled: true },
    { field: 'qr_code', enabled: true },
    { field: 'device_model', enabled: true },
    { field: 'imei_serial', enabled: true },
    { field: 'entry_date', enabled: true },
    { field: 'customer_name', enabled: true },
  ],
  qrCodeStyle: {
    size: 30,
    errorCorrection: 'M',
    margin: 1,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  headerStyle: {
    fontSize: 10,
    fontFamily: 'helvetica',
    fontWeight: 'bold',
    color: '#000000',
    alignment: 'center',
  },
  bodyStyle: {
    fontSize: 7,
    fontFamily: 'helvetica',
    fontWeight: 'normal',
    color: '#000000',
    alignment: 'center',
  },
  footerStyle: {
    fontSize: 5,
    fontFamily: 'helvetica',
    fontWeight: 'normal',
    color: '#666666',
    alignment: 'center',
  },
  margins: {
    top: 3,
    right: 3,
    bottom: 3,
    left: 3,
  },
  lineSpacing: 3,
  showBorder: false,
  isDefault: true,
};

/**
 * Nombres amigables para campos
 */
export const FIELD_LABELS: Record<LabelField, string> = {
  entry_number: 'Número de Entrada',
  company_logo: 'Logo de Empresa',
  company_name: 'Nombre de Empresa',
  qr_code: 'Código QR',
  barcode: 'Código de Barras',
  device_model: 'Modelo del Equipo',
  imei_serial: 'IMEI/Serial',
  entry_date: 'Fecha de Entrada',
  customer_name: 'Nombre del Cliente',
  customer_phone: 'Teléfono del Cliente',
  technician: 'Técnico Asignado',
  status: 'Estado',
  problem: 'Problema',
  accessories: 'Accesorios',
  custom_field_1: 'Campo Personalizado 1',
  custom_field_2: 'Campo Personalizado 2',
  custom_field_3: 'Campo Personalizado 3',
};

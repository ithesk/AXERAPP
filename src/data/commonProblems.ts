/**
 * Lista de problemas comunes para dispositivos electrónicos
 * Organizada por categoría para facilitar la búsqueda
 */

export const COMMON_PROBLEMS = [
  // Pantalla
  "Pantalla rota o fisurada",
  "Pantalla no enciende",
  "Pantalla con manchas o líneas",
  "Touch no funciona",
  "Touch funciona parcialmente",
  "Cristal templado roto",

  // Batería
  "Batería se descarga rápido",
  "No carga la batería",
  "Batería inflada",
  "Apagado repentino con batería",
  "Batería no detectada",

  // Carga
  "No carga el dispositivo",
  "Carga lenta",
  "Puerto de carga dañado",
  "Cable de carga no reconocido",
  "Carga intermitente",

  // Botones
  "Botón de encendido no funciona",
  "Botones de volumen no funcionan",
  "Botón Home no funciona",
  "Botón de silencio atascado",

  // Audio
  "Sin audio en bocina",
  "Sin audio en auricular",
  "Micrófono no funciona",
  "Audio distorsionado",
  "Volumen bajo",

  // Cámaras
  "Cámara trasera no funciona",
  "Cámara frontal no funciona",
  "Foto borrosa",
  "Flash no funciona",
  "Cámara con manchas",

  // Conectividad
  "Sin señal celular",
  "WiFi no funciona",
  "Bluetooth no funciona",
  "GPS no funciona",
  "Sin servicio",

  // Software
  "Dispositivo bloqueado",
  "Actualización fallida",
  "Reinicio constante (bootloop)",
  "Lento o congelado",
  "Virus o malware",

  // Agua/Daño físico
  "Daño por líquido",
  "Caída con golpe",
  "Oxidación interna",

  // Sensores
  "Face ID no funciona",
  "Touch ID no funciona",
  "Sensor de proximidad no funciona",

  // Otros
  "Cambio de batería",
  "Cambio de pantalla",
  "Limpieza interna",
  "Respaldo de datos",
  "Configuración inicial",
] as const;

export type CommonProblem = typeof COMMON_PROBLEMS[number];

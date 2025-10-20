"use client";

import React, { useState, useEffect } from "react";
import { PhoneInput } from "@/components/ui/PhoneInput";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useToast } from "@/context/ToastContext";
import { useOrganization } from "@/context/OrganizationContext";

interface WhatsAppSettings {
  api_url: string;
  enabled: boolean;
}

export default function WhatsAppConfig() {
  const { showToast } = useToast();
  const { currentOrg } = useOrganization();

  // Estado para la configuración
  const [apiUrl, setApiUrl] = useState("http://192.168.2.148:3005/send-message");
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [savedApiUrl, setSavedApiUrl] = useState("");

  // Estado para la prueba de envío
  const [testNumber, setTestNumber] = useState("");
  const [testMessage, setTestMessage] = useState("Hola, este es un mensaje de prueba");
  const [testMediaUrl, setTestMediaUrl] = useState("https://shorturl.at/Qkwxy");
  const [sending, setSending] = useState(false);

  // Cargar configuración al montar el componente
  useEffect(() => {
    loadSettings();
  }, [currentOrg]);

  const loadSettings = async () => {
    if (!currentOrg?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/whatsapp-settings?org_id=${currentOrg.id}`);

      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          const url = data.settings.api_url || "http://192.168.2.148:3005/send-message";
          setApiUrl(url);
          setSavedApiUrl(url);
          setEnabled(data.settings.enabled || false);
          setIsEditing(false);
        } else {
          // No hay configuración guardada, permitir edición
          setIsEditing(true);
        }
      }
    } catch (error) {
      console.error("Error al cargar configuración:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!currentOrg?.id) {
      showToast("error", "Error", "No hay organización seleccionada");
      return;
    }

    if (!apiUrl.trim()) {
      showToast("error", "Error", "La URL de la API es requerida");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/whatsapp-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          org_id: currentOrg.id,
          api_url: apiUrl,
          enabled: enabled,
        }),
      });

      if (response.ok) {
        setSavedApiUrl(apiUrl);
        setIsEditing(false);
        showToast("success", "Configuración guardada", "Los cambios se guardaron correctamente");
      } else {
        const error = await response.json();
        showToast("error", "Error al guardar", error.message || "No se pudo guardar la configuración");
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      showToast("error", "Error", "Ocurrió un error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setApiUrl(savedApiUrl);
    setIsEditing(false);
  };

  const maskUrl = (url: string) => {
    if (!url) return "";
    // Mostrar solo protocolo y último segmento
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      const lastPart = pathParts[pathParts.length - 1] || '';
      return `${urlObj.protocol}//${"*".repeat(15)}.../${lastPart}`;
    } catch {
      // Si no es una URL válida, mostrar asteriscos
      return "*".repeat(Math.min(url.length, 30));
    }
  };

  const handleSendTest = async () => {
    if (!apiUrl.trim()) {
      showToast("error", "Error", "Primero configura la URL de la API");
      return;
    }

    if (!testNumber.trim()) {
      showToast("error", "Error", "Ingresa un número de teléfono");
      return;
    }

    if (!testMessage.trim()) {
      showToast("error", "Error", "Ingresa un mensaje");
      return;
    }

    setSending(true);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: testNumber.replace(/\D/g, ""), // Remover caracteres no numéricos
          message: testMessage,
          mediaUrl: testMediaUrl.trim() || undefined,
        }),
      });

      if (response.ok) {
        showToast("success", "Mensaje enviado", "El mensaje de prueba se envió correctamente");
        // Limpiar campos después de enviar
        setTestMessage("Hola, este es un mensaje de prueba");
      } else {
        const error = await response.text();
        showToast("error", "Error al enviar", `No se pudo enviar el mensaje: ${error}`);
      }
    } catch (error: any) {
      console.error("Error al enviar mensaje:", error);
      showToast("error", "Error de conexión", error.message || "No se pudo conectar con la API");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuración de la API */}
      <div className="p-6 border border-gray-200 rounded-2xl bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Configuración de la API
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configura la URL del servidor de WhatsApp
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>URL de la API</Label>
              {!isEditing && savedApiUrl && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-brand-500 hover:text-brand-600 font-medium"
                >
                  Editar
                </button>
              )}
            </div>

            {isEditing ? (
              <Input
                type="url"
                placeholder="http://192.168.2.148:3005/send-message"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="font-mono text-sm"
              />
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                <span className="font-mono text-gray-600 dark:text-gray-400">
                  {savedApiUrl ? maskUrl(savedApiUrl) : "No configurado"}
                </span>
              </div>
            )}

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {isEditing
                ? "Endpoint REST para enviar mensajes de WhatsApp"
                : "URL protegida. Haz clic en 'Editar' para modificarla"
              }
            </p>
          </div>

          <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl dark:border-gray-800">
            <input
              type="checkbox"
              id="whatsapp-enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500"
            />
            <div>
              <label
                htmlFor="whatsapp-enabled"
                className="text-sm font-medium text-gray-800 dark:text-white/90 cursor-pointer"
              >
                Habilitar notificaciones de WhatsApp
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Activar el envío automático de notificaciones a clientes
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            {isEditing && savedApiUrl && (
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={saving}
                size="sm"
              >
                Cancelar
              </Button>
            )}
            <Button
              onClick={handleSaveSettings}
              disabled={saving || (!isEditing && savedApiUrl === apiUrl)}
              size="sm"
            >
              {saving ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </div>
        </div>
      </div>

      {/* Prueba de envío */}
      <div className="p-6 border border-gray-200 rounded-2xl bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Prueba de Envío
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Envía un mensaje de prueba para verificar la configuración
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Número de Teléfono</Label>
            <PhoneInput
              value={testNumber}
              onChange={setTestNumber}
              placeholder="Número con código de país"
              defaultCountry="DO"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Ejemplo: +1 849 882 5907
            </p>
          </div>

          <div>
            <Label>Mensaje</Label>
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={3}
              placeholder="Escribe tu mensaje de prueba"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <Label>URL de Imagen (Opcional)</Label>
            <Input
              type="url"
              placeholder="https://ejemplo.com/imagen.jpg"
              value={testMediaUrl}
              onChange={(e) => setTestMediaUrl(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              URL pública de una imagen para adjuntar al mensaje
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTestNumber("");
                setTestMessage("Hola, este es un mensaje de prueba");
                setTestMediaUrl("https://shorturl.at/Qkwxy");
              }}
            >
              Limpiar
            </Button>
            <Button
              onClick={handleSendTest}
              disabled={sending || !apiUrl}
              size="sm"
            >
              {sending ? "Enviando..." : "Enviar Prueba"}
            </Button>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="p-6 border border-blue-200 rounded-2xl bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/10">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">
              Formato de la API
            </h3>
            <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
              La API debe aceptar peticiones POST con el siguiente formato JSON:
            </p>
            <pre className="mt-2 p-3 text-xs bg-blue-100 dark:bg-blue-900/30 rounded-lg overflow-x-auto">
{`{
  "number": "18498825907",
  "message": "Hola, este es un mensaje",
  "mediaUrl": "https://ejemplo.com/imagen.jpg"
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

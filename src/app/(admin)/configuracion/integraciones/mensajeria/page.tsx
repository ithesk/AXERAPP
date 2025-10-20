"use client";

import React from "react";
import WhatsAppConfig from "@/components/integrations/WhatsAppConfig";

export default function MessagingIntegrationPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Configuración de WhatsApp
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configura tu API de WhatsApp para enviar notificaciones automáticas a tus clientes
        </p>
      </div>

      {/* WhatsApp Configuration Component */}
      <WhatsAppConfig />
    </div>
  );
}

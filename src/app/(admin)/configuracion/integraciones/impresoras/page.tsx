"use client";

import React from "react";

export default function PrintersIntegrationPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Configuración de Impresoras
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gestiona las impresoras conectadas para tickets, etiquetas y documentos
        </p>
      </div>

      {/* Content Placeholder */}
      <div className="p-12 text-center border border-gray-200 rounded-2xl bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-600">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </div>
          <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
            Página en Construcción
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            La configuración de impresoras estará disponible próximamente. Aquí podrás:
          </p>
          <ul className="mb-8 space-y-2 text-left text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Configurar impresoras térmicas (tickets)</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Configurar impresoras de etiquetas</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Personalizar plantillas de impresión</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Probar conexión e imprimir de prueba</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

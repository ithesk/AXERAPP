"use client";

import React from "react";

export default function RecibirPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Recibir
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gestión de recepción de productos y equipos
        </p>
      </div>

      {/* Content Placeholder */}
      <div className="p-12 text-center border border-gray-200 rounded-2xl bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-teal-500 to-teal-600">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
            Módulo de Recepción
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Esta sección estará disponible próximamente para gestionar:
          </p>
          <ul className="mb-8 space-y-2 text-left text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Recepción de productos</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Verificación de inventario</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Control de calidad</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Asignación a ubicaciones</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Registro de proveedores</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

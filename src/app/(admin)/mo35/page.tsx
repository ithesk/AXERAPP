"use client";

import React from "react";

export default function MO35Page() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          MO35
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gestión de órdenes y movimientos MO35
        </p>
      </div>

      {/* Content Placeholder */}
      <div className="p-12 text-center border border-gray-200 rounded-2xl bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
            Módulo MO35
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Esta sección estará disponible próximamente para gestionar:
          </p>
          <ul className="mb-8 space-y-2 text-left text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Órdenes de trabajo MO35</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Seguimiento de estados</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Historial de movimientos</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Reportes y estadísticas</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

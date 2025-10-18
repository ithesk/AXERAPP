import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Configuraciones - AXER APP",
  description: "Configuración del sistema",
};

export default function Configuraciones() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h1 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-white/90">
          Configuraciones
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Configuración general del sistema
        </p>
      </div>
    </div>
  );
}

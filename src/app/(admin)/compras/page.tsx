import type { Metadata } from "next";
import React from "react";
import ContactUsageCard from "@/components/contacts/ContactUsageCard";

export const metadata: Metadata = {
  title: "Compras - AXER APP",
  description: "Gestión de compras",
};

export default function Compras() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h1 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-white/90">
          Compras
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Módulo de gestión de compras a proveedores con contactos compartidos.
        </p>
      </div>

      <ContactUsageCard
        module="compras"
        title="Contactos en Compras"
        description="Organiza y reutiliza proveedores frecuentes directamente desde esta vista."
      />
    </div>
  );
}

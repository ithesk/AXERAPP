"use client";

import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center bg-gradient-to-br from-[#f8fbff] to-[#eef2ff] dark:from-gray-950 dark:to-gray-900 px-6">
      {/* LOGO */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-20 h-20 mb-3">
          <Image
            src="/images/logo/logo-icon.svg"
            alt="AXER Logo"
            width={80}
            height={80}
            className="hover:scale-105 transition-transform dark:hidden"
          />
          <Image
            src="/images/logo/logo-icon.svg"
            alt="AXER Logo"
            width={80}
            height={80}
            className="hover:scale-105 transition-transform hidden dark:block"
          />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">
          Organízate con AXER
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Administra tus reparaciones, clientes y stock en un solo lugar.
        </p>
      </div>

      {/* BOTONES */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Link href="/signup">
          <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium px-8 py-3 rounded-xl hover:scale-105 transition-all shadow-sm">
            Crear mi cuenta gratis
          </button>
        </Link>
        <Link href="/signin">
          <button className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium px-8 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
            Iniciar sesión
          </button>
        </Link>
      </div>

      {/* FOOTER */}
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-6">
        Empieza gratis. Sin tarjeta de crédito.
      </p>
    </main>
  );
}

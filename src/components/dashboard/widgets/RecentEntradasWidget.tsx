"use client";

import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useOrganization } from '@/context/OrganizationContext';
import type { Entrada } from '@/types/entradas';
import { Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface RecentEntradasWidgetProps {
  config?: {
    title?: string;
    limit?: number;
  };
}

export default function RecentEntradasWidget({ config }: RecentEntradasWidgetProps) {
  const supabase = createClientComponentClient();
  const { currentOrg } = useOrganization();
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentOrg) return;

    const fetchEntradas = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('entradas')
          .select(`
            *,
            contacto:contactos(nombre, apellido)
          `)
          .eq('organization_id', currentOrg.id)
          .order('created_at', { ascending: false })
          .limit(config?.limit || 5);

        if (error) throw error;

        setEntradas(data || []);
      } catch (error) {
        console.error('Error fetching entradas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntradas();

    // Refrescar cada 2 minutos
    const interval = setInterval(fetchEntradas, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentOrg, config?.limit]);

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { color: string; icon: React.ReactNode }> = {
      'Recibido': { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <Clock className="w-3 h-3" /> },
      'En diagnóstico': { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <AlertCircle className="w-3 h-3" /> },
      'En reparación': { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: <AlertCircle className="w-3 h-3" /> },
      'Reparado': { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle2 className="w-3 h-3" /> },
      'No reparado': { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle className="w-3 h-3" /> },
      'Entregado': { color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', icon: <CheckCircle2 className="w-3 h-3" /> },
    };

    const badge = badges[estado] || badges['Recibido'];

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
        {badge.icon}
        {estado}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-t-brand-500 border-gray-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {config?.title || 'Entradas Recientes'}
        </h3>
        <Link
          href="/entradas"
          className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          Ver todas
        </Link>
      </div>

      {entradas.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No hay entradas recientes
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3">
          {entradas.map((entrada) => (
            <Link
              key={entrada.id}
              href={`/entradas`}
              className="block p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-brand-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {entrada.id_reparacion}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {entrada.contacto?.nombre} {entrada.contacto?.apellido}
                  </p>
                </div>
                {getEstadoBadge(entrada.estado)}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400 truncate flex-1">
                  {entrada.equipo}
                </span>
                <span className="text-gray-500 dark:text-gray-500 ml-2">
                  {new Date(entrada.created_at).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

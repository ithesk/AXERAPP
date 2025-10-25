"use client";

import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useOrganization } from '@/context/OrganizationContext';
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Link from 'next/link';

interface Order {
  id: string;
  created_at: string;
  total: number;
  estado: string;
  contacto?: {
    nombre: string;
    apellido: string;
  };
  items_count: number;
}

export default function RecentOrdersWidget() {
  const supabase = createClientComponentClient();
  const { currentOrg } = useOrganization();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentOrg) return;

    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('ventas')
          .select(`
            id,
            created_at,
            total,
            estado,
            contacto:id_contacto(nombre, apellido)
          `)
          .eq('organization_id', currentOrg.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        // Obtener conteo de items por venta (esto sería mejor con una relación real)
        const ordersWithCount = data?.map(order => ({
          ...order,
          items_count: 1, // Por ahora hardcodeado, debería venir de una tabla de items
        })) || [];

        setOrders(ordersWithCount);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentOrg, supabase]);

  const getStatusBadge = (estado: string) => {
    const statusMap: Record<string, { color: 'success' | 'warning' | 'error', label: string }> = {
      'completado': { color: 'success', label: 'Entregado' },
      'pendiente': { color: 'warning', label: 'Pendiente' },
      'cancelado': { color: 'error', label: 'Cancelado' },
    };

    const status = statusMap[estado?.toLowerCase()] || { color: 'warning', label: estado };
    return <Badge color={status.color}>{status.label}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-t-brand-500 border-gray-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 h-full flex flex-col">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Órdenes Recientes
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Últimas 5 ventas registradas
          </p>
        </div>
        <Link
          href="/ventas"
          className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          Ver todas
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No hay órdenes recientes</p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <th className="text-left">Cliente</th>
                <th className="text-left">Items</th>
                <th className="text-left">Total</th>
                <th className="text-left">Estado</th>
                <th className="text-left">Fecha</th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {order.contacto
                        ? `${order.contacto.nombre} ${order.contacto.apellido}`
                        : 'Cliente no especificado'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600 dark:text-gray-400">
                      {order.items_count} {order.items_count === 1 ? 'item' : 'items'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(order.total)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(order.estado)}
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(order.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

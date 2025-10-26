"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Database,
  KeyRound,
  Loader2,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { useToast } from "@/context/ToastContext";
import { useOrganization } from "@/context/OrganizationContext";
import type {
  ERPAuthType,
  ERPConnection,
  ERPConnectionFormState,
  ERPConnectionStatus,
} from "@/types/integrations";

const STATUS_BADGES: Record<
  ERPConnectionStatus,
  { label: string; color: "success" | "warning" | "error" | "info" | "light"; helper: string }
> = {
  connected: {
    label: "Conectado",
    color: "success",
    helper: "Sincronización activa y credenciales válidas",
  },
  pending: {
    label: "Pendiente",
    color: "warning",
    helper: "Falta confirmar credenciales o aprobar en Odoo",
  },
  error: {
    label: "Error",
    color: "error",
    helper: "Último intento falló, revisa los detalles",
  },
  disconnected: {
    label: "Sin configurar",
    color: "light",
    helper: "Aún no se conectó este taller a Odoo",
  },
};

const DEFAULT_FORM: ERPConnectionFormState = {
  base_url: "",
  database_name: "",
  company_id: "",
  auth_type: "api_key",
  api_key: "",
  client_id: "",
  client_secret: "",
  status: "disconnected",
};

const AUTH_OPTIONS: Array<{
  value: ERPAuthType;
  title: string;
  description: string;
  icon: typeof KeyRound;
}> = [
  {
    value: "api_key",
    title: "API Key",
    description: "Ideal para tokens personales o de servicio en Odoo.",
    icon: KeyRound,
  },
  {
    value: "oauth",
    title: "OAuth",
    description: "Client ID/Secret con permisos delegados.",
    icon: ShieldCheck,
  },
];

const formatDateTime = (value: string | null) => {
  if (!value) return "Nunca";
  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const mapConnectionToForm = (conn: ERPConnection): ERPConnectionFormState => ({
  base_url: conn.base_url ?? "",
  database_name: conn.database_name ?? "",
  company_id: conn.company_id !== null && conn.company_id !== undefined ? String(conn.company_id) : "",
  auth_type: conn.auth_type,
  api_key: conn.api_key ?? "",
  client_id: conn.client_id ?? "",
  client_secret: conn.client_secret ?? "",
  status: conn.status,
});

export default function OdooConnectionManager() {
  const { currentOrg, hasPermission } = useOrganization();
  const { showToast } = useToast();

  const [form, setForm] = useState<ERPConnectionFormState>(DEFAULT_FORM);
  const [connection, setConnection] = useState<ERPConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const canManage = hasPermission("manage_settings");

  const currentStatus = useMemo(
    () => STATUS_BADGES[form.status] ?? STATUS_BADGES.disconnected,
    [form.status]
  );

  const loadConnection = useCallback(async () => {
    if (!currentOrg?.id) {
      setConnection(null);
      setForm(DEFAULT_FORM);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/erp-connections?org_id=${currentOrg.id}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || "No se pudo cargar la conexión");
      }

      const payload = await response.json();
      if (payload.connection) {
        setConnection(payload.connection);
        setForm(mapConnectionToForm(payload.connection));
      } else {
        setConnection(null);
        setForm(DEFAULT_FORM);
      }
    } catch (error) {
      console.error("Error loading ERP connection:", error);
      const message = error instanceof Error ? error.message : "Error inesperado al cargar";
      showToast("error", "Error", message);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id, showToast]);

  useEffect(() => {
    loadConnection();
  }, [loadConnection]);

  const updateField = <K extends keyof ERPConnectionFormState>(field: K, value: ERPConnectionFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAuthTypeChange = (value: ERPAuthType) => {
    setForm((prev) => ({
      ...prev,
      auth_type: value,
      api_key: value === "api_key" ? prev.api_key : "",
      client_id: value === "oauth" ? prev.client_id : "",
      client_secret: value === "oauth" ? prev.client_secret : "",
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentOrg?.id || !canManage) return;

    if (!form.base_url.trim()) {
      showToast("error", "URL requerida", "Ingresa la URL base de tu instancia de Odoo.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/erp-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: currentOrg.id,
          base_url: form.base_url,
          database_name: form.database_name || null,
          company_id: form.company_id || null,
          auth_type: form.auth_type,
          api_key: form.api_key || null,
          client_id: form.client_id || null,
          client_secret: form.client_secret || null,
          status: form.status,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "No se pudo guardar la conexión");
      }

      if (payload?.connection) {
        setConnection(payload.connection);
        setForm(mapConnectionToForm(payload.connection));
      }

      showToast("success", "Conexión guardada", "La configuración se guardó correctamente.");
    } catch (error) {
      console.error("Error saving ERP connection:", error);
      const message = error instanceof Error ? error.message : "Error inesperado";
      showToast("error", "Error", message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!currentOrg?.id || !connection) return;
    if (!confirm("¿Eliminar la configuración ERP para este taller?")) return;

    setRemoving(true);
    try {
      const response = await fetch(`/api/erp-connections?org_id=${currentOrg.id}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "No se pudo eliminar la conexión");
      }

      setConnection(null);
      setForm(DEFAULT_FORM);
      showToast("success", "Conexión eliminada", "Se eliminó la configuración de ERP.");
    } catch (error) {
      console.error("Error deleting ERP connection:", error);
      const message = error instanceof Error ? error.message : "Error inesperado al eliminar";
      showToast("error", "Error", message);
    } finally {
      setRemoving(false);
    }
  };

  if (!currentOrg) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-white/5">
        <p className="text-gray-600 dark:text-gray-300">
          Selecciona una organización para configurar su conexión con Odoo.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-10 dark:border-gray-800 dark:bg-white/5">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
          <span>Cargando configuración de ERP...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-brand-500">Integración ERP</p>
          <h2 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            Conecta {currentOrg.name} con Odoo
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Mantén aisladas las credenciales por organización y controla el estado de la conexión.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge color={currentStatus.color} variant="light">
            {currentStatus.label}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={loadConnection}
            disabled={loading}
            startIcon={
              loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />
            }
          >
            Actualizar
          </Button>
        </div>
      </div>

      {!canManage && (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-900/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="font-semibold text-yellow-900 dark:text-yellow-100">Solo lectura</p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                No tienes permisos para editar integraciones. Solicita acceso a un administrador.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/5"
        >
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Estado</label>
            <select
              value={form.status}
              onChange={(event) => updateField("status", event.target.value as ERPConnectionStatus)}
              disabled={!canManage || saving}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="connected">Conectado</option>
              <option value="pending">Pendiente</option>
              <option value="error">Error</option>
              <option value="disconnected">Sin configurar</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400">{currentStatus.helper}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">URL base de Odoo</label>
              <Input
                type="url"
                placeholder="https://mi-taller.odoo.com"
                value={form.base_url}
                onChange={(event) => updateField("base_url", event.target.value)}
                disabled={!canManage || saving}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Nombre de base de datos</label>
              <Input
                placeholder="odoo_production"
                value={form.database_name}
                onChange={(event) => updateField("database_name", event.target.value)}
                disabled={!canManage || saving}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Company ID</label>
              <Input
                type="number"
                placeholder="15"
                value={form.company_id}
                onChange={(event) => updateField("company_id", event.target.value)}
                disabled={!canManage || saving}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Lo encuentras en Ajustes &gt; Empresas dentro de Odoo.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Tipo de autenticación</label>
              <div className="grid gap-3 md:grid-cols-2">
                {AUTH_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = form.auth_type === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-4 text-sm transition ${
                        isActive
                          ? "border-brand-500 bg-brand-50/60 dark:border-brand-400 dark:bg-brand-400/10"
                          : "border-gray-200 hover:border-brand-200 dark:border-gray-700 dark:hover:border-gray-500"
                      } ${!canManage ? "opacity-60" : ""}`}
                    >
                      <input
                        type="radio"
                        name="auth_type"
                        value={option.value}
                        className="sr-only"
                        disabled={!canManage || saving}
                        checked={isActive}
                        onChange={() => handleAuthTypeChange(option.value)}
                      />
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{option.title}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{option.description}</p>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {form.auth_type === "api_key" ? (
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">API Key o Token</label>
              <Input
                type="text"
                placeholder="odoo_XXXXXXXXXXXXXXXX"
                value={form.api_key}
                onChange={(event) => updateField("api_key", event.target.value)}
                disabled={!canManage || saving}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Genera una nueva API key desde tu perfil de Odoo (preferible un usuario técnico).
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Client ID</label>
                <Input
                  type="text"
                  placeholder="odoo_client_id"
                  value={form.client_id}
                  onChange={(event) => updateField("client_id", event.target.value)}
                  disabled={!canManage || saving}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Client Secret</label>
                <Input
                  type="password"
                  placeholder="••••••••••"
                  value={form.client_secret}
                  onChange={(event) => updateField("client_secret", event.target.value)}
                  disabled={!canManage || saving}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              startIcon={
                saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />
              }
              disabled={!canManage || saving}
            >
              {saving ? "Guardando..." : "Guardar conexión"}
            </Button>

            {connection && (
              <Button
                type="button"
                variant="outline"
                className="text-error-600 dark:text-error-400"
                startIcon={removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                disabled={!canManage || removing}
                onClick={handleRemove}
              >
                {removing ? "Eliminando..." : "Eliminar conexión"}
              </Button>
            )}
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-brand-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Aislamiento por organización
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Guardamos org_id, credenciales y estado en Supabase con RLS activo.
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand-500" />
                Cada taller usa su propio registro en <code className="rounded bg-gray-100 px-1 text-xs">erp_connections</code>.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand-500" />
                Las políticas RLS reutilizan <code className="rounded bg-gray-100 px-1 text-xs">user_has_org_access</code>.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand-500" />
                Solo owners y admins pueden crear/editar la conexión.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/5">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Resumen</p>
            <dl className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center justify-between">
                <dt>Última actualización</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {formatDateTime(connection?.updated_at ?? null)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Última sincronización</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {formatDateTime(connection?.last_synced_at ?? null)}
                </dd>
              </div>
            </dl>

            {connection?.last_error && (
              <div className="mt-4 rounded-xl border border-error-200 bg-error-50/60 p-3 text-sm text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-200">
                <p className="font-semibold">Último error reportado</p>
                <p className="mt-1">{connection.last_error}</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

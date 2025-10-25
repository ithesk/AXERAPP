import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  WhatsappSettings,
  WhatsappSettingsInsert,
  WhatsappSettingsUpdate,
  WhatsappSettingsUpsertInput,
  WhatsappSettingsResponse,
} from "@/types/whatsapp";
import type { Tables } from "@/types/supabase";

type SupabaseServerClient = ReturnType<typeof createClient>;

type OrgContextResult =
  | { orgId: string }
  | { response: NextResponse<{ error: string }> };

const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

async function resolveOrgContext(
  supabase: SupabaseServerClient,
  request: NextRequest,
  explicitOrgId?: string | null
): Promise<OrgContextResult> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { response: jsonError("No autenticado", 401) };
  }

  const queryOrgId = request.nextUrl.searchParams.get("org_id");
  let orgId = explicitOrgId ?? queryOrgId;

  if (!orgId) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("current_org_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      if (profileError.code !== "PGRST116") {
        console.error("[whatsapp-settings] Error obteniendo perfil:", profileError);
        return {
          response: jsonError(
            "No se pudo determinar la organización actual",
            500
          ),
        };
      }

      return { response: jsonError("org_id is required", 400) };
    }

    orgId = profile?.current_org_id ?? null;
  }

  if (!orgId) {
    return { response: jsonError("org_id is required", 400) };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("org_members")
    .select("status")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .single();

  if (membershipError) {
    if (membershipError.code === "PGRST116") {
      return { response: jsonError("No tienes acceso a esta organización", 403) };
    }

    console.error(
      "[whatsapp-settings] Error validando membresía:",
      membershipError
    );
    return { response: jsonError("Error al validar la organización", 500) };
  }

  const memberStatus = (membership as Tables<"org_members">).status;
  if (memberStatus !== "active") {
    return { response: jsonError("Tu membresía no está activa", 403) };
  }

  return { orgId };
}

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const context = await resolveOrgContext(supabase, request);

  if ("response" in context) {
    return context.response;
  }

  const { orgId } = context;

  const { data, error } = await supabase
    .from("whatsapp_settings")
    .select("*")
    .eq("org_id", orgId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json<WhatsappSettingsResponse>({ settings: null });
    }

    console.error(
      "[whatsapp-settings] Error obteniendo configuración:",
      error
    );
    return jsonError("Error al obtener configuración", 500);
  }

  return NextResponse.json<WhatsappSettingsResponse>({
    settings: data as WhatsappSettings,
  });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();

  let payload: WhatsappSettingsUpsertInput;
  try {
    payload = (await request.json()) as WhatsappSettingsUpsertInput;
  } catch (error) {
    console.error("[whatsapp-settings] Error parseando JSON:", error);
    return jsonError("JSON inválido", 400);
  }

  const context = await resolveOrgContext(
    supabase,
    request,
    payload.org_id ?? null
  );

  if ("response" in context) {
    return context.response;
  }

  const { orgId } = context;

  const apiUrl =
    typeof payload.api_url === "string" ? payload.api_url.trim() : "";
  if (!apiUrl) {
    return jsonError("api_url is required", 400);
  }

  const enabled = (() => {
    if (typeof payload.enabled === "boolean") return payload.enabled;
    if (typeof payload.enabled === "string")
      return payload.enabled.toLowerCase() === "true";
    if (typeof payload.enabled === "number") return payload.enabled !== 0;
    return Boolean(payload.enabled);
  })();

  const timestamp = new Date().toISOString();

  const { data: existing, error: existingError } = await supabase
    .from("whatsapp_settings")
    .select("id")
    .eq("org_id", orgId)
    .single();

  if (existingError && existingError.code !== "PGRST116") {
    console.error(
      "[whatsapp-settings] Error verificando configuración existente:",
      existingError
    );
    return jsonError("Error al guardar configuración", 500);
  }

  let settings: WhatsappSettings | null = null;

  if (existing && (existing as { id?: string }).id) {
    const updatePayload: WhatsappSettingsUpdate = {
      api_url: apiUrl,
      enabled,
      updated_at: timestamp,
    };

    const { data, error } = await supabase
      .from("whatsapp_settings")
      .update(updatePayload)
      .eq("org_id", orgId)
      .select("*")
      .single();

    if (error) {
      console.error(
        "[whatsapp-settings] Error actualizando configuración:",
        error
      );
      return jsonError("Error al guardar configuración", 500);
    }

    settings = data as WhatsappSettings;
  } else {
    const insertPayload: WhatsappSettingsInsert = {
      org_id: orgId,
      api_url: apiUrl,
      enabled,
      created_at: timestamp,
      updated_at: timestamp,
    };

    const { data, error } = await supabase
      .from("whatsapp_settings")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      console.error(
        "[whatsapp-settings] Error creando configuración:",
        error
      );
      return jsonError("Error al guardar configuración", 500);
    }

    settings = data as WhatsappSettings;
  }

  return NextResponse.json<WhatsappSettingsResponse>({ settings });
}

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const org_id = searchParams.get("org_id");

    if (!org_id) {
      return NextResponse.json(
        { error: "org_id is required" },
        { status: 400 }
      );
    }

    // Obtener configuración de WhatsApp para la organización
    const { data, error } = await supabase
      .from("whatsapp_settings")
      .select("*")
      .eq("org_id", org_id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error al obtener configuración:", error);
      return NextResponse.json(
        { error: "Error al obtener configuración" },
        { status: 500 }
      );
    }

    return NextResponse.json({ settings: data });
  } catch (error) {
    console.error("Error en GET /api/whatsapp-settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { org_id, api_url, enabled } = body;

    if (!org_id) {
      return NextResponse.json(
        { error: "org_id is required" },
        { status: 400 }
      );
    }

    if (!api_url) {
      return NextResponse.json(
        { error: "api_url is required" },
        { status: 400 }
      );
    }

    // Verificar si ya existe configuración para esta organización
    const { data: existing } = await supabase
      .from("whatsapp_settings")
      .select("id")
      .eq("org_id", org_id)
      .single();

    let result;

    if (existing) {
      // Actualizar configuración existente
      result = await supabase
        .from("whatsapp_settings")
        .update({
          api_url,
          enabled,
          updated_at: new Date().toISOString(),
        })
        .eq("org_id", org_id)
        .select()
        .single();
    } else {
      // Crear nueva configuración
      result = await supabase
        .from("whatsapp_settings")
        .insert({
          org_id,
          api_url,
          enabled,
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error("Error al guardar configuración:", result.error);
      return NextResponse.json(
        { error: "Error al guardar configuración", message: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ settings: result.data });
  } catch (error) {
    console.error("Error en POST /api/whatsapp-settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/budgets/[budgetId] - Obtener presupuesto completo con items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ budgetId: string }> }
) {
  try {
    const supabase = await createClient();
    const { budgetId } = await params;
    const orgId = request.nextUrl.searchParams.get("org_id");

    if (!budgetId) {
      return NextResponse.json(
        { error: "budgetId is required" },
        { status: 400 }
      );
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "org_id is required" },
        { status: 400 }
      );
    }

    // Obtener presupuesto
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .select("*")
      .eq("id", budgetId)
      .eq("org_id", orgId)
      .single();

    if (budgetError) {
      console.error("Error al obtener presupuesto:", budgetError);
      return NextResponse.json(
        { error: "Presupuesto no encontrado" },
        { status: 404 }
      );
    }

    // Obtener items del presupuesto
    const { data: items, error: itemsError } = await supabase
      .from("budget_items")
      .select(
        `
          *,
          product:products(*),
          budget:budgets!inner(id, org_id)
        `
      )
      .eq("budget_id", budgetId)
      .eq("budget.org_id", orgId)
      .order("display_order", { ascending: true });

    if (itemsError) {
      console.error("Error al obtener items:", itemsError);
      return NextResponse.json(
        { error: "Error al obtener items del presupuesto" },
        { status: 500 }
      );
    }

    const sanitizedItems = (items ?? []).map((item) => {
      const { budget, ...rest } = item as Record<string, unknown>;
      void budget;
      return rest;
    });

    return NextResponse.json({
      budget: {
        ...budget,
        items: sanitizedItems,
      },
    });
  } catch (error) {
    console.error("Error en GET /api/budgets/[budgetId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/budgets/[budgetId] - Eliminar presupuesto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ budgetId: string }> }
) {
  try {
    const supabase = await createClient();
    const { budgetId } = await params;
    const orgId = request.nextUrl.searchParams.get("org_id");

    if (!budgetId) {
      return NextResponse.json(
        { error: "budgetId is required" },
        { status: 400 }
      );
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "org_id is required" },
        { status: 400 }
      );
    }

    const { error: ownershipError } = await supabase
      .from("budgets")
      .select("id")
      .eq("id", budgetId)
      .eq("org_id", orgId)
      .single();

    if (ownershipError) {
      if (ownershipError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Presupuesto no encontrado" },
          { status: 404 }
        );
      }

      console.error("Error al validar presupuesto antes de eliminar:", ownershipError);
      return NextResponse.json(
        { error: "Error al eliminar presupuesto" },
        { status: 500 }
      );
    }

    // Eliminar presupuesto (items se eliminan por CASCADE)
    const { error: deleteError } = await supabase
      .from("budgets")
      .delete()
      .eq("id", budgetId)
      .eq("org_id", orgId);

    if (deleteError) {
      console.error("Error al eliminar presupuesto:", deleteError);
      return NextResponse.json(
        { error: "Error al eliminar presupuesto" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE /api/budgets/[budgetId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

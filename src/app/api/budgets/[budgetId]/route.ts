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

    if (!budgetId) {
      return NextResponse.json(
        { error: "budgetId is required" },
        { status: 400 }
      );
    }

    // Obtener presupuesto
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .select("*")
      .eq("id", budgetId)
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
      .select("*")
      .eq("budget_id", budgetId)
      .order("display_order", { ascending: true });

    if (itemsError) {
      console.error("Error al obtener items:", itemsError);
      return NextResponse.json(
        { error: "Error al obtener items del presupuesto" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      budget: {
        ...budget,
        items: items || [],
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

    if (!budgetId) {
      return NextResponse.json(
        { error: "budgetId is required" },
        { status: 400 }
      );
    }

    // Eliminar presupuesto (items se eliminan por CASCADE)
    const { error: deleteError } = await supabase
      .from("budgets")
      .delete()
      .eq("id", budgetId);

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

import { NextResponse } from "next/server";
import { getDb } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    
    // Hard delete as per prompt requirement
    db.prepare("DELETE FROM expenses WHERE id = ?").run(id);
    
    return NextResponse.json({ success: true, message: "Expense deleted" });
  } catch (error: any) {
    console.error("Expense DELETE error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete expense" }, { status: 500 });
  }
}

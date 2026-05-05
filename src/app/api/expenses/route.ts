export const dynamic = "force-dynamic";
import { NextResponse, NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    let filter = "WHERE 1=1";
    let params: string[] = [];

    if (from && to) {
      filter += " AND created_at >= ? AND created_at <= ?";
      params = [from, to];
    }

    const expenses = db.prepare(`
      SELECT * FROM expenses 
      ${filter} 
      ORDER BY created_at DESC
    `).all(...params);

    return NextResponse.json({ success: true, data: expenses });
  } catch (error: any) {
    console.error("Expenses GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    
    if (!body.title || !body.amount) {
      return NextResponse.json({ success: false, error: "Title and amount are required" }, { status: 400 });
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO expenses (id, title, amount, category, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.title,
      Number(body.amount),
      body.category || "general",
      body.notes || "",
      now
    );

    const expense = db.prepare("SELECT * FROM expenses WHERE id = ?").get(id);
    return NextResponse.json({ success: true, data: expense });
  } catch (error: any) {
    console.error("Expenses POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to create expense" }, { status: 500 });
  }
}

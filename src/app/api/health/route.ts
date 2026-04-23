import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/infrastructure/database/client";

export async function GET() {
  try {
    const { error } = await supabaseAdmin
      .from("organizations")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    return NextResponse.json({
      status: "ok",
      db: "ok",
      ts: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", db: "down", error: String(error) },
      { status: 503 }
    );
  }
}

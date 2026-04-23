import { NextResponse } from "next/server";
import { pool } from "@/infrastructure/database/client";

export async function GET() {
  try {
    const result = await pool.query("SELECT 1 as ok");
    return NextResponse.json({
      status: "ok",
      db: result.rows[0]?.ok === 1 ? "ok" : "degraded",
      ts: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", db: "down", error: String(error) },
      { status: 503 }
    );
  }
}

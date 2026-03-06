import { NextResponse } from "next/server";
import { memoryService } from "@/lib/memoryService";

export async function GET() {
  try {
    const prefs = await memoryService.getAllPreferences();
    return NextResponse.json({ success: true, preferences: prefs });
  } catch (err: any) {
    const message = err?.message || "Erro desconhecido";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

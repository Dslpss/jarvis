import { NextResponse } from "next/server";
import { memoryService } from "@/lib/memoryService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, value, metadata } = body || {};
    if (!key)
      return NextResponse.json(
        { success: false, error: "Missing key" },
        { status: 400 },
      );

    const saved = await memoryService.saveKeyValue(
      key,
      value,
      metadata || { role: "user", timestamp: new Date().toISOString() },
    );
    if (!saved)
      return NextResponse.json(
        { success: false, error: "Failed to save" },
        { status: 500 },
      );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    const message = err?.message || "Erro desconhecido";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get("key");
    if (!key)
      return NextResponse.json(
        { success: false, error: "Missing key" },
        { status: 400 },
      );

    const value = await memoryService.getKeyValue(key);
    return NextResponse.json({ success: true, key, value });
  } catch (err: any) {
    const message = err?.message || "Erro desconhecido";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get("key");
    if (!key)
      return NextResponse.json(
        { success: false, error: "Missing key" },
        { status: 400 },
      );

    const deleted = await memoryService.deleteKeyValue(key);
    if (!deleted)
      return NextResponse.json(
        { success: false, error: "Failed to delete" },
        { status: 500 },
      );

    return NextResponse.json({ success: true, key });
  } catch (err: any) {
    const message = err?.message || "Erro desconhecido";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { briefingService } from "@/lib/briefingService";

export async function GET() {
  try {
    const data = await briefingService.getBriefing();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

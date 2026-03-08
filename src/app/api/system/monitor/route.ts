import { NextResponse } from "next/server";
import { fileMonitorService } from "@/lib/fileMonitorService";

export async function GET() {
  try {
    const changes = fileMonitorService.checkChanges();
    return NextResponse.json({ success: true, changes });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

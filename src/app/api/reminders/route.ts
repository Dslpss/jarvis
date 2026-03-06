import { NextResponse } from "next/server";
import { reminderService } from "@/lib/reminderService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content, remind_at } = body || {};

    if (!content || !remind_at) {
      return NextResponse.json(
        { success: false, error: "Missing content or remind_at" },
        { status: 400 },
      );
    }

    const reminder = await reminderService.create(content, remind_at);
    if (!reminder) {
      return NextResponse.json(
        { success: false, error: "Failed to create reminder" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, reminder });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type"); // "due" or "upcoming"

    if (type === "due") {
      const reminders = await reminderService.getDue();

      // Mark them as notified
      for (const r of reminders) {
        if (r.id) await reminderService.markNotified(r.id);
      }

      return NextResponse.json({ success: true, reminders });
    }

    const reminders = await reminderService.getUpcoming();
    return NextResponse.json({ success: true, reminders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing id" },
        { status: 400 },
      );
    }

    const deleted = await reminderService.delete(Number(id));
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Failed to delete" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

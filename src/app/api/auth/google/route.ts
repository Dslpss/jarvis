import { NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || "").split(",").map(e => e.trim().toLowerCase());

export async function POST(req: Request) {
  try {
    const { email, idToken } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
      return NextResponse.json({ success: false, error: "Access denied. User not authorized." }, { status: 403 });
    }

    // In a production app, you should verify the idToken using firebase-admin
    // For this POC, we'll trust the client after email validation against the whitelist.
    
    const token = createSessionToken();
    await setSessionCookie(token);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

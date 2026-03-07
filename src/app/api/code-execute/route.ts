import { NextResponse } from "next/server";
import { executeCode } from "@/lib/codeExecutor";

export const runtime = "nodejs";
export const maxDuration = 15;

const ALLOWED_LANGUAGES = ["javascript", "js", "python", "py"];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { language, code } = body || {};

    if (!language || !code) {
      return NextResponse.json(
        { success: false, error: "Missing 'language' and 'code' fields" },
        { status: 400 },
      );
    }

    const lang = String(language).toLowerCase().trim();
    if (!ALLOWED_LANGUAGES.includes(lang)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported language: "${language}". Supported: javascript, python`,
        },
        { status: 400 },
      );
    }

    if (String(code).length > 50_000) {
      return NextResponse.json(
        { success: false, error: "Code too long (max 50KB)" },
        { status: 400 },
      );
    }

    const result = await executeCode(lang, String(code));

    return NextResponse.json({
      success: result.success,
      output: result.output,
      error: result.error,
      executionTimeMs: result.executionTimeMs,
      language: result.language,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

import {
  MODELS,
  JARVIS_SYSTEM_INSTRUCTION,
  DEFAULT_VOICE,
  VOICES,
} from "@/lib/constants";
import { Type, type Tool } from "@google/genai";

const VOICE_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "save_preference",
        description:
          "Saves a user preference or any information the user asks to remember. Use this whenever the user says to save, remember, store, or memorize something.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            key: {
              type: Type.STRING,
              description:
                "A short identifier for the preference, e.g. 'favorite_color', 'name', 'birthday'",
            },
            value: {
              type: Type.STRING,
              description: "The value to save",
            },
          },
          required: ["key", "value"],
        },
      },
      {
        name: "get_preference",
        description:
          "Retrieves a previously saved preference or piece of information. Use this when the user asks about something they previously asked to remember.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            key: {
              type: Type.STRING,
              description:
                "The identifier of the preference to retrieve, e.g. 'favorite_color', 'name'",
            },
          },
          required: ["key"],
        },
      },
      {
        name: "delete_preference",
        description:
          "Deletes/forgets a previously saved preference. Use this when the user asks to forget, remove, or delete a saved piece of information.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            key: {
              type: Type.STRING,
              description:
                "The identifier of the preference to delete, e.g. 'favorite_color', 'name'",
            },
          },
          required: ["key"],
        },
      },
      {
        name: "create_reminder",
        description:
          "Creates a scheduled reminder. Use this when the user asks to be reminded of something at a specific date/time. Convert the user's requested time to an ISO 8601 timestamp.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            content: {
              type: Type.STRING,
              description: "What to remind the user about",
            },
            remind_at: {
              type: Type.STRING,
              description:
                "ISO 8601 timestamp with BRT offset for when to trigger the reminder, e.g. '2026-03-07T14:00:00-03:00'",
            },
          },
          required: ["content", "remind_at"],
        },
      },
      {
        name: "list_reminders",
        description:
          "Lists upcoming reminders. Use this when the user asks what reminders they have scheduled.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: "execute_code",
        description:
          "Execute a code snippet in a sandboxed environment and return the output. Use this when the user asks you to run, execute, test, or evaluate code. Supports JavaScript and Python.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            language: {
              type: Type.STRING,
              description: "The programming language: 'javascript' or 'python'",
            },
            code: {
              type: Type.STRING,
              description:
                "The code to execute. Use console.log() for JS output or print() for Python output.",
            },
          },
          required: ["language", "code"],
        },
      },
      {
        name: "show_code",
        description:
          "ALWAYS use this tool to display code visually on the user's screen. You MUST call this function whenever you want to show, present, demonstrate, or teach any code example. Never just say code verbally — always use this tool so the user can see it on screen. Supports all programming languages.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            language: {
              type: Type.STRING,
              description:
                "The programming language (e.g. 'python', 'javascript', 'typescript', 'java', 'go', etc.)",
            },
            code: {
              type: Type.STRING,
              description: "The complete code snippet to display on screen",
            },
            title: {
              type: Type.STRING,
              description:
                "Optional short title for the code card (e.g. 'QuickSort', 'Fibonacci', 'API Request')",
            },
          },
          required: ["language", "code"],
        },
      },
      {
        name: "clear_display",
        description:
          "Clears the current chat display, code cards, and visual logs when requested by the user.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            reason: {
              type: Type.STRING,
              description: "Optional reason for clearing",
            },
          },
        },
      },
    ],
  },
];

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const voiceId = body.voice as string | undefined;
    const prefsContext = (body.prefsContext as string) || "";

    // Validate voice name, fallback to default
    const validVoiceIds: readonly string[] = VOICES.map((v) => v.id);
    const voiceName =
      voiceId && validVoiceIds.includes(voiceId) ? voiceId : DEFAULT_VOICE;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 },
      );
    }

    // Inject current date/time in BRT so the model knows "now"
    const now = new Date();
    const brtNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const dateStr = brtNow.toISOString().replace("Z", "-03:00");
    const timeContext = `\n\nCURRENT DATE/TIME (Brasília): ${dateStr}`;

    // Build setup config for the client to send via WebSocket
    const setupConfig = {
      model: `models/${MODELS.LIVE_AUDIO}`,
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName,
            },
          },
        },
      },
      systemInstruction: {
        parts: [
          { text: JARVIS_SYSTEM_INSTRUCTION + timeContext + prefsContext },
        ],
      },
      tools: VOICE_TOOLS.map((t) => ({
        functionDeclarations: t.functionDeclarations?.map((fd) => {
          return {
            name: fd.name,
            description: fd.description,
            parameters: fd.parameters,
          };
        }),
      })),
    };

    return Response.json({
      apiKey,
      setupConfig,
    });
  } catch (error: unknown) {
    console.error("Voice token creation error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create token";
    return Response.json({ error: message }, { status: 500 });
  }
}

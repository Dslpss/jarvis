import { getGeminiClient } from "@/lib/gemini-server";
import {
  MODELS,
  JARVIS_SYSTEM_INSTRUCTION,
  DEFAULT_VOICE,
  VOICES,
} from "@/lib/constants";
import { Modality, Type, type Tool } from "@google/genai";

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

    const ai = getGeminiClient();
    const now = new Date();
    const expireTime = new Date(now.getTime() + 30 * 60 * 1000);
    const newSessionExpireTime = new Date(now.getTime() + 2 * 60 * 1000);

    // Inject current date/time in BRT so the model knows "now"
    const brtNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const dateStr = brtNow.toISOString().replace("Z", "-03:00");
    const timeContext = `\n\nCURRENT DATE/TIME (Brasília): ${dateStr}`;

    const token = await ai.authTokens.create({
      config: {
        httpOptions: { apiVersion: "v1alpha" },
        uses: 1,
        expireTime: expireTime.toISOString(),
        newSessionExpireTime: newSessionExpireTime.toISOString(),
        liveConnectConstraints: {
          model: MODELS.LIVE_AUDIO,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction:
              JARVIS_SYSTEM_INSTRUCTION + timeContext + prefsContext,
            tools: VOICE_TOOLS,
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName,
                },
              },
            },
          },
        },
      },
    });

    return Response.json({
      token: token.name,
      expiresAt: expireTime.toISOString(),
    });
  } catch (error: unknown) {
    console.error("Voice token creation error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create token";
    return Response.json({ error: message }, { status: 500 });
  }
}

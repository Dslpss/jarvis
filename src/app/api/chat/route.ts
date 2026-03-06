import { getGeminiClient } from "@/lib/gemini-server";
import { MODELS, JARVIS_SYSTEM_INSTRUCTION } from "@/lib/constants";
import { memoryService } from "@/lib/memoryService";

async function buildPrefsContext(): Promise<string> {
  try {
    const prefs = await memoryService.getAllPreferences();
    if (prefs.length === 0) return "";
    const lines = prefs.map((p) => `- ${p.key}: ${p.value}`);
    return `\n\n[SAVED USER PREFERENCES]\n${lines.join("\n")}\n[END PREFERENCES]`;
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body as {
      messages: Array<{
        role: "user" | "model";
        parts: Array<{ text: string }>;
      }>;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Messages are required" }, { status: 400 });
    }

    const ai = getGeminiClient();
    const history = messages.slice(0, -1);
    const lastMessage = messages[messages.length - 1];
    const userText = lastMessage.parts[0].text;

    // Detectar intenções simples de salvar preferências (ex: "salva minha cor favorita #00ff88")
    let preferenceSavedNote = "";
    try {
      const saveIntent =
        /(?:salv(?:a|ar|e)|guardar|guarda|save)/i.test(userText) &&
        /cor favorita|favorite color/i.test(userText);
      if (saveIntent) {
        const hexMatch = userText.match(/#([0-9a-fA-F]{3,6})/);
        const wordMatch = userText.match(
          /\b(vermelho|azul|verde|amarelo|preto|branco|rosa|roxo|cinza|cinzato|marrom|laranja|purple|pink|red|blue|green|black|white|yellow)\b/i,
        );
        const value = hexMatch
          ? `#${hexMatch[1]}`
          : wordMatch
            ? wordMatch[0]
            : null;
        if (value) {
          await memoryService.saveKeyValue("favorite_color", value, {
            role: "user",
            timestamp: new Date().toISOString(),
          });
          preferenceSavedNote = `\n\n[LOCAL PREF SAVED] favorite_color=${value}`;
          console.log("[LTM] preference saved from chat intent:", value);
        }
      }
    } catch (err) {
      console.error("Error detecting/saving preference intent:", err);
    }

    // 1. Buscar memórias relevantes
    const similarMemories = await memoryService.searchSimilarMemories(userText);
    const memoryContext =
      similarMemories.length > 0
        ? `\n\n[PAST CONTEXT FROM MEMORY]\n${similarMemories.map((m: any) => `- ${m.content}`).join("\n")}\n[END OF CONTEXT]`
        : "";

    // 2. Criar instrução de sistema aumentada (com preferências + memórias semânticas)
    const prefsContext = await buildPrefsContext();
    const augmentedSystemInstruction =
      JARVIS_SYSTEM_INSTRUCTION +
      prefsContext +
      memoryContext +
      preferenceSavedNote;

    const chat = ai.chats.create({
      model: MODELS.TEXT,
      history,
      config: {
        systemInstruction: augmentedSystemInstruction,
      },
    });

    const response = await chat.sendMessageStream({
      message: userText,
    });

    let fullAssistantResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            if (chunk.text) {
              fullAssistantResponse += chunk.text;
              controller.enqueue(new TextEncoder().encode(chunk.text));
            }
          }

          // 3. Salvar a interação na memória após o fim do stream (Fire and forget ou await)
          // Salvamos o usuário e o assistente separadamente para buscas futuras mais precisas
          await Promise.all([
            memoryService.saveMemory(userText, {
              role: "user",
              timestamp: new Date().toISOString(),
            }),
            memoryService.saveMemory(fullAssistantResponse, {
              role: "assistant",
              timestamp: new Date().toISOString(),
            }),
          ]);

          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("rate") ? 429 : 500;
    return Response.json({ error: message }, { status });
  }
}

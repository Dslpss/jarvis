import { getGeminiClient } from "@/lib/gemini-server";
import { Type, type Tool } from "@google/genai";
import { MODELS, JARVIS_SYSTEM_INSTRUCTION } from "@/lib/constants";
import { memoryService } from "@/lib/memoryService";
import { executeCode } from "@/lib/codeExecutor";
import { searchWeb } from "@/lib/providers/search";

export const runtime = "nodejs";

const memoryTools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "save_preference",
        description:
          "Save user preference, fact, or any information the user explicitly asks to remember in long-term memory. Use whenever the user says 'remember', 'save', 'store', 'anota', 'salva', 'guarda', 'lembra', etc.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            key: {
              type: Type.STRING,
              description:
                "Short descriptive snake_case identifier (e.g. 'favorite_color', 'user_name', 'birthday')",
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
          "Retrieve a previously saved user preference or piece of information by its key.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            key: {
              type: Type.STRING,
              description: "The key name of the preference to retrieve",
            },
          },
          required: ["key"],
        },
      },
      {
        name: "delete_preference",
        description:
          "Delete/forget a previously saved user preference or piece of information.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            key: {
              type: Type.STRING,
              description: "The key name of the preference to delete",
            },
          },
          required: ["key"],
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
        name: "web_search",
        description:
          "Perform a search on the internet for real-time information, news, or general knowledge that is not in your training data.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: "The search query to perform",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_system_context",
        description:
          "Get current system information like time, date, and general context to answer time-sensitive questions.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
    ],
  },
];

async function buildPrefsContext(): Promise<string> {
  try {
    const prefs = await memoryService.getAllPreferences();
    if (prefs.length === 0) return "";
    const lines = prefs.map((p) => `- ${p.key}: ${p.value}`);
    return `\n\n[SAVED USER PREFERENCES]\n${lines.join("\n")}\n[END PREFERENCES]`;
  } catch (error: unknown) {
    console.error("[PREFS] Error building context:", error);
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

    // 1. Buscar memórias relevantes
    const similarMemories = await memoryService.searchSimilarMemories(userText);
    const memoryContext =
      similarMemories.length > 0
        ? `\n\n[PAST CONTEXT FROM MEMORY]\n${similarMemories.map((m: { content: string }) => `- ${m.content}`).join("\n")}\n[END OF CONTEXT]`
        : "";

    // 2. Criar instrução de sistema aumentada (com preferências + memórias semânticas)
    const prefsContext = await buildPrefsContext();
    const augmentedSystemInstruction =
      JARVIS_SYSTEM_INSTRUCTION + prefsContext + memoryContext;

    const chat = ai.chats.create({
      model: MODELS.TEXT,
      history,
      config: {
        systemInstruction: augmentedSystemInstruction,
        tools: memoryTools,
      },
    });

    let fullAssistantResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        async function processStream(streamIter: AsyncIterable<any>) {
          let text = "";
          const functionCalls: Array<{ name: string; args: any }> = [];
          for await (const chunk of streamIter) {
            if (chunk.text) {
              text += chunk.text;
              controller.enqueue(encoder.encode(chunk.text));
            }
            if (chunk.functionCalls?.length) {
              functionCalls.push(...chunk.functionCalls);
            }
          }
          return { text, functionCalls };
        }

        async function executeFunctionCall(fc: {
          name: string;
          args: Record<string, any>;
        }): Promise<any> {
          const args = fc.args;
          switch (fc.name) {
            case "save_preference": {
              const saved = await memoryService.saveKeyValue(
                String(args.key),
                args.value,
                {
                  role: "user",
                  timestamp: new Date().toISOString(),
                },
              );
              console.log(
                `[LTM] Function call save_preference: key=${args.key}, value=${args.value}, success=${saved}`,
              );
              return {
                success: saved,
                message: saved
                  ? `Preference '${args.key}' saved successfully`
                  : "Failed to save preference",
              };
            }
            case "get_preference": {
              const kv = await memoryService.getKeyValue(String(args.key));
              console.log(
                `[LTM] Function call get_preference: key=${args.key}, found=${!!kv}`,
              );
              return kv
                ? { found: true, key: String(args.key), value: kv.content }
                : { found: false, key: String(args.key) };
            }
            case "delete_preference": {
              const deleted = await memoryService.deleteKeyValue(String(args.key));
              console.log(
                `[LTM] Function call delete_preference: key=${args.key}, success=${deleted}`,
              );
              return { success: deleted };
            }
            case "execute_code": {
              console.log(
                `[CODE] Function call execute_code: language=${args.language}, code_length=${(args.code as string)?.length}`,
              );
              try {
                const result = await executeCode(String(args.language), String(args.code));
                console.log(
                  `[CODE] Execution result: success=${result.success}, output_length=${result.output?.length}, time=${result.executionTimeMs}ms`,
                );
                return {
                  success: result.success,
                  output: result.output,
                  error: result.error,
                  executionTimeMs: result.executionTimeMs,
                  language: result.language,
                };
              } catch (execErr) {
                console.error("[CODE] Execute code error:", execErr);
                return {
                  success: false,
                  output: "",
                  error:
                    execErr instanceof Error
                      ? execErr.message
                      : String(execErr),
                  executionTimeMs: 0,
                  language: args.language,
                };
              }
            }
            case "web_search": {
              console.log(`[SEARCH] Function call web_search: query=${args.query}`);
              const query = typeof args.query === 'string' ? args.query : String(args.query);
              const searchResult = await searchWeb(query);
              return searchResult as unknown as Record<string, unknown>;
            }
            case "get_system_context": {
              const now = new Date();
              return {
                currentTime: now.toLocaleTimeString("pt-BR"),
                currentDate: now.toLocaleDateString("pt-BR"),
                dayOfWeek: now.toLocaleDateString("pt-BR", { weekday: "long" }),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              };
            }
            default:
              return { error: `Unknown function: ${fc.name}` };
          }
        }

        try {
          let result = await processStream(
            await chat.sendMessageStream({ message: userText }),
          );
          fullAssistantResponse += result.text;

          // Loop para lidar com function calls (pode haver múltiplas rodadas)
          let iterations = 0;
          while (result.functionCalls.length > 0 && iterations++ < 5) {
            const functionResponses = [];
            for (const fc of result.functionCalls) {
              const output = await executeFunctionCall(fc);
              functionResponses.push({
                functionResponse: { name: fc.name, response: output },
              });
            }

            // Enviar resultados das funções de volta ao modelo
            result = await processStream(
              await chat.sendMessageStream({
                message: functionResponses,
              }),
            );
            fullAssistantResponse += result.text;
          }

          // Salvar a interação na memória (fire-and-forget com log de erro)
          Promise.all([
            memoryService.saveMemory(userText, {
              role: "user",
              timestamp: new Date().toISOString(),
            }),
            memoryService.saveMemory(fullAssistantResponse, {
              role: "assistant",
              timestamp: new Date().toISOString(),
            }),
          ]).catch((err: unknown) =>
            console.error("[LTM] Erro ao salvar conversa na memória:", err),
          );

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

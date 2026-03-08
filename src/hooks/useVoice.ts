"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useAudioCapture } from "./useAudioCapture";
import { useAudioPlayback } from "./useAudioPlayback";
import { useWaveformAnalyzer } from "./useWaveformAnalyzer";
import { AUDIO } from "@/lib/constants";
import { useAppStore } from "@/stores/appStore";
import type { VoiceStatus } from "@/types/voice";
import type { VoiceCodeCard } from "@/components/voice/CodeExecutionCard";

const WS_BASE = "wss://generativelanguage.googleapis.com";

/**
 * Executa uma function call do Gemini Live e retorna o resultado.
 */
async function executeFunctionCall(
  name: string,
  args: Record<string, string>,
  onCodeCard?: (card: VoiceCodeCard) => void,
): Promise<Record<string, unknown>> {
  try {
    if (name === "save_preference") {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: args.key, value: args.value }),
      });
      const data = await res.json();
      return data.success
        ? { success: true, message: `Saved ${args.key} = ${args.value}` }
        : { success: false, error: data.error || "Failed to save" };
    }

    if (name === "get_preference") {
      const res = await fetch(
        `/api/settings?key=${encodeURIComponent(args.key)}`,
      );
      const data = await res.json();
      if (data.success && data.value) {
        return { found: true, key: args.key, value: data.value.content };
      }
      return { found: false, key: args.key };
    }

    if (name === "delete_preference") {
      const res = await fetch(
        `/api/settings?key=${encodeURIComponent(args.key)}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      return data.success
        ? { success: true, message: `Deleted ${args.key}` }
        : { success: false, error: data.error || "Failed to delete" };
    }

    if (name === "create_reminder") {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: args.content,
          remind_at: args.remind_at,
        }),
      });
      const data = await res.json();
      return data.success
        ? {
            success: true,
            message: `Reminder set for ${args.remind_at}: ${args.content}`,
          }
        : { success: false, error: data.error || "Failed to create reminder" };
    }

    if (name === "list_reminders") {
      const res = await fetch("/api/reminders?type=upcoming");
      const data = await res.json();
      if (data.success && data.reminders?.length > 0) {
        const list = data.reminders.map(
          (r: any) =>
            `- ${r.content} (${new Date(r.remind_at).toLocaleString()})`,
        );
        return { found: true, reminders: list };
      }
      return { found: false, message: "No upcoming reminders" };
    }

    if (name === "execute_code") {
      const res = await fetch("/api/code-execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: args.language, code: args.code }),
      });
      const data = await res.json();

      if (onCodeCard) {
        onCodeCard({
          id: crypto.randomUUID(),
          mode: "execution",
          language: data.language || args.language,
          code: args.code,
          output: data.output || "",
          error: data.error,
          success: data.success,
          executionTimeMs: data.executionTimeMs || 0,
          timestamp: Date.now(),
        });
      }

      return {
        success: data.success,
        output: data.output || "",
        error: data.error,
        executionTimeMs: data.executionTimeMs,
        language: data.language,
      };
    }

    if (name === "show_code") {
      if (onCodeCard) {
        onCodeCard({
          id: crypto.randomUUID(),
          mode: "display",
          language: args.language || "code",
          code: args.code,
          title: args.title,
          timestamp: Date.now(),
        });
      }
      return {
        success: true,
        message: "Code displayed on screen for the user",
      };
    }

    if (name === "clear_display" || name === "ui_clear") {
      // In voice mode, we need a way to clear the local state
      // We'll return a special flag that the caller can use
      return {
        success: true,
        action: "clear_all",
        message: "[CLEAR_SCREEN]", // This tag will trigger the manual cleanup if needed
      };
    }

    if (name === "ui_show") {
      if (onCodeCard) {
        onCodeCard({
          id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          mode: "display",
          language: args.lang || "code",
          code: args.code || "",
          title: args.title || "",
          timestamp: Date.now(),
        });
      }
      return { success: true, message: "Display updated" };
    }

    return { error: `Unknown function: ${name}` };
  } catch (err) {
    console.error("[Voice] executeFunctionCall error:", err);
    return { error: String(err) };
  }
}

export function useVoice() {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [codeCards, setCodeCards] = useState<VoiceCodeCard[]>([]);
  const setupRef = useRef<boolean>(false);
  const transcriptBufferRef = useRef<string>("");
  const processedActionsRef = useRef<Set<string>>(new Set());
  const mutedRef = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);
  const msgQueueRef = useRef<Promise<void>>(Promise.resolve());
  const capture = useAudioCapture();
  const playback = useAudioPlayback();
  const waveform = useWaveformAnalyzer();
  const selectedVoice = useAppStore((s) => s.selectedVoice);

  const dismissCodeCard = useCallback((id: string) => {
    setCodeCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleHybridAction = useCallback(async (text: string) => {
    // Ultra-simple Regex for <<<TYPE::ARGS>>>
    const regex = /<<<([\s\S]*?)>>>/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0];
      if (processedActionsRef.current.has(fullMatch)) continue;
      processedActionsRef.current.add(fullMatch);

      const content = match[1];
      const parts = content.split("::");
      const type = parts[0].trim();

      console.log(`[Voice] Hybrid Action: ${type}`, parts);

      if (type === "CLEAR") {
        window.dispatchEvent(new CustomEvent("jarvis-clear"));
      } else if (type === "SHOW_CODE") {
        const lang = (parts[1] || "code").trim();
        const title = (parts[2] || "").trim();
        const code = parts.slice(3).join("::").trim();
        
        if (code) {
          setCodeCards((prev) => [
            {
              id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              mode: "display",
              language: lang,
              code: code,
              title: title,
              timestamp: Date.now(),
            },
            ...prev,
          ]);
        }
      }
    }
  }, []);

  const clearVoiceContent = useCallback(() => {
    setCodeCards([]);
    transcriptBufferRef.current = "";
    processedActionsRef.current.clear();
  }, []);

  // Listen for global clear signal
  useEffect(() => {
    const handler = () => clearVoiceContent();
    if (typeof window !== "undefined") {
      window.addEventListener("jarvis-clear", handler);
      return () => window.removeEventListener("jarvis-clear", handler);
    }
  }, [clearVoiceContent]);

  const startSession = useCallback(async () => {
    try {
      setStatus("connecting");
      setErrorMessage(null);

      // Load saved preferences to inject into system instruction
      let prefsContext = "";
      try {
        const prefsRes = await fetch("/api/preferences");
        const prefsData = await prefsRes.json();
        if (prefsData.success && prefsData.preferences?.length > 0) {
          const lines = prefsData.preferences.map(
            (p: { key: string; value: string }) => `- ${p.key}: ${p.value}`,
          );
          prefsContext = `\n\n[SAVED USER PREFERENCES]\n${lines.join("\n")}\n[END PREFERENCES]`;
        }
      } catch (err) {
        console.warn("[Voice] Failed to load preferences:", err);
      }

      // Fetch API key and setup config from server
      const tokenRes = await fetch("/api/voice-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice: selectedVoice, prefsContext }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        throw new Error(tokenData.error || "Failed to get voice token");
      }
      const { apiKey, setupConfig } = tokenData;
      if (!apiKey) {
        throw new Error("API key is missing");
      }

      // Build WebSocket URL with v1beta + API key (supports full tool calling)
      const wsUrl = `${WS_BASE}/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Send full setup message with model, config, tools, system instruction
        const setupMessage = {
          setup: setupConfig,
        };
        ws.send(JSON.stringify(setupMessage));
        setStatus("connected");

        // Start mic capture after connection is established
        capture
          .start((base64: string) => {
            if (
              wsRef.current?.readyState === WebSocket.OPEN &&
              !mutedRef.current
            ) {
              const audioMessage = {
                realtimeInput: {
                  mediaChunks: [
                    {
                      mimeType: AUDIO.INPUT_MIME_TYPE,
                      data: base64,
                    },
                  ],
                },
              };
              wsRef.current.send(JSON.stringify(audioMessage));
            }
          })
          .then(() => {
            const captureAnalyser = capture.getAnalyser();
            if (captureAnalyser) waveform.setAnalyser(captureAnalyser);
            setStatus("listening");
          })
          .catch((err) => {
            console.error("Mic capture failed:", err);
            setErrorMessage("Microphone access denied");
            setStatus("error");
          });
      };

      ws.onmessage = (event) => {
        // Queue messages to prevent race conditions with async handlers
        msgQueueRef.current = msgQueueRef.current.then(async () => {
          try {
            const raw =
              event.data instanceof Blob
                ? await event.data.text()
                : event.data;
            const message = JSON.parse(raw);

            console.log(
              "[Voice] WS message:",
              JSON.stringify(message).slice(0, 500),
            );

            // Handle setup complete
            if (message.setupComplete) {
              return;
            }

            // Handle interruption
            if (message.serverContent?.interrupted) {
              playback.clearQueue();
              setStatus("listening");
              return;
            }

            // Handle tool call cancellation
            if (message.toolCallCancellation?.ids) {
              console.warn(
                "[Voice] Tool calls cancelled:",
                message.toolCallCancellation.ids,
              );
              return;
            }

            // Handle function calls from the model (tool use)
            const toolCall = message.toolCall;
            if (toolCall?.functionCalls) {
              const functionResponses = [];

              for (const fc of toolCall.functionCalls) {
                console.log(
                  `[Voice] Function call: ${fc.name} (id: ${fc.id})`,
                  fc.args,
                );
                const result = await executeFunctionCall(
                  fc.name,
                  fc.args || {},
                  (card) => setCodeCards((prev) => [card, ...prev]),
                );

                if (fc.name === "clear_display" || fc.name === "ui_clear") {
                  window.dispatchEvent(new CustomEvent("jarvis-clear"));
                }

                functionResponses.push({
                  id: fc.id,
                  name: fc.name,
                  response: result,
                });
              }

              if (
                functionResponses.length > 0 &&
                wsRef.current?.readyState === WebSocket.OPEN
              ) {
                console.log(
                  "[Voice] Sending toolResponse:",
                  JSON.stringify(functionResponses).slice(0, 300),
                );
                wsRef.current.send(
                  JSON.stringify({ toolResponse: { functionResponses } }),
                );
              }
              return;
            }

            // Reset buffer on new model turn
            if (message.serverContent?.modelTurn) {
               // We don't necessarily want to wipe it if it's the same turn delivery
            }

            // Handle audio response
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.text) {
                  console.log("[Voice] Raw text part:", part.text);
                  // Buffer the text to handle split tags
                  transcriptBufferRef.current += part.text;
                  console.log("[Voice] Cumulative buffer:", transcriptBufferRef.current);
                  
                  // Process hybrid actions from the cumulative buffer
                  handleHybridAction(transcriptBufferRef.current);

                  // Keep the existing clear screen tag support for backward compatibility
                  if (part.text.includes("[CLEAR_SCREEN]")) {
                    window.dispatchEvent(new CustomEvent("jarvis-clear"));
                  }
                }
                if (part.inlineData?.data) {
                  setStatus("speaking");
                  playback.enqueue(part.inlineData.data);
                }
              }
            }

            // Handle turn complete
            if (message.serverContent?.turnComplete) {
              setStatus("listening");
              transcriptBufferRef.current = ""; // Clear buffer after full delivery
              processedActionsRef.current.clear();
            }
          } catch (err) {
            console.error("Error parsing message:", err);
          }
        });
      };

      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
        setErrorMessage("WebSocket connection failed");
        setStatus("error");
      };

      ws.onclose = (e) => {
        if (e.code !== 1000) {
          const raw = e.reason || `Connection closed (code: ${e.code})`;
          let reason = raw;
          if (
            raw.includes("not implemented") ||
            raw.includes("not supported") ||
            raw.includes("not enabled")
          ) {
            reason =
              "Funcionalidade não suportada pela sua API key. Verifique se seu plano do Gemini tem acesso a function calling na Live API.";
          }
          console.error("WebSocket closed:", raw, "code:", e.code);
          setErrorMessage(reason);
          setStatus("error");
        } else {
          setStatus("idle");
        }
        wsRef.current = null;
      };
    } catch (err: any) {
      const msg = err?.message || "Failed to start voice session";
      console.error("Failed to start voice session:", msg);
      setErrorMessage(msg);
      setStatus("error");
    }
  }, [capture, playback, waveform, selectedVoice]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      mutedRef.current = next;
      return next;
    });
  }, []);

  const stopSession = useCallback(() => {
    capture.stop();
    playback.stop();
    if (wsRef.current) {
      wsRef.current.close(1000);
      wsRef.current = null;
    }
    waveform.setAnalyser(null);
    setMuted(false);
    mutedRef.current = false;
    setStatus("idle");
  }, [capture, playback, waveform]);

  return {
    status,
    errorMessage,
    muted,
    codeCards,
    startSession,
    stopSession,
    toggleMute,
    dismissCodeCard,
    getFrequencyData: waveform.getFrequencyData,
    getAverageAmplitude: waveform.getAverageAmplitude,
    captureAnalyser: capture.getAnalyser,
    playbackAnalyser: playback.getAnalyser,
    setWaveformAnalyser: waveform.setAnalyser,
  };
}

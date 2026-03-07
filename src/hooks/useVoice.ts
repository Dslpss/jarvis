"use client";

import { useState, useRef, useCallback } from "react";
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

            // Handle audio response
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  setStatus("speaking");
                  playback.enqueue(part.inlineData.data);
                }
              }
            }

            // Handle turn complete
            if (message.serverContent?.turnComplete) {
              setStatus("listening");
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

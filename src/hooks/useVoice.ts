"use client";

import { useState, useRef, useCallback } from "react";
import { useAudioCapture } from "./useAudioCapture";
import { useAudioPlayback } from "./useAudioPlayback";
import { useWaveformAnalyzer } from "./useWaveformAnalyzer";
import { MODELS, AUDIO } from "@/lib/constants";
import { useAppStore } from "@/stores/appStore";
import type { VoiceStatus } from "@/types/voice";

const WS_BASE = "wss://generativelanguage.googleapis.com";

const VOICE_FUNCTION_DECLARATIONS = [
  {
    functionDeclarations: [
      {
        name: "save_preference",
        description:
          "Saves a user preference or any information the user asks to remember. Use this whenever the user says to save, remember, store, or memorize something.",
        parameters: {
          type: "OBJECT",
          properties: {
            key: {
              type: "STRING",
              description:
                "A short identifier for the preference, e.g. 'favorite_color', 'name', 'birthday'",
            },
            value: {
              type: "STRING",
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
          type: "OBJECT",
          properties: {
            key: {
              type: "STRING",
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
          type: "OBJECT",
          properties: {
            key: {
              type: "STRING",
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
          type: "OBJECT",
          properties: {
            content: {
              type: "STRING",
              description: "What to remind the user about",
            },
            remind_at: {
              type: "STRING",
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
          type: "OBJECT",
          properties: {},
        },
      },
    ],
  },
];

/**
 * Executa uma function call do Gemini Live e retorna o resultado.
 */
async function executeFunctionCall(
  name: string,
  args: Record<string, string>,
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
  const mutedRef = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);
  const capture = useAudioCapture();
  const playback = useAudioPlayback();
  const waveform = useWaveformAnalyzer();
  const selectedVoice = useAppStore((s) => s.selectedVoice);

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

      // Fetch ephemeral token from server with selected voice + preferences context
      const tokenRes = await fetch("/api/voice-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice: selectedVoice, prefsContext }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        throw new Error(tokenData.error || "Failed to get voice token");
      }
      const token = tokenData.token;
      if (!token) {
        throw new Error("Token is empty or undefined");
      }

      // Build WebSocket URL directly with v1alpha (bypassing SDK bug)
      const wsUrl = `${WS_BASE}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${token}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Send setup message — config (tools, speechConfig, modalities)
        // is already baked into the ephemeral token via BidiGenerateContentConstrained
        const setupMessage = {
          setup: {
            model: `models/${MODELS.LIVE_AUDIO}`,
          },
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

      ws.onmessage = async (event) => {
        try {
          // Gemini Live API sends messages as Blob; read as text first
          const raw =
            event.data instanceof Blob ? await event.data.text() : event.data;
          const message = JSON.parse(raw);

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

          // Handle function calls from the model (tool use)
          const toolCall = message.toolCall;
          if (toolCall?.functionCalls) {
            const functionResponses = [];
            for (const fc of toolCall.functionCalls) {
              console.log(`[Voice] Function call: ${fc.name}`, fc.args);
              const result = await executeFunctionCall(fc.name, fc.args || {});
              functionResponses.push({
                id: fc.id,
                name: fc.name,
                response: result,
              });
            }
            // Send function responses back to the model
            if (wsRef.current?.readyState === WebSocket.OPEN) {
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
      };

      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
        setErrorMessage("WebSocket connection failed");
        setStatus("error");
      };

      ws.onclose = (e) => {
        if (e.code !== 1000) {
          const reason = e.reason || `Connection closed (code: ${e.code})`;
          console.error("WebSocket closed:", reason);
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
    startSession,
    stopSession,
    toggleMute,
    getFrequencyData: waveform.getFrequencyData,
    getAverageAmplitude: waveform.getAverageAmplitude,
    captureAnalyser: capture.getAnalyser,
    playbackAnalyser: playback.getAnalyser,
    setWaveformAnalyser: waveform.setAnalyser,
  };
}

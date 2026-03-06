import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { supabase, supabaseAdmin } from "./supabase";

// Usa o cliente admin (bypass RLS) no servidor, com fallback para o anon
const db = supabaseAdmin || supabase;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  apiVersion: "v1",
});

export interface MemoryMetadata {
  role: "user" | "assistant";
  timestamp: string;
  topic?: string;
  [key: string]: string | boolean | number | undefined;
}

export const memoryService = {
  /**
   * Gera um embedding vetorial para o texto fornecido usando o novo SDK @google/genai.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      console.log("Gerando embedding para:", text.substring(0, 50) + "...");

      const result = await ai.models.embedContent({
        model: "gemini-embedding-exp-03-07",
        contents: [{ parts: [{ text }] }],
      });

      // SDK returns an array of embeddings in `result.embeddings`
      const first = result?.embeddings && result.embeddings[0];
      if (!first || !first.values) {
        throw new Error("Resposta de embedding inválida do Gemini");
      }

      console.log(
        "Embedding gerado com sucesso, tamanho:",
        first.values.length,
      );
      return first.values;
    } catch (error: unknown) {
      try {
        const err = error instanceof Error ? error : new Error(String(error));
        const logError = `\n[${new Date().toISOString()}] Error: ${err.message}\nStack: ${err.stack}\n`;
        fs.appendFileSync(
          "C:\\Users\\dslps\\AppData\\Local\\Temp\\jarvis-debug.log",
          logError,
        );
      } catch {}
      console.error("Erro ao gerar embedding:", error);
      throw error;
    }
  },

  /**
   * Salva uma nova memória no Supabase.
   */
  async saveMemory(content: string, metadata: MemoryMetadata) {
    try {
      if (!content || content.trim() === "") return false;

      console.log(
        "[LTM] Gerando embedding para:",
        content.substring(0, 50) + "...",
      );
      const embedding = await this.generateEmbedding(content);
      console.log("[LTM] Embedding gerado com sucesso.");

      console.log("[LTM] Salvando no Supabase...");
      const { error } = await db.from("memories").insert({
        content,
        embedding,
        metadata,
      });

      if (error) {
        console.error("[LTM] Erro do Supabase ao inserir:", error);
        throw error;
      }

      console.log("[LTM] Memória salva com sucesso!");
      return true;
    } catch (error) {
      console.error("[LTM] Erro ao salvar memória:", error);
      return false;
    }
  },

  /**
   * Busca memórias semanticamente similares ao texto de consulta.
   */
  async searchSimilarMemories(query: string, limit: number = 5) {
    try {
      if (!query || query.trim() === "") return [];

      const queryEmbedding = await this.generateEmbedding(query);

      const { data, error } = await db.rpc("match_memories", {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: limit,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erro ao buscar memórias similares:", error);
      return [];
    }
  },
  /**
   * Salva um par chave/valor como memória (usado para preferências simples).
   */
  async saveKeyValue(
    key: string,
    value: unknown,
    metadata?: MemoryMetadata,
  ): Promise<boolean> {
    try {
      const content = typeof value === "string" ? value : JSON.stringify(value);
      const meta = { ...(metadata || {}), key, kv: true };

      const { error } = await db.from("memories").insert({
        content,
        embedding: null,
        metadata: meta,
      });

      if (error) {
        console.error("[LTM] Erro ao salvar key/value:", error);
        throw error;
      }

      return true;
    } catch (err) {
      console.error("[LTM] saveKeyValue failed", err);
      return false;
    }
  },

  /**
   * Recupera o valor mais recente salvo para uma chave.
   */
  async getKeyValue(
    key: string,
  ): Promise<{ content: unknown; metadata: Record<string, unknown> } | null> {
    try {
      const { data, error } = await db
        .from("memories")
        .select("content,metadata")
        .eq("metadata->>key", key)
        .order("id", { ascending: false })
        .limit(1);

      if (error) {
        console.error("[LTM] Erro ao buscar key/value:", error);
        return null;
      }

      if (!data || data.length === 0) return null;

      const row = data[0] as {
        content: string;
        metadata: Record<string, unknown>;
      };
      let content: unknown = row.content;
      try {
        content = JSON.parse(row.content);
      } catch {
        // manter como string se não for JSON
      }

      return { content, metadata: row.metadata };
    } catch (err) {
      console.error("[LTM] getKeyValue failed", err);
      return null;
    }
  },

  /**
   * Retorna todas as preferências (key-value) salvas, dedupando por chave (mais recente ganha).
   */
  async getAllPreferences(): Promise<Array<{ key: string; value: string }>> {
    try {
      const { data, error } = await db
        .from("memories")
        .select("content,metadata")
        .eq("metadata->>kv", "true")
        .order("id", { ascending: false })
        .limit(100);

      if (error) {
        console.error("[LTM] Erro ao buscar preferências:", error);
        return [];
      }
      if (!data || data.length === 0) return [];

      // Dedup by key — keep the most recent (first in descending order)
      const seen = new Set<string>();
      const prefs: Array<{ key: string; value: string }> = [];
      for (const row of data as Array<{
        content: string;
        metadata: Record<string, unknown>;
      }>) {
        const key = row.metadata?.key as string | undefined;
        if (key && !seen.has(key)) {
          seen.add(key);
          prefs.push({ key, value: row.content });
        }
      }
      return prefs;
    } catch (err) {
      console.error("[LTM] getAllPreferences failed", err);
      return [];
    }
  },

  /**
   * Remove todas as entradas de uma chave específica.
   */
  async deleteKeyValue(key: string): Promise<boolean> {
    try {
      const { error } = await db
        .from("memories")
        .delete()
        .eq("metadata->>key", key)
        .eq("metadata->>kv", "true");

      if (error) {
        console.error("[LTM] Erro ao deletar key/value:", error);
        return false;
      }

      console.log(`[LTM] Preferência '${key}' removida com sucesso.`);
      return true;
    } catch (err) {
      console.error("[LTM] deleteKeyValue failed", err);
      return false;
    }
  },
};

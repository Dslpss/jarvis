import { supabase } from "./supabase";

export interface Reminder {
  id?: number;
  content: string;
  remind_at: string; // ISO timestamp
  notified?: boolean;
  created_at?: string;
}

export const reminderService = {
  /**
   * Cria um novo lembrete agendado.
   */
  async create(content: string, remindAt: string): Promise<Reminder | null> {
    try {
      const { data, error } = await supabase
        .from("reminders")
        .insert({ content, remind_at: remindAt, notified: false })
        .select()
        .single();

      if (error) {
        console.error("[Reminders] Erro ao criar:", error);
        return null;
      }

      console.log("[Reminders] Lembrete criado:", data);
      return data as Reminder;
    } catch (err) {
      console.error("[Reminders] create failed:", err);
      return null;
    }
  },

  /**
   * Retorna lembretes que já chegaram na hora e ainda não foram notificados.
   */
  async getDue(): Promise<Reminder[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("notified", false)
        .lte("remind_at", now)
        .order("remind_at", { ascending: true });

      if (error) {
        console.error("[Reminders] Erro ao buscar pendentes:", error);
        return [];
      }

      return (data as Reminder[]) || [];
    } catch (err) {
      console.error("[Reminders] getDue failed:", err);
      return [];
    }
  },

  /**
   * Marca um lembrete como notificado.
   */
  async markNotified(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("reminders")
        .update({ notified: true })
        .eq("id", id);

      if (error) {
        console.error("[Reminders] Erro ao marcar notificado:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("[Reminders] markNotified failed:", err);
      return false;
    }
  },

  /**
   * Lista lembretes futuros (ainda não notificados).
   */
  async getUpcoming(limit = 10): Promise<Reminder[]> {
    try {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("notified", false)
        .order("remind_at", { ascending: true })
        .limit(limit);

      if (error) {
        console.error("[Reminders] Erro ao listar:", error);
        return [];
      }

      return (data as Reminder[]) || [];
    } catch (err) {
      console.error("[Reminders] getUpcoming failed:", err);
      return [];
    }
  },

  /**
   * Deleta um lembrete pelo ID.
   */
  async delete(id: number): Promise<boolean> {
    try {
      const { error } = await supabase.from("reminders").delete().eq("id", id);

      if (error) {
        console.error("[Reminders] Erro ao deletar:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("[Reminders] delete failed:", err);
      return false;
    }
  },
};

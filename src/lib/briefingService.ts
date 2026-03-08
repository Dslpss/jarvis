import { reminderService } from "./reminderService";
import { searchWeb } from "./providers/search";

export interface BriefingData {
  weather: {
    temp: string;
    condition: string;
    city: string;
  };
  news: Array<{
    title: string;
    url: string;
  }>;
  agenda: Array<{
    content: string;
    time: string;
  }>;
}

export const briefingService = {
  async getBriefing(interests: string[] = ["tecnologia", "inteligência artificial"]): Promise<BriefingData> {
    console.log("[Briefing] Iniciando coleta de dados...");

    // 1. Detecção de Localização e Clima
    let weather = { temp: "N/A", condition: "Não disponível", city: "Sua localização" };
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000); // 5s timeout

      // Tentar detectar cidade pelo IP (ip-api.com é mais robusto)
      try {
        const locationRes = await fetch("http://ip-api.com/json", { signal: controller.signal });
        if (locationRes.ok) {
          const locationData = await locationRes.json();
          if (locationData.city) weather.city = locationData.city;
        }
      } catch (locErr) {
        console.warn("[Briefing] Falha ao detectar cidade, usando default.");
      }

      clearTimeout(id);
      
      const weatherController = new AbortController();
      const wId = setTimeout(() => weatherController.abort(), 8000); // 8s timeout para clima

      // Consultar wttr.in
      const cityParam = weather.city === "Sua localização" ? "" : weather.city;
      const weatherRes = await fetch(`https://wttr.in/${encodeURIComponent(cityParam)}?format=%t|%C&lang=pt`, {
        signal: weatherController.signal,
        headers: { "User-Agent": "curl/7.64.1" } // wttr.in prefere user-agents simples
      });
      
      if (weatherRes.ok) {
        const text = await weatherRes.text();
        if (text && text.includes("|")) {
          const [temp, cond] = text.split("|");
          weather.temp = temp?.trim() || "N/A";
          weather.condition = cond?.trim() || "Céu limpo";
        }
      }
      clearTimeout(wId);
    } catch (err) {
      console.error("[Briefing] Erro crítico no módulo de clima:", err);
    }

    // 2. Notícias (Tavily)
    let news: any[] = [];
    try {
      const newsQuery = `últimas notícias sobre ${interests.join(" e ")}`;
      const searchRes = await searchWeb(newsQuery);
      if (searchRes.results) {
        news = searchRes.results.slice(0, 3).map((r: any) => ({
          title: r.title,
          url: r.url
        }));
      }
    } catch (err) {
      console.error("[Briefing] Falha ao obter notícias:", err);
    }

    // 3. Agenda (Reminder Service)
    let agenda: any[] = [];
    try {
      const reminders = await reminderService.getUpcoming(5);
      agenda = reminders.map((r: any) => ({
        content: r.content,
        time: new Date(r.remind_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      }));
    } catch (err) {
      console.error("[Briefing] Falha ao obter agenda:", err);
    }

    return { weather, news, agenda };
  }
};

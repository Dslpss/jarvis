export async function searchWeb(query: string) {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    console.error("[SEARCH] TAVILY_API_KEY not found in environment variables.");
    return {
      error: "Search API key not configured. Please add TAVILY_API_KEY to your .env file.",
      results: []
    };
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic",
        include_answer: true,
        max_results: 5,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      answer: data.answer,
      results: (data.results || []).map((r: { title: string; url: string; content: string }) => ({
        title: r.title,
        url: r.url,
        content: r.content,
      })),
    };
  } catch (error) {
    console.error("[SEARCH] Error performing web search:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to perform web search",
      results: []
    };
  }
}

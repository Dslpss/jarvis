import { NextResponse } from "next/server";
import { memoryService } from "@/lib/memoryService";

export async function GET() {
  const timestamp = new Date().toISOString();
  const testContent = `Teste de memória realizado pelo o assistente em ${timestamp}`;
  
  try {
    // 1. Tentar salvar uma memória
    const saved = await memoryService.saveMemory(testContent, {
      role: "assistant",
      type: "test",
      timestamp
    });

    if (!saved) {
      return NextResponse.json({ 
        success: false, 
        error: "Falha ao salvar no Supabase. Verifique os logs do servidor para detalhes."
      }, { status: 500 });
    }

    // 2. Tentar buscar memórias similares
    const results = await memoryService.searchSimilarMemories("Teste de memória");

    return NextResponse.json({
      success: true,
      message: "Sistema de memória operacional!",
      saved: testContent,
      searchResults: results
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}

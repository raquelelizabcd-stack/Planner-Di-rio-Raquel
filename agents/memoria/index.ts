import { createClient } from "@supabase/supabase-js";

export class AgenteMemoria {
  private supabase;
  constructor() {
    const supabaseUrl = 
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) || 
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || 
      "";
    const supabaseKey = 
      (typeof process !== 'undefined' && (process.env?.SUPABASE_SERVICE_ROLE_KEY || process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY)) || 
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || 
      "";

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async verificarHistorico(prompt: string): Promise<string | null> {
    try {
      const { data } = await this.supabase
        .from("audit_logs")
        .select("details")
        .ilike("details->>prompt", `%${prompt}%`)
        .order("timestamp", { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        return (data[0].details as any)?.resultado || null;
      }
    } catch (e) {
      console.warn("AgenteMemoria: consulta de histórico offline ou em cache local", e);
    }
    return null;
  }

  async salvarResultado(agentName: string, prompt: string, resultado: string) {
    try {
      await this.supabase.from("audit_logs").insert({
        agent_name: agentName,
        action: "nova_execucao",
        details: { prompt, resultado },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("AgenteMemoria: salvarResultado falhou ou offline", e);
    }
  }
}

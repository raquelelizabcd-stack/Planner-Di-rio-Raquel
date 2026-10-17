import { createClient } from "@supabase/supabase-js";

/**
 * Agente de Memória responsável por consultar histórico de execuções
 * persistidas e salvar novos resultados para reaproveitamento contextual.
 */
export class AgenteMemoria {
  private supabase: any;

  /**
   * Construtor com suporte a Injeção de Dependências para testabilidade.
   *
   * @param supabaseClient Cliente Supabase customizado ou mockado para testes
   */
  constructor(supabaseClient?: any) {
    if (supabaseClient) {
      this.supabase = supabaseClient;
      return;
    }

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

  /**
   * Consulta o histórico persistido no Supabase buscando correspondência com o prompt informado.
   *
   * @param prompt Texto da solicitação a ser buscada no histórico
   * @returns Promise<string | null> Resposta prévia encontrada ou null se inexistente/erro
   */
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

  /**
   * Salva o resultado de execução no log de auditoria / memória no Supabase.
   *
   * @param agentName Nome do agente executor
   * @param prompt Prompt original processado
   * @param resultado Resposta sanitizada gerada
   */
  async salvarResultado(agentName: string, prompt: string, resultado: string): Promise<void> {
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

export default AgenteMemoria;

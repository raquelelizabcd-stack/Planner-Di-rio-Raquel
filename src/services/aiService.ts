import { supabase } from '../lib/supabase';

export interface AIServiceResponse<T = string> {
  success: boolean;
  action: string;
  data: T;
  tokensEstimate?: number;
}

/**
 * Função central para invocar o endpoint seguro de IA no backend.
 * Utiliza o access_token da sessão autenticada do Google OAuth.
 * Nenhuma chave de API (Gemini ou OpenAI) trafega no frontend.
 */
async function callSecureAI<T = string>(action: string, payload: Record<string, any> = {}): Promise<T> {
  // 1. Obter a sessão ativa e o token JWT emitido pelo Supabase / Google OAuth
  let token: string | null = null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token || null;
  } catch (err) {
    console.warn('Erro ao obter sessão do Supabase no aiService:', err);
  }

  // 2. Chamar o endpoint serverless protegido
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/ai/agent', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, payload })
    });

    if (response.status === 403) {
      throw new Error('Acesso negado: Somente a conta autorizada de Raquel pode executar operações de IA.');
    }

    if (response.status === 429) {
      throw new Error('Limite de segurança excedido: aguarde alguns instantes antes de gerar novo conteúdo.');
    }

    if (!response.ok) {
      // Se for a frase de inspiração e o backend não estiver acessível, usa frase de reserva local
      if (action === 'inspiration_quote') {
        return 'O sucesso é a soma de pequenos esforços repetidos dia após dia.' as T;
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Erro ao processar inteligência artificial (HTTP ${response.status}).`);
    }

    const json: AIServiceResponse<T> = await response.json();
    return json.data;
  } catch (error: any) {
    // Para a frase de inspiração diária, entrega a frase padrão para não quebrar a abertura do painel
    if (action === 'inspiration_quote') {
      return 'O sucesso é a soma de pequenos esforços repetidos dia após dia.' as T;
    }

    // Erros de rede ou conexão offline
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      throw new Error('Não foi possível conectar ao servidor de IA. Verifique sua conexão com a internet ou as variáveis no servidor.');
    }

    throw error;
  }
}

/**
 * Serviço Exportado: Métodos Limpos e Tipados para os Agentes e Telas
 */
export const aiService = {
  /**
   * Agente de Marketing: Tendências em tópicos
   */
  async getMarketingTrends(topic: string): Promise<string> {
    return callSecureAI<string>('marketing_trends', { topic });
  },

  /**
   * Agente Debug IA: Diagnóstico de logs de erro
   */
  async analyzeDebugLog(errorLog: string): Promise<string> {
    return callSecureAI<string>('debug_analysis', { errorLog });
  },

  /**
   * Agente Suporte Pedagógico: Geração de plano de aula em 6 blocos
   */
  async generateLessonPlan(params: {
    subject: string;
    topic: string;
    className: string;
    prompt?: string;
  }): Promise<string> {
    return callSecureAI<string>('pedagogico_plan', params);
  },

  /**
   * Agente de Publicação IA: Legenda e hashtags de alta conversão
   */
  async generatePublicacaoPost(params: {
    category: string;
    topic: string;
    platform: string;
  }): Promise<string> {
    return callSecureAI<string>('publicacao_post', params);
  },

  /**
   * Inspiração Diária do Dashboard
   */
  async getInspirationQuote(): Promise<string> {
    return callSecureAI<string>('inspiration_quote', {});
  },

  /**
   * Aba de Estudos: Explicações didáticas de tópicos
   */
  async explainStudyTopic(topic: string, level?: string): Promise<string> {
    return callSecureAI<string>('study_explain', { topic, level });
  },

  /**
   * Central de Marketing: Copywriting e ideias
   */
  async generateMarketingCopy(prompt: string): Promise<string> {
    return callSecureAI<string>('marketing_copy', { prompt });
  },

  /**
   * Chat Helper
   */
  async chatWithHelper(message: string): Promise<string> {
    return callSecureAI<string>('chat_helper', { message });
  }
};

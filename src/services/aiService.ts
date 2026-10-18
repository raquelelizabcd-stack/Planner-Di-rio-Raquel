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
      // Se estiver rodando puramente no Vite local sem o Vercel Serverless (ex: dev local offline)
      if (response.status === 404) {
        console.warn('Endpoint /api/ai/agent não encontrado no servidor de desenvolvimento local. Utilizando fallback seguro.');
        return getLocalFallback<T>(action, payload);
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Erro HTTP ${response.status} ao processar IA.`);
    }

    const json: AIServiceResponse<T> = await response.json();
    return json.data;
  } catch (error: any) {
    // Fallback gracioso para modo de desenvolvimento desconectado
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      console.warn('Servidor de backend não acessível. Utilizando fallback seguro de desenvolvimento.');
      return getLocalFallback<T>(action, payload);
    }
    throw error;
  }
}

/**
 * Fallback seguro para testes e desenvolvimento local sem rede
 */
function getLocalFallback<T = string>(action: string, payload: Record<string, any>): T {
  switch (action) {
    case 'inspiration_quote':
      return 'O sucesso é a soma de pequenos esforços repetidos dia após dia.' as T;
    case 'marketing_trends':
      return `### 📰 Tendências de Marketing Digital (Modo de Demonstração)\n\n1. **Agentes Autônomos de Atendimento**\n2. **Short Video SEO e Transcrições**\n3. **Hiper-personalização de Conteúdo**\n4. **Social Commerce no Reels**\n5. **Micro-influenciadores de EdTech**` as T;
    case 'debug_analysis':
      return `### 🧩 Diagnóstico Debug IA (Modo de Demonstração)\n\n* **Status**: Sistema operacional.\n* **Recomendação**: Adicionar verificação defensiva condicional.` as T;
    case 'pedagogico_plan':
      return `### 🧠 Plano de Aula Técnico (Modo de Demonstração)\n\n**Turma**: ${payload.className || 'Técnico em Marketing'} | **Disciplina**: ${payload.subject || 'Marketing'}\n\n1. 🎯 Objetivos: Competências práticas de mercado.\n2. 📚 Conteúdo: Funil e automações digitais.\n3. 📝 Metodologias: Estudos de caso reais.` as T;
    case 'publicacao_post':
      return `A Inteligência Artificial e a inovação tecnológica estão transformando a rotina profissional.\n\nInvestir na capacitação contínua é o caminho mais seguro para liderar resultados.\n\n#MarketingDigital #InteligenciaArtificial #Educacao #Inovacao #RaquelDuarte` as T;
    case 'study_explain':
      return `Resumo didático sobre ${payload.topic || 'o tema'}: Pratique com aplicações reais em pequenos blocos de foco.` as T;
    case 'marketing_copy':
      return `Ideia estratégica de conteúdo: Posicione seu diferencial com clareza e autoridade.` as T;
    case 'chat_helper':
      return 'Olá, Raquel! Estou pronta para te apoiar em suas tarefas e projetos.' as T;
    default:
      return 'Conteúdo processado com sucesso.' as T;
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

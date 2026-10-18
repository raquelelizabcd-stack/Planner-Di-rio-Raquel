import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { securityMiddleware } from '../../src/agents/seguranca/SecurityMiddleware';
import { agenteSeguranca, BLOCKED_SECURITY_MESSAGE } from '../../src/agents/seguranca/AgenteSeguranca';

// Rate Limiter em memória para proteção contra loops e gastos excessivos
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_MINUTE = 30;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  entry.count += 1;
  return true;
}

// Ações permitidas pelo backend
export type AllowedAIAction =
  | 'marketing_trends'
  | 'debug_analysis'
  | 'pedagogico_plan'
  | 'publicacao_post'
  | 'inspiration_quote'
  | 'study_explain'
  | 'marketing_copy'
  | 'chat_helper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & Security Headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'METHOD_NOT_ALLOWED',
      message: 'Apenas requisições POST são permitidas neste endpoint seguro.'
    });
  }

  // 1. Validação Criptográfica de Sessão via Supabase Auth & Whitelist (Google OAuth)
  const autorizado = await securityMiddleware(req, res);
  if (!autorizado) {
    // securityMiddleware já respondeu 403 Forbidden
    return;
  }

  // Identificador do usuário para rate limit
  const userId = req.headers?.['x-forwarded-for']?.toString() || req.socket?.remoteAddress || 'authorized_user';
  if (!checkRateLimit(userId)) {
    return res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Limite de 30 requisições por minuto excedido. Aguarde antes de chamar a IA novamente.'
    });
  }

  const { action, payload } = req.body || {};

  if (!action || typeof action !== 'string') {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: 'Campo "action" é obrigatório no corpo da requisição.'
    });
  }

  // 2. Sanitização de Entrada contra Injeção de Chaves ou Dados Sensíveis
  const inspection = agenteSeguranca.inspecionarCamada('backend', payload, {
    origem: `API_AI_Agent_${action}`
  });

  if (inspection.bloqueado) {
    return res.status(400).json({
      error: 'SECURITY_BLOCKED_INPUT',
      message: 'A solicitação contém dados sensíveis ou padrões inseguros bloqueados pelo Guardião.'
    });
  }

  const sanitizedPayload = inspection.conteudoSanitizado || {};

  // 3. Chaves Privadas Mantidas Exclusivamente no Servidor
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  try {
    let resultText = '';
    let tokensEstimate = 100;

    switch (action as AllowedAIAction) {
      case 'marketing_trends': {
        const topic = (sanitizedPayload.topic || 'Tendências de IA no Marketing Digital').slice(0, 300);
        tokensEstimate = 280;

        if (!geminiKey) {
          resultText = `### 📰 Resumo de Tendências de Marketing Digital (Modo de Demonstração)\n\n1. **Agentes Autônomos no WhatsApp**: Integração avançada com CRMs.\n2. **Short Video SEO**: Algoritmos priorizando transcrições.\n3. **Hyper-Personalização com IA**: Conteúdo adaptativo em tempo real.\n4. **Social Commerce**: Vendas diretas por canais sociais.\n5. **Micro-Influenciadores**: Parcerias didáticas focadas em nicho.`;
        } else {
          const ai = new GoogleGenAI({ apiKey: geminiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Você é o Agente de Marketing Digital do Planner Raquel. Busca as principais notícias e tendências em alta de Marketing Digital, Redes Sociais e IA Aplicada.\n\nTópico / Foco Solicitado: "${topic}".\n\nREGRAS OBRIGATÓRIAS:\n1. Resuma a resposta em exatamente ATÉ 5 TÓPICOS CURTOS e diretos.\n2. Máximo 300 tokens de limite.\n3. Escreva em Português do Brasil com linguagem profissional e acionável para professores/profissionais de marketing.`
          });
          resultText = response.text || 'Nenhuma tendência retornada.';
        }
        break;
      }

      case 'debug_analysis': {
        const errorLog = (sanitizedPayload.errorLog || '').slice(0, 2000);
        tokensEstimate = 320;

        if (!geminiKey) {
          resultText = `### 🧩 Diagnóstico Debug IA (Modo de Demonstração)\n\n* **Status**: Sistema operacional.\n* **Recomendação**: Aplicar tratamento defensivo com operador de encadeamento opcional (?.) e coalescência nula (?? []).`;
        } else {
          const ai = new GoogleGenAI({ apiKey: geminiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Você é o Agente Debug IA do Planner Diário Raquel. Analise o seguinte log de erro / código:\n\n"${errorLog}"\n\nForneça:\n1. Diagnóstico do Erro\n2. Sugestão de Correção Direta\n3. Passo a passo prático para resolver (máximo 3 passos).`
          });
          resultText = response.text || 'Análise concluída sem anormalidades.';
        }
        break;
      }

      case 'pedagogico_plan': {
        const { subject = 'Marketing', topic = 'Geral', className = 'Turma Técnica', prompt = '' } = sanitizedPayload;
        tokensEstimate = 450;

        if (!geminiKey) {
          resultText = `### 🧠 Plano de Aula Técnico em Marketing Digital (Modo de Demonstração)\n\n**Turma**: ${className} | **Disciplina**: ${subject}\n\n#### 1. 🎯 Objetivos de Aprendizagem\n* Compreender estratégias práticas aplicadas ao mercado.\n\n#### 2. 📚 Conteúdos Programáticos\n* Teoria (20 min), Prática (40 min), Estudo de caso real (20 min).`;
        } else {
          const ai = new GoogleGenAI({ apiKey: geminiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Você é o Agente de Suporte Pedagógico especializado em Educação Profissional Técnica de Nível Médio em Marketing.
Gerencie e elabore um Plano de Aula completo e estruturado para a seguinte turma:
- Turma: ${className}
- Disciplina: ${subject}
- Tópico da Aula: ${topic}
- Observação Adicional: ${prompt || 'Foco em aplicação prática no mercado'}

A SUA RESPOSTA DEVE CONTER OBRIGATORIAMENTE OS SEGUINTES 6 BLOCOS:
1. 🎯 Objetivos de Aprendizagem
2. 📚 Conteúdos Programáticos
3. 📝 Metodologias Didáticas
4. 🧾 Avaliações
5. 🔄 Adaptação por Turma
6. 💡 Sugestões Extras`
          });
          resultText = response.text || 'Erro ao gerar plano pedagógico.';
        }
        break;
      }

      case 'publicacao_post': {
        const { category = 'Marketing Digital', topic = 'Inovação e Tecnologia', platform = 'both' } = sanitizedPayload;
        tokensEstimate = 195;

        const promptText = `Você é o Agente de Publicação IA da professora e especialista Raquel Duarte.
Gere uma publicação em Português do Brasil para LinkedIn e Instagram sobre o tema: "${category} - ${topic}".

REGRAS RÍGIDAS DE GERAÇÃO:
1. MÁXIMO DE 2 PARÁGRAFOS curtos, legíveis e com tom profissional altamente engajador.
2. EXATAMENTE 5 HASHTAGS ESTRATÉGICAS ao final (ex: #MarketingDigital #InteligenciaArtificial #Educacao #Inovacao #RaquelDuarte).
3. Mantenha o texto estritamente dentro do limite de 200 tokens.`;

        // Tenta OpenAI se disponível no servidor; caso contrário Gemini
        if (openaiKey) {
          try {
            const resOpenAI = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiKey}`
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: promptText }],
                max_tokens: 200
              })
            });
            const dataOpenAI = await resOpenAI.json();
            if (dataOpenAI?.choices?.[0]?.message?.content) {
              resultText = dataOpenAI.choices[0].message.content;
            }
          } catch (err) {
            console.warn('Fallback para Gemini após erro na OpenAI:', err);
          }
        }

        if (!resultText && geminiKey) {
          const ai = new GoogleGenAI({ apiKey: geminiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: promptText
          });
          resultText = response.text || '';
        }

        if (!resultText) {
          resultText = `A Inteligência Artificial e as novas tecnologias digitais estão redefinindo os métodos de ensino técnico e a qualificação profissional. Integrar inovações na rotina cria um ambiente de aprendizado dinâmico e focado em resultados práticos.\n\nInvestir na capacitação constante é o caminho mais rápido para liderar transformações com impacto real.\n\n#MarketingDigital #InteligenciaArtificial #Educacao #Inovacao #RaquelDuarte`;
        }
        break;
      }

      case 'inspiration_quote': {
        tokensEstimate = 60;
        if (!geminiKey) {
          resultText = 'O sucesso é a soma de pequenos esforços repetidos dia após dia.';
        } else {
          const ai = new GoogleGenAI({ apiKey: geminiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: 'Gere uma frase curta, motivacional e focada em produtividade ou bem-estar para um desenvolvedor. Máximo 2 linhas. Em português. Não use aspas na resposta.'
          });
          resultText = response.text?.trim() || 'O sucesso é a soma de pequenos esforços repetidos dia após dia.';
        }
        break;
      }

      case 'study_explain': {
        const topic = (sanitizedPayload.topic || 'Conceito').slice(0, 500);
        const level = (sanitizedPayload.level || 'Geral').slice(0, 100);
        tokensEstimate = 350;

        if (!geminiKey) {
          resultText = `Resumo Didático sobre ${topic} (${level}): Pratique a aplicação prática com projetos estruturados e pequenos passos contínuos.`;
        } else {
          const ai = new GoogleGenAI({ apiKey: geminiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Você é uma tutora pedagógica técnica e didática. Explique o tópico "${topic}" para nível "${level}" em português do Brasil com:
1. Resumo conciso em 2 parágrafos
2. Exemplo prático de aplicação
3. 1 exercício rápido para fixação.`
          });
          resultText = response.text || 'Conteúdo gerado com sucesso.';
        }
        break;
      }

      case 'marketing_copy': {
        const prompt = (sanitizedPayload.prompt || 'Ideia de post').slice(0, 1000);
        tokensEstimate = 250;

        if (!geminiKey) {
          resultText = 'Copy estratégica: Conecte sua proposta de valor com a necessidade real do seu público técnico.';
        } else {
          const ai = new GoogleGenAI({ apiKey: geminiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Você é especialista em Marketing de Conteúdo e Copywriting Estratégico. Atenda à seguinte solicitação: "${prompt}". Mantenha texto persuasivo, profissional e em Português do Brasil com limite máximo de 250 tokens.`
          });
          resultText = response.text || 'Copy gerada com sucesso.';
        }
        break;
      }

      case 'chat_helper': {
        const userMsg = (sanitizedPayload.message || '').slice(0, 1000);
        tokensEstimate = 250;

        if (!geminiKey) {
          resultText = 'Olá, Raquel! Estou pronta para te apoiar em suas tarefas, estudos e publicações.';
        } else {
          const ai = new GoogleGenAI({ apiKey: geminiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Você é a assistente pessoal do Planner Diário Raquel. Responda em Português do Brasil de forma empática, prestativa e objetiva:\n\n"${userMsg}"`
          });
          resultText = response.text || 'Estou à disposição.';
        }
        break;
      }

      default:
        return res.status(400).json({
          error: 'UNSUPPORTED_ACTION',
          message: `Ação "${action}" não é suportada pelo endpoint seguro de IA.`
        });
    }

    // 4. Sanitização da Resposta de Saída
    const safeOutput = agenteSeguranca.validarSaida(resultText);

    return res.status(200).json({
      success: true,
      action,
      data: safeOutput,
      tokensEstimate
    });

  } catch (error: any) {
    console.error(`Erro ao processar ação de IA "${action}":`, error);
    return res.status(500).json({
      error: 'AI_EXECUTION_ERROR',
      message: 'Ocorreu um erro interno ao processar a inteligência artificial. Verifique se as variáveis de ambiente estão configuradas no servidor.'
    });
  }
}

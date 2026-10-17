import { createClient } from "@supabase/supabase-js";
import { supabase as sharedSupabase } from "../../lib/supabase";
import { 
  SecurityLayer, 
  SensitiveDataType, 
  SecurityDetectionLog, 
  SecurityInspectionResult, 
  SecurityMetrics 
} from "./types";

export const BLOCKED_SECURITY_MESSAGE = "⚠️ Conteúdo bloqueado por segurança";
export const EMAIL_AUTORIZADO = 'raquelduarteadmi@gmail.com';
export const MENSAGEM_ACESSO_RESTRITO = '⚠️ Acesso restrito: apenas a conta autorizada pode entrar.';

// Cache em memória compartilhado para logs em tempo real do Guardião Global
const inMemorySecurityLogs: SecurityDetectionLog[] = [];
const MAX_IN_MEMORY_LOGS = 100;

export class AgenteSeguranca {
  private supabase: any = null;
  private isBrowser: boolean;

  constructor() {
    this.isBrowser = typeof window !== 'undefined';
    this.initSupabaseClient();
  }

  private initSupabaseClient() {
    try {
      // Cliente compartilhado: carrega a sessão autenticada (necessário para auditoria sob RLS)
      this.supabase = sharedSupabase;
      return;

      const defaultUrl = 'https://cjnagdninashngvpxidc.supabase.co';
      const defaultKey = 'sb_publishable__Pn9EN9UXSnPAYhL4X86nA_E8jqveLM';

      const envUrl = 
        (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_SUPABASE_URL || process.env?.VITE_SUPABASE_URL)) ||
        (this.isBrowser && (import.meta as any)?.env?.VITE_SUPABASE_URL) ||
        defaultUrl;

      const envKey = 
        (typeof process !== 'undefined' && (process.env?.SUPABASE_SERVICE_ROLE_KEY || process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env?.VITE_SUPABASE_ANON_KEY)) ||
        (this.isBrowser && (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY) ||
        defaultKey;

      this.supabase = createClient(envUrl, envKey);
    } catch (e) {
      console.warn("AgenteSeguranca: Falha ao inicializar client Supabase para auditoria", e);
    }
  }

  /**
   * Método padrão retrocompatível usado pelo Orquestrador e componentes legados
   */
  validarSaida(texto: string, metadata?: Record<string, any>): string {
    const res = this.inspecionarCamada('ia', texto, metadata);
    return res.conteudoSanitizado;
  }

  /**
   * Inspeciona qualquer camada do sistema com bloqueio seletivo inteligente
   */
  inspecionarCamada(
    camada: SecurityLayer, 
    conteudo: any, 
    options?: { origem?: string; context?: Record<string, any> }
  ): SecurityInspectionResult {
    const t0 = performance.now();

    try {
      if (conteudo === null || conteudo === undefined) {
        return {
          seguro: true,
          conteudoSanitizado: conteudo,
          dadosDetectados: [],
          tiposDetectados: [],
          tokensEconomizados: 0,
          tempoMs: 0.1,
          bloqueado: false
        };
      }

      if (typeof conteudo === 'string') {
        const { sanitizado, detectados, tipos } = this.verificarPadroesTexto(conteudo);
        const tempoMs = Math.max(0.1, performance.now() - t0);
        const houveBloqueio = detectados.length > 0;
        const tokensEconomizados = houveBloqueio 
          ? detectados.reduce((acc, d) => acc + Math.max(1, Math.ceil(d.length / 4)), 0)
          : 0;

        if (houveBloqueio) {
          this.registrarAlerta(camada, tipos, detectados, sanitizado, tempoMs, tokensEconomizados, options);
        }

        return {
          seguro: !houveBloqueio,
          conteudoSanitizado: sanitizado,
          dadosDetectados: detectados,
          tiposDetectados: tipos,
          tokensEconomizados,
          tempoMs,
          bloqueado: houveBloqueio
        };
      }

      // Se for objeto ou array (payloads de API, banco ou formulários)
      if (typeof conteudo === 'object') {
        const { sanitizadoObj, detectados, tipos } = this.verificarObjetoRecursivo(conteudo);
        const tempoMs = Math.max(0.1, performance.now() - t0);
        const houveBloqueio = detectados.length > 0;
        const tokensEconomizados = houveBloqueio 
          ? detectados.reduce((acc, d) => acc + Math.max(1, Math.ceil(d.length / 4)), 0)
          : 0;

        if (houveBloqueio) {
          this.registrarAlerta(camada, tipos, detectados, JSON.stringify(sanitizadoObj), tempoMs, tokensEconomizados, options);
        }

        return {
          seguro: !houveBloqueio,
          conteudoSanitizado: sanitizadoObj,
          dadosDetectados: detectados,
          tiposDetectados: tipos,
          tokensEconomizados,
          tempoMs,
          bloqueado: houveBloqueio
        };
      }

      return {
        seguro: true,
        conteudoSanitizado: conteudo,
        dadosDetectados: [],
        tiposDetectados: [],
        tokensEconomizados: 0,
        tempoMs: performance.now() - t0,
        bloqueado: false
      };
    } catch (error) {
      console.warn("AgenteSeguranca: Falha na inspeção da camada", error);
      return {
        seguro: false,
        conteudoSanitizado: BLOCKED_SECURITY_MESSAGE,
        dadosDetectados: ["ERRO_INTERNO_INSPECAO"],
        tiposDetectados: ["CREDENCIAIS_GERAIS"],
        tokensEconomizados: 0,
        tempoMs: Math.max(0.1, performance.now() - t0),
        bloqueado: true
      };
    }
  }

  /**
   * Regras de Detecção com Bloqueio Seletivo:
   * Bloqueia APENAS quando há risco real de exposição de dados ou chaves.
   * Termos conceituais e seguros passam sem interferência.
   */
  private verificarPadroesTexto(texto: string): { 
    sanitizado: string; 
    detectados: string[]; 
    tipos: SensitiveDataType[] 
  } {
    let sanitizado = texto;
    const detectados: string[] = [];
    const tipos: SensitiveDataType[] = [];

    const registrarDeteccao = (tipo: SensitiveDataType, valorOriginal: string, substituto: string = BLOCKED_SECURITY_MESSAGE) => {
      detectados.push(valorOriginal);
      if (!tipos.includes(tipo)) tipos.push(tipo);
      sanitizado = sanitizado.replace(valorOriginal, substituto);
    };

    // 1. CHAVES DE API REAIS (Google, OpenAI, Supabase, GitHub, Bearer)
    const googleKeyRegex = /\bAIza[0-9A-Za-z-_]{35}\b/g;
    let m: RegExpExecArray | null;
    while ((m = googleKeyRegex.exec(texto)) !== null) {
      registrarDeteccao('API_KEY', m[0]);
    }

    const openAiKeyRegex = /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g;
    while ((m = openAiKeyRegex.exec(texto)) !== null) {
      registrarDeteccao('API_KEY', m[0]);
    }

    const githubKeyRegex = /\b(?:ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{40,})\b/g;
    while ((m = githubKeyRegex.exec(texto)) !== null) {
      registrarDeteccao('API_KEY', m[0]);
    }

    const supabaseKeyRegex = /\b(?:sb_publishable_[A-Za-z0-9_-]{20,}|sb_secret_[A-Za-z0-9_-]{20,})\b/g;
    while ((m = supabaseKeyRegex.exec(texto)) !== null) {
      registrarDeteccao('API_KEY', m[0]);
    }

    // Atribuição explícita de API Key (ex: api_key = "12345", apiKey: 'xyz')
    const apiKeyAssignRegex = /(?:api[_-]?key|apikey|secret[_-]?key)\s*[:=]\s*["']?([A-Za-z0-9_\-\.]{12,})["']?/gi;
    while ((m = apiKeyAssignRegex.exec(texto)) !== null) {
      if (m[1] && !m[1].includes('blocked') && !m[1].includes('exemplo')) {
        registrarDeteccao('API_KEY', m[0], `api_key: "${BLOCKED_SECURITY_MESSAGE}"`);
      }
    }

    // 2. SENHAS E PASSWORDS (atribuições de risco real)
    const passAssignRegex = /(?:password|senha|passwd|pwd)\s*[:=]\s*["']?([^\s"'<>,;]{4,})["']?/gi;
    while ((m = passAssignRegex.exec(texto)) !== null) {
      const val = m[1];
      // Ignora placeholders comuns ou descrições conceituais
      if (val && !['obrigatoria', 'segura', 'valida', 'definir', '••••••••', '********'].includes(val.toLowerCase())) {
        registrarDeteccao('SENHA', m[0], `senha: "${BLOCKED_SECURITY_MESSAGE}"`);
      }
    }

    // 3. TOKENS E JWTS
    const jwtRegex = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
    while ((m = jwtRegex.exec(texto)) !== null) {
      registrarDeteccao('TOKEN', m[0]);
    }

    const bearerRegex = /Bearer\s+([A-Za-z0-9\-\._~\+\/]{25,})/gi;
    while ((m = bearerRegex.exec(texto)) !== null) {
      registrarDeteccao('TOKEN', m[0], `Bearer ${BLOCKED_SECURITY_MESSAGE}`);
    }

    // 4. CHAVES SECRETAS / CERTIFICADOS
    const pemRegex = /-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA )?PRIVATE KEY-----/gi;
    while ((m = pemRegex.exec(texto)) !== null) {
      registrarDeteccao('CHAVE_SECRETA', m[0]);
    }

    const clientSecretRegex = /(?:client[_-]?secret|chave[_-]?secreta|private[_-]?key)\s*[:=]\s*["']?([^\s"'<>,;]{8,})["']?/gi;
    while ((m = clientSecretRegex.exec(texto)) !== null) {
      registrarDeteccao('CHAVE_SECRETA', m[0], `chave_secreta: "${BLOCKED_SECURITY_MESSAGE}"`);
    }

    // 5. CPF (Formato formatado com validação ou atribuição direta)
    const cpfRegex = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g;
    while ((m = cpfRegex.exec(texto)) !== null) {
      registrarDeteccao('CPF', m[0]);
    }

    const cpfAssignRegex = /(?:cpf)\s*[:=]?\s*["']?(\d{11})["']?/gi;
    while ((m = cpfAssignRegex.exec(texto)) !== null) {
      registrarDeteccao('CPF', m[0], `cpf: "${BLOCKED_SECURITY_MESSAGE}"`);
    }

    // 6. CARTÃO DE CRÉDITO (Padrões de 13 a 19 dígitos)
    const cardFormattedRegex = /\b(?:\d{4}[ -]){3}\d{4}\b/g;
    while ((m = cardFormattedRegex.exec(texto)) !== null) {
      registrarDeteccao('CARTAO_CREDITO', m[0]);
    }

    const cardDigitsRegex = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g;
    while ((m = cardDigitsRegex.exec(texto)) !== null) {
      registrarDeteccao('CARTAO_CREDITO', m[0]);
    }

    // 7. EMAIL PESSOAL (vazamento explícito de identificadores em áreas públicas)
    const emailPessoalRegex = /(?:email pessoal|email privado|e-mail pessoal)\s*[:=]?\s*["']?([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})["']?/gi;
    while ((m = emailPessoalRegex.exec(texto)) !== null) {
      registrarDeteccao('EMAIL_PESSOAL', m[0], `email: "${BLOCKED_SECURITY_MESSAGE}"`);
    }

    return { sanitizado, detectados, tipos };
  }

  /**
   * Sanitização recursiva para payloads de objetos e arrays
   */
  private verificarObjetoRecursivo(obj: any): { 
    sanitizadoObj: any; 
    detectados: string[]; 
    tipos: SensitiveDataType[] 
  } {
    const detectados: string[] = [];
    const tipos: SensitiveDataType[] = [];

    const clonar = (item: any): any => {
      if (item === null || item === undefined) return item;
      
      if (typeof item === 'string') {
        const res = this.verificarPadroesTexto(item);
        if (res.detectados.length > 0) {
          detectados.push(...res.detectados);
          res.tipos.forEach(t => { if (!tipos.includes(t)) tipos.push(t); });
          return res.sanitizado;
        }
        return item;
      }

      if (Array.isArray(item)) {
        return item.map(clonar);
      }

      if (typeof item === 'object') {
        const novo: Record<string, any> = {};
        for (const k of Object.keys(item)) {
          const lowerK = k.toLowerCase();
          const isKeySensitive = 
            lowerK.includes('password') || 
            lowerK.includes('senha') || 
            lowerK.includes('secret') || 
            lowerK.includes('token') || 
            lowerK.includes('api_key') || 
            lowerK.includes('apikey') ||
            lowerK.includes('credit_card') ||
            lowerK.includes('cartao');

          if (isKeySensitive && typeof item[k] === 'string' && item[k].length > 3) {
            detectados.push(`${k}=${item[k]}`);
            if (!tipos.includes('CREDENCIAIS_GERAIS')) tipos.push('CREDENCIAIS_GERAIS');
            novo[k] = BLOCKED_SECURITY_MESSAGE;
          } else {
            novo[k] = clonar(item[k]);
          }
        }
        return novo;
      }

      return item;
    };

    const sanitizadoObj = clonar(obj);
    return { sanitizadoObj, detectados, tipos };
  }

  /**
   * Registra o evento de detecção no Supabase audit_logs e no cache em memória
   */
  private async registrarAlerta(
    camada: SecurityLayer,
    tipos: SensitiveDataType[],
    detectados: string[],
    conteudoMascarado: string,
    tempoMs: number,
    tokensEconomizados: number,
    options?: { origem?: string; context?: Record<string, any> }
  ) {
    const timestamp = new Date().toISOString();
    const id = `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const valorResumido = detectados.map(d => {
      // Mascara parte do valor para não registrar o segredo cru nem nos logs de auditoria
      if (d.length > 8) {
        return `${d.substring(0, 3)}***${d.substring(d.length - 3)}`;
      }
      return '***';
    }).join(', ');

    const logEntry: SecurityDetectionLog = {
      id,
      camada,
      tipo_dado: tipos.join(', ') || 'DADO_SENSIVEL',
      valor_detectado: `Padrao [${tipos.join('/')}] (${valorResumido})`,
      conteudo_mascarado: conteudoMascarado.substring(0, 200),
      timestamp,
      tempo_resposta_ms: Math.round(tempoMs * 10) / 10,
      tokens_economizados: tokensEconomizados,
      status: 'bloqueado',
      origem: options?.origem || 'Guardião Global',
      detalhes: options?.context || {}
    };

    // 1. Armazena no cache volátil local
    inMemorySecurityLogs.unshift(logEntry);
    if (inMemorySecurityLogs.length > MAX_IN_MEMORY_LOGS) {
      inMemorySecurityLogs.pop();
    }

    // 2. Dispara evento customizado no frontend para atualização instantânea dos Badges e Consoles
    if (this.isBrowser) {
      try {
        window.dispatchEvent(new CustomEvent('security-guardian-block', { detail: logEntry }));
      } catch (e) {
        // Silencia erro de evento
      }
    }

    // 3. Persistência de auditoria no Supabase audit_logs
    try {
      if (this.supabase) {
        await this.supabase.from("audit_logs").insert({
          agent_name: "AgenteSeguranca",
          action: "detecção_global",
          details: {
            camada,
            valor_detectado: logEntry.valor_detectado,
            tipo_dado: logEntry.tipo_dado,
            timestamp,
            tokens_economizados: tokensEconomizados,
            response_time_ms: logEntry.tempo_resposta_ms,
            origem: logEntry.origem
          },
          timestamp
        });
      }
    } catch (err) {
      console.warn("AgenteSeguranca: Falha ao enviar alerta para audit_logs no Supabase", err);
    }
  }

  // ===== MÉTODOS ESPECIALIZADOS POR CAMADA =====

  /**
   * Frontend: Valida inputs, labels, tooltips, placeholders e mensagens renderizadas
   */
  inspecionarFrontend(texto: string, context?: { elementId?: string; type?: 'input' | 'label' | 'placeholder' | 'render' }): string {
    const res = this.inspecionarCamada('frontend', texto, { origem: `UI_${context?.type || 'element'}` });
    return res.conteudoSanitizado;
  }

  /**
   * Backend: Inspeciona rotas, middlewares, payloads e logs
   */
  inspecionarBackend(payload: any, path?: string): any {
    const res = this.inspecionarCamada('backend', payload, { origem: `Route_${path || 'api'}` });
    return res.conteudoSanitizado;
  }

  /**
   * Banco de Dados (Supabase): Monitora queries e registros, bloqueando inserção/leitura sensível
   */
  inspecionarBanco(tableName: string, operacao: 'select' | 'insert' | 'update' | 'delete', payload: any): { seguro: boolean; sanitizado: any } {
    const res = this.inspecionarCamada('banco', payload, { origem: `Table_${tableName}_${operacao}` });
    return {
      seguro: res.seguro,
      sanitizado: res.conteudoSanitizado
    };
  }

  /**
   * Autenticação: Bloqueia acessos não autorizados e valida tentativas com Google OAuth
   */
  emailAutorizado(email?: string | null): boolean {
    return (email || '').trim().toLowerCase() === EMAIL_AUTORIZADO;
  }

  /**
   * Autenticação: libera somente a conta autorizada. Qualquer outra é registrada em
   * audit_logs (login_bloqueado) ANTES do signOut, enquanto a sessão ainda existe.
   */
  async inspecionarAuth(email: string, contexto?: any, camada: SecurityLayer = 'auth'): Promise<{ permitido: boolean; motivo?: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (cleanEmail === EMAIL_AUTORIZADO) return { permitido: true };

    await this.registrarLoginBloqueado(cleanEmail, contexto, camada);
    return { permitido: false, motivo: MENSAGEM_ACESSO_RESTRITO };
  }

  private async registrarLoginBloqueado(emailTentativa: string, contexto: any, camada: SecurityLayer) {
    const timestamp = new Date().toISOString();
    const logEntry: SecurityDetectionLog = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      camada,
      tipo_dado: 'LOGIN_NAO_AUTORIZADO',
      valor_detectado: emailTentativa || '(vazio)',
      conteudo_mascarado: 'Tentativa de acesso não autorizada bloqueada',
      timestamp,
      tempo_resposta_ms: 0.5,
      tokens_economizados: 0,
      status: 'bloqueado',
      origem: 'Google_OAuth_Guard',
      detalhes: contexto || {}
    };

    inMemorySecurityLogs.unshift(logEntry);
    if (inMemorySecurityLogs.length > MAX_IN_MEMORY_LOGS) inMemorySecurityLogs.pop();

    if (this.isBrowser) {
      try {
        window.dispatchEvent(new CustomEvent('security-guardian-block', { detail: logEntry }));
      } catch (e) {
        // Silencia erro de evento
      }
    }

    try {
      if (this.supabase) {
        await this.supabase.from('audit_logs').insert({
          agent_name: 'AgenteSeguranca',
          action: 'login_bloqueado',
          details: { camada, email_tentativa: emailTentativa, timestamp, status: 'bloqueado' },
          timestamp
        });
      }
    } catch (err) {
      console.warn('AgenteSeguranca: Falha ao registrar login_bloqueado', err);
    }
  }

  /**
   * Respostas da IA: Valida saídas do Orquestrador e LLMs antes da entrega
   */
  inspecionarIA(saidaIA: string, promptOrigem?: string): string {
    const res = this.inspecionarCamada('ia', saidaIA, { origem: 'Orquestrador_LLM', context: { promptOrigem } });
    return res.conteudoSanitizado;
  }

  /**
   * APIs Externas: Inspeciona chamadas e respostas de serviços externos
   */
  inspecionarAPI(url: string, payloadEnvio?: any, payloadResposta?: any): { seguro: boolean; envioSanitizado: any; respostaSanitizada: any } {
    const resEnvio = payloadEnvio ? this.inspecionarCamada('api', payloadEnvio, { origem: `API_Req_${url}` }) : null;
    const resResp = payloadResposta ? this.inspecionarCamada('api', payloadResposta, { origem: `API_Res_${url}` }) : null;

    return {
      seguro: (resEnvio?.seguro ?? true) && (resResp?.seguro ?? true),
      envioSanitizado: resEnvio?.conteudoSanitizado ?? payloadEnvio,
      respostaSanitizada: resResp?.conteudoSanitizado ?? payloadResposta
    };
  }

  /**
   * Retorna os últimos bloqueios registrados em memória
   */
  obterUltimosBloqueios(): SecurityDetectionLog[] {
    return [...inMemorySecurityLogs];
  }

  /**
   * Retorna métricas consolidadas de segurança
   */
  obterEstatisticas(): SecurityMetrics {
    const porCamada: Record<SecurityLayer, number> = {
      frontend: 0,
      backend: 0,
      banco: 0,
      auth: 0,
      ia: 0,
      api: 0
    };

    let tokensEconomizadosTotal = 0;
    let somaTempoMs = 0;

    for (const log of inMemorySecurityLogs) {
      if (porCamada[log.camada] !== undefined) {
        porCamada[log.camada]++;
      }
      tokensEconomizadosTotal += log.tokens_economizados || 0;
      somaTempoMs += log.tempo_resposta_ms || 0;
    }

    const totalBloqueios = inMemorySecurityLogs.length;
    const tempoMedioMs = totalBloqueios > 0 ? Math.round((somaTempoMs / totalBloqueios) * 10) / 10 : 0.8;
    const ultimoBloqueioTimestamp = inMemorySecurityLogs[0]?.timestamp || null;

    return {
      totalBloqueios,
      porCamada,
      tokensEconomizadosTotal,
      tempoMedioMs,
      ultimoBloqueioTimestamp
    };
  }

  /**
   * Simula uma detecção em qualquer camada para testes em tempo real no console
   */
  simularDeteccao(camada: SecurityLayer, textoTeste: string): SecurityInspectionResult {
    return this.inspecionarCamada(camada, textoTeste, { origem: 'Simulador_Seguranca' });
  }

  /**
   * Limpa histórico local
   */
  limparLogsLocais(): void {
    inMemorySecurityLogs.length = 0;
  }
}

// Instância singleton global do Agente de Segurança
export const agenteSeguranca = new AgenteSeguranca();
export * from './types';
export default AgenteSeguranca;

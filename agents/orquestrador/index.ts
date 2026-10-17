import { AgenteCache } from "../cache";
import { AgenteSeguranca } from "../seguranca/AgenteSeguranca";
import { AgenteMemoria } from "../memoria";
import { AgenteAuditoria } from "../auditoria";

/**
 * Constantes padronizadas para ações de log e auditoria do Orquestrador.
 */
export const LOG_ACTIONS = {
  EXECUCAO: "execucao",
  ERRO: "erro",
  CACHE_HIT: "cache_hit",
  MEMORIA_HIT: "memoria_hit",
} as const;

export type LogActionType = typeof LOG_ACTIONS[keyof typeof LOG_ACTIONS];

/**
 * Mensagem segura e genérica retornada ao usuário em casos de falha inesperada.
 */
export const MENSAGEM_ERRO_GENERICA =
  "Ocorreu um erro ao processar sua solicitação com o agente. Por favor, tente novamente mais tarde.";

/**
 * Orquestrador principal responsável por coordenar o fluxo entre segurança,
 * camadas de cache, memória de histórico, execução de IA e trilha de auditoria.
 */
export class AgenteOrquestrador {
  private cache: AgenteCache;
  private seguranca: AgenteSeguranca;
  private memoria: AgenteMemoria;
  private auditoria: AgenteAuditoria;

  /**
   * Construtor com Injeção de Dependências para maximizar modularidade e testabilidade.
   *
   * @param cache Instância responsável pelo cache em memória de respostas rápidas
   * @param memoria Instância responsável pela persistência e busca de histórico
   * @param auditoria Instância responsável pelo registro e rastreabilidade de eventos
   * @param seguranca Instância responsável pela inspeção e sanitização de dados
   */
  constructor(
    cache?: AgenteCache,
    memoria?: AgenteMemoria,
    auditoria?: AgenteAuditoria,
    seguranca?: AgenteSeguranca
  ) {
    this.cache = cache ?? new AgenteCache();
    this.memoria = memoria ?? new AgenteMemoria();
    this.auditoria = auditoria ?? new AgenteAuditoria();
    this.seguranca = seguranca ?? new AgenteSeguranca();
  }

  /**
   * Executa o fluxo orquestrado para um prompt fornecido de forma segura e resiliente.
   *
   * Etapas executadas:
   * 1. Segurança: Inspeciona e sanitiza a entrada contra vazamentos e dados sensíveis.
   * 2. Cache: Verifica no cache em memória por respostas idênticas anteriores.
   * 3. Memória: Consulta a base de histórico de execuções anteriores no Supabase.
   * 4. IA: Gera e sanitiza a saída através do guardião de segurança.
   * 5. Auditoria & Persistência: Armazena em cache, histórico e registra trilha de auditoria.
   * 6. Tratamento de Erros: Captura exceções, registra falha via logAtividade e retorna fallback seguro.
   *
   * @param prompt Texto ou comando de entrada a ser processado
   * @returns Promise<string> Resposta final sanitizada ou mensagem segura em caso de erro
   */
  async executar(prompt: string): Promise<string> {
    try {
      // 1. Segurança: Inspeciona e sanitiza a entrada contra dados sensíveis
      const promptInspecionado = this.seguranca.inspecionarCamada("ia", prompt, {
        origem: "Orquestrador_Prompt_Entrada",
      });
      const promptSeguro = promptInspecionado.conteudoSanitizado;

      // 2. Cache: Consulta cache em memória para resposta instantânea
      const respostaCache = this.cache.get(promptSeguro);
      if (respostaCache) {
        await this.auditoria.logAction("AgenteOrquestrador", LOG_ACTIONS.CACHE_HIT, {
          prompt: promptSeguro,
        });
        return `♻️ Resposta do cache: ${respostaCache}`;
      }

      // 3. Memória: Consulta histórico de execuções persistidas
      const respostaMemoria = await this.memoria.verificarHistorico(promptSeguro);
      if (respostaMemoria) {
        await this.auditoria.logAction("AgenteOrquestrador", LOG_ACTIONS.MEMORIA_HIT, {
          prompt: promptSeguro,
        });
        return `🧠 Resposta da memória: ${respostaMemoria}`;
      }

      // 4. Execução IA: Gera resposta e aplica inspeção de segurança na saída
      const respostaIA = `✨ Nova resposta gerada para: ${promptSeguro}`;
      const respostaSegura = this.seguranca.inspecionarIA(respostaIA, promptSeguro);

      // 5. Persistência & Auditoria: Salva no cache, memória e gera log estruturado
      this.cache.set(promptSeguro, respostaSegura);
      await this.memoria.salvarResultado("AgenteOrquestrador", promptSeguro, respostaSegura);
      await this.auditoria.logAction("AgenteOrquestrador", LOG_ACTIONS.EXECUCAO, {
        prompt: promptSeguro,
        respostaSegura,
        tokensEconomizados: promptInspecionado.tokensEconomizados,
      });

      return respostaSegura;
    } catch (error: any) {
      // 6. Tratamento de Erros: Registra falha na auditoria e retorna resposta segura e genérica
      const mensagemErro = error instanceof Error ? error.message : String(error);
      await this.auditoria.logAtividade(LOG_ACTIONS.ERRO, { mensagem: mensagemErro });

      return MENSAGEM_ERRO_GENERICA;
    }
  }
}

export default AgenteOrquestrador;

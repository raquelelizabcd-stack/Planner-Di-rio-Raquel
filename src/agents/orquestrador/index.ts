import { AgenteCache } from "../cache";
import { AgenteSeguranca } from "../seguranca";
import { AgenteMemoria } from "../memoria";
import { AgenteAuditoria } from "../auditoria";

export class AgenteOrquestrador {
  private cache = new AgenteCache();
  private seguranca = new AgenteSeguranca();
  private memoria = new AgenteMemoria();
  private auditoria = new AgenteAuditoria();

  async executar(prompt: string): Promise<string> {
    // 1. Inspeciona a entrada com o Guardião Global de Segurança
    const promptInspecionado = this.seguranca.inspecionarCamada('ia', prompt, {
      origem: 'Orquestrador_Prompt_Entrada'
    });
    const promptSeguro = promptInspecionado.conteudoSanitizado;

    // 2. Consulta Cache
    const respostaCache = this.cache.get(promptSeguro);
    if (respostaCache) return `♻️ Resposta do cache: ${respostaCache}`;

    // 3. Consulta Memória
    const respostaMemoria = await this.memoria.verificarHistorico(promptSeguro);
    if (respostaMemoria) return `🧠 Resposta da memória: ${respostaMemoria}`;

    // 4. Geração de Resposta pela IA
    const respostaIA = `✨ Nova resposta gerada para: ${promptSeguro}`;
    
    // 5. Inspeciona e sanitiza a saída da IA com bloqueio seletivo
    const respostaSegura = this.seguranca.inspecionarIA(respostaIA, promptSeguro);

    // 6. Armazena apenas o conteúdo aprovado
    this.cache.set(promptSeguro, respostaSegura);
    await this.memoria.salvarResultado("AgenteOrquestrador", promptSeguro, respostaSegura);
    await this.auditoria.logAction("AgenteOrquestrador", "execucao", { 
      prompt: promptSeguro, 
      respostaSegura,
      tokensEconomizados: promptInspecionado.tokensEconomizados
    });

    return respostaSegura;
  }
}

export default AgenteOrquestrador;

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
    const promptInspecionado = this.seguranca.inspecionarCamada('ia', prompt, {
      origem: 'Orquestrador_Prompt_Entrada'
    });
    const promptSeguro = promptInspecionado.conteudoSanitizado;

    const respostaCache = this.cache.get(promptSeguro);
    if (respostaCache) return `♻️ Resposta do cache: ${respostaCache}`;

    const respostaMemoria = await this.memoria.verificarHistorico(promptSeguro);
    if (respostaMemoria) return `🧠 Resposta da memória: ${respostaMemoria}`;

    const respostaIA = `✨ Nova resposta gerada para: ${promptSeguro}`;
    const respostaSegura = this.seguranca.inspecionarIA(respostaIA, promptSeguro);

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

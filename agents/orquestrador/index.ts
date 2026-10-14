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
    const respostaCache = this.cache.get(prompt);
    if (respostaCache) return `♻️ Resposta do cache: ${respostaCache}`;

    const respostaMemoria = await this.memoria.verificarHistorico(prompt);
    if (respostaMemoria) return `🧠 Resposta da memória: ${respostaMemoria}`;

    const respostaIA = `✨ Nova resposta gerada para: ${prompt}`;
    const respostaSegura = this.seguranca.validarSaida(respostaIA);

    this.cache.set(prompt, respostaSegura);
    await this.memoria.salvarResultado("AgenteOrquestrador", prompt, respostaSegura);
    await this.auditoria.logAction("AgenteOrquestrador", "execucao", { prompt, respostaSegura });

    return respostaSegura;
  }
}

export default AgenteOrquestrador;

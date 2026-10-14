export type AgentStatusType = 'ativo' | 'em execução' | 'em espera';

export class AgenteCache {
  public readonly id = 'cache';
  public readonly name = 'Agente de Cache';
  public readonly role = 'Desempenho & Otimização';
  public readonly avatar = 'caixa de arquivos';
  public status: AgentStatusType = 'ativo';
  public readonly description = 'Armazena respostas frequentes, reduz requisições redundantes de rede e acelera o tempo de carregamento no Planner.';

  public async invalidarCache(chave?: string): Promise<string> {
    this.status = 'em execução';
    await new Promise(resolve => setTimeout(resolve, 200));
    this.status = 'ativo';
    return chave ? `Cache para ${chave} renovado com sucesso.` : 'Cache global otimizado.';
  }

  public getStatus(): AgentStatusType {
    return this.status;
  }
}

export default AgenteCache;

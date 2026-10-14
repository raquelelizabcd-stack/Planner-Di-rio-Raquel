export type AgentStatusType = 'ativo' | 'em execução' | 'em espera';

export class AgenteFoco {
  public readonly id = 'foco';
  public readonly name = 'Agente de Foco';
  public readonly role = 'Produtividade & Pomodoro';
  public readonly avatar = 'relógio/ampulheta';
  public status: AgentStatusType = 'em espera';
  public readonly description = 'Gerencia ciclos de produtividade (Pomodoro), cronometra sessões de trabalho profundo e mantém o ritmo produtivo da Raquel.';

  public async iniciarSessaoFoco(minutos: number = 25): Promise<string> {
    this.status = 'em execução';
    return `Sessão de foco intenso iniciada por ${minutos} minutos. Modo sem distrações ativo.`;
  }

  public getStatus(): AgentStatusType {
    return this.status;
  }
}

export default AgenteFoco;

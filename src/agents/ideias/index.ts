export type AgentStatusType = 'ativo' | 'em execução' | 'em espera';

export class AgenteIdeias {
  public readonly id = 'ideias';
  public readonly name = 'Agente de Ideias';
  public readonly role = 'Criatividade & Brainstorming';
  public readonly avatar = 'lâmpada';
  public status: AgentStatusType = 'ativo';
  public readonly description = 'Brainstorming contínuo, sugestão de temas inovadores para redes sociais, novos formatos de aula e propostas criativas para o ecossistema do Planner.';

  public async gerarIdeiasCriativas(nicho: string = 'Marketing & Tecnologia'): Promise<string[]> {
    this.status = 'em execução';
    await new Promise(resolve => setTimeout(resolve, 300));
    this.status = 'ativo';
    return [
      `Tendências emergentes de IA no ensino técnico de ${nicho}`,
      `Estratégia de conteúdo em formato carrossel imersivo sobre ${nicho}`,
      `Gamificação de estudos para aumentar a retenção dos estudantes em ${nicho}`
    ];
  }

  public getStatus(): AgentStatusType {
    return this.status;
  }
}

export default AgenteIdeias;

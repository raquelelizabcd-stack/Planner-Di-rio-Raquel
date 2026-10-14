export type AgentStatusType = 'ativo' | 'em execução' | 'em espera';

export class AgenteCalendario {
  public readonly id = 'calendario';
  public readonly name = 'Agente de Calendário';
  public readonly role = 'Cronograma & Agendamentos';
  public readonly avatar = 'agenda';
  public status: AgentStatusType = 'ativo';
  public readonly description = 'Organiza eventos, prazos, agendamento de posts nas mídias sociais e sincroniza os cronogramas diários do Planner.';

  public async sincronizarCronograma(): Promise<string> {
    this.status = 'em execução';
    await new Promise(resolve => setTimeout(resolve, 350));
    this.status = 'ativo';
    return 'Cronograma e eventos sincronizados com sucesso no Planner.';
  }

  public getStatus(): AgentStatusType {
    return this.status;
  }
}

export default AgenteCalendario;

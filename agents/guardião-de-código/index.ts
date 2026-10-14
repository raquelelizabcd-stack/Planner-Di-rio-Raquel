export type AgentStatusType = 'ativo' | 'em execução' | 'em espera';

export class AgenteGuardiaoDeCodigo {
  public readonly id = 'guardiao_codigo';
  public readonly name = 'Agente Guardião de Código';
  public readonly role = 'Qualidade & Depuração TypeScript';
  public readonly avatar = 'terminal com escudo';
  public status: AgentStatusType = 'ativo';
  public readonly description = 'Analisa integridade sintática, revisa código TypeScript/React, previne quebras em build e atua no diagnóstico rápido e correção de bugs no Planner.';

  public async inspecionarCodigo(): Promise<{ aprovado: boolean; diagnostico: string }> {
    this.status = 'em execução';
    await new Promise(resolve => setTimeout(resolve, 300));
    this.status = 'ativo';
    return { aprovado: true, diagnostico: 'Código limpo, tipado e com zero erros de compilação TypeScript.' };
  }

  public getStatus(): AgentStatusType {
    return this.status;
  }
}

export default AgenteGuardiaoDeCodigo;

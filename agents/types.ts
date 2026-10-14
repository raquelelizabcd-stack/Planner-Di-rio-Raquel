export type AgentStatusType = 'ativo' | 'em execução' | 'em espera';

export interface VirtualDeskInfo {
  deskNumber: number;
  area: string;
  itemsOnDesk: string[];
}

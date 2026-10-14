export class AgenteCalendario {
  criarEvento(titulo: string, inicio: string, fim: string) {
    return `📅 Evento criado: ${titulo} (${inicio} → ${fim})`;
  }
}

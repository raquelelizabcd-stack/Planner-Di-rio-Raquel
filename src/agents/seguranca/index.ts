export class AgenteSeguranca {
  validarSaida(texto: string): string {
    if (texto.includes("API_KEY") || texto.includes("senha")) {
      return "⚠️ Conteúdo bloqueado por segurança.";
    }
    return texto;
  }
}

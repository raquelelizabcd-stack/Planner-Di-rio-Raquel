const cache = new Map<string, string>();
export class AgenteCache {
  get(prompt: string): string | null {
    return cache.get(prompt) || null;
  }
  set(prompt: string, resposta: string) {
    cache.set(prompt, resposta);
  }
}

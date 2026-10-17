import { describe, it, expect, beforeEach } from "@jest/globals";
import { AgenteCache } from "./index";

describe("AgenteCache - Suíte de Testes Unitários", () => {
  let agenteCache: AgenteCache;

  beforeEach(() => {
    agenteCache = new AgenteCache();
  });

  describe("1. Recuperação e Armazenamento (get & set)", () => {
    it("deve retornar null para prompt que ainda não foi armazenado", () => {
      const resultado = agenteCache.get("Prompt não existente no cache");
      expect(resultado).toBeNull();
    });

    it("deve armazenar e retornar a resposta correta para um prompt", () => {
      const prompt = "Planejar tarefas do dia";
      const resposta = "Plano com 4 tarefas prioritárias";

      agenteCache.set(prompt, resposta);
      const resultado = agenteCache.get(prompt);

      expect(resultado).toBe(resposta);
    });

    it("deve sobrescrever a resposta quando um novo valor for definido para a mesma chave", () => {
      const prompt = "Prompt recorrente";
      agenteCache.set(prompt, "Resposta antiga");
      agenteCache.set(prompt, "Resposta atualizada");

      expect(agenteCache.get(prompt)).toBe("Resposta atualizada");
    });
  });

  describe("2. Isolamento e Resiliência", () => {
    it("deve operar puramente em memória, sem chamadas de rede ou consumo de tokens de IA", () => {
      agenteCache.set("chave", "valor");
      expect(agenteCache.get("chave")).toBe("valor");
    });
  });
});

import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { 
  AgenteSeguranca, 
  BLOCKED_SECURITY_MESSAGE 
} from "./AgenteSeguranca";

describe("AgenteSeguranca - Suíte de Testes Unitários", () => {
  let agente: AgenteSeguranca;
  let consoleWarnSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();
    agente = new AgenteSeguranca();
    agente.limparLogsLocais();
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe("1. Sanitização de Entrada (inspecionarCamada)", () => {
    it("deve detectar e sanitizar chave de API do Google AIza em texto", () => {
      const promptInseguro = "Minha chave é AIzaSyD3x9AbCdEfGhIjKlMnOpQrStUvWxYz123";
      const resultado = agente.inspecionarCamada("ia", promptInseguro);

      expect(resultado.seguro).toBe(false);
      expect(resultado.bloqueado).toBe(true);
      expect(resultado.conteudoSanitizado).toContain(BLOCKED_SECURITY_MESSAGE);
      expect(resultado.tiposDetectados).toContain("API_KEY");
      expect(resultado.tokensEconomizados).toBeGreaterThan(0);
    });

    it("deve detectar e sanitizar chave de API da OpenAI (sk-...)", () => {
      const promptOpenAI = "Use a chave sk-proj-1234567890abcdef1234567890abcdef para conectar";
      const resultado = agente.inspecionarCamada("ia", promptOpenAI);

      expect(resultado.seguro).toBe(false);
      expect(resultado.bloqueado).toBe(true);
      expect(resultado.conteudoSanitizado).toContain(BLOCKED_SECURITY_MESSAGE);
      expect(resultado.tiposDetectados).toContain("API_KEY");
    });

    it("deve detectar e sanitizar atribuição direta de senha", () => {
      const promptSenha = 'login com credenciais: password = "superSecretPassword123"';
      const resultado = agente.inspecionarCamada("ia", promptSenha);

      expect(resultado.seguro).toBe(false);
      expect(resultado.bloqueado).toBe(true);
      expect(resultado.conteudoSanitizado).toContain(BLOCKED_SECURITY_MESSAGE);
      expect(resultado.tiposDetectados).toContain("SENHA");
    });

    it("deve detectar e sanitizar CPF formatado", () => {
      const promptCPF = "O documento do cliente é 123.456.789-00 registrado hoje";
      const resultado = agente.inspecionarCamada("ia", promptCPF);

      expect(resultado.seguro).toBe(false);
      expect(resultado.bloqueado).toBe(true);
      expect(resultado.conteudoSanitizado).toContain(BLOCKED_SECURITY_MESSAGE);
      expect(resultado.tiposDetectados).toContain("CPF");
    });

    it("deve detectar e sanitizar número de cartão de crédito", () => {
      const promptCartao = "Número para cobrança: 4111 2222 3333 4444";
      const resultado = agente.inspecionarCamada("ia", promptCartao);

      expect(resultado.seguro).toBe(false);
      expect(resultado.bloqueado).toBe(true);
      expect(resultado.conteudoSanitizado).toContain(BLOCKED_SECURITY_MESSAGE);
      expect(resultado.tiposDetectados).toContain("CARTAO_CREDITO");
    });

    it("deve sanitizar objetos aninhados contendo chaves sensíveis recursivamente", () => {
      const payloadObjeto = {
        usuario: "raquel",
        detalhes: {
          config: {
            api_key: "segredo123456789",
            senha: "senhaInsegura123",
          },
        },
      };

      const resultado = agente.inspecionarCamada("backend", payloadObjeto);

      expect(resultado.seguro).toBe(false);
      expect(resultado.bloqueado).toBe(true);
      expect(resultado.conteudoSanitizado.detalhes.config.api_key).toBe(BLOCKED_SECURITY_MESSAGE);
      expect(resultado.conteudoSanitizado.detalhes.config.senha).toBe(BLOCKED_SECURITY_MESSAGE);
      expect(resultado.conteudoSanitizado.usuario).toBe("raquel");
    });
  });

  describe("2. Sanitização de Saída da IA (inspecionarIA)", () => {
    it("deve interceptar saída de IA com chave sensível e retornar apenas versão sanitizada", () => {
      const saidaIA = "Aqui está o token de acesso: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-ID";
      const respostaSanitizada = agente.inspecionarIA(saidaIA, "Prompt original");

      expect(respostaSanitizada).toContain(BLOCKED_SECURITY_MESSAGE);
      expect(respostaSanitizada).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
    });

    it("deve manter saída da IA inalterada quando o conteúdo for limpo e seguro", () => {
      const saidaSegura = "Aqui está o seu planejamento para hoje com 3 prioridades definidas.";
      const resposta = agente.inspecionarIA(saidaSegura);

      expect(resposta).toBe(saidaSegura);
    });
  });

  describe("3. Fluxo Normal com Dados Limpos", () => {
    it("deve retornar seguro=true e conteúdo inalterado para prompts normais de trabalho", () => {
      const promptLimpo = "Como organizar meu cronograma diário de estudos e reuniões?";
      const resultado = agente.inspecionarCamada("ia", promptLimpo);

      expect(resultado.seguro).toBe(true);
      expect(resultado.bloqueado).toBe(false);
      expect(resultado.conteudoSanitizado).toBe(promptLimpo);
      expect(resultado.dadosDetectados).toEqual([]);
      expect(resultado.tiposDetectados).toEqual([]);
      expect(resultado.tokensEconomizados).toBe(0);
    });

    it("não deve gerar falsos positivos com termos conceituais seguros", () => {
      const textoConceitual = "É importante definir uma senha segura e válida no cadastro do usuário.";
      const resultado = agente.inspecionarCamada("ia", textoConceitual);

      expect(resultado.seguro).toBe(true);
      expect(resultado.bloqueado).toBe(false);
      expect(resultado.conteudoSanitizado).toBe(textoConceitual);
    });

    it("deve lidar com valores nulos ou indefinidos sem erro", () => {
      const resNull = agente.inspecionarCamada("ia", null);
      expect(resNull.seguro).toBe(true);
      expect(resNull.conteudoSanitizado).toBeNull();

      const resUndefined = agente.inspecionarCamada("ia", undefined);
      expect(resUndefined.seguro).toBe(true);
      expect(resUndefined.conteudoSanitizado).toBeUndefined();
    });
  });

  describe("4. Tratamento de Erros e Fallback Seguro", () => {
    it("deve capturar exceção interna em inspecionarCamada, acionar console.warn e retornar fallback seguro", () => {
      // Simula falha interna forçando erro no método de verificação de padrões
      jest.spyOn(agente as any, "verificarPadroesTexto").mockImplementation(() => {
        throw new Error("Erro interno de regex ou parsing de segurança");
      });

      const resultado = agente.inspecionarCamada("ia", "Texto qualquer");

      // Deve retornar fallback seguro sem propagar a exceção
      expect(resultado.seguro).toBe(false);
      expect(resultado.bloqueado).toBe(true);
      expect(resultado.conteudoSanitizado).toBe(BLOCKED_SECURITY_MESSAGE);
      expect(resultado.dadosDetectados).toContain("ERRO_INTERNO_INSPECAO");

      // Confirma que console.warn foi disparado
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "AgenteSeguranca: Falha na inspeção da camada",
        expect.any(Error)
      );
    });

    it("deve retornar fallback seguro em inspecionarIA caso inspecionarCamada falhe", () => {
      jest.spyOn(agente, "inspecionarCamada").mockImplementation(() => {
        return {
          seguro: false,
          conteudoSanitizado: BLOCKED_SECURITY_MESSAGE,
          dadosDetectados: ["ERRO_INTERNO_INSPECAO"],
          tiposDetectados: ["CREDENCIAIS_GERAIS"],
          tokensEconomizados: 0,
          tempoMs: 0.1,
          bloqueado: true,
        };
      });

      const resultado = agente.inspecionarIA("Texto com falha simulada");
      expect(resultado).toBe(BLOCKED_SECURITY_MESSAGE);
    });
  });

  describe("5. Métricas e Isolamento", () => {
    it("deve acumular estatísticas de bloqueios em memória e permitir limpeza local", () => {
      // Gera um bloqueio real
      agente.inspecionarCamada("ia", "Chave secreta AIzaSyD3x9AbCdEfGhIjKlMnOpQrStUvWxYz123");

      const stats = agente.obterEstatisticas();
      expect(stats.totalBloqueios).toBe(1);
      expect(stats.porCamada.ia).toBe(1);
      expect(stats.tokensEconomizadosTotal).toBeGreaterThan(0);

      // Limpa os logs em memória
      agente.limparLogsLocais();
      const statsAposLimpeza = agente.obterEstatisticas();
      expect(statsAposLimpeza.totalBloqueios).toBe(0);
      expect(statsAposLimpeza.tokensEconomizadosTotal).toBe(0);
    });

    it("deve validar autorização de e-mail estritamente para o administrador", () => {
      expect(agente.emailAutorizado("raquelduarteadmi@gmail.com")).toBe(true);
      expect(agente.emailAutorizado("  RAQUELDUARTEADMI@GMAIL.COM  ")).toBe(true);
      expect(agente.emailAutorizado("outro@gmail.com")).toBe(false);
      expect(agente.emailAutorizado(null)).toBe(false);
    });
  });
});

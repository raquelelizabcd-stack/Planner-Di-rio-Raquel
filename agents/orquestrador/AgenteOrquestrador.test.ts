import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { 
  AgenteOrquestrador, 
  LOG_ACTIONS, 
  MENSAGEM_ERRO_GENERICA 
} from "./index";
import type { AgenteCache } from "../cache";
import type { AgenteMemoria } from "../memoria";
import type { AgenteAuditoria } from "../auditoria";
import type { AgenteSeguranca } from "../seguranca";

describe("AgenteOrquestrador - Suíte de Testes Unitários", () => {
  let mockCache: {
    get: ReturnType<typeof jest.fn>;
    set: ReturnType<typeof jest.fn>;
  };

  let mockMemoria: {
    verificarHistorico: ReturnType<typeof jest.fn>;
    salvarResultado: ReturnType<typeof jest.fn>;
  };

  let mockAuditoria: {
    logAction: ReturnType<typeof jest.fn>;
    logAtividade: ReturnType<typeof jest.fn>;
  };

  let mockSeguranca: {
    inspecionarCamada: ReturnType<typeof jest.fn>;
    inspecionarIA: ReturnType<typeof jest.fn>;
  };

  let orquestrador: AgenteOrquestrador;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCache = {
      get: jest.fn<any>().mockReturnValue(null),
      set: jest.fn<any>(),
    };

    mockMemoria = {
      verificarHistorico: jest.fn<() => Promise<any>>().mockResolvedValue(null),
      salvarResultado: jest.fn<() => Promise<any>>().mockResolvedValue(undefined),
    };

    mockAuditoria = {
      logAction: jest.fn<() => Promise<any>>().mockResolvedValue(undefined),
      logAtividade: jest.fn<() => Promise<any>>().mockResolvedValue(undefined),
    };

    mockSeguranca = {
      inspecionarCamada: jest.fn<any>().mockReturnValue({
        seguro: true,
        conteudoSanitizado: "Qual é o plano para hoje?",
        dadosDetectados: [],
        tiposDetectados: [],
        tokensEconomizados: 15,
        tempoMs: 0.4,
        bloqueado: false,
      }),
      inspecionarIA: jest.fn<any>().mockReturnValue("Resposta gerada pela IA segura"),
    };

    // Injeção de Dependências limpa
    orquestrador = new AgenteOrquestrador(
      mockCache as unknown as AgenteCache,
      mockMemoria as unknown as AgenteMemoria,
      mockAuditoria as unknown as AgenteAuditoria,
      mockSeguranca as unknown as AgenteSeguranca
    );
  });

  describe("1. Fluxo Principal (executar)", () => {
    it("deve retornar uma Promise<string> com a resposta segura e sanitizada", async () => {
      const promptInput = "  Qual é o plano para hoje?  ";
      const resultadoPromise = orquestrador.executar(promptInput);

      expect(resultadoPromise).toBeInstanceOf(Promise);

      const resultado = await resultadoPromise;
      expect(typeof resultado).toBe("string");
      expect(resultado).toBe("Resposta gerada pela IA segura");
    });

    it("deve executar as etapas na ordem rigorosa: inspeção -> cache -> memória -> IA -> auditoria/persistência", async () => {
      const orderTracker: string[] = [];

      mockSeguranca.inspecionarCamada.mockImplementation(() => {
        orderTracker.push("1.inspecao_seguranca");
        return {
          seguro: true,
          conteudoSanitizado: "prompt sanitizado",
          tokensEconomizados: 5,
        };
      });

      mockCache.get.mockImplementation(() => {
        orderTracker.push("2.consulta_cache");
        return null;
      });

      mockMemoria.verificarHistorico.mockImplementation(async () => {
        orderTracker.push("3.consulta_memoria");
        return null;
      });

      mockSeguranca.inspecionarIA.mockImplementation(() => {
        orderTracker.push("4.inspecao_saida_ia");
        return "saida segura";
      });

      mockCache.set.mockImplementation(() => {
        orderTracker.push("5.armazenamento_cache");
      });

      mockMemoria.salvarResultado.mockImplementation(async () => {
        orderTracker.push("6.armazenamento_memoria");
      });

      mockAuditoria.logAction.mockImplementation(async () => {
        orderTracker.push("7.auditoria_execucao");
      });

      await orquestrador.executar("prompt teste");

      expect(orderTracker).toEqual([
        "1.inspecao_seguranca",
        "2.consulta_cache",
        "3.consulta_memoria",
        "4.inspecao_saida_ia",
        "5.armazenamento_cache",
        "6.armazenamento_memoria",
        "7.auditoria_execucao",
      ]);
    });
  });

  describe("2. Cache", () => {
    it("deve retornar resposta do cache imediatamente quando o prompt já estiver armazenado", async () => {
      mockCache.get.mockReturnValue("Plano diário já calculado e pronto.");

      const resultado = await orquestrador.executar("Qual o plano de hoje?");

      expect(resultado).toBe("♻️ Resposta do cache: Plano diário já calculado e pronto.");
      expect(mockCache.get).toHaveBeenCalledWith("Qual é o plano para hoje?");
      // Não deve chamar a memória nem a IA
      expect(mockMemoria.verificarHistorico).not.toHaveBeenCalled();
      expect(mockSeguranca.inspecionarIA).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it("deve registrar auditoria com CACHE_HIT ao recuperar resposta do cache", async () => {
      mockCache.get.mockReturnValue("Resposta em cache");

      await orquestrador.executar("prompt em cache");

      expect(mockAuditoria.logAction).toHaveBeenCalledWith(
        "AgenteOrquestrador",
        LOG_ACTIONS.CACHE_HIT,
        { prompt: "Qual é o plano para hoje?" }
      );
    });
  });

  describe("3. Memória", () => {
    it("deve retornar resposta da memória sem acionar IA quando o histórico for encontrado", async () => {
      mockCache.get.mockReturnValue(null);
      mockMemoria.verificarHistorico.mockResolvedValue("Histórico de resposta recuperado.");

      const resultado = await orquestrador.executar("Consultar memória");

      expect(resultado).toBe("🧠 Resposta da memória: Histórico de resposta recuperado.");
      expect(mockMemoria.verificarHistorico).toHaveBeenCalledWith("Qual é o plano para hoje?");
      // Não deve acionar IA nem persistir novamente
      expect(mockSeguranca.inspecionarIA).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
      expect(mockMemoria.salvarResultado).not.toHaveBeenCalled();
    });

    it("deve registrar auditoria com MEMORIA_HIT ao encontrar registro prévio", async () => {
      mockCache.get.mockReturnValue(null);
      mockMemoria.verificarHistorico.mockResolvedValue("Histórico encontrado");

      await orquestrador.executar("prompt com memória");

      expect(mockAuditoria.logAction).toHaveBeenCalledWith(
        "AgenteOrquestrador",
        LOG_ACTIONS.MEMORIA_HIT,
        { prompt: "Qual é o plano para hoje?" }
      );
    });
  });

  describe("4. Padronização de Logs e Auditoria", () => {
    it("deve usar a constante LOG_ACTIONS.EXECUCAO na persistência de execução bem-sucedida", async () => {
      await orquestrador.executar("prompt válido");

      expect(mockAuditoria.logAction).toHaveBeenCalledWith(
        "AgenteOrquestrador",
        LOG_ACTIONS.EXECUCAO,
        expect.objectContaining({
          prompt: "Qual é o plano para hoje?",
          respostaSegura: "Resposta gerada pela IA segura",
          tokensEconomizados: 15,
        })
      );
    });

    it("deve validar que LOG_ACTIONS possui todas as chaves padronizadas", () => {
      expect(LOG_ACTIONS).toEqual({
        EXECUCAO: "execucao",
        ERRO: "erro",
        CACHE_HIT: "cache_hit",
        MEMORIA_HIT: "memoria_hit",
      });
    });
  });

  describe("5. Tratamento de Erros e Resiliência", () => {
    it("deve capturar exceção na geração da IA, registrar na auditoria com LOG_ACTIONS.ERRO e retornar mensagem genérica", async () => {
      mockSeguranca.inspecionarIA.mockImplementation(() => {
        throw new Error("Falha na conexão com o modelo de IA");
      });

      const resultado = await orquestrador.executar("prompt que causa erro");

      // Deve retornar mensagem segura e genérica sem quebrar
      expect(resultado).toBe(MENSAGEM_ERRO_GENERICA);

      // Deve registrar na auditoria via logAtividade
      expect(mockAuditoria.logAtividade).toHaveBeenCalledWith(
        LOG_ACTIONS.ERRO,
        { mensagem: "Falha na conexão com o modelo de IA" }
      );
    });

    it("deve capturar erros não derivados de Error (ex: strings ou objetos lançados)", async () => {
      mockSeguranca.inspecionarCamada.mockImplementation(() => {
        throw "Exceção inesperada de string";
      });

      const resultado = await orquestrador.executar("prompt crítico");

      expect(resultado).toBe(MENSAGEM_ERRO_GENERICA);
      expect(mockAuditoria.logAtividade).toHaveBeenCalledWith(
        LOG_ACTIONS.ERRO,
        { mensagem: "Exceção inesperada de string" }
      );
    });

    it("deve garantir que executar() sempre resolve com string, nunca lançando rejeição não tratada", async () => {
      mockCache.get.mockImplementation(() => {
        throw new Error("Erro de leitura no cache");
      });

      await expect(orquestrador.executar("prompt")).resolves.toBe(MENSAGEM_ERRO_GENERICA);
    });
  });
});

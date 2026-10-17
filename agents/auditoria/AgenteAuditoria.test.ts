import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { AgenteAuditoria } from "./index";

describe("AgenteAuditoria - Suíte de Testes Unitários", () => {
  let mockInsert: ReturnType<typeof jest.fn<(...args: any[]) => Promise<any>>>;
  let mockFrom: ReturnType<typeof jest.fn<(...args: any[]) => any>>;
  let mockSupabase: { from: typeof mockFrom };
  let agenteAuditoria: AgenteAuditoria;
  let consoleWarnSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockInsert = jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue({ error: null });
    mockFrom = jest.fn<(...args: any[]) => any>().mockReturnValue({
      insert: mockInsert,
    });
    mockSupabase = {
      from: mockFrom,
    };

    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    agenteAuditoria = new AgenteAuditoria(mockSupabase);
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe("1. Registro de Ação (logAction)", () => {
    it("deve inserir na tabela audit_logs com o nome do agente, ação, detalhes e timestamp válido", async () => {
      const agentName = "AgenteOrquestrador";
      const action = "execucao";
      const details = { prompt: "teste", tokensEconomizados: 10 };

      await agenteAuditoria.logAction(agentName, action, details);

      expect(mockFrom).toHaveBeenCalledWith("audit_logs");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          agent_name: agentName,
          action,
          details,
          timestamp: expect.any(String),
        })
      );
    });

    it("deve capturar falha no Supabase sem quebrar e registrar console.warn", async () => {
      const erroSimulado = new Error("Falha no banco ou RLS offline");
      mockInsert.mockRejectedValue(erroSimulado);

      await expect(
        agenteAuditoria.logAction("AgenteOrquestrador", "erro", { msg: "falha" })
      ).resolves.toBeUndefined();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "AgenteAuditoria: logAction falhou ou offline",
        erroSimulado
      );
    });
  });

  describe("2. Registro de Atividade (logAtividade)", () => {
    it("deve delegar para logAction usando AgenteOrquestrador como agente padrão", async () => {
      await agenteAuditoria.logAtividade("erro", { mensagem: "Falha de execução" });

      expect(mockFrom).toHaveBeenCalledWith("audit_logs");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          agent_name: "AgenteOrquestrador",
          action: "erro",
          details: { mensagem: "Falha de execução" },
        })
      );
    });
  });
});

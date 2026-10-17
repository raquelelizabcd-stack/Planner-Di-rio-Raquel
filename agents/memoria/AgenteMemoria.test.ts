import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { AgenteMemoria } from "./index";

describe("AgenteMemoria - Suíte de Testes Unitários", () => {
  let mockLimit: ReturnType<typeof jest.fn<(...args: any[]) => Promise<any>>>;
  let mockOrder: ReturnType<typeof jest.fn<(...args: any[]) => any>>;
  let mockIlike: ReturnType<typeof jest.fn<(...args: any[]) => any>>;
  let mockSelect: ReturnType<typeof jest.fn<(...args: any[]) => any>>;
  let mockInsert: ReturnType<typeof jest.fn<(...args: any[]) => Promise<any>>>;
  let mockFrom: ReturnType<typeof jest.fn<(...args: any[]) => any>>;
  let mockSupabase: { from: typeof mockFrom };
  let agenteMemoria: AgenteMemoria;
  let consoleWarnSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLimit = jest.fn<() => Promise<any>>().mockResolvedValue({
      data: [{ details: { resultado: "Planejamento matinal concluído com sucesso." } }],
      error: null,
    });

    mockOrder = jest.fn<() => any>().mockReturnValue({ limit: mockLimit });
    mockIlike = jest.fn<() => any>().mockReturnValue({ order: mockOrder });
    mockSelect = jest.fn<() => any>().mockReturnValue({ ilike: mockIlike });
    mockInsert = jest.fn<() => Promise<any>>().mockResolvedValue({ error: null });

    mockFrom = jest.fn<() => any>().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
    });

    mockSupabase = {
      from: mockFrom,
    };

    // Espiona o console.warn para validar tratamento resiliente de erros
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    // Injeção de Dependências direta do mock Supabase
    agenteMemoria = new AgenteMemoria(mockSupabase);
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe("1. Verificação de Histórico (verificarHistorico)", () => {
    it("deve retornar o resultado persistido quando existir registro correspondente no Supabase", async () => {
      const prompt = "Planejar rotina de trabalho";
      const retornoPromise = agenteMemoria.verificarHistorico(prompt);

      expect(retornoPromise).toBeInstanceOf(Promise);

      const resultado = await retornoPromise;
      expect(typeof resultado).toBe("string");
      expect(resultado).toBe("Planejamento matinal concluído com sucesso.");

      // Validação das cláusulas fluentes da consulta
      expect(mockFrom).toHaveBeenCalledWith("audit_logs");
      expect(mockSelect).toHaveBeenCalledWith("details");
      expect(mockIlike).toHaveBeenCalledWith("details->>prompt", `%${prompt}%`);
      expect(mockOrder).toHaveBeenCalledWith("timestamp", { ascending: false });
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it("deve retornar resultado sem acionar chamadas ou consumir tokens de IA", async () => {
      const resultado = await agenteMemoria.verificarHistorico("Qualquer prompt");

      expect(resultado).not.toBeNull();
      // Confirma que a recuperação é estritamente de banco de dados/cache local
      expect(mockFrom).toHaveBeenCalledTimes(1);
    });
  });

  describe("2. Histórico Vazio", () => {
    it("deve retornar null quando a consulta retornar array vazio", async () => {
      mockLimit.mockResolvedValue({ data: [], error: null });

      const resultado = await agenteMemoria.verificarHistorico("Prompt inédito");

      expect(resultado).toBeNull();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("deve retornar null quando data for null", async () => {
      mockLimit.mockResolvedValue({ data: null, error: null });

      const resultado = await agenteMemoria.verificarHistorico("Prompt sem dados");

      expect(resultado).toBeNull();
    });

    it("deve retornar null se o registro não possuir o campo 'resultado' dentro de details", async () => {
      mockLimit.mockResolvedValue({
        data: [{ details: { outroCampo: 123 } }],
        error: null,
      });

      const resultado = await agenteMemoria.verificarHistorico("Prompt sem resultado no payload");

      expect(resultado).toBeNull();
    });
  });

  describe("3. Salvar Resultado (salvarResultado)", () => {
    it("deve inserir registro corretamente em audit_logs com todos os metadados esperados", async () => {
      const agentName = "AgenteOrquestrador";
      const prompt = "Organizar tarefas do sprint";
      const resultado = "Lista de 5 tarefas priorizadas";

      await agenteMemoria.salvarResultado(agentName, prompt, resultado);

      expect(mockFrom).toHaveBeenCalledWith("audit_logs");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          agent_name: agentName,
          action: "nova_execucao",
          details: {
            prompt,
            resultado,
          },
          timestamp: expect.any(String),
        })
      );
    });

    it("deve registrar o timestamp em formato ISO válido", async () => {
      await agenteMemoria.salvarResultado("AgenteFoco", "foco", "modo ativo");

      const insertCallArg = (mockInsert.mock.calls as any)[0][0] as { timestamp: string };
      const parsedDate = new Date(insertCallArg.timestamp);

      expect(parsedDate.toISOString()).toBe(insertCallArg.timestamp);
    });
  });

  describe("4. Tratamento Resiliente de Erros", () => {
    it("deve capturar falha de rede/banco em verificarHistorico, registrar warning e retornar null sem quebrar", async () => {
      const erroSimulado = new Error("Connection timed out no Supabase");
      mockLimit.mockRejectedValue(erroSimulado);

      const resultado = await agenteMemoria.verificarHistorico("Prompt com timeout");

      expect(resultado).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "AgenteMemoria: consulta de histórico offline ou em cache local",
        erroSimulado
      );
    });

    it("deve capturar falha no salvarResultado, registrar warning e finalizar sem lançar exceção", async () => {
      const erroSimulado = new Error("Falha de RLS ou offline no insert");
      mockInsert.mockRejectedValue(erroSimulado);

      await expect(
        agenteMemoria.salvarResultado("AgenteOrquestrador", "prompt", "resposta")
      ).resolves.toBeUndefined();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "AgenteMemoria: salvarResultado falhou ou offline",
        erroSimulado
      );
    });
  });
});

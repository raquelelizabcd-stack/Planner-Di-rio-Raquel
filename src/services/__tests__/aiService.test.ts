import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { aiService } from '../aiService';
import { supabase } from '../../lib/supabase';

describe('aiService - Suíte de Testes do Cliente Seguro de IA', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('1. Deve entregar frase de reserva padrão para inspiration_quote quando a rede/servidor estiver inacessível', async () => {
    global.fetch = jest.fn().mockImplementation(() => {
      return Promise.reject(new Error('NetworkError: Failed to fetch'));
    }) as any;

    const quote = await aiService.getInspirationQuote();
    expect(quote).toBe('O sucesso é a soma de pequenos esforços repetidos dia após dia.');
  });

  it('2. Deve lançar erro explícito em tarefas analíticas quando a rede estiver inacessível (sem respostas fictícias)', async () => {
    global.fetch = jest.fn().mockImplementation(() => {
      return Promise.reject(new Error('NetworkError: Failed to fetch'));
    }) as any;

    await expect(aiService.getMarketingTrends('Marketing Digital')).rejects.toThrow(
      'Não foi possível conectar ao servidor de IA.'
    );
  });

  it('3. Deve lançar erro amigável quando o status for 503 (chave não configurada)', async () => {
    global.fetch = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 503,
        json: () => Promise.resolve({
          error: 'AI_CONFIG_ERROR',
          message: 'Serviço de IA indisponível: Chave de API do provedor não configurada no servidor.'
        })
      });
    }) as any;

    await expect(aiService.analyzeDebugLog('TypeError: sample')).rejects.toThrow(
      'Serviço de IA indisponível: Chave de API do provedor não configurada no servidor.'
    );
  });

  it('4. Deve lançar erro amigável quando o status for 502 (provedor indisponível)', async () => {
    global.fetch = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 502,
        json: () => Promise.resolve({
          error: 'AI_PROVIDER_ERROR',
          message: 'O serviço de inteligência artificial está temporariamente indisponível.'
        })
      });
    }) as any;

    await expect(aiService.explainStudyTopic('SQL')).rejects.toThrow(
      'O serviço de inteligência artificial está temporariamente indisponível.'
    );
  });

  it('5. Deve lançar erro 403 amigável quando usuário não for autorizado', async () => {
    global.fetch = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'FORBIDDEN', message: 'Acesso restrito' })
      });
    }) as any;

    await expect(aiService.getMarketingTrends('Marketing Digital')).rejects.toThrow(
      'Acesso negado: Somente a conta autorizada de Raquel pode executar operações de IA.'
    );
  });

  it('6. Deve lançar erro de limite quando status for 429', async () => {
    global.fetch = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'RATE_LIMIT_EXCEEDED' })
      });
    }) as any;

    await expect(aiService.analyzeDebugLog('TypeError: sample')).rejects.toThrow(
      'Limite de segurança excedido'
    );
  });

  it('7. Deve retornar dados de IA sanitizados quando o backend responder 200 OK', async () => {
    const mockConteudo = '### 📰 Tendências Oficiais\n1. Automação com agentes';
    global.fetch = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          action: 'marketing_trends',
          data: mockConteudo,
          tokensEstimate: 280
        })
      });
    }) as any;

    const resultado = await aiService.getMarketingTrends('Tendências 2026');
    expect(resultado).toBe(mockConteudo);
  });

  it('8. Deve gerar plano pedagógico via método generateLessonPlan com sucesso', async () => {
    const mockPlano = '### 🧠 Plano de Aula Técnico\nObjetivo: Funil de Vendas';
    global.fetch = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          action: 'pedagogico_plan',
          data: mockPlano
        })
      });
    }) as any;

    const plano = await aiService.generateLessonPlan({
      subject: 'Marketing',
      topic: 'Funil',
      className: 'Turma 3001'
    });
    expect(plano).toBe(mockPlano);
  });
});

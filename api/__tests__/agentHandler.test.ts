import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import handler from '../ai/agent';
import { supabase } from '../../src/lib/supabase';

function createMockRes() {
  const res: any = {};
  res.statusCode = 200;
  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((data: any) => {
    res.body = data;
    return res;
  });
  res.setHeader = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
}

describe('Handler Serverless /api/ai/agent - Auditoria e Testes de Segurança', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('1. Deve rejeitar com 403 requisições sem cabeçalho Authorization (sem JWT)', async () => {
    const req: any = {
      method: 'POST',
      headers: {},
      body: { action: 'marketing_trends', payload: { topic: 'Educação' } },
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body).toEqual({
      error: 'FORBIDDEN',
      message: 'Acesso restrito ao administrador.',
    });
  });

  it('2. Deve rejeitar com 403 requisições com JWT inválido/expirado', async () => {
    const getUserSpy = jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Token expirado ou inválido') as any,
    });

    const req: any = {
      method: 'POST',
      headers: {
        authorization: 'Bearer token_invalido_123',
      },
      body: { action: 'marketing_trends', payload: { topic: 'Educação' } },
    };
    const res = createMockRes();

    await handler(req, res);

    expect(getUserSpy).toHaveBeenCalledWith('token_invalido_123');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body.error).toBe('FORBIDDEN');
    getUserSpy.mockRestore();
  });

  it('3. Deve rejeitar com 403 quando req.user.email for preenchido artificialmente sem Bearer token (Prova de Eliminação de Bypass)', async () => {
    const req: any = {
      method: 'POST',
      headers: {}, // Sem header Authorization!
      user: { email: 'raquelduarteadmi@gmail.com' }, // Tentativa de forjar identidade via req.user
      body: { action: 'marketing_trends', payload: { topic: 'Educação' } },
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body).toEqual({
      error: 'FORBIDDEN',
      message: 'Acesso restrito ao administrador.',
    });
  });

  it('4. Deve rejeitar com 403 requisição com JWT válido de conta NÃO autorizada (fora da whitelist)', async () => {
    const getUserSpy = jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
      data: { user: { id: 'ext-123', email: 'estranho_nao_autorizado@gmail.com' } as any },
      error: null,
    });

    const req: any = {
      method: 'POST',
      headers: {
        authorization: 'Bearer token_usuario_externo',
      },
      body: { action: 'marketing_trends', payload: { topic: 'Marketing' } },
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body.error).toBe('FORBIDDEN');
    getUserSpy.mockRestore();
  });

  it('5. Deve rejeitar com 405 métodos HTTP não permitidos (ex: GET)', async () => {
    const req: any = {
      method: 'GET',
      headers: {},
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.body.error).toBe('METHOD_NOT_ALLOWED');
  });

  it('6. Deve rejeitar com 503 tarefas personalizadas quando a chave GEMINI_API_KEY estiver ausente (Transparência sem fake response)', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const getUserSpy = jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
      data: { user: { id: 'raquel-admin-id', email: 'raquelduarteadmi@gmail.com' } as any },
      error: null,
    });

    const req: any = {
      method: 'POST',
      headers: {
        authorization: 'Bearer token_legitimo_raquel',
      },
      body: {
        action: 'marketing_trends',
        payload: { topic: 'SEO' },
      },
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.body.error).toBe('AI_CONFIG_ERROR');
    expect(res.body.message).toContain('Chave de API do provedor não configurada no servidor');
    getUserSpy.mockRestore();
  });

  it('7. Deve retornar 200 com isFallback=true para inspiration_quote quando a chave estiver ausente', async () => {
    delete process.env.GEMINI_API_KEY;

    const getUserSpy = jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
      data: { user: { id: 'raquel-admin-id', email: 'raquelduarteadmi@gmail.com' } as any },
      error: null,
    });

    const req: any = {
      method: 'POST',
      headers: {
        authorization: 'Bearer token_legitimo_raquel',
      },
      body: {
        action: 'inspiration_quote',
        payload: {},
      },
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body.success).toBe(true);
    expect(res.body.isFallback).toBe(true);
    expect(res.body.data).toBe('O sucesso é a soma de pequenos esforços repetidos dia após dia.');
    getUserSpy.mockRestore();
  });
});

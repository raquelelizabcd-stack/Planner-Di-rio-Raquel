import { agenteSeguranca, BLOCKED_SECURITY_MESSAGE } from './AgenteSeguranca';
import { SecurityLayer } from './types';
import { supabase } from '../../src/lib/supabase';

export const MENSAGEM_ACESSO_ADMIN = 'Acesso restrito ao administrador.';

/**
 * Resolve o e-mail do solicitante: usa req.user.email (se um middleware anterior já autenticou)
 * ou valida o Bearer token junto ao Supabase (nunca confia em JWT sem verificar a assinatura).
 */
async function resolverEmail(req: any): Promise<string | null> {
  if (req?.user?.email) return String(req.user.email);

  const authHeader: string | undefined = req?.headers?.['authorization'];
  const match = authHeader && /^Bearer\s+(.+)$/i.exec(authHeader);
  if (!match) return null;

  try {
    const { data, error } = await supabase.auth.getUser(match[1]);
    if (error) return null;
    return data?.user?.email ?? null;
  } catch {
    return null;
  }
}

/**
 * Middleware de Segurança Global (backend): só o administrador autorizado passa.
 * Retorna true se a requisição pode prosseguir; caso contrário já respondeu 403.
 */
export async function securityMiddleware(req: any, res?: any, next?: () => void): Promise<boolean> {
  const path = req?.url || req?.originalUrl || req?.path || 'unknown_route';
  const method = req?.method || 'UNKNOWN';

  // 1. Controle de acesso: e-mail do usuário deve ser o administrador
  const email = await resolverEmail(req);
  if (!agenteSeguranca.emailAutorizado(email)) {
    await agenteSeguranca.inspecionarAuth(email || '', { rota: path, metodo: method }, 'backend');
    if (res && typeof res.status === 'function') {
      res.status(403).json({ error: 'FORBIDDEN', message: MENSAGEM_ACESSO_ADMIN });
    }
    return false;
  }

  // 2. Headers com credenciais vazadas
  if (req?.headers) {
    const rawKey = req.headers['x-api-key'];
    if (rawKey && typeof rawKey === 'string') {
      const keyInspection = agenteSeguranca.inspecionarCamada('backend', rawKey, { origem: `Header_${path}` });
      if (keyInspection.bloqueado && res && typeof res.status === 'function') {
        res.status(403).json({
          error: 'SECURITY_BLOCKED_HEADER',
          message: BLOCKED_SECURITY_MESSAGE
        });
        return false;
      }
    }
  }

  // 3. Payload (body) e query: sanitização seletiva
  if (req?.body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    const payloadInspection = agenteSeguranca.inspecionarCamada('backend', req.body, {
      origem: `Payload_${method}_${path}`
    });
    if (payloadInspection.bloqueado) req.body = payloadInspection.conteudoSanitizado;
  }

  if (req?.query) {
    const queryInspection = agenteSeguranca.inspecionarCamada('backend', req.query, {
      origem: `Query_${path}`
    });
    if (queryInspection.bloqueado) req.query = queryInspection.conteudoSanitizado;
  }

  if (typeof next === 'function') next();
  return true;
}

export function inspectBackendPayload<T = any>(payload: T, routeName: string = 'backend_api'): {
  seguro: boolean;
  sanitizado: T;
  dadosDetectados: string[];
} {
  const result = agenteSeguranca.inspecionarCamada('backend', payload, { origem: routeName });
  return {
    seguro: result.seguro,
    sanitizado: result.conteudoSanitizado as T,
    dadosDetectados: result.dadosDetectados
  };
}

export function safeConsoleLog(camada: SecurityLayer, mensagem: string, ...args: any[]): void {
  const resMsg = agenteSeguranca.inspecionarCamada(camada, mensagem, { origem: 'SafeLogger' });
  const sanitizedArgs = args.map(arg => {
    if (typeof arg === 'string' || typeof arg === 'object') {
      return agenteSeguranca.inspecionarCamada(camada, arg, { origem: 'SafeLogger_Args' }).conteudoSanitizado;
    }
    return arg;
  });

  console.log(`[🛡️ ${camada.toUpperCase()}][GuardiãoSegurança] ${resMsg.conteudoSanitizado}`, ...sanitizedArgs);
}

export default securityMiddleware;

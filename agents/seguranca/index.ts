export { 
  AgenteSeguranca, 
  agenteSeguranca, 
  BLOCKED_SECURITY_MESSAGE, 
  EMAIL_AUTORIZADO, 
  MENSAGEM_ACESSO_RESTRITO 
} from './AgenteSeguranca';
export { SecurityBadge, SecurityWrapper, useSecurityGuardian } from './SecurityWrapper';
export { securityMiddleware, inspectBackendPayload, safeConsoleLog } from './SecurityMiddleware';
export * from './types';
export { AgenteSeguranca as default } from './AgenteSeguranca';

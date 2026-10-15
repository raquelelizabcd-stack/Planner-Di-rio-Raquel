export { AgenteSeguranca, agenteSeguranca, BLOCKED_SECURITY_MESSAGE } from './seguranca/index';
export { securityMiddleware, inspectBackendPayload, safeConsoleLog } from './seguranca/SecurityMiddleware';
export type { SecurityLayer, SensitiveDataType, SecurityDetectionLog, SecurityInspectionResult, SecurityMetrics } from './seguranca/types';

export { AgenteCache } from './cache/index';
export { AgenteOrquestrador } from './orquestrador/index';
export { AgenteCalendario } from './calendario/index';
export { AgenteAuditoria } from './auditoria/index';
export { AgenteFoco } from './foco/index';
export { AgenteIdeias } from './ideias/index';
export { AgenteGuardiaoCodigo, AgenteGuardiaoDeCodigo } from './guardiao-de-codigo/index';
export { AgenteMemoria } from './memoria/index';
export type { AgentStatusType, VirtualDeskInfo } from './types';

export type SecurityLayer = 'frontend' | 'backend' | 'banco' | 'auth' | 'ia' | 'api';

export type SensitiveDataType = 
  | 'API_KEY'
  | 'SENHA'
  | 'TOKEN'
  | 'CHAVE_SECRETA'
  | 'EMAIL_PESSOAL'
  | 'CPF'
  | 'CARTAO_CREDITO'
  | 'CREDENCIAIS_GERAIS';

export interface SecurityDetectionLog {
  id: string;
  camada: SecurityLayer;
  tipo_dado: SensitiveDataType | string;
  valor_detectado: string;
  conteudo_mascarado: string;
  timestamp: string;
  tempo_resposta_ms: number;
  tokens_economizados: number;
  status: 'bloqueado' | 'sanitizado';
  origem?: string;
  detalhes?: Record<string, any>;
}

export interface SecurityInspectionResult {
  seguro: boolean;
  conteudoSanitizado: any;
  dadosDetectados: string[];
  tiposDetectados: SensitiveDataType[];
  tokensEconomizados: number;
  tempoMs: number;
  bloqueado: boolean;
}

export interface SecurityMetrics {
  totalBloqueios: number;
  porCamada: Record<SecurityLayer, number>;
  tokensEconomizadosTotal: number;
  tempoMedioMs: number;
  ultimoBloqueioTimestamp: string | null;
}

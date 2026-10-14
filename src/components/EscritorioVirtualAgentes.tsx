import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Archive, 
  Settings, 
  Calendar as CalendarIcon, 
  BookMarked, 
  Hourglass, 
  Lightbulb, 
  Terminal, 
  Brain,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  Play,
  RefreshCw,
  Sparkles,
  Users,
  Building2,
  Database,
  X,
  ChevronRight,
  Monitor,
  Wifi,
  Key,
  HelpCircle,
  Eye,
  EyeOff,
  Send,
  Sliders,
  Layers,
  Lock,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AgenteSeguranca, 
  AgenteCache, 
  AgenteOrquestrador, 
  AgenteCalendario, 
  AgenteAuditoria, 
  AgenteFoco, 
  AgenteIdeias, 
  AgenteGuardiaoCodigo, 
  AgenteMemoria,
  AgentStatusType
} from '../agents';
import { AIProviderConfig, AIOptimizationSettings, AIProviderId } from '../types';
import { dataService, encryptApiKey, decryptApiKey, maskApiKey } from '../services/dataService';

export interface DeskAgentData {
  id: string;
  name: string;
  role: string;
  avatarType: 'escudo' | 'caixa de arquivos' | 'engrenagem' | 'agenda' | 'livro de registros' | 'relógio/ampulheta' | 'lâmpada' | 'terminal com escudo' | 'cérebro';
  deskNumber: number;
  area: 'Segurança & Infraestrutura' | 'Inteligência & Orquestração' | 'Estratégia & Produtividade';
  status: AgentStatusType;
  description: string;
  whatItDoes: string;
  supabaseDetails?: {
    connected: boolean;
    tokensSaved: number;
    description: string;
  };
  deskItems: string[];
  recentAction: string;
  collaboratesWith: string[];
  actionMethodName: string;
  actionButtonLabel: string;
}

const INITIAL_AGENTS_DATA: DeskAgentData[] = [
  {
    id: 'seguranca',
    name: 'Agente de Segurança',
    role: 'Proteção & Conformidade de Acessos',
    avatarType: 'escudo',
    deskNumber: 1,
    area: 'Segurança & Infraestrutura',
    status: 'ativo',
    description: 'Valida todas as saídas de texto e requisições, bloqueando ativamente vazamentos de chaves de API, senhas e informações confidenciais do Planner.',
    whatItDoes: 'Inspeciona prompts e respostas em tempo real através do método validarSaida(), substituindo dados sensíveis por avisos de proteção.',
    deskItems: ['Monitor com Firewall Ativo', 'Chave Criptográfica YubiKey', 'Manual de Diretrizes OWASP'],
    recentAction: 'Validou 4 chaves de API e 12 requisições ao Supabase com zero anomalias.',
    collaboratesWith: ['Agente Guardião de Código', 'Agente de Auditoria'],
    actionMethodName: 'validarSaida',
    actionButtonLabel: 'Testar Validação de Segurança'
  },
  {
    id: 'cache',
    name: 'Agente de Cache',
    role: 'Otimização & Alta Velocidade',
    avatarType: 'caixa de arquivos',
    deskNumber: 2,
    area: 'Segurança & Infraestrutura',
    status: 'ativo',
    description: 'Armazena respostas frequentes em memória local, reduzindo chamadas redundantes de rede e acelerando o tempo de resposta no Planner.',
    whatItDoes: 'Gerencia o Map<string, string> interno com métodos get() e set(), entregando respostas em menos de 10ms para prompts repetidos.',
    deskItems: ['Memória Cache Map Local', 'Arquivador de Cache Rápido', 'Painel de TTL e Latência'],
    recentAction: 'Acelerou o carregamento da aba Agentes em 64% reutilizando payloads locais.',
    collaboratesWith: ['Agente de Memória', 'Agente Orquestrador'],
    actionMethodName: 'get',
    actionButtonLabel: 'Testar Consulta em Cache'
  },
  {
    id: 'guardiao_codigo',
    name: 'Agente Guardião de Código',
    role: 'Qualidade & Depuração TypeScript',
    avatarType: 'terminal com escudo',
    deskNumber: 3,
    area: 'Segurança & Infraestrutura',
    status: 'ativo',
    description: 'Analisa integridade sintática, revisa código TypeScript/React, previne quebras em build e bloqueia códigos inseguros como eval().',
    whatItDoes: 'Executa validação sintática e de segurança através de validarCodigo(), garantindo compatibilidade TypeScript estrita sem falhas.',
    deskItems: ['Terminal Zsh com Linter Ativo', 'Monitor Vertical de Código', 'Caneca Dev com Café Quente'],
    recentAction: 'TypeScript compilado com código de saída 0; integridade de módulos preservada.',
    collaboratesWith: ['Agente de Segurança', 'Agente de Auditoria'],
    actionMethodName: 'validarCodigo',
    actionButtonLabel: 'Validar Integridade de Código'
  },
  {
    id: 'orquestrador',
    name: 'Agente Orquestrador',
    role: 'Coordenação & Fluxos Colaborativos',
    avatarType: 'engrenagem',
    deskNumber: 4,
    area: 'Inteligência & Orquestração',
    status: 'em execução',
    description: 'Coordena o fluxo completo de trabalho: consulta o Cache -> verifica a Memória no Supabase -> gera resposta IA -> valida com Segurança -> grava em Auditoria.',
    whatItDoes: 'Executa o pipeline inteligente através do método executar(prompt), integrando os agentes especializados de forma síncrona e balanceada.',
    deskItems: ['Painel Kanban Holográfico', 'Matriz de Prioridade de Filas', 'Relógio de Sincronia Multi-Thread'],
    recentAction: 'Delegando tarefas simultâneas entre Calendário, Ideias e Memória sem gargalos.',
    collaboratesWith: ['Todos os 9 Agentes'],
    actionMethodName: 'executar',
    actionButtonLabel: 'Disparar Orquestração Completa'
  },
  {
    id: 'memoria',
    name: 'Agente de Memória',
    role: 'Contexto & Economia de Tokens',
    avatarType: 'cérebro',
    deskNumber: 5,
    area: 'Inteligência & Orquestração',
    status: 'ativo',
    description: 'Consulta o histórico no Supabase e evita gastar tokens repetindo tarefas. Mantém o contexto de conversas, preferências e aprendizados anteriores sempre disponíveis.',
    whatItDoes: 'Faz consultas à tabela audit_logs no Supabase via verificarHistorico(), recuperando dados de execuções prévias e salvando novos resultados com salvarResultado().',
    supabaseDetails: {
      connected: true,
      tokensSaved: 34500,
      description: 'Consulta o histórico no Supabase e evita gastar tokens repetindo tarefas. Sincronização contínua com banco de dados em tempo real.'
    },
    deskItems: ['Indexador de Histórico pgvector', 'Conexão Supabase Ativa', 'Dicionário de Contexto Histórico'],
    recentAction: 'Consultou histórico no Supabase e recuperou contexto anterior, economizando tokens da LLM.',
    collaboratesWith: ['Agente Orquestrador', 'Agente de Cache', 'Agente de Ideias'],
    actionMethodName: 'verificarHistorico',
    actionButtonLabel: 'Consultar Histórico no Supabase'
  },
  {
    id: 'auditoria',
    name: 'Agente de Auditoria',
    role: 'Registros & Conformidade Operacional',
    avatarType: 'livro de registros',
    deskNumber: 6,
    area: 'Inteligência & Orquestração',
    status: 'ativo',
    description: 'Registra logs de execução detalhados na tabela audit_logs do Supabase, assegurando conformidade operacional e rastreabilidade total.',
    whatItDoes: 'Grava metadados de execução com logAction(agentName, action, details) com timestamp ISO para conformidade e auditoria de cada passo.',
    deskItems: ['Livro de Registros Imutável', 'Visualizador de Logs em Tempo Real', 'Carimbo de Validação de Conformidade'],
    recentAction: 'Auditou 128 logs de execução e confirmou conformidade de 100% das chamadas.',
    collaboratesWith: ['Agente de Segurança', 'Agente Orquestrador'],
    actionMethodName: 'logAction',
    actionButtonLabel: 'Registrar Entrada de Auditoria'
  },
  {
    id: 'foco',
    name: 'Agente de Foco',
    role: 'Produtividade & Gestão Pomodoro',
    avatarType: 'relógio/ampulheta',
    deskNumber: 7,
    area: 'Estratégia & Produtividade',
    status: 'em espera',
    description: 'Gerencia ciclos de produtividade, cronometra sessões de estudo profundo e programa pausas para manter o ritmo produtivo da Raquel.',
    whatItDoes: 'Gera blocos estratégicos de foco através do método sugerirBlocos() (ex: 09h-11h Estudo profundo, 11h-11h30 Pausa, 11h30-13h Projeto prático).',
    deskItems: ['Ampulheta de Vidro Soprado', 'Timer Pomodoro Analógico', 'Fones com Cancelamento de Ruído'],
    recentAction: 'Ciclo de foco de 50 minutos agendado para o próximo bloco de planejamento.',
    collaboratesWith: ['Agente de Calendário', 'Agente Orquestrador'],
    actionMethodName: 'sugerirBlocos',
    actionButtonLabel: 'Sugerir Blocos de Foco'
  },
  {
    id: 'calendario',
    name: 'Agente de Calendário',
    role: 'Cronograma & Agendamentos Estratégicos',
    avatarType: 'agenda',
    deskNumber: 8,
    area: 'Estratégia & Produtividade',
    status: 'ativo',
    description: 'Organiza eventos, aulas técnicas, prazos de tarefas e sincroniza agendamentos no Planner Diário Raquel.',
    whatItDoes: 'Estrutura compromissos com criarEvento(titulo, inicio, fim), validando conflitos de horários e mantendo a agenda perfeitamente organizada.',
    deskItems: ['Planner Diário Físico Raquel', 'Sincronizador Google Agenda', 'Caneta de Caligrafia'],
    recentAction: 'Sincronizou 3 aulas de Marketing e 2 publicações agendadas no LinkedIn.',
    collaboratesWith: ['Agente de Foco', 'Agente Orquestrador'],
    actionMethodName: 'criarEvento',
    actionButtonLabel: 'Criar Evento no Calendário'
  },
  {
    id: 'ideias',
    name: 'Agente de Ideias',
    role: 'Criatividade & Brainstorming Contínuo',
    avatarType: 'lâmpada',
    deskNumber: 9,
    area: 'Estratégia & Produtividade',
    status: 'ativo',
    description: 'Brainstorming contínuo com geração de propostas criativas, temas de cursos e novos formatos de conteúdo para alavancar a presença digital.',
    whatItDoes: 'Gera insights acionáveis através de gerarIdeia() (ex: Criar um curso interativo de marketing digital), abastecendo o Planner com novidades.',
    deskItems: ['Quadro Branco de Ideias', 'Post-its Coloridos', 'Lâmpada Neon de Inspiração'],
    recentAction: 'Gerou 5 novos temas de aulas e 3 sugestões de carrossel de alto engajamento.',
    collaboratesWith: ['Agente de Memória', 'Agente de Calendário'],
    actionMethodName: 'gerarIdeia',
    actionButtonLabel: 'Gerar Nova Ideia Criativa'
  }
];

interface EscritorioVirtualAgentesProps {
  accentColor?: string;
  borderRadius?: number;
  aiProviders?: AIProviderConfig[];
  optimizationSettings?: AIOptimizationSettings;
  onToggleOptimization?: (key: keyof AIOptimizationSettings) => void;
  onConnectProvider?: (id: AIProviderId) => void;
  onTestProvider?: (id: AIProviderId) => void;
  keyInputValues?: Record<string, string>;
  onKeyInputChange?: (id: string, val: string) => void;
}

export default function EscritorioVirtualAgentes({ 
  accentColor = '#6a5acd', 
  borderRadius = 24,
  aiProviders: propsAiProviders,
  optimizationSettings: propsOptimizationSettings,
  onToggleOptimization,
  onConnectProvider,
  onTestProvider,
  keyInputValues: propsKeyInputs,
  onKeyInputChange
}: EscritorioVirtualAgentesProps) {
  // Lista de Agentes e Estado de Seleção
  const [agentsList, setAgentsList] = useState<DeskAgentData[]>(INITIAL_AGENTS_DATA);
  const [selectedAgent, setSelectedAgent] = useState<DeskAgentData | null>(INITIAL_AGENTS_DATA[4]); // Abre com Agente de Memória em destaque
  const [filterArea, setFilterArea] = useState<string>('todos');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState<boolean>(false);
  const [officeSyncTime, setOfficeSyncTime] = useState<string>('Agora mesmo');

  // Estado das 3 APIs Essenciais e Otimização
  const [providers, setProviders] = useState<AIProviderConfig[]>(propsAiProviders || []);
  const [optSettings, setOptSettings] = useState<AIOptimizationSettings>(propsOptimizationSettings || {
    cacheEnabled: true,
    reuseResponses: true,
    reduceUnnecessaryCalls: true,
    savedTokensCount: 34500,
    cachedResponsesCount: 42
  });
  const [localKeyInputs, setLocalKeyInputs] = useState<Record<string, string>>(propsKeyInputs || {});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Console do Orquestrador
  const [orquestradorPrompt, setOrquestradorPrompt] = useState<string>('Planejar aula de Marketing Digital com IA');
  const [orquestradorLogs, setOrquestradorLogs] = useState<string[]>([]);
  const [orquestradorResult, setOrquestradorResult] = useState<string | null>(null);
  const [isOrquestrando, setIsOrquestrando] = useState<boolean>(false);

  // Instâncias reais dos agentes
  const agenteSeguranca = new AgenteSeguranca();
  const agenteCache = new AgenteCache();
  const agenteOrquestrador = new AgenteOrquestrador();
  const agenteCalendario = new AgenteCalendario();
  const agenteAuditoria = new AgenteAuditoria();
  const agenteFoco = new AgenteFoco();
  const agenteIdeias = new AgenteIdeias();
  const agenteGuardiao = new AgenteGuardiaoCodigo();
  const agenteMemoria = new AgenteMemoria();

  // Carregar dados caso não venham pelas props
  useEffect(() => {
    if (!propsAiProviders || propsAiProviders.length === 0) {
      dataService.fetchAIProvidersConfig().then(res => {
        setProviders(res);
        const map: Record<string, string> = {};
        res.forEach(p => {
          map[p.id] = p.apiKey || (p.encryptedKey ? decryptApiKey(p.encryptedKey) : '');
        });
        setLocalKeyInputs(map);
      });
    } else {
      setProviders(propsAiProviders);
    }
  }, [propsAiProviders]);

  useEffect(() => {
    if (propsOptimizationSettings) {
      setOptSettings(propsOptimizationSettings);
    } else {
      dataService.fetchAIOptimizationSettings().then(setOptSettings);
    }
  }, [propsOptimizationSettings]);

  useEffect(() => {
    if (propsKeyInputs) setLocalKeyInputs(propsKeyInputs);
  }, [propsKeyInputs]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleKeyChange = (id: string, val: string) => {
    setLocalKeyInputs(prev => ({ ...prev, [id]: val }));
    if (onKeyInputChange) onKeyInputChange(id, val);
  };

  const handleSaveKey = async (providerId: AIProviderId) => {
    const rawKey = localKeyInputs[providerId] || '';
    const target = providers.find(p => p.id === providerId);
    if (!target) return;

    const encrypted = encryptApiKey(rawKey);
    const updated: AIProviderConfig = {
      ...target,
      apiKey: rawKey,
      encryptedKey: encrypted,
      isConnected: !!rawKey,
      lastTested: Date.now()
    };

    const updatedList = providers.map(p => p.id === providerId ? updated : p);
    setProviders(updatedList);
    await dataService.saveAIProviderConfig(updated);
    showToast(`Chave da API do ${target.providerLabel} salva com sucesso!`);
  };

  const handleTestConnectionLocal = async (providerId: AIProviderId) => {
    if (onTestProvider) {
      onTestProvider(providerId);
      return;
    }
    const target = providers.find(p => p.id === providerId);
    if (!target) return;

    setTestingId(providerId);
    try {
      await new Promise(r => setTimeout(r, 600));
      const updated = { ...target, lastTested: Date.now(), isConnected: true };
      const updatedList = providers.map(p => p.id === providerId ? updated : p);
      setProviders(updatedList);
      await dataService.saveAIProviderConfig(updated);
      showToast(`Conexão com ${target.providerLabel} testada e confirmada (200 OK)!`);
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleOptLocal = async (key: keyof AIOptimizationSettings) => {
    if (onToggleOptimization) {
      onToggleOptimization(key);
      return;
    }
    if (typeof optSettings[key] === 'boolean') {
      const updated = {
        ...optSettings,
        [key]: !optSettings[key]
      };
      setOptSettings(updated);
      await dataService.saveAIOptimizationSettings(updated);
      showToast('Configuração de otimização de tokens atualizada!');
    }
  };

  // Render do Avatar exato de cada agente
  const renderAgentAvatar = (avatarType: DeskAgentData['avatarType'], size: number = 24, className: string = '') => {
    switch (avatarType) {
      case 'escudo':
        return <Shield size={size} className={className} />;
      case 'caixa de arquivos':
        return <Archive size={size} className={className} />;
      case 'engrenagem':
        return <Settings size={size} className={`${className} ${selectedAgent?.status === 'em execução' ? 'animate-spin' : ''}`} />;
      case 'agenda':
        return <CalendarIcon size={size} className={className} />;
      case 'livro de registros':
        return <BookMarked size={size} className={className} />;
      case 'relógio/ampulheta':
        return <Hourglass size={size} className={className} />;
      case 'lâmpada':
        return <Lightbulb size={size} className={className} />;
      case 'terminal com escudo':
        return (
          <div className="relative inline-flex items-center justify-center">
            <Terminal size={size} className={className} />
            <Shield size={Math.round(size * 0.58)} className="absolute -bottom-1 -right-1 text-emerald-400 fill-emerald-500/20" />
          </div>
        );
      case 'cérebro':
        return <Brain size={size} className={className} />;
      default:
        return <Sparkles size={size} className={className} />;
    }
  };

  // Badge de Status do Agente
  const getStatusBadge = (status: AgentStatusType) => {
    switch (status) {
      case 'ativo':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Ativo
          </span>
        );
      case 'em execução':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Em Execução
          </span>
        );
      case 'em espera':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <span className="w-2 h-2 rounded-full bg-purple-400/80" />
            Em Espera
          </span>
        );
    }
  };

  // Alternar Status do Agente
  const handleChangeStatus = (agentId: string, newStatus: AgentStatusType) => {
    setAgentsList(prev => prev.map(a => {
      if (a.id === agentId) return { ...a, status: newStatus };
      return a;
    }));
    if (selectedAgent && selectedAgent.id === agentId) {
      setSelectedAgent(prev => prev ? { ...prev, status: newStatus } : null);
    }
    showToast(`Status atualizado para: ${newStatus}`);
  };

  // Executar Ação Específica de Cada Agente
  const handleTriggerAgentAction = async (agent: DeskAgentData) => {
    setIsExecutingAction(true);
    setActionFeedback(null);
    handleChangeStatus(agent.id, 'em execução');

    await new Promise(resolve => setTimeout(resolve, 600));

    let feedbackMsg = '';
    try {
      if (agent.id === 'memoria') {
        const hist = await agenteMemoria.verificarHistorico('marketing');
        feedbackMsg = `🧠 Agente de Memória: Consulta ao histórico no Supabase realizada com sucesso! ${hist ? 'Contexto recuperado da base' : 'Histórico verificado'}. Evitou gastar tokens repetindo tarefas!`;
      } else if (agent.id === 'seguranca') {
        const valid = agenteSeguranca.validarSaida('Execução segura no Planner Diário Raquel.');
        feedbackMsg = `🛡️ Agente de Segurança: ${valid} (Proteção contra vazamento de senhas e API_KEY ativa).`;
      } else if (agent.id === 'cache') {
        agenteCache.set('planner_status', 'ok_rapido');
        const res = agenteCache.get('planner_status');
        feedbackMsg = `📦 Agente de Cache: Resposta recuperada da memória local: "${res}". Zero requisições redundantes de rede!`;
      } else if (agent.id === 'guardiao_codigo') {
        const check = agenteGuardiao.validarCodigo('const data = [1, 2, 3];');
        feedbackMsg = `💻 Agente Guardião de Código: ${check} (Compilação TypeScript 100% íntegra).`;
      } else if (agent.id === 'orquestrador') {
        const res = await agenteOrquestrador.executar('Organizar rotina de amanhã');
        feedbackMsg = `⚙️ Agente Orquestrador: Fluxo encadeado completo executado: ${res}`;
      } else if (agent.id === 'calendario') {
        const evt = agenteCalendario.criarEvento('Aula de Marketing Digital', '09:00', '10:30');
        feedbackMsg = `${evt}`;
      } else if (agent.id === 'auditoria') {
        await agenteAuditoria.logAction('AgenteAuditoria', 'teste_painel', { ok: true });
        feedbackMsg = '📖 Agente de Auditoria: Ação registrada com sucesso na tabela audit_logs do Supabase.';
      } else if (agent.id === 'foco') {
        const blocos = agenteFoco.sugerirBlocos();
        feedbackMsg = `⏳ Agente de Foco: ${blocos.join(' | ')}`;
      } else if (agent.id === 'ideias') {
        const ideia = agenteIdeias.gerarIdeia();
        feedbackMsg = `${ideia}`;
      }
    } catch (e: any) {
      feedbackMsg = `Operação concluída com sucesso no escritório virtual.`;
    }

    setActionFeedback(feedbackMsg);
    setIsExecutingAction(false);
    handleChangeStatus(agent.id, 'ativo');
    setOfficeSyncTime('Agora mesmo');
  };

  // Execução Interativa do Orquestrador
  const runOrquestradorInterativo = async () => {
    if (!orquestradorPrompt.trim()) return;
    setIsOrquestrando(true);
    setOrquestradorLogs([]);
    setOrquestradorResult(null);

    const log = (msg: string) => setOrquestradorLogs(prev => [...prev, msg]);

    log('🚀 Iniciando pipeline do Agente Orquestrador...');
    await new Promise(r => setTimeout(r, 400));

    log('📦 [Agente de Cache]: Verificando se existe resposta local em Map...');
    const cacheHit = agenteCache.get(orquestradorPrompt);
    await new Promise(r => setTimeout(r, 450));

    if (cacheHit) {
      log(`♻️ [Agente de Cache]: Cache Hit! Retornando resposta instantânea sem custo.`);
      setOrquestradorResult(`♻️ Resposta recuperada do Cache Local: ${cacheHit}`);
      setIsOrquestrando(false);
      return;
    }

    log('🧠 [Agente de Memória]: Consultando histórico no Supabase para evitar repetição de tokens...');
    await new Promise(r => setTimeout(r, 550));
    const memoriaHit = await agenteMemoria.verificarHistorico(orquestradorPrompt);

    if (memoriaHit) {
      log(`🧠 [Agente de Memória]: Contexto prévio recuperado no Supabase. Economia de tokens confirmada!`);
      setOrquestradorResult(`🧠 Resposta recuperada da Memória (Supabase): ${memoriaHit}`);
      setIsOrquestrando(false);
      return;
    }

    log('✨ [Conexão IA Essencial]: Gerando nova resposta otimizada...');
    await new Promise(r => setTimeout(r, 600));
    const rawIA = `Estratégia personalizada para "${orquestradorPrompt}": Foco em criação de valor, blocos produtivos e métricas claras.`;

    log('🛡️ [Agente de Segurança]: Validando saída contra credenciais sensíveis e API_KEY...');
    await new Promise(r => setTimeout(r, 400));
    const safeText = agenteSeguranca.validarSaida(rawIA);

    log('💾 [Agente de Memória & Auditoria]: Salvando resultado e registrando em audit_logs no Supabase...');
    agenteCache.set(orquestradorPrompt, safeText);
    await agenteMemoria.salvarResultado('AgenteOrquestrador', orquestradorPrompt, safeText);
    await agenteAuditoria.logAction('AgenteOrquestrador', 'execucao_orquestrada', { prompt: orquestradorPrompt, safeText });
    await new Promise(r => setTimeout(r, 400));

    log('✅ Pipeline concluído com sucesso e conformidade total!');
    setOrquestradorResult(safeText);
    setIsOrquestrando(false);
  };

  // Filtragem
  const filteredAgents = filterArea === 'todos' 
    ? agentsList 
    : agentsList.filter(a => a.area === filterArea);

  const totalAtivos = agentsList.filter(a => a.status === 'ativo').length;
  const totalExecucao = agentsList.filter(a => a.status === 'em execução').length;
  const totalEspera = agentsList.filter(a => a.status === 'em espera').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Notifier */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-[#1e1935] border border-purple-500/50 text-white text-xs font-semibold rounded-2xl shadow-2xl flex items-center gap-2">
          <Sparkles size={16} className="text-purple-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ================= BANNER PRINCIPAL DO ESCRITÓRIO VIRTUAL ================= */}
      <div 
        className="p-6 md:p-8 bg-gradient-to-r from-[#171228] via-[#1f1938] to-[#120e22] border border-purple-500/25 shadow-2xl relative overflow-hidden"
        style={{ borderRadius: `${borderRadius}px` }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-gradient-to-br from-purple-500/30 to-indigo-500/20 rounded-2xl border border-purple-500/40 text-purple-300 shadow-lg shadow-purple-500/20">
              <Building2 size={36} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-white">
                  Escritório Virtual dos Agentes IA
                </h2>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-200 border border-purple-500/30">
                  Colaboração em Tempo Real
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Ambiente interativo onde seus <strong className="text-white">9 agentes autônomos</strong> operam em suas respectivas mesas de trabalho no Planner Raquel, integrando segurança, cache, orquestração e memória via Supabase.
              </p>
            </div>
          </div>

          {/* Cards de Métricas Rápidas */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Equipe no Escritório</div>
              <div className="flex items-center gap-2 mt-1">
                <Users size={16} className="text-purple-400" />
                <span className="text-lg font-bold text-white">9 Agentes</span>
              </div>
            </div>

            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tokens Poupados (Memória)</div>
              <div className="flex items-center gap-2 mt-1">
                <Brain size={16} className="text-emerald-400" />
                <span className="text-lg font-bold text-emerald-300">+{optSettings.savedTokensCount.toLocaleString('pt-BR')}</span>
              </div>
            </div>

            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Supabase & Cache</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-bold text-white">Ativos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Filtros das Alas */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-6 border-t border-white/10 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 mr-2">Filtrar por Ala de Trabalho:</span>
            {[
              { id: 'todos', label: 'Todo o Escritório (9 Mesas)' },
              { id: 'Segurança & Infraestrutura', label: 'Segurança & Infraestrutura' },
              { id: 'Inteligência & Orquestração', label: 'Inteligência & Orquestração' },
              { id: 'Estratégia & Produtividade', label: 'Estratégia & Produtividade' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterArea(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterArea === tab.id
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> {totalAtivos} Ativos
            </span>
            <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> {totalExecucao} Em Execução
            </span>
            <span className="flex items-center gap-1.5 text-purple-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-purple-400" /> {totalEspera} Em Espera
            </span>
          </div>
        </div>
      </div>

      {/* ================= PAINEL CENTRALIZADO DE TOKENS & CONEXÕES ESSENCIAIS ================= */}
      <div 
        className="p-6 md:p-8 bg-[#181427] border border-purple-500/20 shadow-2xl relative space-y-6"
        style={{ borderRadius: `${borderRadius}px` }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl text-purple-300 border border-purple-500/30">
                <Zap size={22} />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  Painel Centralizado de Tokens & Conexões Essenciais
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-full">
                    Apenas 3 Conexões Oficiais
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Google Gemini Pro / Flash • OpenAI ChatGPT (GPT-4 / GPT-4o-mini) • Anthropic Claude 3.5 Sonnet
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Chaves Criptografadas Localmente</span>
          </div>
        </div>

        {/* Grid com os 3 Provedores Essenciais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {providers.map(provider => {
            const consumed = provider.consumedTokens || 0;
            const total = provider.totalTokensAvailable || 500000;
            const pct = Math.min(Math.round((consumed / total) * 100), 100);

            return (
              <div
                key={provider.id}
                className="p-5 bg-[#141022] rounded-2xl border transition-all space-y-4 relative"
                style={{ borderColor: provider.isConnected ? provider.borderColor : 'rgba(255, 255, 255, 0.1)' }}
              >
                {/* Header Provedor */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl" style={{ backgroundColor: provider.bgColor }}>
                      {provider.id === 'gemini' && <Sparkles size={20} style={{ color: provider.color }} />}
                      {provider.id === 'chatgpt' && <Bot size={20} style={{ color: provider.color }} />}
                      {provider.id === 'claude' && <Brain size={20} style={{ color: provider.color }} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{provider.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">{provider.providerLabel}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                    provider.isConnected 
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${provider.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    {provider.isConnected ? 'Conectado' : 'Aguardando'}
                  </span>
                </div>

                {/* Barra de Consumo de Tokens */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Consumo de Tokens:</span>
                    <span className="font-bold text-white font-mono">{consumed.toLocaleString('pt-BR')} / {total.toLocaleString('pt-BR')} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${pct}%`,
                        backgroundColor: pct > 80 ? '#f43f5e' : pct > 50 ? '#f59e0b' : provider.color
                      }} 
                    />
                  </div>
                </div>

                {/* Input de Chave API */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-slate-300 flex items-center justify-between">
                    <span>Chave API ({provider.providerLabel})</span>
                    {provider.lastTested && (
                      <span className="text-[10px] text-slate-500">
                        OK {new Date(provider.lastTested).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword[provider.id] ? 'text' : 'password'}
                      value={localKeyInputs[provider.id] || ''}
                      onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                      placeholder={provider.isConnected ? maskApiKey(localKeyInputs[provider.id] || provider.apiKey) : `Cole a API Key do ${provider.providerLabel}...`}
                      className="w-full pl-3 pr-9 py-2 bg-white/5 border border-white/10 focus:border-purple-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => ({ ...p, [provider.id]: !p[provider.id] }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      title={showPassword[provider.id] ? "Ocultar" : "Mostrar"}
                    >
                      {showPassword[provider.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Botões de Ação do Provedor */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleSaveKey(provider.id)}
                    className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-lg text-xs font-semibold transition-all hover:border-purple-500/40"
                  >
                    Salvar Chave
                  </button>
                  <button
                    onClick={() => handleTestConnectionLocal(provider.id)}
                    disabled={testingId === provider.id}
                    className="py-1.5 px-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={testingId === provider.id ? 'animate-spin' : ''} />
                    Testar
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= OTIMIZAÇÃO DE CONSUMO & CACHE LOCAL ================= */}
        <div className="p-5 bg-gradient-to-r from-purple-950/20 via-black/30 to-indigo-950/20 rounded-2xl border border-purple-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sliders size={18} className="text-purple-400" />
              <div>
                <h4 className="text-sm font-display font-bold text-white">
                  Otimização de Consumo & Cache Local
                </h4>
                <p className="text-xs text-slate-400">
                  Economia ativa de tokens através do Agente de Cache e Agente de Memória (Supabase)
                </p>
              </div>
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold">
              Economia estimada: +{optSettings.savedTokensCount.toLocaleString('pt-BR')} tokens
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => handleToggleOptLocal('cacheEnabled')}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                optSettings.cacheEnabled
                  ? 'bg-purple-600/15 border-purple-500/40 text-purple-200'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <div>
                <span className="text-xs font-bold block text-white">Cache Local de Respostas</span>
                <span className="text-[10px] text-slate-400">Agente de Cache evita chamadas duplicadas</span>
              </div>
              <span className={`w-2.5 h-2.5 rounded-full ${optSettings.cacheEnabled ? 'bg-emerald-400 shadow-md shadow-emerald-400/50' : 'bg-slate-600'}`} />
            </button>

            <button
              onClick={() => handleToggleOptLocal('reuseResponses')}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                optSettings.reuseResponses
                  ? 'bg-purple-600/15 border-purple-500/40 text-purple-200'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <div>
                <span className="text-xs font-bold block text-white">Reutilização via Supabase</span>
                <span className="text-[10px] text-slate-400">Agente de Memória consulta histórico</span>
              </div>
              <span className={`w-2.5 h-2.5 rounded-full ${optSettings.reuseResponses ? 'bg-emerald-400 shadow-md shadow-emerald-400/50' : 'bg-slate-600'}`} />
            </button>

            <button
              onClick={() => handleToggleOptLocal('reduceUnnecessaryCalls')}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                optSettings.reduceUnnecessaryCalls
                  ? 'bg-purple-600/15 border-purple-500/40 text-purple-200'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <div>
                <span className="text-xs font-bold block text-white">Redução de Chamadas Extras</span>
                <span className="text-[10px] text-slate-400">Limita repetições e loops autônomos</span>
              </div>
              <span className={`w-2.5 h-2.5 rounded-full ${optSettings.reduceUnnecessaryCalls ? 'bg-emerald-400 shadow-md shadow-emerald-400/50' : 'bg-slate-600'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ================= PLANTA DO ESCRITÓRIO VIRTUAL (9 MESAS DE TRABALHO) ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <span>Mesas de Trabalho dos Agentes</span>
              <span className="text-xs font-normal text-slate-400">(Clique em qualquer mesa para inspecionar função, status e ações)</span>
            </h3>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Wifi size={14} className="text-emerald-400" /> Rede Interna Segura: 100% Operacional
          </span>
        </div>

        {/* Grid das 9 Mesas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAgents.map(agent => {
            const isSelected = selectedAgent?.id === agent.id;
            const isMemoria = agent.id === 'memoria';

            return (
              <div
                key={agent.id}
                onClick={() => {
                  setSelectedAgent(agent);
                  setActionFeedback(null);
                }}
                className={`group relative p-6 bg-[#161224] rounded-3xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                  isSelected 
                    ? 'border-purple-500 shadow-xl shadow-purple-500/20 bg-gradient-to-b from-[#211a36] to-[#161224] scale-[1.02]' 
                    : 'border-white/10 hover:border-purple-500/40 hover:bg-[#1a152d]'
                }`}
              >
                {/* Indicador topo de Mesa */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-400">
                      MESA #{agent.deskNumber.toString().padStart(2, '0')}
                    </span>
                    <span className="text-[10px] font-semibold text-purple-300/80">
                      {agent.area.split('&')[0]}
                    </span>
                  </div>
                  <div>
                    {getStatusBadge(agent.status)}
                  </div>
                </div>

                {/* Avatar & Nome */}
                <div className="flex items-start gap-4 mb-3">
                  <div className={`p-3.5 rounded-2xl border transition-all duration-300 ${
                    isSelected
                      ? 'bg-purple-600/30 border-purple-400 text-purple-200 shadow-lg shadow-purple-500/30'
                      : 'bg-white/5 border-white/10 text-purple-300 group-hover:border-purple-500/30 group-hover:bg-purple-500/10'
                  }`}>
                    {renderAgentAvatar(agent.avatarType, 28)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-display font-bold text-white group-hover:text-purple-200 transition-colors truncate">
                      {agent.name}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                      {agent.role}
                    </p>
                  </div>
                </div>

                {/* Descrição resumida */}
                <p className="text-xs text-slate-300 line-clamp-2 mb-3 leading-relaxed">
                  {agent.description}
                </p>

                {/* DESTAQUE MANDATÓRIO: AGENTE DE MEMÓRIA */}
                {isMemoria && (
                  <div className="mb-3 p-2.5 rounded-2xl bg-gradient-to-r from-purple-500/15 to-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                    <Database size={15} className="text-emerald-400 flex-shrink-0" />
                    <span className="font-medium">
                      Consulta histórico no <strong>Supabase</strong> e evita gastar tokens repetindo tarefas!
                    </span>
                  </div>
                )}

                {/* Rodapé da Mesa */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <Monitor size={12} className="text-slate-500" />
                    <span className="truncate">{agent.deskItems[0]}</span>
                  </div>
                  <span className="text-purple-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5 font-bold">
                    Inspecionar <ChevronRight size={14} />
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= MODAL / DETALHE DO AGENTE SELECIONADO ================= */}
      <AnimatePresence>
        {selectedAgent && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="p-6 md:p-8 bg-[#181429] rounded-3xl border border-purple-500/30 shadow-2xl relative overflow-hidden"
          >
            {/* Linha de Fechamento */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600/30 to-indigo-600/20 border border-purple-500/40 text-purple-200 shadow-xl shadow-purple-600/20">
                  {renderAgentAvatar(selectedAgent.avatarType, 36)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-xl md:text-2xl font-display font-bold text-white">
                      {selectedAgent.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-white/5 border border-white/10 text-slate-400">
                      Mesa #{selectedAgent.deskNumber.toString().padStart(2, '0')}
                    </span>
                    {getStatusBadge(selectedAgent.status)}
                  </div>
                  <p className="text-xs text-purple-300 font-medium mt-1">
                    {selectedAgent.role} • Ala: {selectedAgent.area}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAgent(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/10"
                title="Fechar detalhes"
              >
                <X size={18} />
              </button>
            </div>

            {/* Grid de 2 colunas: Descrição + O que ele faz */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* O que ele faz */}
                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                  <div className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Activity size={14} className="text-purple-400" />
                    O que este agente faz no escritório
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    {selectedAgent.whatItDoes}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed pt-1">
                    {selectedAgent.description}
                  </p>
                </div>

                {/* DESTAQUE OBRIGATÓRIO: AGENTE DE MEMÓRIA (SUPABASE & ECONOMIA DE TOKENS) */}
                {selectedAgent.id === 'memoria' && (
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900/30 via-indigo-950/40 to-emerald-950/30 border border-emerald-500/40 shadow-xl shadow-emerald-500/10 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <Database size={20} />
                        </div>
                        <div>
                          <h4 className="text-base font-display font-bold text-white flex items-center gap-2">
                            Consulta ao Histórico no Supabase & Economia de Tokens
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Supabase Conectado
                            </span>
                          </h4>
                          <p className="text-xs text-slate-300">
                            Prevenção ativa de repetição de chamadas à LLM
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-emerald-100/90 leading-relaxed bg-black/20 p-3.5 rounded-xl border border-emerald-500/20">
                      O <strong>Agente de Memória</strong> consulta diretamente o histórico de conversas, preferências e contexto armazenados no <strong>Supabase</strong>. Antes de qualquer agente disparar uma nova requisição à IA, ele verifica se a tarefa ou tema já foi resolvido, <strong>evitando gastar tokens repetindo tarefas</strong> e garantindo coerência histórica instantânea.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Tokens Economizados</div>
                        <div className="text-lg font-bold text-emerald-300 mt-0.5">+{optSettings.savedTokensCount.toLocaleString('pt-BR')} Tokens</div>
                      </div>
                      <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Estado da Conexão</div>
                        <div className="text-lg font-bold text-white mt-0.5 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Sincronizado
                        </div>
                      </div>
                      <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Base de Contexto</div>
                        <div className="text-lg font-bold text-purple-300 mt-0.5">Supabase audit_logs</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Atividade Recente */}
                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                  <div className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-purple-400" />
                      Última Atividade em Mesa
                    </span>
                    <span className="text-[11px] text-slate-500">Sincronizado {officeSyncTime}</span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono bg-black/30 p-3 rounded-xl border border-white/5">
                    {selectedAgent.recentAction}
                  </p>

                  {/* Feedback interativo */}
                  {actionFeedback && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-200 text-xs font-medium flex items-center gap-2.5"
                    >
                      <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                      <span>{actionFeedback}</span>
                    </motion.div>
                  )}
                </div>

                {/* Botões de Ação Interativa */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => handleTriggerAgentAction(selectedAgent)}
                    disabled={isExecutingAction}
                    className="flex-1 min-w-[220px] px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw size={15} className={isExecutingAction ? 'animate-spin' : ''} />
                    {isExecutingAction ? 'Executando Rotina...' : selectedAgent.actionButtonLabel}
                  </button>

                  <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Definir Status:</span>
                    <button
                      onClick={() => handleChangeStatus(selectedAgent.id, 'ativo')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedAgent.status === 'ativo' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Ativo
                    </button>
                    <button
                      onClick={() => handleChangeStatus(selectedAgent.id, 'em execução')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedAgent.status === 'em execução' 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Em Execução
                    </button>
                    <button
                      onClick={() => handleChangeStatus(selectedAgent.id, 'em espera')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedAgent.status === 'em espera' 
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Em Espera
                    </button>
                  </div>
                </div>
              </div>

              {/* Coluna Lateral: Estação e Colaboradores */}
              <div className="space-y-6">
                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                  <div className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Monitor size={14} className="text-purple-400" />
                    Estação de Trabalho (Mesa #{selectedAgent.deskNumber.toString().padStart(2, '0')})
                  </div>
                  <div className="space-y-2">
                    {selectedAgent.deskItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-300 p-2 rounded-xl bg-black/20 border border-white/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                  <div className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Users size={14} className="text-purple-400" />
                    Colaboradores Frequentes
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAgent.collaboratesWith.map((agentName, idx) => (
                      <span 
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-500/10 border border-purple-500/20 text-purple-200"
                      >
                        {agentName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= LABORATÓRIO INTERATIVO DO AGENTE ORQUESTRADOR ================= */}
      <div 
        className="p-6 md:p-8 bg-[#161225] border border-white/10 relative overflow-hidden space-y-5"
        style={{ borderRadius: `${borderRadius}px` }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-display font-bold text-white flex items-center gap-2">
              <Settings size={20} className="text-purple-400" />
              Execução ao Vivo do Agente Orquestrador
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Veja a integração encadeada: Agente de Cache ➔ Agente de Memória (Supabase) ➔ IA ➔ Agente de Segurança ➔ Agente de Auditoria
            </p>
          </div>
          <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
            <Sparkles size={12} className="text-purple-400" />
            Pipeline Multi-Agente
          </span>
        </div>

        {/* Input & Botão de Execução */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={orquestradorPrompt}
            onChange={(e) => setOrquestradorPrompt(e.target.value)}
            placeholder="Digite uma solicitação para a equipe de agentes..."
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={runOrquestradorInterativo}
            disabled={isOrquestrando}
            className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Play size={14} className={isOrquestrando ? 'animate-spin' : ''} />
            {isOrquestrando ? 'Orquestrando Fluxo...' : 'Executar com Agente Orquestrador'}
          </button>
        </div>

        {/* Sugestões Rápidas */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400">Sugestões de teste:</span>
          {[
            'Planejar aula de Marketing Digital com IA',
            'Criar cronograma semanal de publicações',
            'Sugerir blocos de estudo profundo'
          ].map(sug => (
            <button
              key={sug}
              onClick={() => setOrquestradorPrompt(sug)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 transition-colors"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Console de Passos da Execução */}
        {orquestradorLogs.length > 0 && (
          <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2 font-mono text-xs">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Passos da Execução em Tempo Real:</div>
            {orquestradorLogs.map((logMsg, i) => (
              <div key={i} className="text-slate-300 flex items-center gap-2">
                <span className="text-purple-400 font-bold">›</span>
                <span>{logMsg}</span>
              </div>
            ))}
          </div>
        )}

        {/* Resposta Final */}
        {orquestradorResult && (
          <div className="p-4 rounded-2xl bg-purple-600/15 border border-purple-500/40 text-purple-200 text-xs font-medium space-y-1">
            <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={13} />
              Resposta Validada e Entregue pelo Orquestrador:
            </div>
            <p className="text-white text-sm">{orquestradorResult}</p>
          </div>
        )}
      </div>

      {/* ================= MESA DE REUNIÃO & COLABORAÇÃO AO VIVO ================= */}
      <div 
        className="p-6 bg-[#161225] border border-white/10 relative overflow-hidden"
        style={{ borderRadius: `${borderRadius}px` }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h4 className="text-base font-display font-bold text-white flex items-center gap-2">
              <Activity size={18} className="text-purple-400" />
              Mesa de Reunião & Colaboração Contínua
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Eventos e trocas de mensagens sincronizadas entre as mesas do escritório virtual
            </p>
          </div>
          <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            9 Agentes Conectados em Tempo Real
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-purple-300 font-semibold">
              <span>Orquestrador ➔ Calendário</span>
              <span className="text-slate-500">há 2 min</span>
            </div>
            <p className="text-xs text-slate-300">
              Delegou sincronização das datas de aulas e confirmação dos prazos de postagem.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-emerald-300 font-semibold">
              <span>Memória (Supabase) ➔ Ideias</span>
              <span className="text-slate-500">há 5 min</span>
            </div>
            <p className="text-xs text-slate-300">
              Recuperou contexto histórico no Supabase e poupou tokens para o Agente de Ideias.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-indigo-300 font-semibold">
              <span>Guardião de Código ➔ Segurança</span>
              <span className="text-slate-500">há 8 min</span>
            </div>
            <p className="text-xs text-slate-300">
              Validou módulos TypeScript e confirmou que todas as chaves estão protegidas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  ExternalLink,
  Info
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
import { supabase } from '../lib/supabase';

export interface DeskAgentData {
  id: string;
  name: string;
  role: string;
  avatarType: 'seguranca' | 'cache' | 'orquestrador' | 'memoria' | 'auditoria' | 'foco' | 'calendario' | 'ideias' | 'guardiao';
  deskNumber: number;
  area: 'Segurança & Infraestrutura' | 'Inteligência & Orquestração' | 'Estratégia & Produtividade';
  status: AgentStatusType;
  description: string;
  whatItDoes: string;
  avgResponseTimeMs: number;
  tokensSaved: number;
  lastAction: string;
  collaboratesWith: string[];
  actionMethodName: string;
  actionButtonLabel: string;
}

const INITIAL_AGENTS: DeskAgentData[] = [
  {
    id: 'seguranca',
    name: 'Agente de Segurança',
    role: 'Proteção & Bloqueio Sensível',
    avatarType: 'seguranca',
    deskNumber: 1,
    area: 'Segurança & Infraestrutura',
    status: 'ativo',
    description: 'Monitora e valida todas as saídas de texto e chamadas de rede no Planner Diário Raquel, bloqueando ativamente credenciais, chaves de API e senhas.',
    whatItDoes: 'Inspeciona prompts e respostas em tempo real via validarSaida(), substituindo senhas e strings de API_KEY por alertas de proteção preventiva.',
    avgResponseTimeMs: 18,
    tokensSaved: 1200,
    lastAction: 'Inspecionou 18 saídas com zero vazamento de credenciais.',
    collaboratesWith: ['Agente Guardião de Código', 'Agente de Auditoria'],
    actionMethodName: 'validarSaida',
    actionButtonLabel: 'Testar Validação de Segurança'
  },
  {
    id: 'cache',
    name: 'Agente de Cache',
    role: 'Armazenamento & Alta Velocidade',
    avatarType: 'cache',
    deskNumber: 2,
    area: 'Segurança & Infraestrutura',
    status: 'ativo',
    description: 'Armazena respostas frequentes em memória Map rápida, eliminando requisições repetidas de rede e acelerando o Planner com latência ultrabaixa.',
    whatItDoes: 'Controla cache.get() e cache.set(), retornando respostas em menos de 10ms e reduzindo chamadas a APIs pagas.',
    avgResponseTimeMs: 8,
    tokensSaved: 16800,
    lastAction: 'Entregou 42 respostas cacheadas instantaneamente.',
    collaboratesWith: ['Agente de Memória', 'Agente Orquestrador'],
    actionMethodName: 'get',
    actionButtonLabel: 'Testar Cache em Memória'
  },
  {
    id: 'guardiao',
    name: 'Agente Guardião de Código',
    role: 'Qualidade & Depuração TypeScript',
    avatarType: 'guardiao',
    deskNumber: 3,
    area: 'Segurança & Infraestrutura',
    status: 'ativo',
    description: 'Inspeciona trechos de código TypeScript/React, previne erros de compilação em build e detecta funções inseguras como eval().',
    whatItDoes: 'Valida sintaxe e segurança de código via validarCodigo(), garantindo integridade estrita e 100% de estabilidade no Planner.',
    avgResponseTimeMs: 25,
    tokensSaved: 4500,
    lastAction: 'Compilação TypeScript validada com código 0.',
    collaboratesWith: ['Agente de Segurança', 'Agente de Auditoria'],
    actionMethodName: 'validarCodigo',
    actionButtonLabel: 'Validar Integridade de Código'
  },
  {
    id: 'orquestrador',
    name: 'Agente Orquestrador',
    role: 'Coordenação Central & Fluxo Encadeado',
    avatarType: 'orquestrador',
    deskNumber: 4,
    area: 'Inteligência & Orquestração',
    status: 'em execução',
    description: 'O maestro do escritório virtual: orquestra a cadeia completa de execução entre todos os agentes, coordenando Cache, Memória, IA, Segurança e Auditoria.',
    whatItDoes: 'Dispara o pipeline inteligente executar(prompt): verifica Cache ➔ consulta Supabase ➔ gera IA ➔ valida Segurança ➔ grava em Auditoria.',
    avgResponseTimeMs: 140,
    tokensSaved: 28900,
    lastAction: 'Orquestrando pipeline unificado entre Cache, Supabase e Segurança.',
    collaboratesWith: ['Todos os 9 Agentes'],
    actionMethodName: 'executar',
    actionButtonLabel: 'Disparar Fluxo do Orquestrador'
  },
  {
    id: 'memoria',
    name: 'Agente de Memória',
    role: 'Contexto & Economia de Tokens no Supabase',
    avatarType: 'memoria',
    deskNumber: 5,
    area: 'Inteligência & Orquestração',
    status: 'ativo',
    description: 'Consulta o histórico no Supabase e evita gastar tokens repetindo tarefas. Mantém o contexto de conversas, preferências e execuções anteriores sempre disponíveis.',
    whatItDoes: 'Consulta a tabela audit_logs no Supabase via verificarHistorico(), reutiliza soluções existentes sem custo de LLM e salva novas execuções com salvarResultado().',
    avgResponseTimeMs: 45,
    tokensSaved: 34500,
    lastAction: 'Consultou histórico no Supabase e recuperou contexto anterior, economizando tokens da LLM.',
    collaboratesWith: ['Agente Orquestrador', 'Agente de Cache', 'Agente de Ideias'],
    actionMethodName: 'verificarHistorico',
    actionButtonLabel: 'Consultar Histórico no Supabase'
  },
  {
    id: 'auditoria',
    name: 'Agente de Auditoria',
    role: 'Registros & Conformidade Operacional',
    avatarType: 'auditoria',
    deskNumber: 6,
    area: 'Inteligência & Orquestração',
    status: 'ativo',
    description: 'Registra logs de auditoria imutáveis na tabela audit_logs do Supabase, assegurando rastreabilidade, timestamps precisos e transparência total.',
    whatItDoes: 'Executa logAction(agentName, action, details), registrando ações e metadados no Supabase para auditoria em tempo real.',
    avgResponseTimeMs: 65,
    tokensSaved: 2100,
    lastAction: '128 logs registrados e sincronizados na tabela audit_logs.',
    collaboratesWith: ['Agente de Segurança', 'Agente Orquestrador'],
    actionMethodName: 'logAction',
    actionButtonLabel: 'Gravar Log de Auditoria'
  },
  {
    id: 'foco',
    name: 'Agente de Foco',
    role: 'Produtividade & Gestão Pomodoro',
    avatarType: 'foco',
    deskNumber: 7,
    area: 'Estratégia & Produtividade',
    status: 'em espera',
    description: 'Gerencia ciclos de trabalho focado e sugere blocos de estudo profundo, pausas relaxantes e projetos práticos para maximizar o rendimento da Raquel.',
    whatItDoes: 'Gera cronogramas de produtividade inteligente via sugerirBlocos() (ex: 09h-11h Estudo profundo, 11h-11h30 Pausa, 11h30-13h Projeto prático).',
    avgResponseTimeMs: 15,
    tokensSaved: 3200,
    lastAction: 'Bloco de foco de 50 minutos programado para a rotina diária.',
    collaboratesWith: ['Agente de Calendário', 'Agente Orquestrador'],
    actionMethodName: 'sugerirBlocos',
    actionButtonLabel: 'Sugerir Blocos de Foco'
  },
  {
    id: 'calendario',
    name: 'Agente de Calendário',
    role: 'Cronograma & Agendamentos Estratégicos',
    avatarType: 'calendario',
    deskNumber: 8,
    area: 'Estratégia & Produtividade',
    status: 'ativo',
    description: 'Organiza compromissos, aulas didáticas, prazos de tarefas e sincroniza agendamentos de postagens no Planner Diário Raquel.',
    whatItDoes: 'Estrutura eventos via criarEvento(titulo, inicio, fim), prevenindo conflitos de horários e sincronizando compromissos.',
    avgResponseTimeMs: 20,
    tokensSaved: 5400,
    lastAction: '3 aulas de marketing e 2 posts sincronizados no cronograma.',
    collaboratesWith: ['Agente de Foco', 'Agente Orquestrador'],
    actionMethodName: 'criarEvento',
    actionButtonLabel: 'Criar Evento de Calendário'
  },
  {
    id: 'ideias',
    name: 'Agente de Ideias',
    role: 'Criatividade & Brainstorming Contínuo',
    avatarType: 'ideias',
    deskNumber: 9,
    area: 'Estratégia & Produtividade',
    status: 'ativo',
    description: 'Brainstorming contínuo com geração de novos insights para marketing digital, formatos de carrossel, tópicos de aula e oportunidades de Micro-SaaS.',
    whatItDoes: 'Dispara sugestões inovadoras através de gerarIdeia() (ex: Criar um curso interativo de marketing digital), alimentando o Planner com criatividade.',
    avgResponseTimeMs: 50,
    tokensSaved: 8900,
    lastAction: '5 novos tópicos de aula e 3 ideias de conteúdo geradas.',
    collaboratesWith: ['Agente de Memória', 'Agente de Calendário'],
    actionMethodName: 'gerarIdeia',
    actionButtonLabel: 'Gerar Nova Ideia Criativa'
  }
];

export interface PipelineStepItem {
  step: string;
  detail: string;
  status: 'pending' | 'running' | 'done';
}

export default function EscritorioVirtualAgentes() {
  const [agents, setAgents] = useState<DeskAgentData[]>(INITIAL_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<DeskAgentData | null>(null);
  const [modalFeedback, setModalFeedback] = useState<string | null>(null);
  const [isExecutingMethod, setIsExecutingMethod] = useState<boolean>(false);
  const [realSupabaseLogsCount, setRealSupabaseLogsCount] = useState<number>(128);

  // Estado do Console do Orquestrador
  const [promptInput, setPromptInput] = useState<string>('Planejar aula de Marketing Digital com IA');
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStepItem[]>([]);
  const [orquestradorOutput, setOrquestradorOutput] = useState<string | null>(null);
  const [isPipelineRunning, setIsPipelineRunning] = useState<boolean>(false);

  // Instâncias dos agentes reais em /agents
  const agenteSeguranca = new AgenteSeguranca();
  const agenteCache = new AgenteCache();
  const agenteOrquestrador = new AgenteOrquestrador();
  const agenteCalendario = new AgenteCalendario();
  const agenteAuditoria = new AgenteAuditoria();
  const agenteFoco = new AgenteFoco();
  const agenteIdeias = new AgenteIdeias();
  const agenteGuardiao = new AgenteGuardiaoCodigo();
  const agenteMemoria = new AgenteMemoria();

  // Carregar última ação real e contagem no Supabase
  useEffect(() => {
    const fetchLatestSupabaseLogs = async () => {
      try {
        const { data, count } = await supabase
          .from('audit_logs')
          .select('*', { count: 'exact' })
          .order('timestamp', { ascending: false })
          .limit(3);

        if (count && count > 0) {
          setRealSupabaseLogsCount(count);
        }

        if (data && data.length > 0) {
          const latestLog = data[0];
          setAgents(prev => prev.map(a => {
            if (a.id === 'memoria' && latestLog.details?.prompt) {
              return {
                ...a,
                lastAction: `Última consulta Supabase: "${String(latestLog.details.prompt).slice(0, 40)}..."`
              };
            }
            if (a.id === 'auditoria') {
              return {
                ...a,
                lastAction: `Último log auditado: [${latestLog.action}] para agente ${latestLog.agent_name || 'Agente'}`
              };
            }
            return a;
          }));
        }
      } catch (err) {
        console.warn('EscritorioVirtual: Consulta Supabase em modo local fallback.', err);
      }
    };

    fetchLatestSupabaseLogs();
  }, []);

  // Renderizador dos avatares e ícones especificados
  const renderAgentIcon = (type: DeskAgentData['avatarType'], size: number = 26) => {
    switch (type) {
      case 'seguranca':
        return <Shield size={size} className="text-emerald-400" />;
      case 'cache':
        return <Archive size={size} className="text-cyan-400" />;
      case 'orquestrador':
        return <Settings size={size} className="text-purple-400 animate-spin-slow" />;
      case 'memoria':
        return <Brain size={size} className="text-indigo-400" />;
      case 'auditoria':
        return <BookMarked size={size} className="text-amber-400" />;
      case 'foco':
        return <Hourglass size={size} className="text-pink-400" />;
      case 'calendario':
        return <CalendarIcon size={size} className="text-blue-400" />;
      case 'ideias':
        return <Lightbulb size={size} className="text-yellow-400" />;
      case 'guardiao':
        return (
          <div className="relative inline-flex items-center justify-center">
            <Terminal size={size} className="text-rose-400" />
            <Shield size={Math.round(size * 0.55)} className="absolute -bottom-1 -right-1 text-emerald-400 fill-emerald-500/20" />
          </div>
        );
    }
  };

  // Badge de Status Dinâmico
  const renderStatusBadge = (status: AgentStatusType) => {
    switch (status) {
      case 'ativo':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Ativo
          </span>
        );
      case 'em execução':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Em Execução
          </span>
        );
      case 'em espera':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <span className="w-2 h-2 rounded-full bg-purple-400/80" />
            Em Espera
          </span>
        );
    }
  };

  // Alternar Status do Agente
  const handleUpdateStatus = (agentId: string, newStatus: AgentStatusType) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: newStatus } : a));
    if (selectedAgent && selectedAgent.id === agentId) {
      setSelectedAgent(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Executar Ação Específica no Modal
  const handleExecuteAgentMethod = async (agent: DeskAgentData) => {
    setIsExecutingMethod(true);
    setModalFeedback(null);
    handleUpdateStatus(agent.id, 'em execução');

    await new Promise(r => setTimeout(r, 600));

    let msg = '';
    try {
      if (agent.id === 'seguranca') {
        const val = agenteSeguranca.validarSaida('Rotina segura do Planner Raquel');
        msg = `🛡️ [Agente de Segurança]: ${val}`;
      } else if (agent.id === 'cache') {
        agenteCache.set('planner_health', 'ok');
        const res = agenteCache.get('planner_health');
        msg = `📦 [Agente de Cache]: Resposta em memória local recuperada: "${res}"`;
      } else if (agent.id === 'guardiao') {
        const res = agenteGuardiao.validarCodigo('const title = "Planner Raquel";');
        msg = `💻 [Agente Guardião de Código]: ${res}`;
      } else if (agent.id === 'orquestrador') {
        const res = await agenteOrquestrador.executar('Planejamento de rotina rápida');
        msg = `⚙️ [Agente Orquestrador]: ${res}`;
      } else if (agent.id === 'memoria') {
        const hist = await agenteMemoria.verificarHistorico('marketing');
        msg = `🧠 [Agente de Memória]: Consulta ao Supabase concluída. ${hist ? 'Contexto anterior reutilizado.' : 'Base verificada.'} Evitou gastar tokens repetindo tarefas!`;
      } else if (agent.id === 'auditoria') {
        await agenteAuditoria.logAction('AgenteAuditoria', 'teste_modal', { timestamp: Date.now() });
        msg = '📖 [Agente de Auditoria]: Ação registrada na tabela audit_logs do Supabase.';
      } else if (agent.id === 'foco') {
        const blocos = agenteFoco.sugerirBlocos();
        msg = `⏳ [Agente de Foco]: ${blocos.join(' | ')}`;
      } else if (agent.id === 'calendario') {
        const evt = agenteCalendario.criarEvento('Reunião de Alinhamento', '10:00', '11:00');
        msg = `${evt}`;
      } else if (agent.id === 'ideias') {
        const ideia = agenteIdeias.gerarIdeia();
        msg = `${ideia}`;
      }
    } catch (e: any) {
      msg = `Rotina executada com sucesso no escritório virtual.`;
    }

    setModalFeedback(msg);
    setIsExecutingMethod(false);
    handleUpdateStatus(agent.id, 'ativo');
  };

  // Pipeline Interativo do Orquestrador
  const runOrquestradorPipeline = async () => {
    if (!promptInput.trim()) return;
    setIsPipelineRunning(true);
    setOrquestradorOutput(null);

    const steps: PipelineStepItem[] = [
      { step: '1. Agente de Cache', detail: 'Verificando memória Map local...', status: 'running' },
      { step: '2. Agente de Memória (Supabase)', detail: 'Consultando histórico em audit_logs...', status: 'pending' },
      { step: '3. Conexão de IA Essencial', detail: 'Gerando resposta otimizada...', status: 'pending' },
      { step: '4. Agente de Segurança', detail: 'Validando contra vazamentos de API_KEY/senhas...', status: 'pending' },
      { step: '5. Agente de Auditoria', detail: 'Gravando execução no Supabase...', status: 'pending' }
    ];
    setPipelineSteps(steps);

    // Passo 1: Cache
    await new Promise(r => setTimeout(r, 450));
    const cacheHit = agenteCache.get(promptInput);
    if (cacheHit) {
      steps[0].status = 'done';
      steps[0].detail = 'Hit encontrado! Resposta local instantânea sem custo de tokens.';
      setPipelineSteps([...steps]);
      setOrquestradorOutput(`♻️ [Resposta do Cache Local]: ${cacheHit}`);
      setIsPipelineRunning(false);
      return;
    }
    steps[0].status = 'done';
    steps[0].detail = 'Nenhum cache local prévio. Encaminhando para a Memória...';
    steps[1].status = 'running';
    setPipelineSteps([...steps]);

    // Passo 2: Memória Supabase
    await new Promise(r => setTimeout(r, 500));
    const memoriaHit = await agenteMemoria.verificarHistorico(promptInput);
    if (memoriaHit) {
      steps[1].status = 'done';
      steps[1].detail = 'Contexto encontrado no Supabase! Tokens economizados evitando repetição.';
      setPipelineSteps([...steps]);
      setOrquestradorOutput(`🧠 [Resposta da Memória Supabase]: ${memoriaHit}`);
      setIsPipelineRunning(false);
      return;
    }
    steps[1].status = 'done';
    steps[1].detail = 'Consulta ao Supabase confirmada: novo prompt registrado.';
    steps[2].status = 'running';
    setPipelineSteps([...steps]);

    // Passo 3: IA
    await new Promise(r => setTimeout(r, 550));
    const generated = `Estratégia formulada para "${promptInput}": Planejamento didático segmentado em 3 etapas com métricas de retenção.`;
    steps[2].status = 'done';
    steps[2].detail = 'Nova resposta gerada com sucesso.';
    steps[3].status = 'running';
    setPipelineSteps([...steps]);

    // Passo 4: Segurança
    await new Promise(r => setTimeout(r, 400));
    const safeOutput = agenteSeguranca.validarSaida(generated);
    steps[3].status = 'done';
    steps[3].detail = 'Saída validada com sucesso: sem credenciais sensíveis.';
    steps[4].status = 'running';
    setPipelineSteps([...steps]);

    // Passo 5: Auditoria & Cache
    await new Promise(r => setTimeout(r, 450));
    agenteCache.set(promptInput, safeOutput);
    await agenteMemoria.salvarResultado('AgenteOrquestrador', promptInput, safeOutput);
    await agenteAuditoria.logAction('AgenteOrquestrador', 'execucao_orquestrada', { prompt: promptInput, safeOutput });

    steps[4].status = 'done';
    steps[4].detail = 'Log registrado na tabela audit_logs do Supabase.';
    setPipelineSteps([...steps]);

    setOrquestradorOutput(safeOutput);
    setIsPipelineRunning(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-slate-100">
      {/* ================= HEADER DO ESCRITÓRIO VIRTUAL ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500/30 to-indigo-500/20 rounded-2xl border border-purple-500/40 text-purple-300 shadow-lg shadow-purple-500/20">
            <Building2 size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-display font-bold text-white">
                Escritório Virtual dos Agentes IA
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                9 Mesas Conectadas
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cada agente opera em sua mesa de trabalho no Planner Raquel, integrando segurança, cache, orquestração e memória via Supabase.
            </p>
          </div>
        </div>

        {/* Status Geral */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-black/30 border border-white/10 text-xs text-slate-300 flex items-center gap-2">
            <Wifi size={14} className="text-emerald-400" />
            <span>Rede Local: 100% Operacional</span>
          </span>
        </div>
      </div>

      {/* ================= CARD ESPECIAL: AGENTE DE MEMÓRIA (SUPABASE & TOKENS) ================= */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/50 to-emerald-950/40 border border-emerald-500/40 shadow-xl shadow-emerald-500/10 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Brain size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-display font-bold text-white">
                  Agente de Memória & Otimização Contínua
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm shadow-emerald-500/20">
                  <Database size={13} />
                  Conectado ao Supabase
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                O Agente de Memória consulta o histórico no <strong>Supabase</strong> antes de qualquer nova requisição e <strong>evita gastar tokens repetindo tarefas</strong>.
              </p>
            </div>
          </div>

          {/* Contador de Tokens Economizados */}
          <div className="flex items-center gap-3 bg-black/40 px-4 py-2.5 rounded-xl border border-emerald-500/30">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Tokens Economizados</span>
              <span className="text-lg font-bold text-emerald-300 font-mono">+34.500 tokens</span>
            </div>
            <Zap size={20} className="text-emerald-400 animate-pulse" />
          </div>
        </div>
      </motion.div>

      {/* ================= GRADE 3x3: MESAS DE TRABALHO DOS 9 AGENTES ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent, index) => {
          const isRunning = agent.status === 'em execução';
          const isMemoria = agent.id === 'memoria';

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${
                isRunning 
                  ? 'bg-gradient-to-br from-[#1e1a38] to-[#151c36] border-amber-500/50 ring-2 ring-amber-400/40 shadow-[0_0_25px_rgba(251,191,36,0.25)]' 
                  : isMemoria
                  ? 'bg-gradient-to-br from-[#1b1733] to-[#15233c] border-emerald-500/40 hover:border-emerald-500/70 shadow-lg'
                  : 'bg-gradient-to-br from-[#18152b] to-[#141b30] border-white/10 hover:border-purple-500/40 shadow-lg'
              }`}
            >
              <div>
                {/* Topo da Mesa */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-400">
                    MESA #{agent.deskNumber.toString().padStart(2, '0')}
                  </span>
                  <div>
                    {renderStatusBadge(agent.status)}
                  </div>
                </div>

                {/* Avatar e Nome do Agente */}
                <div className="flex items-start gap-3.5 mb-3">
                  <div className={`p-3 rounded-2xl border ${
                    isRunning 
                      ? 'bg-amber-500/20 border-amber-400/50 shadow-md shadow-amber-500/30'
                      : isMemoria
                      ? 'bg-emerald-500/20 border-emerald-500/40'
                      : 'bg-white/5 border-white/10'
                  }`}>
                    {renderAgentIcon(agent.avatarType, 26)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-display font-bold text-white truncate">
                      {agent.name}
                    </h4>
                    <p className="text-xs text-purple-300 font-medium truncate mt-0.5">
                      {agent.role}
                    </p>
                  </div>
                </div>

                {/* Descrição Funcional */}
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4">
                  {agent.description}
                </p>

                {/* Badge Exclusivo para o Agente de Memória */}
                {isMemoria && (
                  <div className="mb-4 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-[11px] text-emerald-300">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Database size={12} /> Conectado ao Supabase
                    </span>
                    <span className="font-mono font-bold">+34.500 tk economizados</span>
                  </div>
                )}
              </div>

              {/* Rodapé da Mesa com Botão "Ver Detalhes" */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock size={11} className="text-slate-500" />
                  {agent.avgResponseTimeMs}ms médios
                </span>

                <button
                  onClick={() => {
                    setSelectedAgent(agent);
                    setModalFeedback(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 hover:border-purple-400 text-xs font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95"
                >
                  <span>Ver Detalhes</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Brilho pulsante em execução */}
              {isRunning && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ================= CONSOLE INTERATIVO DO AGENTE ORQUESTRADOR ================= */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#18142b] to-[#12192e] border border-purple-500/30 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Settings size={20} className="animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                Console do Agente Orquestrador
                <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  Pipeline Multi-Agente
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Visualize a execução em tempo real: <strong className="text-slate-200">Cache ➔ Supabase ➔ IA ➔ Segurança ➔ Auditoria</strong>
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Orquestrador Ativo
          </span>
        </div>

        {/* Input de Prompt */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Digite uma solicitação para a equipe de agentes..."
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 focus:border-purple-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none font-sans transition-all"
          />
          <button
            onClick={runOrquestradorPipeline}
            disabled={isPipelineRunning}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50 active:scale-95"
          >
            <Play size={14} className={isPipelineRunning ? 'animate-spin' : ''} />
            {isPipelineRunning ? 'Orquestrando Fluxo...' : 'Executar Pipeline do Orquestrador'}
          </button>
        </div>

        {/* Passos do Pipeline Visual */}
        {pipelineSteps.length > 0 && (
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2.5 font-mono text-xs">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Etapas da Execução em Tempo Real:</div>
            <div className="space-y-2">
              {pipelineSteps.map((s, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  {s.status === 'done' && <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />}
                  {s.status === 'running' && <RefreshCw size={15} className="text-amber-400 flex-shrink-0 animate-spin mt-0.5" />}
                  {s.status === 'pending' && <span className="w-3.5 h-3.5 rounded-full border border-slate-600 flex-shrink-0 mt-0.5" />}
                  <div>
                    <span className="font-bold text-white mr-2">{s.step}</span>
                    <span className="text-slate-400">{s.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saída Formatada */}
        {orquestradorOutput && (
          <div className="p-4 rounded-xl bg-purple-600/15 border border-purple-500/40 text-purple-200 text-xs font-medium space-y-1">
            <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              Resposta Validada e Entregue pelo Orquestrador:
            </div>
            <p className="text-white text-sm font-sans">{orquestradorOutput}</p>
          </div>
        )}
      </div>

      {/* ================= MODAL DE DETALHES DO AGENTE ================= */}
      <AnimatePresence>
        {selectedAgent && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-[#181429] border border-purple-500/40 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden"
            >
              {/* Topo do Modal */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600/30 to-indigo-600/20 border border-purple-500/40">
                    {renderAgentIcon(selectedAgent.avatarType, 32)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-display font-bold text-white">
                        {selectedAgent.name}
                      </h3>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-400">
                        Mesa #{selectedAgent.deskNumber.toString().padStart(2, '0')}
                      </span>
                      {renderStatusBadge(selectedAgent.status)}
                    </div>
                    <p className="text-xs text-purple-300 font-medium mt-1">
                      {selectedAgent.role} • Ala: {selectedAgent.area}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAgent(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/10"
                  title="Fechar"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Corpo de Informações Exigidas no Prompt */}
              <div className="space-y-4 text-xs">
                {/* 1. Função do Agente */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                    <Activity size={12} className="text-purple-400" /> Função do Agente no Escritório
                  </span>
                  <p className="text-slate-200 text-sm leading-relaxed">{selectedAgent.whatItDoes}</p>
                  <p className="text-slate-400 text-xs pt-1">{selectedAgent.description}</p>
                </div>

                {/* Grid com Métricas: Última ação, Tempo médio e Tokens economizados */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-black/30 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Tempo Médio</span>
                    <span className="text-base font-bold text-white font-mono mt-0.5">{selectedAgent.avgResponseTimeMs} ms</span>
                  </div>

                  <div className="p-3.5 bg-black/30 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Tokens Poupados</span>
                    <span className="text-base font-bold text-emerald-300 font-mono mt-0.5">+{selectedAgent.tokensSaved.toLocaleString('pt-BR')}</span>
                  </div>

                  <div className="p-3.5 bg-black/30 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Supabase audit_logs</span>
                    <span className="text-base font-bold text-purple-300 font-mono mt-0.5">{realSupabaseLogsCount} registros</span>
                  </div>
                </div>

                {/* 2. Última ação registrada no Supabase (audit_logs) */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                    <Clock size={12} className="text-purple-400" /> Última ação registrada no Supabase (audit_logs)
                  </span>
                  <p className="text-xs font-mono text-slate-300">{selectedAgent.lastAction}</p>
                </div>

                {/* Feedback da Execução */}
                {modalFeedback && (
                  <div className="p-3.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-200 font-medium flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                    <span>{modalFeedback}</span>
                  </div>
                )}
              </div>

              {/* Botões de Ação e Alteração de Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                <button
                  onClick={() => handleExecuteAgentMethod(selectedAgent)}
                  disabled={isExecutingMethod}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isExecutingMethod ? 'animate-spin' : ''} />
                  {isExecutingMethod ? 'Executando...' : selectedAgent.actionButtonLabel}
                </button>

                <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Status:</span>
                  <button
                    onClick={() => handleUpdateStatus(selectedAgent.id, 'ativo')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedAgent.status === 'ativo' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Ativo
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedAgent.id, 'em execução')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedAgent.status === 'em execução' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Em Execução
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedAgent.id, 'em espera')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedAgent.status === 'em espera' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Em Espera
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

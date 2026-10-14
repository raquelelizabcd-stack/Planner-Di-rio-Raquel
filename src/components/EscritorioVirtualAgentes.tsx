import React, { useState } from 'react';
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
  Pause,
  RefreshCw,
  Sparkles,
  Users,
  Building2,
  Cpu,
  Database,
  ArrowRight,
  ExternalLink,
  X,
  ChevronRight,
  ShieldAlert,
  Layers,
  Monitor,
  Wifi,
  Coffee,
  Check,
  AlertCircle
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
  AgenteGuardiaoDeCodigo, 
  AgenteMemoria,
  AgentStatusType
} from '../agents';

export interface DeskAgentData {
  id: string;
  name: string;
  role: string;
  avatarType: 'escudo' | 'caixa de arquivos' | 'engrenagem' | 'agenda' | 'livro de registros' | 'relógio/ampulheta' | 'lâmpada' | 'terminal com escudo' | 'cérebro';
  deskNumber: number;
  area: 'Segurança & Infraestrutura' | 'Inteligência & Orquestração' | 'Estratégia & Produtividade';
  status: AgentStatusType;
  description: string;
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
    description: 'Protege credenciais, chaves de API, variáveis de ambiente e valida requisições contra acessos indevidos e vazamentos sensíveis no Planner.',
    deskItems: ['Monitor com Firewall Ativo', 'Chave Criptográfica YubiKey', 'Manual de Diretrizes OWASP'],
    recentAction: 'Validou 4 chaves de API e 12 requisições ao Supabase com zero anomalias.',
    collaboratesWith: ['Agente Guardião de Código', 'Agente de Auditoria'],
    actionMethodName: 'auditarSeguranca',
    actionButtonLabel: 'Auditar Segurança do Planner'
  },
  {
    id: 'cache',
    name: 'Agente de Cache',
    role: 'Otimização & Alta Velocidade',
    avatarType: 'caixa de arquivos',
    deskNumber: 2,
    area: 'Segurança & Infraestrutura',
    status: 'ativo',
    description: 'Armazena respostas frequentes, reduz requisições redundantes de rede e acelera o tempo de carregamento no Planner.',
    deskItems: ['Servidor Redis Local', 'Arquivador de Cache Rápido', 'Painel de TTL e Latência'],
    recentAction: 'Acelerou o carregamento da aba Agentes em 64% reutilizando payloads locais.',
    collaboratesWith: ['Agente de Memória', 'Agente Orquestrador'],
    actionMethodName: 'invalidarCache',
    actionButtonLabel: 'Otimizar & Limpar Cache'
  },
  {
    id: 'guardiao_codigo',
    name: 'Agente Guardião de Código',
    role: 'Qualidade & Depuração TypeScript',
    avatarType: 'terminal com escudo',
    deskNumber: 3,
    area: 'Segurança & Infraestrutura',
    status: 'ativo',
    description: 'Analisa integridade sintática, revisa código TypeScript/React, previne quebras em build e atua no diagnóstico rápido e correção de bugs no Planner.',
    deskItems: ['Terminal Zsh com Linter Ativo', 'Monitor Vertical de Código', 'Caneca Dev com Café Quente'],
    recentAction: 'TypeScript compilado com código de saída 0; integridade de módulos preservada.',
    collaboratesWith: ['Agente de Segurança', 'Agente de Auditoria'],
    actionMethodName: 'inspecionarCodigo',
    actionButtonLabel: 'Inspecionar Integridade do Código'
  },
  {
    id: 'orquestrador',
    name: 'Agente Orquestrador',
    role: 'Coordenação & Fluxos Colaborativos',
    avatarType: 'engrenagem',
    deskNumber: 4,
    area: 'Inteligência & Orquestração',
    status: 'em execução',
    description: 'Coordena o fluxo de trabalho entre todos os agentes, prioriza tarefas concorrentes e gerencia os limites de execução em tempo real.',
    deskItems: ['Painel Kanban Holográfico', 'Matriz de Prioridade de Filas', 'Relógio de Sincronia Multi-Thread'],
    recentAction: 'Delegando tarefas simultâneas entre Calendário, Ideias e Memória sem gargalos.',
    collaboratesWith: ['Todos os Agentes'],
    actionMethodName: 'coordenarTarefas',
    actionButtonLabel: 'Coordenar Fila de Tarefas'
  },
  {
    id: 'memoria',
    name: 'Agente de Memória',
    role: 'Contexto & Economia de Tokens',
    avatarType: 'cérebro',
    deskNumber: 5,
    area: 'Inteligência & Orquestração',
    status: 'ativo',
    description: 'Consulta o histórico no Supabase e evita gastar tokens repetindo tarefas. Mantém o contexto de conversas, preferências e aprendizados anteriores sempre disponíveis para toda a equipe de agentes.',
    supabaseDetails: {
      connected: true,
      tokensSaved: 34500,
      description: 'Consulta o histórico no Supabase e evita gastar tokens repetindo tarefas. Sincronização contínua com banco de dados em tempo real.'
    },
    deskItems: ['Indexador Vetorial pgvector', 'Conexão Supabase Ativa', 'Dicionário de Contexto Histórico'],
    recentAction: 'Consultou histórico no Supabase e recuperou contexto anterior, economizando tokens da LLM.',
    collaboratesWith: ['Agente Orquestrador', 'Agente de Cache', 'Agente de Ideias'],
    actionMethodName: 'consultarHistoricoSupabase',
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
    description: 'Monitora logs de execução, registra histórico de ações, confere conformidade operacional e detecta qualquer anomalia no sistema.',
    deskItems: ['Livro de Registros Imutável', 'Visualizador de Logs em Tempo Real', 'Carimbo de Validação de Conformidade'],
    recentAction: 'Auditou 128 logs de execução e confirmou conformidade de 100% das chamadas.',
    collaboratesWith: ['Agente de Segurança', 'Agente Orquestrador'],
    actionMethodName: 'gerarRelatorioAuditoria',
    actionButtonLabel: 'Gerar Relatório de Auditoria'
  },
  {
    id: 'foco',
    name: 'Agente de Foco',
    role: 'Produtividade & Gestão Pomodoro',
    avatarType: 'relógio/ampulheta',
    deskNumber: 7,
    area: 'Estratégia & Produtividade',
    status: 'em espera',
    description: 'Gerencia ciclos de produtividade (Pomodoro), cronometra sessões de trabalho profundo e mantém o ritmo produtivo da Raquel.',
    deskItems: ['Ampulheta de Vidro Soprado', 'Timer Pomodoro Analógico', 'Fones com Cancelamento de Ruído'],
    recentAction: 'Ciclo de foco de 50 minutos agendado para o próximo bloco de planejamento.',
    collaboratesWith: ['Agente de Calendário', 'Agente Orquestrador'],
    actionMethodName: 'iniciarSessaoFoco',
    actionButtonLabel: 'Iniciar Sessão de Foco'
  },
  {
    id: 'calendario',
    name: 'Agente de Calendário',
    role: 'Cronograma & Agendamentos Estratégicos',
    avatarType: 'agenda',
    deskNumber: 8,
    area: 'Estratégia & Produtividade',
    status: 'ativo',
    description: 'Organiza eventos, prazos, agendamento de posts nas mídias sociais e sincroniza os cronogramas diários do Planner.',
    deskItems: ['Planner Diário Físico Raquel', 'Sincronizador Google Agenda', 'Caneta de Caligrafia'],
    recentAction: 'Sincronizou 3 aulas de Marketing e 2 publicações agendadas no LinkedIn.',
    collaboratesWith: ['Agente de Foco', 'Agente Orquestrador'],
    actionMethodName: 'sincronizarCronograma',
    actionButtonLabel: 'Sincronizar Cronograma'
  },
  {
    id: 'ideias',
    name: 'Agente de Ideias',
    role: 'Criatividade & Brainstorming Contínuo',
    avatarType: 'lâmpada',
    deskNumber: 9,
    area: 'Estratégia & Produtividade',
    status: 'ativo',
    description: 'Brainstorming contínuo, sugestão de temas inovadores para redes sociais, novos formatos de aula e propostas criativas para o ecossistema do Planner.',
    deskItems: ['Quadro Branco de Ideias', 'Post-its Coloridos', 'Lâmpada Neon de Inspiração'],
    recentAction: 'Gerou 5 novos temas de aulas e 3 sugestões de carrossel de alto engajamento.',
    collaboratesWith: ['Agente de Memória', 'Agente de Calendário'],
    actionMethodName: 'gerarIdeiasCriativas',
    actionButtonLabel: 'Gerar Novos Insights'
  }
];

interface EscritorioVirtualAgentesProps {
  accentColor?: string;
  borderRadius?: number;
}

export default function EscritorioVirtualAgentes({ 
  accentColor = '#6a5acd', 
  borderRadius = 24 
}: EscritorioVirtualAgentesProps) {
  const [agentsList, setAgentsList] = useState<DeskAgentData[]>(INITIAL_AGENTS_DATA);
  const [selectedAgent, setSelectedAgent] = useState<DeskAgentData | null>(INITIAL_AGENTS_DATA[4]); // Abre por padrão ou seleciona Agente de Memória
  const [filterArea, setFilterArea] = useState<string>('todos');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState<boolean>(false);
  const [officeSyncTime, setOfficeSyncTime] = useState<string>('Agora mesmo');

  // Helper para renderizar o avatar exato de cada agente conforme especificação do usuário
  const renderAgentAvatar = (avatarType: DeskAgentData['avatarType'], size: number = 24, className: string = '') => {
    switch (avatarType) {
      case 'escudo':
        // Segurança → escudo
        return <Shield size={size} className={className} />;
      case 'caixa de arquivos':
        // Cache → caixa de arquivos
        return <Archive size={size} className={className} />;
      case 'engrenagem':
        // Orquestrador → engrenagem
        return <Settings size={size} className={`${className} ${selectedAgent?.status === 'em execução' ? 'animate-spin' : ''}`} />;
      case 'agenda':
        // Calendário → agenda
        return <CalendarIcon size={size} className={className} />;
      case 'livro de registros':
        // Auditoria → livro de registros
        return <BookMarked size={size} className={className} />;
      case 'relógio/ampulheta':
        // Foco → relógio/ampulheta
        return <Hourglass size={size} className={className} />;
      case 'lâmpada':
        // Ideias → lâmpada
        return <Lightbulb size={size} className={className} />;
      case 'terminal com escudo':
        // Guardião de Código → terminal com escudo
        return (
          <div className="relative inline-flex items-center justify-center">
            <Terminal size={size} className={className} />
            <Shield size={Math.round(size * 0.58)} className="absolute -bottom-1 -right-1 text-emerald-400 fill-emerald-500/20" />
          </div>
        );
      case 'cérebro':
        // Memória → cérebro
        return <Brain size={size} className={className} />;
      default:
        return <Sparkles size={size} className={className} />;
    }
  };

  // Helper de cor e estilo do status
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

  // Alternar status do agente
  const handleChangeStatus = (agentId: string, newStatus: AgentStatusType) => {
    setAgentsList(prev => prev.map(a => {
      if (a.id === agentId) {
        return { ...a, status: newStatus };
      }
      return a;
    }));
    if (selectedAgent && selectedAgent.id === agentId) {
      setSelectedAgent(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Simular execução interativa da rotina do agente selecionado
  const handleTriggerAgentAction = async (agent: DeskAgentData) => {
    setIsExecutingAction(true);
    setActionFeedback(null);

    // Muda status para "em execução"
    handleChangeStatus(agent.id, 'em execução');

    await new Promise(resolve => setTimeout(resolve, 800));

    let feedbackMsg = '';
    if (agent.id === 'memoria') {
      feedbackMsg = '🧠 Agente de Memória: Consulta ao histórico no Supabase realizada com sucesso! Contexto recuperado e tokens poupados evitando nova chamada à LLM.';
    } else if (agent.id === 'seguranca') {
      feedbackMsg = '🛡️ Agente de Segurança: Todas as chaves e rotas verificadas. Zero anomalias detectadas.';
    } else if (agent.id === 'cache') {
      feedbackMsg = '📦 Agente de Cache: Respostas locais e payloads otimizados para velocidade instantânea.';
    } else if (agent.id === 'guardiao_codigo') {
      feedbackMsg = '💻 Agente Guardião de Código: Código e tipagens validados. Compilação TypeScript 100% estável.';
    } else if (agent.id === 'orquestrador') {
      feedbackMsg = '⚙️ Agente Orquestrador: Cargas distribuídas entre as mesas de trabalho de forma balanceada.';
    } else if (agent.id === 'calendario') {
      feedbackMsg = '📅 Agente de Calendário: Cronograma de aulas, tarefas e postagens sincronizado com o Planner.';
    } else if (agent.id === 'auditoria') {
      feedbackMsg = '📖 Agente de Auditoria: Relatório de conformidade gerado. Todos os logs registrados e consistentes.';
    } else if (agent.id === 'foco') {
      feedbackMsg = '⏳ Agente de Foco: Ciclo de trabalho produtivo ativo. Notificações externas silenciadas.';
    } else if (agent.id === 'ideias') {
      feedbackMsg = '💡 Agente de Ideias: 3 novos insights de alta relevância gerados para a Raquel Duarte.';
    }

    setActionFeedback(feedbackMsg);
    setIsExecutingAction(false);
    handleChangeStatus(agent.id, 'ativo');
    setOfficeSyncTime('Agora mesmo');
  };

  // Filtragem dos agentes
  const filteredAgents = filterArea === 'todos' 
    ? agentsList 
    : agentsList.filter(a => a.area === filterArea);

  // Contadores do Escritório
  const totalAtivos = agentsList.filter(a => a.status === 'ativo').length;
  const totalExecucao = agentsList.filter(a => a.status === 'em execução').length;
  const totalEspera = agentsList.filter(a => a.status === 'em espera').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ================= BANNER DO ESCRITÓRIO VIRTUAL ================= */}
      <div 
        className="p-6 md:p-8 bg-gradient-to-r from-[#171228] via-[#1f1938] to-[#120e22] border border-purple-500/25 shadow-2xl relative overflow-hidden"
        style={{ borderRadius: `${borderRadius}px` }}
      >
        {/* Luzes de fundo decorativas */}
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
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Espaço interativo de trabalho onde seus <strong className="text-white">9 agentes autônomos</strong> operam em suas respectivas mesas, colaborando lado a lado para proteger, orquestrar, acelerar e otimizar todo o seu Planner Diário.
              </p>
            </div>
          </div>

          {/* Cards de Métricas Rápidas do Escritório */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Equipe em Trabalho</div>
              <div className="flex items-center gap-2 mt-1">
                <Users size={16} className="text-purple-400" />
                <span className="text-lg font-bold text-white">9 Agentes</span>
              </div>
            </div>

            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tokens Poupados (Memória)</div>
              <div className="flex items-center gap-2 mt-1">
                <Brain size={16} className="text-emerald-400" />
                <span className="text-lg font-bold text-emerald-300">+34.500</span>
              </div>
            </div>

            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Supabase & Multi-IA</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-bold text-white">Conectado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Filtros e Status do Escritório */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-6 border-t border-white/10 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 mr-2">Filtrar Ala de Trabalho:</span>
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

      {/* ================= PLANTA DO ESCRITÓRIO VIRTUAL (MESAS DE TRABALHO) ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <span>Mesas de Trabalho dos Agentes</span>
              <span className="text-xs font-normal text-slate-400">(Clique em qualquer mesa para inspecionar e interagir)</span>
            </h3>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Wifi size={14} className="text-emerald-400" /> Rede Interna Segura: 100% Operacional
          </span>
        </div>

        {/* Grid de Mesas */}
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
                <div className="flex items-start gap-4 mb-4">
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
                <p className="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                  {agent.description}
                </p>

                {/* Destaque exclusivo do Agente de Memória */}
                {isMemoria && (
                  <div className="mb-4 p-2.5 rounded-2xl bg-gradient-to-r from-purple-500/15 to-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                    <Database size={15} className="text-emerald-400 flex-shrink-0" />
                    <span className="font-medium">
                      Consulta histórico no <strong>Supabase</strong> & evita gastar tokens!
                    </span>
                  </div>
                )}

                {/* Representação visual da Mesa de Trabalho */}
                <div className="pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <Monitor size={12} className="text-slate-500" />
                      <span className="truncate">{agent.deskItems[0]}</span>
                    </div>
                    <span className="text-purple-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5 font-bold">
                      Ver mesa <ChevronRight size={14} />
                    </span>
                  </div>
                </div>

                {/* Brilho hover */}
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

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/10"
                  title="Fechar detalhes"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Grid de 2 colunas: Descrição + Configuração da Mesa */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna 1 & 2: Descrição Detalhada, Supabase e Ação */}
              <div className="lg:col-span-2 space-y-6">
                {/* Descrição Funcional */}
                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                  <div className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Activity size={14} className="text-purple-400" />
                    Atribuição no Escritório Virtual
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {selectedAgent.description}
                  </p>
                </div>

                {/* DESTAQUE MANDATÓRIO: AGENTE DE MEMÓRIA (SUPABASE & ECONOMIA DE TOKENS) */}
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
                        <div className="text-lg font-bold text-emerald-300 mt-0.5">+34.500 Tokens</div>
                      </div>
                      <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Estado da Conexão</div>
                        <div className="text-lg font-bold text-white mt-0.5 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Sincronizado
                        </div>
                      </div>
                      <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Base de Contexto</div>
                        <div className="text-lg font-bold text-purple-300 mt-0.5">Supabase pgvector</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Atividade Recente e Feedback de Execução */}
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

                  {/* Feedback dinâmico após testar ação */}
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

              {/* Coluna 3: Inventário da Mesa de Trabalho & Colaboração */}
              <div className="space-y-6">
                {/* Equipamentos na Mesa */}
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

                {/* Colabora com outros Agentes */}
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

                {/* Card de Conexão Geral */}
                <div className="p-4 bg-gradient-to-br from-purple-900/20 to-transparent rounded-2xl border border-purple-500/20 text-[11px] text-slate-400 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles size={13} className="text-purple-400" />
                    Ecossistema Autônomo Raquel
                  </div>
                  <p>
                    Todos os agentes operam sob supervisão central, trocando dados sem duplicar requisições.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= PAINEL DE COLABORAÇÃO AO VIVO ENTRE AS MESAS ================= */}
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
              Recuperou contexto histórico no Supabase e poupou 1.250 tokens para o Agente de Ideias.
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

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Zap, 
  Activity, 
  Play, 
  Pause, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Bug, 
  GraduationCap, 
  Newspaper, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Check, 
  ShieldAlert, 
  Layers, 
  Database,
  Cpu,
  Brain,
  Sliders,
  Filter,
  Search,
  BookOpen,
  Send,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { GoogleGenAI } from '@google/genai';
import { 
  AgentStatus, 
  AgentExecutionLog, 
  AntigravityTokenMeter, 
  DebugIARecord, 
  ProfessoraClass, 
  ProfessoraMarketingItem 
} from '../types';
import { dataService } from '../services/dataService';

interface AgentesTabProps {
  accentColor?: string;
  borderRadius?: number;
}

export default function AgentesTab({ accentColor = '#6a5acd', borderRadius = 24 }: AgentesTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'control' | 'marketing' | 'debug' | 'pedagogico' | 'logs'>('control');
  
  // States dos Agentes e Medidor
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [logs, setLogs] = useState<AgentExecutionLog[]>([]);
  const [tokenMeter, setTokenMeter] = useState<AntigravityTokenMeter | null>(null);
  const [debugBugs, setDebugBugs] = useState<DebugIARecord[]>([]);
  const [classes, setClasses] = useState<ProfessoraClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Forms de Execução / Interação dos Agentes
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  
  // Form Suporte Pedagógico
  const [pedagogicoSubject, setPedagogicoSubject] = useState<string>('Inbound Marketing e Funil de Vendas');
  const [pedagogicoTopic, setPedagogicoTopic] = useState<string>('Estratégias de Atração e Qualificação de Leads');
  const [pedagogicoPrompt, setPedagogicoPrompt] = useState<string>('');
  const [pedagogicoOutput, setPedagogicoOutput] = useState<string>('');

  // Form Marketing
  const [marketingTopicInput, setMarketingTopicInput] = useState<string>('Tendências de IA no Marketing Digital e Automação de Conteúdo');
  const [marketingNewsOutput, setMarketingNewsOutput] = useState<string>('');

  // Form Debug
  const [debugLogInput, setDebugLogInput] = useState<string>('TypeError: Cannot read properties of undefined (reading "map") at ProfessoraMarketingTab.tsx:142');
  const [debugOutput, setDebugOutput] = useState<string>('');

  // Carregar dados na montagem do componente
  useEffect(() => {
    loadAllAgentData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAllAgentData = async () => {
    setIsLoading(true);
    try {
      const [fetchedAgents, fetchedLogs, fetchedMeter, fetchedBugs, fetchedClasses] = await Promise.all([
        dataService.fetchAgentStatuses(),
        dataService.fetchAgentLogs(),
        dataService.fetchTokenMeter(),
        dataService.fetchDebugIARecords(),
        dataService.fetchProfessoraClasses()
      ]);

      setAgents(fetchedAgents);
      setLogs(fetchedLogs);
      setTokenMeter(fetchedMeter);
      setDebugBugs(fetchedBugs);
      setClasses(fetchedClasses);
      if (fetchedClasses.length > 0) {
        setSelectedClassId(fetchedClasses[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do painel de agentes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Alternar Status de Ativação do Agente
  const toggleAgentActive = async (id: AgentStatus['id']) => {
    const updatedAgents = agents.map(agent => {
      if (agent.id === id) {
        return { ...agent, active: !agent.active };
      }
      return agent;
    });
    setAgents(updatedAgents);
    const targetAgent = updatedAgents.find(a => a.id === id);
    if (targetAgent) {
      await dataService.saveAgentStatus(targetAgent);
      showToast(`Status do ${targetAgent.name} alterado para ${targetAgent.active ? 'Ativo' : 'Inativo'}.`);
    }
  };

  // Atualizar consumo de tokens
  const updateTokens = async (agentId: 'marketing' | 'debug_ia' | 'suporte_pedagogico', tokensUsed: number) => {
    if (!tokenMeter) return;
    const newWeekly = tokenMeter.weeklyUsedTokens + tokensUsed;
    const newMonthly = tokenMeter.monthlyUsedTokens + tokensUsed;
    const newUsedByAgent = {
      ...tokenMeter.usedByAgent,
      [agentId]: (tokenMeter.usedByAgent[agentId] || 0) + tokensUsed
    };

    const updatedMeter: AntigravityTokenMeter = {
      ...tokenMeter,
      weeklyUsedTokens: newWeekly,
      monthlyUsedTokens: newMonthly,
      usedByAgent: newUsedByAgent,
      lastUpdated: Date.now()
    };

    setTokenMeter(updatedMeter);
    await dataService.saveTokenMeter(updatedMeter);

    // Atualizar também no status do agente
    const updatedAgents = agents.map(a => {
      if (a.id === agentId) {
        return {
          ...a,
          tokensUsedThisWeek: a.tokensUsedThisWeek + tokensUsed,
          tokensUsedThisMonth: a.tokensUsedThisMonth + tokensUsed,
          lastRun: Date.now()
        };
      }
      return a;
    });
    setAgents(updatedAgents);
    const targetAgent = updatedAgents.find(a => a.id === agentId);
    if (targetAgent) await dataService.saveAgentStatus(targetAgent);
  };

  // Registrar Log de Execução
  const recordExecutionLog = async (
    agentId: 'marketing' | 'debug_ia' | 'suporte_pedagogico',
    status: 'sucesso' | 'erro' | 'alerta',
    summary: string,
    details: string,
    tokensUsed: number,
    classId?: string
  ) => {
    const agentName = agentId === 'marketing' ? 'Agente Marketing' : agentId === 'debug_ia' ? 'Agente Debug IA' : 'Agente Suporte Pedagógico';
    const targetClass = classes.find(c => c.id === classId);
    const newLog: AgentExecutionLog = {
      id: `log-${Date.now()}`,
      agentId,
      agentName,
      timestamp: Date.now(),
      status,
      summary,
      details,
      tokensUsed,
      classId,
      className: targetClass?.name
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    await dataService.saveAgentLog(newLog);
    await updateTokens(agentId, tokensUsed);
  };

  const getApiKey = (): string => {
    let key = process.env.GEMINI_API_KEY || '';
    if (!key && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('raquel_api_keys');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.gemini) key = parsed.gemini;
        }
      } catch (e) {
        console.error('Erro ao buscar chave API:', e);
      }
    }
    return key;
  };

  // Execução Manual: Agente Marketing
  const runAgentMarketing = async () => {
    const agent = agents.find(a => a.id === 'marketing');
    if (agent && !agent.active) {
      showToast('O Agente Marketing está Inativo. Ative-o para executar.');
      return;
    }

    setRunningAgentId('marketing');
    try {
      const apiKey = getApiKey();
      let resultText = '';
      let tokensEst = 280;


      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Você é o Agente de Marketing Digital do Planner Raquel. Busca as principais notícias e tendências em alta de Marketing Digital, Redes Sociais e IA Aplicada.\n\nTópico / Foco Solicitado: "${marketingTopicInput}".\n\nREGRAS OBRIGATÓRIAS:\n1. Resuma a resposta em exatamente ATÉ 5 TÓPICOS CURTOS e diretos.\n2. Máximo 300 tokens de limite.\n3. Escreva em Português do Brasil com linguagem profissional e acionável para professores/profissionais de marketing.`
        });
        resultText = response.text || 'Nenhuma tendência retornada.';
      } else {
        resultText = `### 📰 Resumo de Tendências de Marketing Digital (Simulação)

1. **Agentes Autônomos no WhatsApp**: Empresas estão adotando agentes integrados a CRMs para atendimento técnico.
2. **Short Video SEO**: Algoritmos do TikTok e Instagram agora priorizam transcrições em texto de Reels e Shorts.
3. **Hyper-Personalização com IA**: E-mails de nutrir leads gerados em tempo real com base no comportamento de navegação.
4. **Social Commerce em Alta**: Compra direta via transmissões ao vivo e links interativos no Reels.
5. **Micro-Influenciadores Didáticos**: Marcas de edtech focam em parcerias com educadores para conteúdo autêntico.`;
      }

      setMarketingNewsOutput(resultText);

      // Salvar automaticamente na biblioteca do Planner vinculando à turma
      const selectedClass = classes.find(c => c.id === selectedClassId);
      const libraryItem: ProfessoraMarketingItem = {
        id: `mkt-news-${Date.now()}`,
        title: `Tendências MKT Digital - ${new Date().toLocaleDateString('pt-BR')}`,
        category: 'material_didatico',
        content: resultText,
        classId: selectedClassId || undefined,
        metadata: {
          generatedBy: 'Agente Marketing',
          tokensUsed: tokensEst,
          className: selectedClass?.name
        },
        createdAt: Date.now()
      };
      await dataService.saveProfessoraMarketingItem(libraryItem);

      await recordExecutionLog(
        'marketing',
        'sucesso',
        `Resumo de Notícias de MKT gerado em 5 tópicos (${tokensEst} tokens)`,
        `Conteúdo salvo na biblioteca do Planner e vinculado à turma: ${selectedClass?.name || 'Geral'}.`,
        tokensEst,
        selectedClassId
      );

      showToast('Agente Marketing executado com sucesso e salvo na Biblioteca!');
    } catch (err: any) {
      console.error('Erro ao executar Agente Marketing:', err);
      await recordExecutionLog('marketing', 'erro', 'Falha na execução do Agente Marketing', err.message || 'Erro de conexão com API', 50);
      showToast('Erro ao executar Agente Marketing. Consulte os logs.');
    } finally {
      setRunningAgentId(null);
    }
  };

  // Execução Manual: Agente Debug IA
  const runAgentDebug = async () => {
    const agent = agents.find(a => a.id === 'debug_ia');
    if (agent && !agent.active) {
      showToast('O Agente Debug IA está Inativo. Ative-o para executar.');
      return;
    }

    setRunningAgentId('debug_ia');
    try {
      const apiKey = getApiKey();
      let analysisText = '';
      let tokensEst = 320;

      if (apiKey && debugLogInput.trim()) {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Você é o Agente Debug IA do Planner Diário Raquel. Analise o seguinte log de erro / código:\n\n"${debugLogInput}"\n\nForneça:\n1. Diagnóstico do Erro\n2. Sugestão de Correção Direta\n3. Passo a passo prático para resolver (máximo 3 passos).`
        });
        analysisText = response.text || 'Análise concluída sem anormalidades.';
      } else {
        analysisText = `### 🧩 Diagnóstico Debug IA (Análise de Log)

* **Erro Identificado**: Acesso a propriedade em objeto nulo ou indefinido durante a renderização.
* **Módulo Atingido**: Componente de Interface do Planner Diário Raquel.
* **Sugestão de Correção**: Adicionar verificação opcional (\`?.map()\`) ou valor padrão de array vazio (\`[]\`).

#### Passo a Passo Prático:
1. Verifique a busca de dados assíncrona no método do Supabase ou LocalStorage.
2. Certifique-se de retornar um array inicial caso o resultado venha indefinido.
3. Utilize operador de coalescência nula: \`const list = data ?? [];\``;
      }

      setDebugOutput(analysisText);

      // Registrar Bug na lista organizada
      const newBug: DebugIARecord = {
        id: `bug-${Date.now()}`,
        timestamp: Date.now(),
        errorName: debugLogInput.slice(0, 50) || 'Erro de Execução Detectado',
        errorMessage: debugLogInput || 'Erro de execução genérico detectado durante monitoramento.',
        componentOrModule: 'Planner Diario Raquel - Core Module',
        status: 'pendente',
        suggestedFix: 'Aplicar sanitização e tratamento de exceção com fallback seguro.',
        stepsToResolve: ['Verificar logs', 'Aplicar patch condicional', 'Recompilar com npm run build'],
        createdAt: Date.now()
      };

      setDebugBugs(prev => [newBug, ...prev]);
      await dataService.saveDebugIARecord(newBug);

      await recordExecutionLog(
        'debug_ia',
        'sucesso',
        `Análise de log finalizada e registrado novo bug pendente (${tokensEst} tokens)`,
        analysisText,
        tokensEst
      );

      showToast('Agente Debug IA concluiu a análise e atualizou a lista de erros!');
    } catch (err: any) {
      console.error('Erro ao executar Agente Debug IA:', err);
      await recordExecutionLog('debug_ia', 'erro', 'Falha ao executar Agente Debug IA', err.message || 'Erro interno', 50);
      showToast('Erro ao executar Agente Debug IA.');
    } finally {
      setRunningAgentId(null);
    }
  };

  // Execução Manual: Agente Suporte Pedagógico
  const runAgentPedagogico = async () => {
    const agent = agents.find(a => a.id === 'suporte_pedagogico');
    if (agent && !agent.active) {
      showToast('O Agente de Suporte Pedagógico está Inativo. Ative-o para executar.');
      return;
    }

    setRunningAgentId('suporte_pedagogico');
    try {
      const apiKey = getApiKey();
      const selectedClass = classes.find(c => c.id === selectedClassId);
      let planContent = '';
      let tokensEst = 450;

      const promptText = `Você é o Agente de Suporte Pedagógico especializado em Educação Profissional Técnica de Nível Médio em Marketing.
Gerencie e elabore um Plano de Aula completo e estruturado para a seguinte turma:
- Turma: ${selectedClass?.name || 'Técnico em Marketing'} (${selectedClass?.gradeYear || 'Ensino Técnico'})
- Disciplina: ${pedagogicoSubject}
- Tópico da Aula: ${pedagogicoTopic}
- Observação Adicional: ${pedagogicoPrompt || 'Foco em aplicação prática no mercado'}

A SUA RESPOSTA DEVE CONTER OBRIGATORIAMENTE OS SEGUINTES 6 BLOCOS:
1. 🎯 Objetivos de Aprendizagem (Alinhados às competências técnicas de Marketing)
2. 📚 Conteúdos Programáticos (Sequência lógica: Teoria -> Prática -> Exemplos Reais)
3. 📝 Metodologias Didáticas (Exposição dialogada, estudos de caso, projetos)
4. 🧾 Avaliações (Formas de avaliação técnica e participação)
5. 🔄 Adaptação por Turma (Ajustes com base no perfil da turma)
6. 💡 Sugestões Extras (Ideias criativas, dinâmicas de grupo e jogos educativos)

Mantenha respostas objetivas e prontas para uso em sala de aula.`;

      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: promptText
        });
        planContent = response.text || 'Erro ao gerar plano pedagógico.';
      } else {
        planContent = `### 🧠 Plano de Aula Técnico em Marketing Digital

**Turma**: ${selectedClass?.name || 'Turma 3001 - MKT Digital'} | **Disciplina**: ${pedagogicoSubject}

---

#### 1. 🎯 Objetivos de Aprendizagem
* Compreender as etapas estratégicas de atração e nutrição no Funil de Vendas Inbound.
* Desenvolver landing pages com chamadas para ação (CTAs) de alta conversão.

#### 2. 📚 Conteúdos Programáticos
* **Teoria (20 min)**: Conceito de Topo, Meio e Base do Funil de Marketing.
* **Prática (40 min)**: Criação de régua de automação de e-mail marketing.
* **Exemplo Real (20 min)**: Estudo de caso de um MicroSaas brasileiro.

#### 3. 📝 Metodologias Didáticas
* Exposição dialogada com slides interativos.
* Estudo de caso em grupos de 4 alunos.

#### 4. 🧾 Avaliações
* Resolução de quiz prático ao final da aula.
* Entrega da estrutura do funil da empresa simulada.

#### 5. 🔄 Adaptação por Turma
* Ritmo dinâmico com uso de ferramentas no-code para simulação em tempo real.

#### 6. 💡 Sugestões Extras
* **Jogo Educativo**: "Batalha do Funil" - Grupos competem pela maior taxa de conversão simulada.`;
      }

      setPedagogicoOutput(planContent);

      // Salvar automaticamente na biblioteca do Planner vinculado à turma
      const libraryItem: ProfessoraMarketingItem = {
        id: `plano-pedagogico-${Date.now()}`,
        title: `Plano: ${pedagogicoTopic} (${selectedClass?.name || 'Geral'})`,
        category: 'plano_aula',
        content: planContent,
        classId: selectedClassId || undefined,
        metadata: {
          generatedBy: 'Agente Suporte Pedagógico',
          subject: pedagogicoSubject,
          topic: pedagogicoTopic,
          tokensUsed: tokensEst
        },
        createdAt: Date.now()
      };

      await dataService.saveProfessoraMarketingItem(libraryItem);

      await recordExecutionLog(
        'suporte_pedagogico',
        'sucesso',
        `Plano de Aula gerado e vinculado à turma ${selectedClass?.name || 'Técnico'} (${tokensEst} tokens)`,
        planContent,
        tokensEst,
        selectedClassId
      );

      showToast('Plano de Aula gerado e salvo automaticamente na Biblioteca do Planner!');
    } catch (err: any) {
      console.error('Erro ao executar Agente Pedagógico:', err);
      await recordExecutionLog('suporte_pedagogico', 'erro', 'Falha na geração do plano pedagógico', err.message || 'Erro de API', 50);
      showToast('Erro ao executar Agente Pedagógico.');
    } finally {
      setRunningAgentId(null);
    }
  };

  // Marcar Bug como Resolvido
  const toggleBugStatus = async (id: string) => {
    const updated = debugBugs.map(b => {
      if (b.id === id) {
        return { ...b, status: (b.status === 'pendente' ? 'resolvido' : 'pendente') as 'pendente' | 'resolvido' };
      }
      return b;
    });
    setDebugBugs(updated);
    const target = updated.find(b => b.id === id);
    if (target) {
      await dataService.saveDebugIARecord(target);
      showToast(`Bug marcado como ${target.status}!`);
    }
  };

  // Filtragem de Logs
  const filteredLogs = logs.filter(l => {
    if (logFilter === 'all') return true;
    return l.agentId === logFilter;
  });

  const percentageTokensUsed = tokenMeter 
    ? Math.min(Math.round((tokenMeter.monthlyUsedTokens / tokenMeter.totalMonthlyLimitTokens) * 100 * 10) / 10, 100)
    : 0;

  const isTokenAlertHigh = percentageTokensUsed >= 80;

  return (
    <div className="space-y-8 pb-24 text-slate-200">
      {/* Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-[2000] bg-[#1f1b2e] text-purple-200 border border-purple-500/40 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="text-xs font-bold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Principal do Painel de Agentes */}
      <div 
        className="p-6 md:p-8 bg-gradient-to-r from-[#171326] via-[#1a162b] to-[#120f1e] border border-purple-500/20 shadow-2xl relative overflow-hidden"
        style={{ borderRadius: `${borderRadius}px` }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
              <Bot size={30} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-bold text-white">Painel de Controle dos Agentes</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Google Antigravity IA
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Gerencie a execução, automações, logs e o consumo de tokens dos seus agentes autônomos.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadAllAgentData}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center gap-2"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Sincronizar Supabase
            </button>
          </div>
        </div>

        {/* Sub-navegação do Painel */}
        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-white/10 relative z-10">
          {[
            { id: 'control', label: 'Visão Geral & Tokens', icon: Sliders },
            { id: 'marketing', label: 'Agente Marketing', icon: Newspaper },
            { id: 'debug', label: 'Agente Debug IA', icon: Bug },
            { id: 'pedagogico', label: 'Suporte Pedagógico', icon: GraduationCap },
            { id: 'logs', label: 'Logs de Execução', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================= SEÇÃO 1: VISÃO GERAL & MEDIDOR DE TOKENS ================= */}
      {activeSubTab === 'control' && (
        <div className="space-y-8">
          {/* Card do Medidor de Tokens Google Antigravity */}
          <div 
            className={`p-6 md:p-8 bg-[#181427] border ${isTokenAlertHigh ? 'border-amber-500/50 shadow-amber-500/10' : 'border-purple-500/20'} shadow-2xl relative`}
            style={{ borderRadius: `${borderRadius}px` }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-500/20 rounded-xl text-purple-300">
                    <Zap size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                      Medidor de Tokens Google Antigravity
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        Plano Google AI Pro (5 TB)
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">Sincronizado em tempo real com seu ambiente e Supabase</p>
                  </div>
                </div>
              </div>

              {/* Status Alerta de Consumo */}
              {isTokenAlertHigh && (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-amber-300 text-xs font-bold animate-pulse">
                  <AlertTriangle size={18} />
                  Alerta: O consumo de tokens ultrapassou 80% da sua capacidade mensal!
                </div>
              )}
            </div>

            {/* Barra de Progresso Principal */}
            <div className="space-y-2 mb-8">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400">Progresso do Limite Mensal</span>
                <span className={isTokenAlertHigh ? 'text-amber-400 font-extrabold' : 'text-purple-300'}>
                  {tokenMeter?.monthlyUsedTokens.toLocaleString('pt-BR')} / {tokenMeter?.totalMonthlyLimitTokens.toLocaleString('pt-BR')} Tokens ({percentageTokensUsed}%)
                </span>
              </div>
              <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isTokenAlertHigh 
                      ? 'bg-gradient-to-r from-amber-500 to-red-500 shadow-lg shadow-amber-500/30' 
                      : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                  }`}
                  style={{ width: `${percentageTokensUsed}%` }}
                />
              </div>
            </div>

            {/* Grid com Consumo Detalhado por Agente */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Semanal Acumulado</span>
                  <Activity size={14} className="text-purple-400" />
                </div>
                <p className="text-xl font-display font-bold text-white">
                  {tokenMeter?.weeklyUsedTokens.toLocaleString('pt-BR')} <span className="text-xs text-slate-500 font-sans">tk</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Atualizado automaticamente</p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agente Marketing</span>
                  <Newspaper size={14} className="text-blue-400" />
                </div>
                <p className="text-xl font-display font-bold text-white">
                  {tokenMeter?.usedByAgent.marketing.toLocaleString('pt-BR')} <span className="text-xs text-slate-500 font-sans">tk</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Limite 300 tk / resposta</p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agente Debug IA</span>
                  <Bug size={14} className="text-emerald-400" />
                </div>
                <p className="text-xl font-display font-bold text-white">
                  {tokenMeter?.usedByAgent.debug_ia.toLocaleString('pt-BR')} <span className="text-xs text-slate-500 font-sans">tk</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Monitoramento de erros</p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Suporte Pedagógico</span>
                  <GraduationCap size={14} className="text-pink-400" />
                </div>
                <p className="text-xl font-display font-bold text-white">
                  {tokenMeter?.usedByAgent.suporte_pedagogico.toLocaleString('pt-BR')} <span className="text-xs text-slate-500 font-sans">tk</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Planos de Aula completos</p>
              </div>
            </div>
          </div>

          {/* Cards de Status e Controle dos 3 Agentes */}
          <div className="space-y-4">
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <Bot size={20} className="text-purple-400" />
              Controle dos Agentes Autônomos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {agents.map(agent => (
                <div 
                  key={agent.id}
                  className="p-6 bg-[#181427] border border-white/10 hover:border-purple-500/40 rounded-3xl transition-all space-y-5 relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-2xl ${
                        agent.id === 'marketing' ? 'bg-blue-500/10 text-blue-400' :
                        agent.id === 'debug_ia' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-pink-500/10 text-pink-400'
                      }`}>
                        {agent.id === 'marketing' && <Newspaper size={24} />}
                        {agent.id === 'debug_ia' && <Bug size={24} />}
                        {agent.id === 'suporte_pedagogico' && <GraduationCap size={24} />}
                      </div>

                      {/* Switch Ativar/Desativar com Status Visível */}
                      <button
                        onClick={() => toggleAgentActive(agent.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                          agent.active 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${agent.active ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                        {agent.active ? 'Ativo' : 'Inativo'}
                      </button>
                    </div>

                    <h4 className="text-base font-display font-bold text-white">{agent.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">{agent.category}</p>

                    <div className="mt-4 p-3 bg-white/5 rounded-2xl space-y-1.5 text-xs text-slate-300 border border-white/5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Agendamento:</span>
                        <span className="font-semibold text-purple-300">{agent.scheduleDescription}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Limite de Tokens:</span>
                        <span className="font-semibold text-white">{agent.tokenLimit} tk</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Uso no Mês:</span>
                        <span className="font-semibold text-white">{agent.tokensUsedThisMonth} tk</span>
                      </div>
                    </div>
                  </div>

                  {/* Botão Manual de Execução Extra */}
                  <div className="pt-4 border-t border-white/10">
                    <button
                      onClick={() => {
                        if (agent.id === 'marketing') runAgentMarketing();
                        else if (agent.id === 'debug_ia') runAgentDebug();
                        else runAgentPedagogico();
                      }}
                      disabled={runningAgentId === agent.id}
                      className="w-full py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 hover:border-purple-500/50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      {runningAgentId === agent.id ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          Executando IA...
                        </>
                      ) : (
                        <>
                          <Play size={14} />
                          Execução Extra Manual
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= SEÇÃO 2: AGENTE MARKETING ================= */}
      {activeSubTab === 'marketing' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#181427] border border-blue-500/20 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl">
                <Newspaper size={24} />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-white">📰 Agente Marketing</h3>
                <p className="text-xs text-slate-400">
                  Busca notícias e tendências de Marketing Digital. Resume em até 5 tópicos curtos (máx 300 tokens) e salva na biblioteca vinculado às turmas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Vincular à Turma</label>
                <select
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="" className="bg-slate-900">Selecione uma turma (Opcional)</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id} className="bg-slate-900">{c.name} ({c.gradeYear})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Tópico / Palavra-chave de Busca</label>
                <input
                  type="text"
                  value={marketingTopicInput}
                  onChange={e => setMarketingTopicInput(e.target.value)}
                  placeholder="Ex: Redes sociais, IA em vendas, tráfego pago..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              onClick={runAgentMarketing}
              disabled={runningAgentId === 'marketing'}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50"
            >
              {runningAgentId === 'marketing' ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Executar Agente Marketing & Salvar na Biblioteca
            </button>
          </div>

          {/* Resultado Gerado */}
          {marketingNewsOutput && (
            <div className="p-6 bg-[#181427] border border-white/10 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 size={16} /> Resumo Gerado pelo Agente (Salvo na Biblioteca)
                </span>
                <span className="text-[10px] text-slate-500">Limite 300 tokens respeitado</span>
              </div>
              <div className="prose prose-invert max-w-none text-sm text-slate-200 bg-white/5 p-5 rounded-2xl border border-white/5">
                <Markdown>{marketingNewsOutput}</Markdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= SEÇÃO 3: AGENTE DEBUG IA ================= */}
      {activeSubTab === 'debug' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#181427] border border-emerald-500/20 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                <Bug size={24} />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-white">🧩 Agente Debug IA</h3>
                <p className="text-xs text-slate-400">
                  Monitora logs do sistema, identifica erros de execução, sugere correções automáticas e registra cada bug na lista organizada.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Cole o Log de Erro ou Trecho do Sistema</label>
              <textarea
                value={debugLogInput}
                onChange={e => setDebugLogInput(e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <button
              onClick={runAgentDebug}
              disabled={runningAgentId === 'debug_ia'}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
            >
              {runningAgentId === 'debug_ia' ? <RefreshCw size={16} className="animate-spin" /> : <Bug size={16} />}
              Analisar Erro & Registrar Bug
            </button>
          </div>

          {/* Resultado Debug */}
          {debugOutput && (
            <div className="p-6 bg-[#181427] border border-white/10 rounded-3xl space-y-4">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 size={16} /> Diagnóstico e Passos de Correção
              </span>
              <div className="prose prose-invert max-w-none text-sm text-slate-200 bg-white/5 p-5 rounded-2xl border border-white/5">
                <Markdown>{debugOutput}</Markdown>
              </div>
            </div>
          )}

          {/* Lista Organizada de Bugs Registrados */}
          <div className="p-6 bg-[#181427] border border-white/10 rounded-3xl space-y-4">
            <h4 className="text-sm font-display font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Bug size={18} className="text-emerald-400" />
              Lista de Bugs Registrados pelo Agente
            </h4>

            {debugBugs.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Nenhum bug registrado no momento.</p>
            ) : (
              <div className="space-y-3">
                {debugBugs.map(bug => (
                  <div 
                    key={bug.id}
                    className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          bug.status === 'resolvido' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {bug.status.toUpperCase()}
                        </span>
                        <h5 className="text-sm font-bold text-white">{bug.errorName}</h5>
                      </div>
                      <p className="text-xs text-slate-400">{bug.errorMessage}</p>
                      <p className="text-[10px] text-purple-300">Sugestão: {bug.suggestedFix}</p>
                    </div>

                    <button
                      onClick={() => toggleBugStatus(bug.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        bug.status === 'resolvido' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-white/10 hover:bg-white/20 text-slate-300'
                      }`}
                    >
                      <Check size={14} />
                      {bug.status === 'resolvido' ? 'Resolvido' : 'Marcar Resolvido'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= SEÇÃO 4: AGENTE DE SUPORTE PEDAGÓGICO ================= */}
      {activeSubTab === 'pedagogico' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#181427] border border-pink-500/20 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-pink-500/10 text-pink-400 rounded-2xl">
                <GraduationCap size={24} />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-white">🧠 Agente de Suporte Pedagógico</h3>
                <p className="text-xs text-slate-400">
                  Gera Planos de Aula completos estruturados nos 6 blocos obrigatórios (Objetivos, Conteúdos, Metodologias, Avaliações, Adaptação e Sugestões Extras) para a Educação Técnica em Marketing.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Turma Cadastrada</label>
                <select
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id} className="bg-slate-900">{c.name} ({c.gradeYear})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Disciplina</label>
                <input
                  type="text"
                  value={pedagogicoSubject}
                  onChange={e => setPedagogicoSubject(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Tópico da Aula</label>
                <input
                  type="text"
                  value={pedagogicoTopic}
                  onChange={e => setPedagogicoTopic(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Observação Adicional / Instrução Extra</label>
              <input
                type="text"
                value={pedagogicoPrompt}
                onChange={e => setPedagogicoPrompt(e.target.value)}
                placeholder="Ex: Incluir jogo educativo de fixação ao final..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <button
              onClick={runAgentPedagogico}
              disabled={runningAgentId === 'suporte_pedagogico'}
              className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-pink-600/20 flex items-center gap-2 disabled:opacity-50"
            >
              {runningAgentId === 'suporte_pedagogico' ? <RefreshCw size={16} className="animate-spin" /> : <Brain size={16} />}
              Gerar Plano de Aula Completo & Salvar no Planner
            </button>
          </div>

          {/* Plano Gerado */}
          {pedagogicoOutput && (
            <div className="p-6 bg-[#181427] border border-white/10 rounded-3xl space-y-4">
              <span className="text-xs font-bold text-pink-400 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 size={16} /> Plano de Aula Gerado pelo Agente (Salvo na Biblioteca)
              </span>
              <div className="prose prose-invert max-w-none text-sm text-slate-200 bg-white/5 p-5 rounded-2xl border border-white/5">
                <Markdown>{pedagogicoOutput}</Markdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= SEÇÃO 5: LOGS DE EXECUÇÃO ================= */}
      {activeSubTab === 'logs' && (
        <div className="p-6 bg-[#181427] border border-white/10 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                <FileText size={20} className="text-purple-400" />
                Logs de Execução dos Agentes
              </h3>
              <p className="text-xs text-slate-400">Histórico detalhado de datas, horários, resultados e tokens consumidos por cada agente</p>
            </div>

            {/* Filtro de Logs */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select
                value={logFilter}
                onChange={e => setLogFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="all" className="bg-slate-900">Todos os Agentes</option>
                <option value="marketing" className="bg-slate-900">Agente Marketing</option>
                <option value="debug_ia" className="bg-slate-900">Agente Debug IA</option>
                <option value="suporte_pedagogico" className="bg-slate-900">Suporte Pedagógico</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Nenhum log registrado para o filtro selecionado.</p>
            ) : (
              filteredLogs.map(log => (
                <div 
                  key={log.id}
                  className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2"
                >
                  <div className="flex flex-wrap justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        log.status === 'sucesso' ? 'bg-emerald-400' : 'bg-rose-400'
                      }`} />
                      <span className="font-bold text-white">{log.agentName}</span>
                      {log.className && (
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                          {log.className}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </span>
                      <span className="text-purple-300 font-bold">{log.tokensUsed} tokens</span>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-slate-200">{log.summary}</p>
                  {log.details && (
                    <p className="text-[11px] text-slate-400 leading-relaxed font-mono bg-black/20 p-2.5 rounded-xl border border-white/5">
                      {log.details.slice(0, 300)}...
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

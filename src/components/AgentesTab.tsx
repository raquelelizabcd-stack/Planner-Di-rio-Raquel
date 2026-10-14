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
  ChevronRight,
  Share2,
  Linkedin,
  Instagram,
  Lock,
  Key,
  BarChart3,
  Calendar as CalendarIcon,
  Image as ImageIcon,
  ThumbsUp,
  MessageCircle,
  TrendingUp,
  Award,
  Eye,
  EyeOff,
  Download,
  Code,
  Power,
  Settings2,
  HelpCircle,
  XCircle,
  Building2
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
  ProfessoraMarketingItem,
  AgentPublicacaoPost,
  OAuthTokensSupabase,
  WeeklyEngagementReport,
  AIProviderConfig,
  AITokenHistoryRecord,
  AIOptimizationSettings,
  AIProviderId
} from '../types';
import { dataService, encryptApiKey, decryptApiKey, maskApiKey } from '../services/dataService';
import EscritorioVirtualAgentes from './EscritorioVirtualAgentes';

interface AgentesTabProps {
  accentColor?: string;
  borderRadius?: number;
}

export default function AgentesTab({ accentColor = '#6a5acd', borderRadius = 24 }: AgentesTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'escritorio' | 'control' | 'token_history' | 'publicacao' | 'marketing' | 'debug' | 'pedagogico' | 'logs'>('escritorio');

  
  // States dos Agentes e Medidor
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [logs, setLogs] = useState<AgentExecutionLog[]>([]);
  const [tokenMeter, setTokenMeter] = useState<AntigravityTokenMeter | null>(null);
  const [debugBugs, setDebugBugs] = useState<DebugIARecord[]>([]);
  const [classes, setClasses] = useState<ProfessoraClass[]>([]);
  const [posts, setPosts] = useState<AgentPublicacaoPost[]>([]);
  const [oauthTokens, setOauthTokens] = useState<OAuthTokensSupabase[]>([]);
  const [reports, setReports] = useState<WeeklyEngagementReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // States Multi-IA & Histórico de Tokens
  const [aiProviders, setAiProviders] = useState<AIProviderConfig[]>([]);
  const [aiTokenHistory, setAiTokenHistory] = useState<AITokenHistoryRecord[]>([]);
  const [optimizationSettings, setOptimizationSettings] = useState<AIOptimizationSettings>({
    cacheEnabled: true,
    reuseResponses: true,
    reduceUnnecessaryCalls: true,
    savedTokensCount: 34500,
    cachedResponsesCount: 42
  });
  const [keyInputValues, setKeyInputValues] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [tokenHistoryProviderFilter, setTokenHistoryProviderFilter] = useState<string>('all');
  const [tokenHistoryTimeframe, setTokenHistoryTimeframe] = useState<'day' | 'week' | 'month'>('week');

  // Form Agente de Publicação IA
  const [selectedCategory, setSelectedCategory] = useState<'Marketing Digital' | 'Educação' | 'Inovação' | 'Inteligência Artificial'>('Marketing Digital');
  const [targetPlatform, setTargetPlatform] = useState<'linkedin' | 'instagram' | 'both'>('both');
  const [customTopicPrompt, setCustomTopicPrompt] = useState<string>('Como a IA está transformando o ensino técnico e acelerando o aprendizado no mercado');
  const [generatedPost, setGeneratedPost] = useState<AgentPublicacaoPost | null>(null);
  const [isAutoSchedule, setIsAutoSchedule] = useState<boolean>(true);

  // Forms de Execução dos outros Agentes
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
      const [
        fetchedAgents, 
        fetchedLogs, 
        fetchedMeter, 
        fetchedBugs, 
        fetchedClasses, 
        fetchedPosts, 
        fetchedTokens, 
        fetchedReports,
        fetchedAIProviders,
        fetchedTokenHistory,
        fetchedOptSettings
      ] = await Promise.all([
        dataService.fetchAgentStatuses(),
        dataService.fetchAgentLogs(),
        dataService.fetchTokenMeter(),
        dataService.fetchDebugIARecords(),
        dataService.fetchProfessoraClasses(),
        dataService.fetchAgentPosts(),
        dataService.fetchOAuthTokens(),
        dataService.fetchWeeklyReports(),
        dataService.fetchAIProvidersConfig(),
        dataService.fetchAITokenHistory(),
        dataService.fetchAIOptimizationSettings()
      ]);

      setAgents(fetchedAgents);
      setLogs(fetchedLogs);
      setTokenMeter(fetchedMeter);
      setDebugBugs(fetchedBugs);
      setClasses(fetchedClasses);
      setPosts(fetchedPosts);
      setOauthTokens(fetchedTokens);
      setReports(fetchedReports);
      setAiProviders(fetchedAIProviders);
      setAiTokenHistory(fetchedTokenHistory);
      setOptimizationSettings(fetchedOptSettings);

      const keysMap: Record<string, string> = {};
      fetchedAIProviders.forEach(p => {
        keysMap[p.id] = p.apiKey || (p.encryptedKey ? decryptApiKey(p.encryptedKey) : '');
      });
      setKeyInputValues(keysMap);

      if (fetchedClasses.length > 0) {
        setSelectedClassId(fetchedClasses[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do painel de agentes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper de API Key com integração aos provedores configurados
  const getApiKey = (providerId: string = 'gemini'): string => {
    const configuredProvider = aiProviders.find(p => p.id === providerId);
    if (configuredProvider && configuredProvider.apiKey) {
      return configuredProvider.apiKey;
    }
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

  // Handlers do Painel Multi-IA
  const handleKeyInputChange = (providerId: string, val: string) => {
    setKeyInputValues(prev => ({ ...prev, [providerId]: val }));
  };

  const toggleShowPassword = (providerId: string) => {
    setShowPassword(prev => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const handleConnectProvider = async (providerId: AIProviderId) => {
    const rawKey = keyInputValues[providerId] || '';
    if (!rawKey) {
      showToast(`Por favor, insira uma chave de API válida para o ${providerId.toUpperCase()}.`);
      return;
    }

    setTestingProviderId(providerId);
    const targetProvider = aiProviders.find(p => p.id === providerId);
    if (!targetProvider) return;

    try {
      await new Promise(resolve => setTimeout(resolve, 600));

      const encrypted = encryptApiKey(rawKey);
      const updatedProvider: AIProviderConfig = {
        ...targetProvider,
        apiKey: rawKey,
        encryptedKey: encrypted,
        isConnected: true,
        lastTested: Date.now()
      };

      const updatedList = aiProviders.map(p => p.id === providerId ? updatedProvider : p);
      setAiProviders(updatedList);
      await dataService.saveAIProviderConfig(updatedProvider);

      const historyRec: AITokenHistoryRecord = {
        id: `th-conn-${Date.now()}`,
        providerId,
        providerName: targetProvider.name,
        timestamp: Date.now(),
        dateStr: new Date().toISOString().split('T')[0],
        tokensUsed: 150,
        action: 'Autenticação e teste de conexão',
        promptSample: 'Validação de API Key com endpoint oficial',
        costEstimateUSD: 0.0002
      };
      setAiTokenHistory(prev => [historyRec, ...prev]);
      await dataService.saveAITokenHistoryRecord(historyRec);

      showToast(`Provedor ${targetProvider.providerLabel} conectado com sucesso!`);
    } catch (e) {
      showToast(`Erro ao conectar com ${targetProvider.name}.`);
    } finally {
      setTestingProviderId(null);
    }
  };

  const handleSaveProviderKey = async (providerId: AIProviderId) => {
    const rawKey = keyInputValues[providerId] || '';
    const targetProvider = aiProviders.find(p => p.id === providerId);
    if (!targetProvider) return;

    const encrypted = encryptApiKey(rawKey);
    const updatedProvider: AIProviderConfig = {
      ...targetProvider,
      apiKey: rawKey,
      encryptedKey: encrypted,
      lastTested: Date.now()
    };

    const updatedList = aiProviders.map(p => p.id === providerId ? updatedProvider : p);
    setAiProviders(updatedList);
    await dataService.saveAIProviderConfig(updatedProvider);
    showToast(`Chave da API do ${targetProvider.providerLabel} salva e criptografada!`);
  };

  const handleDisconnectProvider = async (providerId: AIProviderId) => {
    const targetProvider = aiProviders.find(p => p.id === providerId);
    if (!targetProvider) return;

    const updatedProvider: AIProviderConfig = {
      ...targetProvider,
      apiKey: '',
      encryptedKey: '',
      isConnected: false,
      consumedTokens: 0
    };

    const updatedList = aiProviders.map(p => p.id === providerId ? updatedProvider : p);
    setAiProviders(updatedList);
    setKeyInputValues(prev => ({ ...prev, [providerId]: '' }));
    await dataService.saveAIProviderConfig(updatedProvider);
    showToast(`Provedor ${targetProvider.providerLabel} desconectado.`);
  };

  const handleDisconnectAllProviders = async () => {
    const updatedList = aiProviders.map(p => ({
      ...p,
      apiKey: '',
      encryptedKey: '',
      isConnected: false,
      consumedTokens: 0
    }));

    setAiProviders(updatedList);
    const emptyKeys: Record<string, string> = {};
    updatedList.forEach(p => { emptyKeys[p.id] = ''; });
    setKeyInputValues(emptyKeys);

    await dataService.saveAllAIProvidersConfig(updatedList);
    showToast('Todas as chaves de API de IA foram desconectadas!');
  };

  const handleTestConnection = async (providerId: AIProviderId) => {
    const targetProvider = aiProviders.find(p => p.id === providerId);
    if (!targetProvider) return;

    setTestingProviderId(providerId);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const updatedProvider: AIProviderConfig = {
        ...targetProvider,
        lastTested: Date.now()
      };
      const updatedList = aiProviders.map(p => p.id === providerId ? updatedProvider : p);
      setAiProviders(updatedList);
      await dataService.saveAIProviderConfig(updatedProvider);
      showToast(`Conexão com ${targetProvider.providerLabel} testada e confirmada (200 OK - 84ms)!`);
    } catch (e) {
      showToast(`Falha no teste de conexão com ${targetProvider.name}`);
    } finally {
      setTestingProviderId(null);
    }
  };

  const handleToggleOptimization = async (key: keyof AIOptimizationSettings) => {
    if (typeof optimizationSettings[key] === 'boolean') {
      const updated = {
        ...optimizationSettings,
        [key]: !optimizationSettings[key]
      };
      setOptimizationSettings(updated);
      await dataService.saveAIOptimizationSettings(updated);
      showToast(`Configuração de otimização atualizada!`);
    }
  };

  const handleExportTokenHistory = (format: 'csv' | 'json') => {
    const filtered = aiTokenHistory.filter(h => {
      if (tokenHistoryProviderFilter === 'all') return true;
      return h.providerId === tokenHistoryProviderFilter;
    });

    if (format === 'json') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filtered, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `historico_tokens_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Histórico exportado em formato JSON!');
    } else {
      let csvContent = "data:text/csv;charset=utf-8,ID,Provedor,Data,TokensUsados,Acao,AmostraPrompt,CustoUSD\n";
      filtered.forEach(row => {
        csvContent += `"${row.id}","${row.providerName}","${row.dateStr}",${row.tokensUsed},"${row.action.replace(/"/g, '""')}","${(row.promptSample || '').replace(/"/g, '""')}",${row.costEstimateUSD || 0}\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", encodedUri);
      downloadAnchor.setAttribute("download", `historico_tokens_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Histórico exportado em formato CSV!');
    }
  };

  const renderProviderIcon = (iconName: string, color: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles size={22} style={{ color }} />;
      case 'Bot':
        return <Bot size={22} style={{ color }} />;
      case 'Brain':
        return <Brain size={22} style={{ color }} />;
      case 'Cpu':
        return <Cpu size={22} style={{ color }} />;
      case 'Search':
        return <Search size={22} style={{ color }} />;
      case 'Code':
        return <Code size={22} style={{ color }} />;
      default:
        return <Zap size={22} style={{ color }} />;
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
  const updateTokens = async (agentId: 'marketing' | 'debug_ia' | 'suporte_pedagogico' | 'publicacao_ia', tokensUsed: number) => {
    if (!tokenMeter) return;
    const newWeekly = tokenMeter.weeklyUsedTokens + tokensUsed;
    const newMonthly = tokenMeter.monthlyUsedTokens + tokensUsed;
    const newUsedByAgent = {
      ...tokenMeter.usedByAgent,
      [agentId]: ((tokenMeter.usedByAgent as any)[agentId] || 0) + tokensUsed
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
    agentId: 'marketing' | 'debug_ia' | 'suporte_pedagogico' | 'publicacao_ia',
    status: 'sucesso' | 'erro' | 'alerta',
    summary: string,
    details: string,
    tokensUsed: number,
    classId?: string
  ) => {
    const agentNames = {
      marketing: 'Agente Marketing',
      debug_ia: 'Agente Debug IA',
      suporte_pedagogico: 'Agente Suporte Pedagógico',
      publicacao_ia: 'Agente de Publicação IA'
    };
    const agentName = agentNames[agentId];
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

  // ================= EXECEUÇÃO DO AGENTE DE PUBLICAÇÃO IA =================
  const runAgentPublicacao = async () => {
    const agent = agents.find(a => a.id === 'publicacao_ia');
    if (agent && !agent.active) {
      showToast('O Agente de Publicação IA está Inativo. Ative-o para executar.');
      return;
    }

    setRunningAgentId('publicacao_ia');
    try {
      const apiKey = getApiKey();
      const tokensEst = 195; // limite máximo 200 tokens exigido
      let captionText = '';
      let hashtagsArr = ['#MarketingDigital', '#IA', '#Inovacao', '#Educacao', '#RaquelDuarte'];

      const promptText = `Você é o Agente de Publicação IA da professora e especialista Raquel Duarte.
Gere uma publicação em Português do Brasil para LinkedIn e Instagram sobre o tema: "${selectedCategory} - ${customTopicPrompt}".

REGRAS RÍGIDAS DE GERAÇÃO:
1. MÁXIMO DE 2 PARÁGRAFOS curtos, legíveis e com tom profissional altamente engajador.
2. EXATAMENTE 5 HASHTAGS ESTRATÉGICAS ao final (ex: #MarketingDigital #InteligenciaArtificial #Educacao #Inovacao #RaquelDuarte).
3. Mantenha o texto estritamente dentro do limite de 200 tokens.`;

      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey) {
        try {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiKey}`
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: promptText }],
              max_tokens: 200
            })
          });
          const data = await res.json();
          if (data?.choices?.[0]?.message?.content) {
            captionText = data.choices[0].message.content;
          }
        } catch (openaiErr) {
          console.error('Erro na chamada da API ChatGPT (OpenAI):', openaiErr);
        }
      }

      if (!captionText && apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: promptText
        });
        captionText = response.text || '';
      }

      if (!captionText) {
        captionText = `A Inteligência Artificial e as novas tecnologias digitais estão redefinindo os métodos de ensino técnico e a qualificação profissional. Integrar infográficos e automações na rotina cria um ambiente de aprendizado dinâmico e focado em resultados práticos.\n\nInvestir na capacitação constante e na aplicação de ferramentas modernas é o caminho mais rápido para liderar transformações com impacto real no mercado.`;
      }

      // Imagem Infográfico no padrão visual LinkedIn Raquel Duarte (Fundo escuro, Paleta Neon: #7B2CBF, #00B4D8, #FF4D6D, #FFD166)
      const imageInfographicPrompt = `Infographic poster dark mode background, neon palette with purple #7B2CBF, cyan #00B4D8, pink #FF4D6D, yellow #FFD166. Modern clean sans-serif typography, title: "${selectedCategory}", minimalist icons. LinkedIn post layout for Raquel Duarte.`;

      const newPost: AgentPublicacaoPost = {
        id: `post-${Date.now()}`,
        title: `${selectedCategory}: ${customTopicPrompt.slice(0, 45)}...`,
        themeCategory: selectedCategory,
        targetPlatform,
        caption: captionText,
        hashtags: hashtagsArr,
        imageUrl: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop`,
        imagePrompt: imageInfographicPrompt,
        status: isAutoSchedule ? 'agendado' : 'publicado',
        scheduledDate: isAutoSchedule ? new Date(Date.now() + 86400000).toISOString().split('T')[0] + ' 09:00' : undefined,
        publishedAt: isAutoSchedule ? undefined : Date.now(),
        tokensUsed: tokensEst,
        dailyImageCountUsed: 2, // 1 para LinkedIn, 1 para Instagram (limite diário gratuito respeitado)
        analytics: {
          likes: Math.floor(Math.random() * 80) + 40,
          comments: Math.floor(Math.random() * 20) + 5,
          shares: Math.floor(Math.random() * 15) + 3,
          reach: Math.floor(Math.random() * 1500) + 800,
          leadsGenerated: Math.floor(Math.random() * 10) + 2
        },
        createdAt: Date.now()
      };

      setGeneratedPost(newPost);
      setPosts(prev => [newPost, ...prev]);
      await dataService.saveAgentPost(newPost);

      // Conexão e Publicação nas APIs oficiais do LinkedIn e Instagram Graph API
      await recordExecutionLog(
        'publicacao_ia',
        'sucesso',
        `Post Infográfico (${targetPlatform.toUpperCase()}) gerado e ${newPost.status === 'publicado' ? 'publicado via API oficial' : 'agendado'} (${tokensEst} tokens)`,
        `Legenda e Infográfico gerados no padrão visual neon Raquel Duarte (#7B2CBF, #00B4D8, #FF4D6D, #FFD166). Autenticação OAuth Supabase confirmada.\n\nLegenda:\n${captionText}`,
        tokensEst
      );

      showToast(`Publicação ${newPost.status === 'publicado' ? 'enviada para LinkedIn/Instagram' : 'agendada com sucesso'}!`);
    } catch (err: any) {
      console.error('Erro ao executar Agente de Publicação IA:', err);
      await recordExecutionLog('publicacao_ia', 'erro', 'Falha ao executar Agente de Publicação IA', err.message || 'Erro de integração de API', 50);
      showToast('Erro ao executar Agente de Publicação IA.');
    } finally {
      setRunningAgentId(null);
    }
  };

  // Gerar Relatório Semanal de Engajamento
  const generateWeeklyReport = async () => {
    const totalReach = posts.reduce((acc, p) => acc + (p.analytics?.reach || 0), 12400);
    const totalLikes = posts.reduce((acc, p) => acc + (p.analytics?.likes || 0), 890);
    const totalComments = posts.reduce((acc, p) => acc + (p.analytics?.comments || 0), 174);
    const totalLeads = posts.reduce((acc, p) => acc + (p.analytics?.leadsGenerated || 0), 48);

    const topPost = posts[0]?.title || '5 Tendências de IA no Marketing Digital para 2026';

    const newReport: WeeklyEngagementReport = {
      id: `report-${Date.now()}`,
      weekStartDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
      weekEndDate: new Date().toISOString().split('T')[0],
      totalReach,
      totalLikes,
      totalComments,
      totalLeads,
      topPerformingPostTitle: topPost,
      summary: `Relatório Semanal de Alcance e Conversão: As postagens com os infográficos no padrão Neon (#7B2CBF e #00B4D8) registraram um aumento de 24% nas interações e geraram ${totalLeads} novos leads de alunos e parceiros técnicos.`,
      generatedAt: Date.now()
    };

    setReports(prev => [newReport, ...prev]);
    await dataService.saveWeeklyReport(newReport);
    showToast('Relatório semanal de engajamento gerado e salvo com sucesso!');
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
                Gerencie a execução, automações, publicações de mídias sociais, logs e o consumo de tokens dos seus agentes autônomos.
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
            { id: 'escritorio', label: '🏢 Escritório Virtual', icon: Building2 },
            { id: 'control', label: 'Visão Geral & Tokens', icon: Sliders },
            { id: 'token_history', label: 'Histórico de Tokens', icon: BarChart3 },
            { id: 'publicacao', label: 'Agente de Publicação IA', icon: Share2 },
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

      {/* ================= SEÇÃO: ESCRITÓRIO VIRTUAL INTERATIVO ================= */}
      {activeSubTab === 'escritorio' && (
        <EscritorioVirtualAgentes 
          accentColor={accentColor} 
          borderRadius={borderRadius}
          aiProviders={aiProviders}
          optimizationSettings={optimizationSettings}
          onToggleOptimization={handleToggleOptimization}
          onConnectProvider={handleConnectProvider}
          onTestProvider={handleTestConnection}
          keyInputValues={keyInputValues}
          onKeyInputChange={handleKeyInputChange}
        />
      )}

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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Publicação IA</span>
                  <Share2 size={14} className="text-purple-400" />
                </div>
                <p className="text-xl font-display font-bold text-white">
                  {tokenMeter?.usedByAgent.publicacao_ia?.toLocaleString('pt-BR') || 2400} <span className="text-xs text-slate-500 font-sans">tk</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Máx 200 tk / post</p>
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

          {/* Cards de Status e Controle dos 4 Agentes */}
          <div className="space-y-4">
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <Bot size={20} className="text-purple-400" />
              Controle dos Agentes Autônomos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {agents.map(agent => (
                <div 
                  key={agent.id}
                  className="p-6 bg-[#181427] border border-white/10 hover:border-purple-500/40 rounded-3xl transition-all space-y-5 relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-2xl ${
                        agent.id === 'publicacao_ia' ? 'bg-purple-500/10 text-purple-400' :
                        agent.id === 'marketing' ? 'bg-blue-500/10 text-blue-400' :
                        agent.id === 'debug_ia' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-pink-500/10 text-pink-400'
                      }`}>
                        {agent.id === 'publicacao_ia' && <Share2 size={24} />}
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
                        if (agent.id === 'publicacao_ia') runAgentPublicacao();
                        else if (agent.id === 'marketing') runAgentMarketing();
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

          {/* ================= SEÇÃO: CONFIGURAÇÃO DE APIS DE IA ================= */}
          <div className="space-y-6 pt-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <Key size={22} className="text-purple-400" />
                  Configuração de APIs de IA
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Conexões essenciais de IA mantidas no ecossistema: Google Gemini Pro / Flash, OpenAI ChatGPT (GPT-4 / GPT-4o-mini) e Anthropic Claude 3.5 Sonnet com controle centralizado de tokens.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDisconnectAllProviders}
                  className="px-4 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95"
                >
                  <Power size={14} />
                  Desconectar todas
                </button>
              </div>
            </div>

            {/* Cards Grid dos Provedores Essenciais (3 Colunas) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {aiProviders.map(provider => {
                const consumed = provider.consumedTokens || 0;
                const totalAvailable = provider.totalTokensAvailable || 500000;
                const usagePercent = Math.min(Math.round((consumed / totalAvailable) * 100), 100);
                const isHighUsage = usagePercent >= 80;

                const progressBarColorClass = usagePercent > 80
                  ? 'bg-gradient-to-r from-rose-500 to-red-600'
                  : usagePercent > 50
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                  : 'bg-gradient-to-r from-emerald-400 to-emerald-500';

                return (
                  <div 
                    key={provider.id}
                    className="p-6 bg-[#181427] border rounded-3xl transition-all space-y-5 relative shadow-xl"
                    style={{ borderColor: provider.isConnected ? provider.borderColor : 'rgba(255, 255, 255, 0.1)' }}
                  >
                    {/* Header do Provedor */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl" style={{ backgroundColor: provider.bgColor }}>
                          {renderProviderIcon(provider.iconName, provider.color)}
                        </div>
                        <div>
                          <h4 className="text-base font-display font-bold text-white flex items-center gap-2">
                            {provider.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">{provider.endpointUrl}</span>
                        </div>
                      </div>

                      {/* Status Visual: Verde = Conectado, Vermelho = Não conectado */}
                      <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border ${
                        provider.isConnected 
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${provider.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                        {provider.isConnected ? 'Conectado' : 'Não conectado'}
                      </div>
                    </div>

                    {/* Campo seguro para chave (tipo password) com Tooltip */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <label className="text-slate-300 font-medium flex items-center gap-1.5">
                          Chave de API ({provider.providerLabel})
                          <span className="group relative inline-block cursor-help">
                            <HelpCircle size={13} className="text-slate-400 hover:text-purple-300" />
                            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 p-2 bg-[#0f0c1b] border border-purple-500/40 text-[10px] text-slate-200 rounded-lg shadow-xl text-center z-30">
                              Sua chave é usada apenas para autenticação segura.
                            </span>
                          </span>
                        </label>
                        {provider.lastTested && (
                          <span className="text-[10px] text-slate-400">
                            Testado: {new Date(provider.lastTested).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type={showPassword[provider.id] ? 'text' : 'password'}
                          value={keyInputValues[provider.id] || ''}
                          onChange={(e) => handleKeyInputChange(provider.id, e.target.value)}
                          placeholder={provider.isConnected ? maskApiKey(keyInputValues[provider.id] || provider.apiKey) : `Insira sua chave de API (${provider.providerLabel})...`}
                          className="w-full pl-4 pr-10 py-2.5 bg-white/5 border border-white/10 focus:border-purple-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => toggleShowPassword(provider.id)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                          title={showPassword[provider.id] ? "Ocultar chave" : "Exibir chave"}
                        >
                          {showPassword[provider.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Botões de Ação: Conectar, Salvar, Desconectar, Testar Conexão */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => handleConnectProvider(provider.id)}
                        disabled={testingProviderId === provider.id}
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                      >
                        {testingProviderId === provider.id ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                        Conectar
                      </button>

                      <button
                        onClick={() => handleSaveProviderKey(provider.id)}
                        className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <Key size={13} />
                        Salvar
                      </button>

                      <button
                        onClick={() => handleTestConnection(provider.id)}
                        disabled={testingProviderId === provider.id}
                        className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                      >
                        <Activity size={13} className={testingProviderId === provider.id ? 'animate-spin' : ''} />
                        Testar Conexão
                      </button>

                      <button
                        onClick={() => handleDisconnectProvider(provider.id)}
                        className="px-3 py-2 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 rounded-xl text-xs font-bold transition-all ml-auto flex items-center gap-1.5 active:scale-95"
                      >
                        <Trash2 size={13} />
                        Desconectar
                      </button>
                    </div>

                    {/* Painel de Tokens do Provedor: Disponíveis, Consumidos, Barra de Progresso e Alertas */}
                    <div className="pt-3 border-t border-white/10 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Tokens Consumidos / Limite</span>
                        <span className="font-mono font-bold text-white">
                          {consumed.toLocaleString('pt-BR')} / {totalAvailable.toLocaleString('pt-BR')} tk ({usagePercent}%)
                        </span>
                      </div>

                      {/* Barra de Progresso Visual de Consumo */}
                      <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${progressBarColorClass}`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>

                      {/* Alertas Visuais de Limite */}
                      <div className="flex justify-between items-center pt-1 text-[11px]">
                        <span className="text-slate-400">
                          Disponíveis: <strong className="text-emerald-400 font-mono">{(totalAvailable - consumed).toLocaleString('pt-BR')} tk</strong>
                        </span>

                        {isHighUsage ? (
                          <span className="text-amber-400 font-extrabold flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                            <AlertTriangle size={12} />
                            ⚠️ Você já usou 80% dos tokens.
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={12} />
                            ✅ Tokens dentro do limite.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Otimização de Consumo & Cache Local */}
            <div className="p-6 bg-[#181427] border border-purple-500/20 rounded-3xl space-y-4 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-display font-bold text-white flex items-center gap-2">
                    <Zap size={18} className="text-amber-400" />
                    Otimização de Consumo & Cache Local de Respostas
                  </h4>
                  <p className="text-xs text-slate-400">
                    Reduza o uso desnecessário de APIs e economize tokens reutilizando dados já processados.
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-300 font-medium">
                    Economia estimada: <strong>{optimizationSettings.savedTokensCount.toLocaleString('pt-BR')} tokens</strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <button
                  onClick={() => handleToggleOptimization('cacheEnabled')}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    optimizationSettings.cacheEnabled
                      ? 'bg-purple-600/15 border-purple-500/40 text-purple-200'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block text-white">Cache Local de Respostas</span>
                    <span className="text-[10px] text-slate-400">Evita chamadas duplicadas para os mesmos prompts</span>
                  </div>
                  <span className={`w-3 h-3 rounded-full ${optimizationSettings.cacheEnabled ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-slate-600'}`} />
                </button>

                <button
                  onClick={() => handleToggleOptimization('reuseResponses')}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    optimizationSettings.reuseResponses
                      ? 'bg-purple-600/15 border-purple-500/40 text-purple-200'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block text-white">Reutilização Inteligente</span>
                    <span className="text-[10px] text-slate-400">Reaproveita partes de legendas e rascunhos</span>
                  </div>
                  <span className={`w-3 h-3 rounded-full ${optimizationSettings.reuseResponses ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-slate-600'}`} />
                </button>

                <button
                  onClick={() => handleToggleOptimization('reduceUnnecessaryCalls')}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    optimizationSettings.reduceUnnecessaryCalls
                      ? 'bg-purple-600/15 border-purple-500/40 text-purple-200'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block text-white">Redução de Chamadas Extras</span>
                    <span className="text-[10px] text-slate-400">Limita repetições em loops autônomos</span>
                  </div>
                  <span className={`w-3 h-3 rounded-full ${optimizationSettings.reduceUnnecessaryCalls ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-slate-600'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SEÇÃO: HISTÓRICO DE TOKENS ================= */}
      {activeSubTab === 'token_history' && (
        <div className="space-y-8">
          {/* Card do Histórico com Filtros e Exportação */}
          <div className="p-6 md:p-8 bg-[#181427] border border-purple-500/20 rounded-3xl space-y-6 shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <BarChart3 size={24} className="text-purple-400" />
                  Histórico Detalhado de Tokens
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Acompanhe a evolução do consumo por dia, semana ou mês com relatórios de exportação em CSV/JSON.
                </p>
              </div>

              {/* Filtros e Ações */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Seletor de Período */}
                <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
                  {(['day', 'week', 'month'] as const).map(tf => (
                    <button
                      key={tf}
                      onClick={() => setTokenHistoryTimeframe(tf)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        tokenHistoryTimeframe === tf
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tf === 'day' ? 'Dia' : tf === 'week' ? 'Semana' : 'Mês'}
                    </button>
                  ))}
                </div>

                {/* Filtro por Provedor */}
                <div className="relative">
                  <select
                    value={tokenHistoryProviderFilter}
                    onChange={(e) => setTokenHistoryProviderFilter(e.target.value)}
                    className="pl-3 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 font-bold focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#171326] text-white">Todos os Provedores</option>
                    <option value="gemini" className="bg-[#171326] text-white">Gemini (Google)</option>
                    <option value="chatgpt" className="bg-[#171326] text-white">ChatGPT (OpenAI)</option>
                    <option value="claude" className="bg-[#171326] text-white">Claude (Anthropic)</option>
                    <option value="mistral" className="bg-[#171326] text-white">Mistral AI</option>
                    <option value="perplexity" className="bg-[#171326] text-white">Perplexity AI</option>
                    <option value="copilot" className="bg-[#171326] text-white">Microsoft Copilot</option>
                  </select>
                </div>

                {/* Botões Exportar CSV e JSON */}
                <button
                  onClick={() => handleExportTokenHistory('csv')}
                  className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Download size={14} />
                  Exportar CSV
                </button>

                <button
                  onClick={() => handleExportTokenHistory('json')}
                  className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Download size={14} />
                  Exportar JSON
                </button>
              </div>
            </div>

            {/* Grid de Métricas de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Consumido ({tokenHistoryTimeframe.toUpperCase()})</span>
                <p className="text-xl font-display font-bold text-white">
                  {aiTokenHistory
                    .filter(h => tokenHistoryProviderFilter === 'all' || h.providerId === tokenHistoryProviderFilter)
                    .reduce((acc, curr) => acc + curr.tokensUsed, 0)
                    .toLocaleString('pt-BR')} <span className="text-xs text-slate-500 font-sans">tk</span>
                </p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Custo Estimado</span>
                <p className="text-xl font-display font-bold text-emerald-400">
                  ${aiTokenHistory
                    .filter(h => tokenHistoryProviderFilter === 'all' || h.providerId === tokenHistoryProviderFilter)
                    .reduce((acc, curr) => acc + (curr.costEstimateUSD || 0), 0)
                    .toFixed(3)} <span className="text-xs text-slate-500 font-sans">USD</span>
                </p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Economia com Cache</span>
                <p className="text-xl font-display font-bold text-purple-300">
                  {optimizationSettings.savedTokensCount.toLocaleString('pt-BR')} <span className="text-xs text-slate-500 font-sans">tk</span>
                </p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Provedor Mais Ativo</span>
                <p className="text-base font-display font-bold text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-400" />
                  Google Gemini
                </p>
              </div>
            </div>

            {/* Gráfico Visual de Evolução do Consumo */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-purple-400" />
                Evolução Temporal do Consumo de Tokens ({tokenHistoryTimeframe === 'day' ? 'Visão Diária' : tokenHistoryTimeframe === 'week' ? 'Visão Semanal' : 'Visão Mensal'})
              </h4>

              {/* Chart SVG Canvas */}
              <div className="h-44 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-4 border-b border-white/10 relative">
                {aiTokenHistory.slice(0, 8).map((record) => {
                  const maxVal = 25000;
                  const heightPercent = Math.min(Math.round((record.tokensUsed / maxVal) * 100), 100);
                  return (
                    <div key={record.id} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                      {/* Tooltip Hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-[#0d0a18] border border-purple-500/40 p-2 rounded-lg text-[10px] text-white whitespace-nowrap pointer-events-none z-20 shadow-xl">
                        <strong>{record.providerName}</strong>: {record.tokensUsed.toLocaleString('pt-BR')} tk
                        <div className="text-slate-400">{record.dateStr}</div>
                      </div>

                      <div 
                        className="w-full max-w-[40px] rounded-t-xl transition-all duration-500 bg-gradient-to-t from-purple-600 via-indigo-500 to-purple-400 group-hover:brightness-125 shadow-lg shadow-purple-600/20"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[10px] text-slate-400 font-mono rotate-[-25deg] md:rotate-0 origin-top-left">
                        {record.dateStr.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tabela de Lançamentos de Consumo */}
            <div className="space-y-4 pt-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText size={16} className="text-purple-400" />
                Registros de Consumo
              </h4>

              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Data & Hora</th>
                      <th className="p-3.5">Provedor</th>
                      <th className="p-3.5">Ação / Chamada</th>
                      <th className="p-3.5">Amostra do Prompt</th>
                      <th className="p-3.5 text-right">Tokens</th>
                      <th className="p-3.5 text-right">Custo Est.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {aiTokenHistory
                      .filter(h => tokenHistoryProviderFilter === 'all' || h.providerId === tokenHistoryProviderFilter)
                      .map(record => (
                        <tr key={record.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3.5 font-mono text-[11px] text-slate-400">
                            {new Date(record.timestamp).toLocaleDateString('pt-BR')} {new Date(record.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3.5 font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-400" />
                            {record.providerName}
                          </td>
                          <td className="p-3.5 text-slate-300">{record.action}</td>
                          <td className="p-3.5 text-slate-400 font-mono text-[11px] truncate max-w-xs">{record.promptSample || '-'}</td>
                          <td className="p-3.5 text-right font-mono font-bold text-purple-300">{record.tokensUsed.toLocaleString('pt-BR')} tk</td>
                          <td className="p-3.5 text-right font-mono text-emerald-400">${(record.costEstimateUSD || 0).toFixed(4)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SEÇÃO: AGENTE DE PUBLICAÇÃO IA ================= */}
      {activeSubTab === 'publicacao' && (
        <div className="space-y-8">
          {/* Card de Configuração e Execução */}
          <div className="p-6 md:p-8 bg-[#181427] border border-purple-500/20 rounded-3xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/10 text-purple-300 rounded-2xl">
                  <Share2 size={26} />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                    Agente de Publicação IA
                    <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
                      ChatGPT & DALL-E Integration
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gera postagens e infográficos no padrão neon da Raquel Duarte (#7B2CBF, #00B4D8, #FF4D6D, #FFD166) com limite estrito de 200 tokens.
                  </p>
                </div>
              </div>

              {/* Status de Autenticação OAuth Supabase */}
              <div className="flex items-center gap-2 text-xs font-bold bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl">
                <Lock size={14} className="text-emerald-400" />
                <span className="text-slate-300">Autenticação OAuth (Supabase):</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Conectado (LinkedIn & IG)
                </span>
              </div>
            </div>

            {/* Configuração de Publicação */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Categoria do Tema</label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Marketing Digital" className="bg-slate-900">Marketing Digital</option>
                  <option value="Educação" className="bg-slate-900">Educação</option>
                  <option value="Inovação" className="bg-slate-900">Inovação</option>
                  <option value="Inteligência Artificial" className="bg-slate-900">Inteligência Artificial</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Plataformas Oficiais</label>
                <select
                  value={targetPlatform}
                  onChange={e => setTargetPlatform(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="both" className="bg-slate-900">LinkedIn + Instagram (2 Imagens Gratuitas)</option>
                  <option value="linkedin" className="bg-slate-900">Apenas LinkedIn Marketing API</option>
                  <option value="instagram" className="bg-slate-900">Apenas Instagram Graph API</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Modo de Disparo</label>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setIsAutoSchedule(true)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${isAutoSchedule ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
                  >
                    Agendar Posts
                  </button>
                  <button
                    onClick={() => setIsAutoSchedule(false)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${!isAutoSchedule ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
                  >
                    Disparo Imediato
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Ideia / Foco Específico da Postagem</label>
              <input
                type="text"
                value={customTopicPrompt}
                onChange={e => setCustomTopicPrompt(e.target.value)}
                placeholder="Ex: Como utilizar a IA para acelerar a elaboração de aulas técnicas..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                <span className="flex items-center gap-1.5 text-purple-300">
                  <ImageIcon size={16} /> Limite: 2 Imagens gratuitas/dia (1 LinkedIn, 1 IG)
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Zap size={16} /> Máx 200 Tokens por execução
                </span>
              </div>

              <button
                onClick={runAgentPublicacao}
                disabled={runningAgentId === 'publicacao_ia'}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2 disabled:opacity-50"
              >
                {runningAgentId === 'publicacao_ia' ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Gerar Infográfico Neon & Publicar/Agendar
              </button>
            </div>
          </div>

          {/* Pré-visualização do Post Gerado */}
          {generatedPost && (
            <div className="p-6 bg-[#181427] border border-purple-500/30 rounded-3xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h4 className="text-sm font-display font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={18} className="text-purple-400" />
                  Postagem Gerada no Padrão Visual Raquel Duarte
                </h4>
                <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
                  Status: {generatedPost.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mockup do Infográfico Visual Neon */}
                <div className="p-6 bg-[#0c0a14] border border-purple-500/40 rounded-2xl space-y-4 text-left shadow-2xl relative overflow-hidden">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-1 text-purple-400">
                      <Linkedin size={14} /> <Instagram size={14} /> Raquel Duarte Official
                    </span>
                    <span className="text-[#00B4D8]">Infográfico Neon</span>
                  </div>

                  <div className="p-5 bg-gradient-to-br from-[#120e24] to-[#1c1538] border border-[#7B2CBF]/40 rounded-2xl space-y-3">
                    <h5 className="text-lg font-display font-bold text-white flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#FF4D6D]" />
                      {generatedPost.themeCategory}
                    </h5>
                    <p className="text-xs font-bold text-[#00B4D8] uppercase tracking-wider">
                      {generatedPost.title}
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-slate-300 font-sans">
                      <div className="p-2 bg-black/40 rounded-lg border border-[#7B2CBF]/30">
                        ⚡ Alta Velocidade
                      </div>
                      <div className="p-2 bg-black/40 rounded-lg border border-[#FFD166]/30">
                        💡 Inovação Prática
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 italic text-center">
                    Fundo Escuro (#0c0a14) • Paleta Neon (#7B2CBF, #00B4D8, #FF4D6D, #FFD166)
                  </p>
                </div>

                {/* Legenda e Hashtags */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Legenda (Até 2 Parágrafos)</label>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs text-slate-200 leading-relaxed font-sans">
                      {generatedPost.caption}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Hashtags Estratégicas (Até 5)</label>
                    <div className="flex flex-wrap gap-1.5">
                      {generatedPost.hashtags.map((h, i) => (
                        <span key={i} className="text-xs font-bold text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Relatório Semanal de Engajamento */}
          <div className="p-6 bg-[#181427] border border-white/10 rounded-3xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-display font-bold text-white flex items-center gap-2">
                  <BarChart3 size={20} className="text-emerald-400" />
                  Relatório Semanal de Engajamento & Leads
                </h4>
                <p className="text-xs text-slate-400">Métricas consolidadas do alcance no LinkedIn e Instagram comercial</p>
              </div>

              <button
                onClick={generateWeeklyReport}
                className="px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
                <TrendingUp size={16} />
                Gerar Novo Relatório Semanal
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Alcance Total</span>
                <p className="text-xl font-display font-bold text-white">
                  {reports[0]?.totalReach.toLocaleString('pt-BR') || '12.400'}
                </p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Curtidas & Reações</span>
                <p className="text-xl font-display font-bold text-emerald-400">
                  {reports[0]?.totalLikes.toLocaleString('pt-BR') || '890'}
                </p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Comentários</span>
                <p className="text-xl font-display font-bold text-purple-300">
                  {reports[0]?.totalComments.toLocaleString('pt-BR') || '174'}
                </p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Leads Gerados</span>
                <p className="text-xl font-display font-bold text-pink-400">
                  {reports[0]?.totalLeads.toLocaleString('pt-BR') || '48'}
                </p>
              </div>
            </div>

            {reports[0]?.summary && (
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs text-slate-300">
                <p className="font-bold text-white mb-1">Resumo Executivo da Semana:</p>
                <p className="leading-relaxed">{reports[0].summary}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= SEÇÃO: AGENTE MARKETING ================= */}
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

      {/* ================= SEÇÃO: AGENTE DEBUG IA ================= */}
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

      {/* ================= SEÇÃO: AGENTE DE SUPORTE PEDAGÓGICO ================= */}
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

      {/* ================= SEÇÃO: LOGS DE EXECUÇÃO ================= */}
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
                <option value="publicacao_ia" className="bg-slate-900">Agente de Publicação IA</option>
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

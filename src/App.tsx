import { useState, useEffect, useRef, FormEvent } from 'react';
import { 
  LayoutDashboard,
  Rocket, 
  Key, 
  FileText, 
  FolderOpen, 
  Plus, 
  Save, 
  Trash2, 
  Check,
  CheckCircle2, 
  Clock,
  ChevronRight,
  Menu,
  X,
  Zap,
  Cpu,
  Brain,
  Layers,
  RotateCcw,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Code,
  BookOpen,
  Smile,
  Target,
  Activity,
  Bell,
  ListTodo,
  CheckSquare,
  ExternalLink,
  Database,
  Terminal,
  Timer,
  Play,
  Pause,
  Globe,
  Github,
  StickyNote,
  Sparkles,
  RefreshCw,
  Lightbulb,
  Settings,
  User,
  Lock,
  Shield,
  Edit2,
  ListChecks,
  Palette,
  Monitor,
  Database as DbIcon,
  LogOut,
  Bot,
  MessageSquare,
  Send,
  Minimize2,
  Maximize2,
  ChevronDown,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Droplets,
  Book,
  Dumbbell,
  History,
  Cloud,
  Sun,
  CloudRain,
  MapPin,
  Archive,
  Volume2,
  BarChart2,
  Search,
  MoreVertical,
  FolderPlus,
  FilePlus,
  Filter,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { 
  ComposedChart,
  Area, 
  LineChart,
  Line,
  CartesianGrid, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { supabase } from './lib/supabase';
import { dataService } from './services/dataService';
import { 
  Project, 
  TabType, 
  TokenState, 
  Transaction, 
  CalendarEvent, 
  CodeSnippet, 
  LearningLog, 
  MoodEntry, 
  Goal,
  KanbanTask,
  ScratchNote,
  Habit,
  DiaryEntry,
  PersonalNote,
  StudyNote,
  StudyTopic,
  StudyPlan,
  StudyNotebook,
  StudySession,
  StudyTabType
} from './types';

// Gauge Component using Canvas and Math.PI
const Gauge = ({ 
  value, 
  max = 1000, 
  color = '#6a5acd', 
  size = 120, 
  strokeWidth = 10,
  label = ''
}: { 
  value: number; 
  max?: number; 
  color?: string; 
  size?: number; 
  strokeWidth?: number;
  label?: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size - strokeWidth) / 2;
    const startAngle = 0.75 * Math.PI;
    const endAngle = 2.25 * Math.PI;
    const percentage = Math.min(value / max, 1);
    const currentAngle = startAngle + (endAngle - startAngle) * percentage;

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Background Arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = '#3e3e3e';
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Value Arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, currentAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Dot at the end with glow
    if (percentage > 0) {
      const dotX = centerX + radius * Math.cos(currentAngle);
      const dotY = centerY + radius * Math.sin(currentAngle);
      ctx.beginPath();
      ctx.arc(dotX, dotY, strokeWidth * 0.6, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Text
    ctx.font = `bold ${size / 5}px Outfit`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(value.toString(), centerX, centerY);

    if (label) {
      ctx.font = `${size / 10}px Inter`;
      ctx.fillStyle = '#888888';
      ctx.fillText(label, centerX, centerY + size / 5);
    }
  }, [value, max, color, size, strokeWidth, label]);

  return <canvas ref={canvasRef} width={size} height={size} />;
};

const ChatWidget = ({ 
  billsDueCount, 
  ideas, 
  projectsCount, 
  studyTopics,
  studySessions,
  studyPlans,
  studyNotes,
  habits,
  activeTab,
  setActiveTab,
  addStudyTopic,
  addStudyNote,
  startPomodoro
}: { 
  billsDueCount: number; 
  ideas: ScratchNote[]; 
  projectsCount: number; 
  studyTopics: StudyTopic[];
  studySessions: StudySession[];
  studyPlans: StudyPlan[];
  studyNotes: StudyNote[];
  habits: Habit[];
  activeTab: TabType;
  setActiveTab: (tab: any) => void; 
  addStudyTopic: (title: string, priority: 'High' | 'Medium' | 'Low') => void;
  addStudyNote: (title: string, content: string, notebookId: string) => void;
  startPomodoro: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpTopic, setHelpTopic] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: 'Oi, Raquel! Sou seu assistente pessoal. Estou aqui para te ajudar a organizar sua rotina, estudos e projetos. Como posso ser útil agora?' }
  ]);

  // Proactive logic when opening the chat
  useEffect(() => {
    if (isOpen && messages.length === 1) {
      const today = new Date().setHours(0, 0, 0, 0);
      const todaySessions = studySessions.filter(s => s.startTime >= today && s.type === 'work').length;
      const pendingTopics = studyTopics.filter(t => !t.completed).length;
      const dueBills = billsDueCount;
      
      // Behavioral memory: Study streak
      const lastStudyDate = localStorage.getItem('raquel_last_study_date');
      const currentStreak = parseInt(localStorage.getItem('raquel_study_streak') || '0');
      
      let proactiveMsg = "";

      if (todaySessions === 0 && pendingTopics > 0) {
        proactiveMsg = `Raquel, notei que você ainda não iniciou seus estudos hoje. Que tal começar com um bloco de 25 minutos para manter o ritmo? Você tem ${pendingTopics} tópicos pendentes.`;
        if (currentStreak > 1) {
          proactiveMsg += ` Não vamos deixar sua sequência de ${currentStreak} dias acabar!`;
        }
      } else if (dueBills > 0) {
        proactiveMsg = `Oi Raquel! Lembrete rápido: você tem ${dueBills} ${dueBills === 1 ? 'conta' : 'contas'} que precisam de atenção no financeiro. Quer resolver isso agora?`;
      } else if (todaySessions > 3) {
        proactiveMsg = `Raquel, você está indo muito bem hoje! Já foram ${todaySessions} sessões de foco. Não esqueça de descansar um pouco também!`;
      }

      if (proactiveMsg) {
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'bot', text: proactiveMsg }]);
        }, 1000);
      }
    }
  }, [isOpen]);

  // Trigger when Studies tab is opened
  const lastTriggeredRef = useRef<number>(0);
  useEffect(() => {
    if (activeTab === 'studies') {
      const now = Date.now();
      // Only trigger once every 30 minutes to avoid annoyance
      if (now - lastTriggeredRef.current < 30 * 60 * 1000) return;
      
      const today = new Date().setHours(0, 0, 0, 0);
      const todaySessions = studySessions.filter(s => s.startTime >= today && s.type === 'work').length;
      const pendingTopics = studyTopics.filter(t => !t.completed).length;

      let triggerMsg = "";
      if (todaySessions === 0 && pendingTopics > 0) {
        triggerMsg = "Raquel, você ainda não estudou hoje. Que tal começar com 25 minutos de foco agora?";
      } else if (pendingTopics > 8) {
        triggerMsg = `Você tem ${pendingTopics} tópicos pendentes. Recomendo dar uma organizada neles para não acumular!`;
      }

      if (triggerMsg) {
        setMessages(prev => [...prev, { role: 'bot', text: triggerMsg }]);
        setIsOpen(true);
        lastTriggeredRef.current = now;
      }
    }
  }, [activeTab]);

  // Update streak when a session is completed
  useEffect(() => {
    const today = new Date().toLocaleDateString();
    const lastSession = studySessions.filter(s => s.type === 'work').sort((a, b) => b.startTime - a.startTime)[0];
    
    if (lastSession) {
      const lastSessionDate = new Date(lastSession.startTime).toLocaleDateString();
      if (lastSessionDate === today) {
        const lastSavedDate = localStorage.getItem('raquel_last_study_date');
        if (lastSavedDate !== today) {
          const prevDate = new Date();
          prevDate.setDate(prevDate.getDate() - 1);
          const yesterday = prevDate.toLocaleDateString();
          
          let newStreak = 1;
          if (lastSavedDate === yesterday) {
            newStreak = parseInt(localStorage.getItem('raquel_study_streak') || '0') + 1;
          }
          
          localStorage.setItem('raquel_last_study_date', today);
          localStorage.setItem('raquel_study_streak', newStreak.toString());
        }
      }
    }
  }, [studySessions]);
  const [input, setInput] = useState('');
  const [aiEnabled, setAiEnabled] = useState(() => localStorage.getItem('raquel_ai_enabled') === 'true');
  const [apiKeys, setApiKeys] = useState(() => {
    const saved = localStorage.getItem('raquel_api_keys');
    return saved ? JSON.parse(saved) : { gemini: '', openai: '', claude: '', deepseek: '' };
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const saveKeys = () => {
    localStorage.setItem('raquel_api_keys', JSON.stringify(apiKeys));
    localStorage.setItem('raquel_ai_enabled', String(aiEnabled));
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');

    // Bot logic
    setTimeout(async () => {
      let response = "";

      if (aiEnabled && (apiKeys.gemini || apiKeys.openai || apiKeys.claude || apiKeys.deepseek)) {
        // Mock AI call - in a real app we would call the API here
        response = "Raquel, estou processando sua solicitação com IA... (Simulação de resposta)";
      } else {
        // Local logic (Expert Mode)
        const lowerMsg = userMsg.toLowerCase();
        
        if (lowerMsg.includes('conta') || lowerMsg.includes('vencer') || lowerMsg.includes('financeiro') || lowerMsg.includes('pagar')) {
          const dueText = billsDueCount > 0 
            ? `Raquel, você tem ${billsDueCount} ${billsDueCount === 1 ? 'conta' : 'contas'} vencendo hoje ou nos próximos dias. Quer que eu te leve para a aba Financeiro para conferir?`
            : "Raquel, não encontrei contas vencendo nos próximos dias. Tudo sob controle no seu financeiro! Você é muito organizada.";
          response = dueText;
        } else if (lowerMsg.includes('o que fiz hoje') || lowerMsg.includes('resumo de hoje')) {
          const today = new Date().setHours(0, 0, 0, 0);
          const todaySessions = studySessions.filter(s => s.startTime >= today && s.type === 'work').length;
          const completedToday = studyTopics.filter(t => t.completed && t.createdAt >= today).length;
          const notesToday = studyNotes.filter(n => n.createdAt >= today).length;
          
          response = `Raquel, hoje você:\n- Completou ${todaySessions} sessões de foco\n- Concluiu ${completedToday} tópicos\n- Criou ${notesToday} anotações\n\nBom trabalho!`;
        } else if (lowerMsg.includes('o que estudei hoje') || lowerMsg.includes('o que eu estudei')) {
          const today = new Date().setHours(0, 0, 0, 0);
          const todayNotes = studyNotes.filter(n => n.createdAt >= today);
          if (todayNotes.length > 0) {
            response = `Raquel, hoje você fez anotações sobre: ${todayNotes.map(n => n.title).join(', ')}.`;
          } else {
            response = "Raquel, você ainda não fez nenhuma anotação de estudo hoje. Que tal registrar o que aprendeu?";
          }
        } else if (lowerMsg.includes('criar tópico') || lowerMsg.includes('novo tópico')) {
          const title = userMsg.replace(/criar tópico|novo tópico/gi, '').trim();
          if (title) {
            addStudyTopic(title, 'Medium');
            response = `Certo, Raquel! Criei o tópico "${title}" com prioridade média para você.`;
          } else {
            response = "Qual seria o título do novo tópico que você quer criar?";
          }
        } else if (lowerMsg.includes('iniciar foco') || lowerMsg.includes('começar pomodoro') || lowerMsg.includes('foco agora')) {
          startPomodoro();
          response = "Iniciei o timer de 25 minutos para você, Raquel. Bom foco! Te levei para a aba de estudos.";
        } else if (lowerMsg.includes('não sei por onde começar') || lowerMsg.includes('me ajuda a começar')) {
          const pendingTopics = studyTopics.filter(t => !t.completed);
          if (pendingTopics.length > 0) {
            const highPriority = pendingTopics.filter(t => t.priority === 'High');
            const target = highPriority.length > 0 ? highPriority[0] : pendingTopics[0];
            response = `Raquel, que tal começar pelo tópico "${target.title}"? Ele parece ser um bom ponto de partida. Quer que eu inicie um timer de 25 minutos para você focar nele?`;
          } else {
            response = "Raquel, você está com tudo em dia! Que tal criar um novo tópico de algo que você queira aprender hoje?";
          }
        } else if (lowerMsg.includes('estudar') || lowerMsg.includes('estudo') || lowerMsg.includes('tópico') || lowerMsg.includes('aprender')) {
          const pendingTopics = studyTopics.filter(t => !t.completed);
          if (pendingTopics.length > 0) {
            const highPriority = pendingTopics.filter(t => t.priority === 'High');
            if (highPriority.length > 0) {
              response = `Raquel, você tem ${pendingTopics.length} tópicos pendentes. Recomendo começar pelo de prioridade alta: "${highPriority[0].title}". Quer que eu te leve para a aba de Estudos?`;
            } else {
              response = `Raquel, você tem ${pendingTopics.length} tópicos pendentes. O mais antigo é "${pendingTopics[0].title}". Que tal dar uma olhada neles agora?`;
            }
          } else {
            response = "Raquel, você está em dia com seus tópicos de estudo! 🎉 Você está voando! Quer planejar os próximos passos ou revisar alguma nota?";
          }
        } else if (lowerMsg.includes('sessão') || lowerMsg.includes('pomodoro') || lowerMsg.includes('foco')) {
          const today = new Date().setHours(0, 0, 0, 0);
          const todaySessions = studySessions.filter(s => s.startTime >= today && s.type === 'work').length;
          
          if (todaySessions > 0) {
            response = `Raquel, você já completou ${todaySessions} sessões de foco hoje. Excelente ritmo! Quer encarar mais 25 minutos agora?`;
          } else {
            response = "Raquel, você ainda não iniciou nenhuma sessão de foco hoje. Que tal começar com apenas 25 minutos? Eu te acompanho e prometo que vai valer a pena!";
          }
        } else if (lowerMsg.includes('hábito') || lowerMsg.includes('rotina') || lowerMsg.includes('consistência')) {
          const completedToday = habits.filter(h => h.completedToday).length;
          const totalHabits = habits.length;
          
          if (totalHabits === 0) {
            response = "Raquel, você ainda não cadastrou nenhum hábito. Que tal definir algumas metas diárias no seu Diário? Pequenos passos levam a grandes resultados.";
          } else if (completedToday === totalHabits) {
            response = `Raquel, você completou todos os seus ${totalHabits} hábitos de hoje! Você está imparável! 🔥 Orgulho de você!`;
          } else {
            response = `Raquel, você completou ${completedToday} de ${totalHabits} hábitos hoje. Ainda faltam alguns para fechar o dia com chave de ouro! Vamos lá?`;
          }
        } else if (lowerMsg.includes('resumo') || lowerMsg.includes('como estou') || lowerMsg.includes('meu dia')) {
          const pendingTopics = studyTopics.filter(t => !t.completed).length;
          const today = new Date().setHours(0, 0, 0, 0);
          const todaySessions = studySessions.filter(s => s.startTime >= today && s.type === 'work').length;
          
          response = `Raquel, aqui está seu resumo atualizado:\n\n` +
                     `- 💸 Financeiro: ${billsDueCount > 0 ? `${billsDueCount} contas pendentes.` : 'Tudo pago! Organização nota 10.'}\n` +
                     `- 📚 Estudos: ${pendingTopics} tópicos pendentes e ${todaySessions} sessões de foco hoje.\n` +
                     `- 🚀 Projetos: ${projectsCount} ativos.\n\n` +
                     `Raquel, você está no caminho certo. Como posso te ajudar a avançar ainda mais agora?`;
        } else if (lowerMsg.includes('ideia') || lowerMsg.includes('insight') || lowerMsg.includes('banco')) {
          const ideaCount = ideas.filter(n => n.category === 'Ideia').length;
          if (ideaCount > 0) {
            const lastIdeas = ideas.filter(n => n.category === 'Ideia').slice(0, 2).map(i => `"${i.content.substring(0, 30)}..."`).join(', ');
            response = `Raquel, seu Banco de Ideias tem ${ideaCount} insights. Os últimos foram: ${lastIdeas}. Quer anotar algo novo?`;
          } else {
            response = "Raquel, seu Banco de Ideias está vazio. Que tal salvar seu primeiro insight no Dashboard? Posso te ajudar a organizar seus pensamentos.";
          }
        } else if (lowerMsg.includes('projeto') || lowerMsg.includes('adicionar') || lowerMsg.includes('tarefa')) {
          response = `Raquel, você tem ${projectsCount} projetos ativos. Para adicionar um novo, vá em 'Projetos em andamento' e use o botão '+ Novo Projeto'. Quer que eu te leve lá?`;
        } else if (lowerMsg.includes('diário') || lowerMsg.includes('escrever') || lowerMsg.includes('humor') || lowerMsg.includes('hábito')) {
          setActiveTab('diary');
          response = "Certo, Raquel! Te levei para o seu Diário Pessoal. Lá você pode registrar seu humor e hábitos.";
        } else if (lowerMsg.includes('dashboard') || lowerMsg.includes('início')) {
          setActiveTab('dashboard');
          response = "Voltando para o Dashboard, Raquel. Aqui você tem a visão geral do seu dia.";
        } else if (lowerMsg.includes('ajuda') || lowerMsg.includes('como funciona') || lowerMsg.includes('tutorial')) {
          response = "Raquel, eu sou seu assistente! Posso te ajudar com finanças, estudos, projetos e seu diário. Se precisar de algo mais inteligente, pode conectar uma API de IA nas configurações.";
        } else if (lowerMsg.includes('oi') || lowerMsg.includes('olá') || lowerMsg.includes('bom dia') || lowerMsg.includes('boa tarde')) {
          response = "Oi, Raquel! Como posso tornar seu dia mais produtivo hoje? Posso checar seus estudos, contas ou projetos.";
        } else {
          const randomResponses = [
            "Raquel, entendi! Posso te dar informações sobre seus estudos, contas ou resumir suas ideias. O que prefere?",
            "Interessante, Raquel! Quer que eu verifique seus lembretes ou te ajude a organizar um novo projeto?",
            "Raquel, estou aqui para ajudar. Você pode me perguntar sobre seu progresso nos hábitos ou sobre suas finanças.",
            "Como posso ser útil, Raquel? Posso te levar para qualquer aba do sistema ou responder dúvidas sobre as ferramentas."
          ];
          response = randomResponses[Math.floor(Math.random() * randomResponses.length)];
        }
      }

      setMessages(prev => [...prev, { role: 'bot', text: response }]);
    }, 600);
  };

  const helpGuides: Record<string, string> = {
    gemini: "Gemini: 1. Acesse o [Google AI Studio] | 2. Clique em 'Get API Key' | 3. Cole aqui.",
    openai: "OpenAI/Copilot: 1. Vá ao [OpenAI Dashboard] | 2. Crie uma 'Secret Key' | 3. Verifique se tem créditos.",
    claude: "Claude: 1. Acesse o [Anthropic Console] | 2. Gere sua key em 'API Keys'.",
    deepseek: "DeepSeek: 1. Vá ao [DeepSeek Platform] | 2. Crie sua key no painel de controle (é a mais barata!)."
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="w-[calc(100vw-2rem)] sm:w-96 glass-card rounded-3xl overflow-hidden mb-4 flex flex-col shadow-2xl border-white/10"
            style={{ height: '500px' }}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-roxo-suave/20 to-indigo-600/20 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-roxo-suave rounded-2xl flex items-center justify-center text-white shadow-lg shadow-roxo-suave/20">
                  <Bot size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-display font-bold text-white">Assistente da Raquel</h4>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => { setShowHelp(!showHelp); setShowSettings(false); setHelpTopic(null); }}
                  className={`p-2 rounded-xl transition-all ${showHelp ? 'bg-blue-500 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                  title="Como conectar minhas IAs?"
                >
                  <HelpCircle size={18} />
                </button>
                <button 
                  onClick={() => { setShowSettings(!showSettings); setShowHelp(false); }}
                  className={`p-2 rounded-xl transition-all ${showSettings ? 'bg-roxo-suave text-white' : 'text-slate-400 hover:bg-white/5'}`}
                >
                  <Settings size={18} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:bg-white/5 rounded-xl transition-all"
                >
                  <Minimize2 size={18} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
              {/* Help Guide View */}
              {showHelp && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute inset-0 bg-bg-card/98 backdrop-blur-xl p-6 overflow-y-auto space-y-6 z-20"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Como conectar minhas IAs?</h5>
                    <button onClick={() => setShowHelp(false)} className="text-[10px] font-bold text-roxo-suave hover:underline">Fechar</button>
                  </div>

                  {!helpTopic ? (
                    <div className="grid grid-cols-1 gap-3">
                      {['Gemini', 'OpenAI', 'Claude', 'DeepSeek'].map(ia => (
                        <button 
                          key={ia}
                          onClick={() => setHelpTopic(ia.toLowerCase())}
                          className="p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 transition-all flex justify-between items-center group"
                        >
                          <span className="text-sm font-bold text-white">{ia}</span>
                          <ChevronRight size={16} className="text-slate-600 group-hover:text-roxo-suave transition-all" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <button onClick={() => setHelpTopic(null)} className="text-[10px] font-bold text-slate-500 flex items-center gap-1 hover:text-white transition-all">
                        <ChevronRight size={12} className="rotate-180" /> Voltar ao menu
                      </button>
                      <div className="p-4 bg-roxo-suave/10 border border-roxo-suave/20 rounded-2xl">
                        <p className="text-sm text-slate-200 leading-relaxed">
                          {helpGuides[helpTopic]}
                        </p>
                      </div>
                      <button 
                        onClick={() => { setShowHelp(false); setShowSettings(true); }}
                        className="w-full py-3 bg-roxo-suave text-white rounded-xl text-xs font-bold"
                      >
                        Ir para Configurações
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Settings View */}
              {showSettings ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute inset-0 bg-bg-card/95 backdrop-blur-xl p-6 overflow-y-auto space-y-6 z-10"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configurações de IA</h5>
                    <button 
                      onClick={() => setShowSettings(false)}
                      className="text-[10px] font-bold text-roxo-suave hover:underline"
                    >
                      Voltar
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div>
                      <p className="text-sm font-bold text-white">Ativar Inteligência Artificial</p>
                      <p className="text-[10px] text-slate-500">Usa APIs externas para respostas</p>
                    </div>
                    <button 
                      onClick={() => setAiEnabled(!aiEnabled)}
                      className={`w-12 h-6 rounded-full transition-all relative ${aiEnabled ? 'bg-roxo-suave' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${aiEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {[
                      { id: 'gemini', label: 'Gemini API' },
                      { id: 'openai', label: 'OpenAI/Copilot API' },
                      { id: 'claude', label: 'Claude API' },
                      { id: 'deepseek', label: 'DeepSeek API' }
                    ].map(api => (
                      <div key={api.id} className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{api.label}</label>
                          {apiKeys[api.id as keyof typeof apiKeys] && (
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="text-[8px] text-emerald-500 font-bold uppercase">Configurada</span>
                            </div>
                          )}
                        </div>
                        <input 
                          type="password" 
                          value={apiKeys[api.id as keyof typeof apiKeys]}
                          onChange={(e) => setApiKeys({...apiKeys, [api.id]: e.target.value})}
                          placeholder="••••••••••••••••"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-roxo-suave"
                        />
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={saveKeys}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Salvar Chaves
                  </button>

                  <p className="text-[10px] text-slate-600 text-center italic">
                    Suas chaves são salvas apenas localmente no navegador.
                  </p>
                </motion.div>
              ) : (
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
                >
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`
                        max-w-[80%] p-3 rounded-2xl text-sm
                        ${msg.role === 'user' 
                          ? 'bg-roxo-suave text-white rounded-tr-none shadow-lg shadow-roxo-suave/10' 
                          : 'bg-white/5 text-slate-300 border border-white/10 rounded-tl-none'}
                      `}>
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Input Area */}
              {!showSettings && !showHelp && (
                <div className="p-4 border-t border-white/10 bg-white/5">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2"
                  >
                    <input 
                      type="text" 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Pergunte algo..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-sm text-white focus:outline-none focus:border-roxo-suave transition-all"
                    />
                    <button 
                      type="submit"
                      className="p-2 bg-roxo-suave text-white rounded-xl hover:bg-roxo-suave/80 transition-all active:scale-90 shadow-lg shadow-roxo-suave/20"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-br from-roxo-suave to-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-roxo-suave/40 border border-white/20 relative group"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <ChevronDown size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <Bot size={24} />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute right-full mr-4 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap">
            Raquel AI Helper
          </div>
        )}
      </motion.button>
    </div>
  );
};

const LoginView = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        onLogin();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Erro ao fazer login. Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-card p-6 md:p-8 rounded-3xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-roxo-suave/20 rounded-2xl flex items-center justify-center text-roxo-suave mb-4">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-display font-bold text-white">Bem-vindo de volta</h1>
          <p className="text-slate-500 text-sm">Entre para gerenciar seus projetos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-white/5 border border-border-dark rounded-2xl px-12 py-3 text-white focus:outline-none focus:border-roxo-suave transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-border-dark rounded-2xl px-12 py-3 text-white focus:outline-none focus:border-roxo-suave transition-all"
                required
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-[10px] text-center font-bold leading-tight">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-4 bg-roxo-suave hover:bg-roxo-suave/80 text-white rounded-2xl font-bold shadow-lg shadow-roxo-suave/20 transition-all active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border-dark text-center">
          <p className="text-xs text-slate-600">
            Esqueceu sua senha? <span className="text-roxo-suave cursor-pointer hover:underline">Recuperar acesso</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const ProjectModal = ({ project, isOpen, onClose }: { project: Project | null, isOpen: boolean, onClose: () => void }) => {
  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="glass-card w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[40px] p-8 md:p-12 relative shadow-2xl border border-white/10 z-10 custom-scrollbar"
      >
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl transition-all z-20"
        >
          <X size={24} />
        </button>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-2xl ${project.status === 'ongoing' ? 'bg-roxo-suave/20 text-roxo-suave' : 'bg-emerald-500/20 text-emerald-500'}`}>
              {project.status === 'ongoing' ? <Clock size={24} /> : <CheckCircle2 size={24} />}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{project.status === 'ongoing' ? 'Em Desenvolvimento' : 'Concluído'}</p>
              <h2 className="text-4xl md:text-5xl font-display font-black text-white tracking-tight">{project.title}</h2>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-6">
            {project.startDate && (
              <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                <Calendar size={14} className="text-roxo-suave" />
                <span className="text-xs font-bold text-slate-300">Início: {new Date(project.startDate).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
            {project.deadline && (
              <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-2xl flex items-center gap-2">
                <Calendar size={14} className="text-amber-500" />
                <span className="text-xs font-bold text-amber-500">Prazo: {new Date(project.deadline).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
            {project.devLocation && (
              <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-2xl flex items-center gap-2">
                <Monitor size={14} className="text-blue-400" />
                <span className="text-xs font-bold text-blue-400">Plataforma: {project.devLocation}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-10">
            <section>
              <h4 className="text-lg font-display font-bold text-white mb-4 border-b border-white/5 pb-2">Sobre o Projeto</h4>
              <p className="text-slate-400 leading-relaxed text-sm whitespace-pre-wrap">
                {project.description || 'Sem descrição detalhada.'}
              </p>
            </section>

            {project.techStack && project.techStack.length > 0 && (
              <section>
                <h4 className="text-lg font-display font-bold text-white mb-4 border-b border-white/5 pb-2">Tech Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((tech, i) => (
                    <span key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:bg-roxo-suave/10 hover:border-roxo-suave/30 transition-all">
                      {tech}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <section className="glass-card p-6 rounded-[32px] border border-white/5 bg-white/[0.02]">
              <h4 className="text-sm font-display font-bold text-white mb-6 uppercase tracking-wider">Conexões & Links</h4>
              
              <div className="space-y-4">
                {project.projectUrl && (
                  <button 
                    onClick={() => window.open(project.projectUrl, '_blank')}
                    className="w-full flex items-center justify-between p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-2xl group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <ExternalLink size={18} className="text-emerald-500" />
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase">Deploy / Live</p>
                        <p className="text-xs font-bold text-white truncate w-40">Ver online</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-emerald-500 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}

                {project.githubUrl && (
                  <button 
                    onClick={() => window.open(project.githubUrl, '_blank')}
                    className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 rounded-2xl group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Github size={18} className="text-slate-400" />
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Repositório</p>
                        <p className="text-xs font-bold text-white truncate w-40">GitHub Source</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}

                {(project.githubEmail || project.supabaseEmail) && (
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Credenciais de Acesso</p>
                    <div className="space-y-2">
                      {project.githubEmail && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">GitHub:</span>
                          <span className="text-white font-medium">{project.githubEmail}</span>
                        </div>
                      )}
                      {project.supabaseEmail && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Supabase:</span>
                          <span className="text-white font-medium">{project.supabaseEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <div className="p-6 bg-roxo-suave/5 rounded-[32px] border border-roxo-suave/10">
              <h5 className="text-xs font-bold text-white mb-2 italic">Dica de Produtividade</h5>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Mantenha seu Tech Stack atualizado para facilitar o onboarding de novos colaboradores e a manutenção futura.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [isEditingTokens, setIsEditingTokens] = useState(false);
  const [selectedProjectForView, setSelectedProjectForView] = useState<Project | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('raquel_projects_dark');
    return saved ? JSON.parse(saved) : [];
  });
  const [tokens, setTokens] = useState<TokenState>({
    total: 0,
    flash: 0,
    pro: 0,
    claude: 0,
    general: 0
  });
  const [notes, setNotes] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('raquel_transactions_dark');
    return saved ? JSON.parse(saved) : [];
  });
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [editingTransactionAmount, setEditingTransactionAmount] = useState<string>('');
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('raquel_events_dark');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date(2026, 3, 1)); // Default to April 2026
  const [snippets, setSnippets] = useState<CodeSnippet[]>(() => {
    const saved = localStorage.getItem('raquel_snippets_dark');
    return saved ? JSON.parse(saved) : [];
  });
  const [logs, setLogs] = useState<LearningLog[]>(() => {
    const saved = localStorage.getItem('raquel_logs_dark');
    return saved ? JSON.parse(saved) : [];
  });
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [kanbanTasks, setKanbanTasks] = useState<KanbanTask[]>(() => {
    const saved = localStorage.getItem('raquel_kanban_dark');
    return saved ? JSON.parse(saved) : [];
  });
  const [scratchNotes, setScratchNotes] = useState<ScratchNote[]>([]);
  const [personalNotes, setPersonalNotes] = useState<PersonalNote[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('O que você aprendeu sobre si mesmo hoje?');
  const [currentDiaryContent, setCurrentDiaryContent] = useState('');
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([]);
  const [savedFeedback, setSavedFeedback] = useState<Record<string, boolean>>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [userEmail, setUserEmail] = useState('raquelelizabcd@gmail.com');
  const [userPassword, setUserPassword] = useState('********');
  
  // Study State
  const [studyNotebooks, setStudyNotebooks] = useState<StudyNotebook[]>(() => {
    const saved = localStorage.getItem('raquel_study_notebooks');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Programação', icon: '💻', color: '#6366f1', createdAt: Date.now() },
      { id: '2', title: 'Finanças', icon: '💰', color: '#10b981', createdAt: Date.now() },
      { id: '3', title: 'Pessoal', icon: '🏠', color: '#f59e0b', createdAt: Date.now() },
    ];
  });
  const [studySessions, setStudySessions] = useState<StudySession[]>(() => {
    const saved = localStorage.getItem('raquel_study_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeStudyTab, setActiveStudyTab] = useState<StudyTabType>('general');
  const [studySearchQuery, setStudySearchQuery] = useState('');
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  const [isStudyNoteFocusMode, setIsStudyNoteFocusMode] = useState(false);
  const [activeStudyNoteId, setActiveStudyNoteId] = useState<string | null>(null);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');

  const [studyNotes, setStudyNotes] = useState<StudyNote[]>(() => {
    const saved = localStorage.getItem('raquel_study_notes');
    return saved ? JSON.parse(saved) : [];
  });
  const [studyTopics, setStudyTopics] = useState<StudyTopic[]>(() => {
    const saved = localStorage.getItem('raquel_study_topics');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Aprender Supabase', completed: false, priority: 'High', createdAt: Date.now() },
      { id: '2', title: 'Organização pessoal', completed: false, priority: 'Medium', createdAt: Date.now() },
      { id: '3', title: 'Estudos de programação', completed: false, priority: 'High', createdAt: Date.now() },
      { id: '4', title: 'Finanças pessoais', completed: false, priority: 'Low', createdAt: Date.now() },
    ];
  });
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>(() => {
    const saved = localStorage.getItem('raquel_study_plans');
    return saved ? JSON.parse(saved) : [];
  });

  // Study Form State
  const [activeStudyNoteTitle, setActiveStudyNoteTitle] = useState('');
  const [newStudyNote, setNewStudyNote] = useState('');
  const [editingStudyNoteId, setEditingStudyNoteId] = useState<string | null>(null);
  const [newStudyTopic, setNewStudyTopic] = useState('');
  const [newStudyTopicPriority, setNewStudyTopicPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newStudyPlanTitle, setNewStudyPlanTitle] = useState('');
  const [newStudyPlanDate, setNewStudyPlanDate] = useState('');
  const [newStudyPlanPriority, setNewStudyPlanPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newNotebookTitle, setNewNotebookTitle] = useState('');
  const [newNotebookIcon, setNewNotebookIcon] = useState('📚');
  const [newNotebookColor, setNewNotebookColor] = useState('#6366f1');
  
  // Settings State
  const [theme, setTheme] = useState<'original' | 'deep' | 'navy' | 'light-rose'>('original');
  const [accentColor, setAccentColor] = useState('#6a5acd');
  const [borderRadius, setBorderRadius] = useState(24); // in pixels
  
  const [newIdea, setNewIdea] = useState('');
  const [inspiration, setInspiration] = useState<string>('Carregando inspiração...');
  const [loadingInspiration, setLoadingInspiration] = useState(false);

  const generateInspiration = async () => {
    setLoadingInspiration(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Gere uma frase curta, motivacional e focada em produtividade ou bem-estar para um desenvolvedor. Máximo 2 linhas. Em português. Não use aspas na resposta.",
      });
      setInspiration(response.text || 'O sucesso é a soma de pequenos esforços repetidos dia após dia.');
    } catch (error) {
      console.error('Erro ao gerar inspiração:', error);
      setInspiration('O sucesso é a soma de pequenos esforços repetidos dia após dia.');
    } finally {
      setLoadingInspiration(false);
    }
  };

  useEffect(() => {
    generateInspiration();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply Theme
    root.setAttribute('data-theme', theme);
    if (theme === 'original') {
      root.style.setProperty('--bg-color', '#1e1e1e');
      root.style.setProperty('--card-color', '#2c2c2c');
      root.style.setProperty('--border-color', '#3e3e3e');
    } else if (theme === 'deep') {
      root.style.setProperty('--bg-color', '#000000');
      root.style.setProperty('--card-color', '#111111');
      root.style.setProperty('--border-color', '#222222');
    } else if (theme === 'navy') {
      root.style.setProperty('--bg-color', '#0a192f');
      root.style.setProperty('--card-color', '#112240');
      root.style.setProperty('--border-color', '#233554');
    } else if (theme === 'light-rose') {
      root.style.setProperty('--bg-color', '#fff5f7');
      root.style.setProperty('--card-color', '#ffffff');
      root.style.setProperty('--border-color', '#ffe4e9');
    }
    
    // Apply Accent
    root.style.setProperty('--primary-color', accentColor);
    
    // Apply Border Radius
    root.style.setProperty('--card-radius', `${borderRadius}px`);
  }, [theme, accentColor, borderRadius]);
  const [debugNotes, setDebugNotes] = useState<string>('');
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isPomodoroActive, setIsPomodoroActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToastWithMsg = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const addStudyTopic = (title: string, priority: 'High' | 'Medium' | 'Low') => {
    const newTopic: StudyTopic = {
      id: Date.now().toString(),
      title,
      completed: false,
      priority,
      createdAt: Date.now()
    };
    setStudyTopics(prev => [newTopic, ...prev]);
    showToastWithMsg(`Tópico "${title}" criado com sucesso!`);
  };

  const addStudyNote = (title: string, content: string, notebookId: string) => {
    const newNote: StudyNote = {
      id: Date.now().toString(),
      title,
      content,
      notebookId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setStudyNotes(prev => [newNote, ...prev]);
    showToastWithMsg(`Nota "${title}" salva!`);
  };

  const startPomodoro = () => {
    setPomodoroTime(25 * 60);
    setIsPomodoroActive(true);
    setActiveTab('studies');
    setActiveStudyTab('focus');
  };
  
  // New project form state
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectStartDate, setNewProjectStartDate] = useState('');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');
  const [newProjectTechStack, setNewProjectTechStack] = useState('');
  const [newProjectGithubEmail, setNewProjectGithubEmail] = useState('');
  const [newProjectGithubUrl, setNewProjectGithubUrl] = useState('');
  const [newProjectSupabaseEmail, setNewProjectSupabaseEmail] = useState('');
  const [newProjectSupabaseUrl, setNewProjectSupabaseUrl] = useState('');
  const [newProjectUrl, setNewProjectUrl] = useState('');
  const [newProjectDevLocation, setNewProjectDevLocation] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectSaved, setProjectSaved] = useState<Record<string, boolean>>({});
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('raquel_sound_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // New snippet form state
  const [showAddSnippet, setShowAddSnippet] = useState(false);
  const [newSnippetTitle, setNewSnippetTitle] = useState('');
  const [newSnippetLang, setNewSnippetLang] = useState('');
  const [newSnippetCode, setNewSnippetCode] = useState('');

  // New goal form state
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalPeriod, setNewGoalPeriod] = useState<'weekly' | 'monthly'>('weekly');

  // Load data from localStorage
  useEffect(() => {
    const savedProjects = localStorage.getItem('raquel_projects_dark');
    const savedTokens = localStorage.getItem('raquel_tokens_dark');
    const savedNotes = localStorage.getItem('raquel_notes_dark');
    const savedTransactions = localStorage.getItem('raquel_transactions_dark');
    const savedEvents = localStorage.getItem('raquel_events_dark');
    const savedSnippets = localStorage.getItem('raquel_snippets_dark');
    const savedLogs = localStorage.getItem('raquel_logs_dark');
    const savedMoods = localStorage.getItem('raquel_moods_dark');
    const savedGoals = localStorage.getItem('raquel_goals_dark');
    const savedKanban = localStorage.getItem('raquel_kanban_dark');
    const savedScratch = localStorage.getItem('raquel_scratch_dark');
    const savedPersonalNotes = localStorage.getItem('raquel_personal_notes');
    const savedDebugNotes = localStorage.getItem('raquel_debug_notes_dark');

    if (savedProjects) setProjects(JSON.parse(savedProjects));
    if (savedTokens) setTokens(JSON.parse(savedTokens));
    if (savedNotes) setNotes(savedNotes);
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    if (savedEvents) setEvents(JSON.parse(savedEvents));
    if (savedSnippets) setSnippets(JSON.parse(savedSnippets));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedMoods) setMoods(JSON.parse(savedMoods));
    if (savedGoals) setGoals(JSON.parse(savedGoals));
    if (savedKanban) setKanbanTasks(JSON.parse(savedKanban));
    if (savedScratch) setScratchNotes(JSON.parse(savedScratch));
    if (savedPersonalNotes) setPersonalNotes(JSON.parse(savedPersonalNotes));
    if (savedDebugNotes) setDebugNotes(savedDebugNotes);

    const savedHabits = localStorage.getItem('raquel_habits');
    const savedDiary = localStorage.getItem('raquel_diary_entries');
    if (savedHabits) {
      setHabits(JSON.parse(savedHabits));
    } else {
      setHabits([
        { id: '1', title: 'Meditação', streak: 5, completedToday: false },
        { id: '2', title: 'Leitura', streak: 12, completedToday: true },
        { id: '3', title: 'Exercício', streak: 3, completedToday: false },
        { id: '4', title: 'Hidratação', streak: 20, completedToday: true },
      ]);
    }
    if (savedDiary) setDiaryEntries(JSON.parse(savedDiary));

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        initSupabase();
        const isGoogle = session.user.identities?.some((id: any) => id.provider === 'google');
        setIsGoogleConnected(!!isGoogle);
      } else {
        setIsAuthenticated(false);
        setIsGoogleConnected(false);
      }
    });

    // Check current session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        initSupabase();
        const isGoogle = session.user.identities?.some((id: any) => id.provider === 'google');
        setIsGoogleConnected(!!isGoogle);
      }
    };

    const initSupabase = async () => {
      try {
        const [supaProjects, supaReminders] = await Promise.all([
          dataService.fetchProjects(),
          dataService.fetchReminders()
        ]);
        if (supaProjects.length > 0) setProjects(supaProjects);
        if (supaReminders.length > 0) setKanbanTasks(supaReminders);
      } catch (err) {
        console.error('Failed to load Supabase data:', err);
      }
    };
    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('raquel_projects_dark', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('raquel_tokens_dark', JSON.stringify(tokens));
  }, [tokens]);

  useEffect(() => {
    localStorage.setItem('raquel_transactions_dark', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('raquel_events_dark', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('raquel_snippets_dark', JSON.stringify(snippets));
  }, [snippets]);

  useEffect(() => {
    localStorage.setItem('raquel_logs_dark', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('raquel_kanban_dark', JSON.stringify(kanbanTasks));
  }, [kanbanTasks]);

  useEffect(() => {
    localStorage.setItem('raquel_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('raquel_diary_entries', JSON.stringify(diaryEntries));
  }, [diaryEntries]);

  useEffect(() => {
    localStorage.setItem('raquel_personal_notes', JSON.stringify(personalNotes));
  }, [personalNotes]);

  useEffect(() => {
    localStorage.setItem('raquel_debug_notes_dark', debugNotes);
  }, [debugNotes]);

  useEffect(() => {
    localStorage.setItem('raquel_moods_dark', JSON.stringify(moods));
  }, [moods]);

  useEffect(() => {
    localStorage.setItem('raquel_goals_dark', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('raquel_study_notebooks', JSON.stringify(studyNotebooks));
  }, [studyNotebooks]);

  useEffect(() => {
    localStorage.setItem('raquel_study_sessions', JSON.stringify(studySessions));
  }, [studySessions]);

  useEffect(() => {
    localStorage.setItem('raquel_study_notes', JSON.stringify(studyNotes));
  }, [studyNotes]);

  useEffect(() => {
    localStorage.setItem('raquel_study_topics', JSON.stringify(studyTopics));
  }, [studyTopics]);

  useEffect(() => {
    localStorage.setItem('raquel_study_plans', JSON.stringify(studyPlans));
  }, [studyPlans]);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('raquel_scratch_dark', JSON.stringify(scratchNotes));
  }, [scratchNotes]);

  useEffect(() => {
    localStorage.setItem('raquel_sound_enabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  const playClickSound = () => {
    if (!soundEnabled) return;
    const audio = new Audio('https://www.soundjay.com/buttons/button-16.mp3');
    audio.volume = 0.2;
    audio.play().catch(() => {});
  };

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('.cursor-pointer') || target.closest('a')) {
        playClickSound();
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [soundEnabled]);

  const saveNotes = () => {
    localStorage.setItem('raquel_notes_dark', notes);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const incrementToken = (key: keyof Omit<TokenState, 'total'>) => {
    setTokens(prev => {
      const newValue = prev[key] + 50;
      return {
        ...prev,
        [key]: newValue,
        total: prev.total + 50
      };
    });
  };

  const setTokenValue = (key: keyof Omit<TokenState, 'total'>, value: number) => {
    setTokens(prev => {
      const diff = value - prev[key];
      return {
        ...prev,
        [key]: value,
        total: prev.total + diff
      };
    });
  };

  const resetTokens = () => {
    setTokens({
      total: 0,
      flash: 0,
      pro: 0,
      claude: 0,
      general: 0
    });
  };

  const startEditingProject = (project: Project) => {
    setEditingProjectId(project.id);
    setNewProjectTitle(project.title);
    setNewProjectDesc(project.description);
    setNewProjectStartDate(project.startDate || '');
    setNewProjectDeadline(project.deadline || '');
    setNewProjectTechStack(project.techStack ? project.techStack.join(', ') : '');
    setNewProjectGithubEmail(project.githubEmail || '');
    setNewProjectGithubUrl(project.githubUrl || '');
    setNewProjectSupabaseEmail(project.supabaseEmail || '');
    setNewProjectSupabaseUrl(project.supabaseUrl || '');
    setNewProjectUrl(project.projectUrl || '');
    setNewProjectDevLocation(project.devLocation || '');
    setShowAddProject(true);
  };

  const addProject = () => {
    if (!newProjectTitle.trim()) return;
    
    if (editingProjectId) {
      // Update existing project
      const updatedProjects = projects.map(p => {
        if (p.id === editingProjectId) {
          return {
            ...p,
            title: newProjectTitle,
            description: newProjectDesc,
            startDate: newProjectStartDate || undefined,
            deadline: newProjectDeadline || undefined,
            techStack: newProjectTechStack ? newProjectTechStack.split(',').map(s => s.trim()) : undefined,
            githubEmail: newProjectGithubEmail,
            githubUrl: newProjectGithubUrl,
            supabaseEmail: newProjectSupabaseEmail,
            supabaseUrl: newProjectSupabaseUrl,
            projectUrl: newProjectUrl,
            devLocation: newProjectDevLocation
          };
        }
        return p;
      });
      setProjects(updatedProjects);
      const updated = updatedProjects.find(p => p.id === editingProjectId);
      if (updated) {
        dataService.saveProject(updated).then(() => {
          showToastWithMsg('Projeto atualizado com sucesso');
        }).catch(err => {
          console.error('Save error:', err);
          showToastWithMsg(`Erro ao salvar: ${err.message || 'Erro no banco'}`);
          setDebugNotes(prev => `${new Date().toLocaleTimeString()}: Erro ao atualizar projeto - ${JSON.stringify(err)}\n${prev}`);
        });
      }
      setEditingProjectId(null);
    } else {
      // Create new project
      const newProject: Project = {
        id: Date.now().toString(),
        title: newProjectTitle,
        description: newProjectDesc,
        status: 'ongoing',
        startDate: newProjectStartDate || undefined,
        deadline: newProjectDeadline || undefined,
        techStack: newProjectTechStack ? newProjectTechStack.split(',').map(s => s.trim()) : undefined,
        createdAt: Date.now(),
        githubEmail: newProjectGithubEmail,
        githubUrl: newProjectGithubUrl,
        supabaseEmail: newProjectSupabaseEmail,
        supabaseUrl: newProjectSupabaseUrl,
        projectUrl: newProjectUrl,
        devLocation: newProjectDevLocation
      };
      
      setProjects([newProject, ...projects]);
      dataService.saveProject(newProject).catch(err => {
        console.error('Create error:', err);
        showToastWithMsg(`Erro ao salvar: ${err.message || 'Erro no banco'}`);
        setDebugNotes(prev => `${new Date().toLocaleTimeString()}: Erro ao criar projeto - ${JSON.stringify(err)}\n${prev}`);
      });
    }
    
    // Reset form fields
    setNewProjectTitle('');
    setNewProjectDesc('');
    setNewProjectStartDate('');
    setNewProjectDeadline('');
    setNewProjectTechStack('');
    setNewProjectGithubEmail('');
    setNewProjectGithubUrl('');
    setNewProjectSupabaseEmail('');
    setNewProjectSupabaseUrl('');
    setNewProjectUrl('');
    setNewProjectDevLocation('');
    setShowAddProject(false);
  };

  const updateProjectField = (id: string, field: keyof Project, value: any) => {
    const updatedProjects: Project[] = projects.map(p => p.id === id ? { ...p, [field]: value } as Project : p);
    setProjects(updatedProjects);
    const updatedProject = updatedProjects.find(p => p.id === id);
    if (updatedProject) {
      dataService.saveProject(updatedProject).catch(err => showToastWithMsg('Erro ao atualizar no banco de dados'));
    }
  };

  const handleSaveProject = (id: string) => {
    // Save to localStorage is handled by useEffect on projects change
    setProjectSaved(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setProjectSaved(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const toggleProjectStatus = (id: string) => {
    const updatedProjects: Project[] = projects.map(p => 
      p.id === id ? { ...p, status: p.status === 'ongoing' ? 'completed' : 'ongoing' } as Project : p
    );
    setProjects(updatedProjects);
    const updatedProject = updatedProjects.find(p => p.id === id);
    if (updatedProject) {
      dataService.saveProject(updatedProject).catch(err => showToastWithMsg('Erro ao mudar status no banco de dados'));
    }
  };

  const deleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
    dataService.deleteProject(id).catch(err => showToastWithMsg('Erro ao excluir do banco de dados'));
  };

  const addTransaction = (
    type: 'income' | 'expense', 
    title: string, 
    amount: number, 
    category: string, 
    dueDate: string | undefined,
    paymentMethod: 'Cartão' | 'PIX' | 'Boleto' | 'Dinheiro' | undefined,
    status: 'Pendente' | 'Pago' | 'A Vencer',
    recurrence: 'Único' | 'Semanal' | 'Mensal'
  ) => {
    if (!title || !amount) return;
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type,
      title,
      amount,
      category,
      dueDate,
      paymentMethod,
      status,
      recurrence,
      createdAt: Date.now()
    };
    setTransactions([newTransaction, ...transactions]);
  };

  const exportToAccountant = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Data,Título,Tipo,Valor,Categoria,Pagamento,Status,Recorrência\n"
      + transactions.map(t => {
          return `${new Date(t.createdAt).toLocaleDateString()},${t.title},${t.type === 'income' ? 'Entrada' : 'Saída'},${t.amount},${t.category},${t.paymentMethod || ''},${t.status},${t.recurrence || ''}`;
        }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_financeiro_${new Date().getMonth() + 1}_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const updateTransactionAmount = (id: string, newAmount: number) => {
    setTransactions(transactions.map(t => t.id === id ? { ...t, amount: newAmount } : t));
    setEditingTransactionId(null);
    setEditingTransactionAmount('');
  };

  const addEvent = (title: string, date: string, type: CalendarEvent['type'], description?: string, projectId?: string) => {
    const newEvent: CalendarEvent = { id: Date.now().toString(), title, date, type, description, projectId };
    setEvents([...events, newEvent]);
    showToastWithMsg('Evento agendado com sucesso!');
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const nextMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1));
  };

  const addSnippet = () => {
    if (!newSnippetTitle || !newSnippetLang || !newSnippetCode) return;
    const newSnippet: CodeSnippet = { 
      id: Date.now().toString(), 
      title: newSnippetTitle, 
      language: newSnippetLang, 
      code: newSnippetCode 
    };
    setSnippets([newSnippet, ...snippets]);
    setNewSnippetTitle('');
    setNewSnippetLang('');
    setNewSnippetCode('');
    setShowAddSnippet(false);
  };

  const deleteSnippet = (id: string) => {
    setSnippets(snippets.filter(s => s.id !== id));
  };

  const addLog = (topic: string, notes: string) => {
    const newLog: LearningLog = { id: Date.now().toString(), topic, notes, date: Date.now() };
    setLogs([newLog, ...logs]);
  };

  const deleteLog = (id: string) => {
    setLogs(logs.filter(l => l.id !== id));
  };

  const addScratchNote = () => {
    const newNote: ScratchNote = {
      id: Date.now().toString(),
      content: '',
      category: 'Geral',
      date: Date.now()
    };
    setScratchNotes([newNote, ...scratchNotes]);
  };

  const updateScratchNote = (id: string, content: string, category?: ScratchNote['category']) => {
    setScratchNotes(prev => prev.map(note => 
      note.id === id 
        ? { ...note, content, category: category || note.category } 
        : note
    ));
  };

  const deleteScratchNote = (id: string) => {
    setScratchNotes(prev => prev.filter(note => note.id !== id));
  };

  const handleSaveScratchNote = (id: string) => {
    setSavedFeedback(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setSavedFeedback(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const addMood = (mood: MoodEntry['mood'], feelings?: string[]) => {
    const date = new Date().toISOString().split('T')[0];
    const newMood: MoodEntry = { 
      id: Date.now().toString(), 
      date, 
      mood,
      feelings: feelings || selectedFeelings
    };
    setMoods(prev => [newMood, ...prev.filter(m => m.date !== date)]);
  };

  const toggleHabit = (id: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const completed = !h.completedToday;
        return { 
          ...h, 
          completedToday: completed,
          streak: completed ? h.streak + 1 : Math.max(0, h.streak - 1)
        };
      }
      return h;
    }));
  };

  const saveDiaryEntry = () => {
    if (!currentDiaryContent.trim()) return;
    const date = new Date().toISOString().split('T')[0];
    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      date,
      content: currentDiaryContent,
      aiQuestion: aiQuestion
    };
    setDiaryEntries(prev => [newEntry, ...prev.filter(e => e.date !== date)]);
    setCurrentDiaryContent('');
    setSavedFeedback(prev => ({ ...prev, diary: true }));
    setTimeout(() => setSavedFeedback(prev => ({ ...prev, diary: false })), 2000);
  };

  const suggestAIQuestion = () => {
    const questions = [
      'O que você aprendeu sobre si mesmo hoje?',
      'Qual foi o pequeno momento de alegria do seu dia?',
      'Pelo que você é mais grato hoje?',
      'Como você lidou com um desafio hoje?',
      'O que você faria de diferente se pudesse repetir o dia de hoje?',
      'Qual foi a melhor conversa que você teve hoje?',
      'O que te fez sorrir hoje?',
      'Qual hábito você está mais orgulhoso de manter?',
      'Como você se sentiu produtivo hoje?',
      'O que você quer priorizar amanhã para o seu bem-estar?'
    ];
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    setAiQuestion(randomQuestion);
  };

  const addPersonalNote = () => {
    const newNote: PersonalNote = {
      id: Date.now().toString(),
      title: '',
      content: '',
      category: 'Geral',
      isLocked: false,
      isArchived: false,
      createdAt: Date.now()
    };
    setPersonalNotes([newNote, ...personalNotes]);
  };

  const updatePersonalNote = (id: string, updates: Partial<PersonalNote>) => {
    setPersonalNotes(prev => prev.map(note => 
      note.id === id ? { ...note, ...updates } : note
    ));
  };

  const deletePersonalNote = (id: string) => {
    setPersonalNotes(prev => prev.filter(note => note.id !== id));
  };

  const archivePersonalNote = (id: string) => {
    setPersonalNotes(prev => prev.map(note => 
      note.id === id ? { ...note, isArchived: !note.isArchived } : note
    ));
  };

  const addGoal = () => {
    if (!newGoalTitle.trim()) return;
    const newGoal: Goal = { id: Date.now().toString(), title: newGoalTitle, period: newGoalPeriod, completed: false };
    setGoals([...goals, newGoal]);
    setNewGoalTitle('');
    setShowAddGoal(false);
  };

  const toggleGoal = (id: string) => {
    setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const addKanbanTask = (title: string) => {
    const newTask: KanbanTask = { id: Date.now().toString(), title, status: 'todo' };
    setKanbanTasks([...kanbanTasks, newTask]);
    dataService.saveReminder(newTask).catch(err => {
      showToastWithMsg('Erro ao salvar lembrete');
      setDebugNotes(prev => `${new Date().toLocaleTimeString()}: Erro ao salvar lembrete - ${err.message}\n${prev}`);
    });
  };

  const handleConnectGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar.events',
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      showToastWithMsg(`Erro ao conectar: ${err.message}`);
    }
  };

  const moveKanbanTask = (id: string, status: KanbanTask['status']) => {
    const updatedTasks: KanbanTask[] = kanbanTasks.map(t => t.id === id ? { ...t, status } as KanbanTask : t);
    setKanbanTasks(updatedTasks);
    const updatedTask = updatedTasks.find(t => t.id === id);
    if (updatedTask) {
      dataService.saveReminder(updatedTask).catch(err => showToastWithMsg('Erro ao mover lembrete no banco de dados'));
    }
  };

  const deleteKanbanTask = (id: string) => {
    setKanbanTasks(kanbanTasks.filter(t => t.id !== id));
    dataService.deleteReminder(id).catch(err => showToastWithMsg('Erro ao excluir lembrete do banco de dados'));
  };

  // Study Handlers
  const handleSaveStudyNote = () => {
    if (!newStudyNote.trim() || !selectedNotebookId) {
      if (!selectedNotebookId) showToastWithMsg('Selecione um caderno primeiro!');
      return;
    }
    
    if (editingStudyNoteId) {
      setStudyNotes(prev => prev.map(n => n.id === editingStudyNoteId ? { 
        ...n, 
        title: activeStudyNoteTitle || 'Sem título',
        content: newStudyNote,
        updatedAt: Date.now()
      } : n));
      setEditingStudyNoteId(null);
      setActiveStudyNoteId(null);
    } else {
      const note: StudyNote = {
        id: Date.now().toString(),
        title: activeStudyNoteTitle || 'Sem título',
        content: newStudyNote,
        notebookId: selectedNotebookId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setStudyNotes(prev => [note, ...prev]);
    }
    setNewStudyNote('');
    setActiveStudyNoteTitle('');
    setIsStudyNoteFocusMode(false);
    showToastWithMsg('Anotação salva com sucesso!');
  };

  const handleDeleteStudyNote = (id: string) => {
    setStudyNotes(prev => prev.filter(n => n.id !== id));
    if (activeStudyNoteId === id) {
      setActiveStudyNoteId(null);
      setEditingStudyNoteId(null);
      setNewStudyNote('');
      setActiveStudyNoteTitle('');
    }
  };

  const handleEditStudyNote = (note: StudyNote) => {
    setNewStudyNote(note.content);
    setActiveStudyNoteTitle(note.title);
    setEditingStudyNoteId(note.id);
    setActiveStudyNoteId(note.id);
    setSelectedNotebookId(note.notebookId);
    setActiveStudyTab('notes');
  };

  const handleAddStudyTopic = () => {
    if (!newStudyTopic.trim()) return;
    const topic: StudyTopic = {
      id: Date.now().toString(),
      title: newStudyTopic,
      completed: false,
      priority: newStudyTopicPriority,
      notebookId: selectedNotebookId || undefined,
      createdAt: Date.now(),
    };
    setStudyTopics(prev => [...prev, topic]);
    setNewStudyTopic('');
    showToastWithMsg('Tópico adicionado!');
  };

  const handleToggleStudyTopic = (id: string) => {
    setStudyTopics(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteStudyTopic = (id: string) => {
    setStudyTopics(prev => prev.filter(t => t.id !== id));
  };

  const handleAddStudyPlan = () => {
    if (!newStudyPlanTitle.trim() || !newStudyPlanDate) return;
    const plan: StudyPlan = {
      id: Date.now().toString(),
      title: newStudyPlanTitle,
      date: newStudyPlanDate,
      completed: false,
      priority: newStudyPlanPriority,
      createdAt: Date.now(),
    };
    setStudyPlans(prev => [...prev, plan]);
    setNewStudyPlanTitle('');
    setNewStudyPlanDate('');
    showToastWithMsg('Plano de estudo agendado!');
  };

  const handleToggleStudyPlan = (id: string) => {
    setStudyPlans(prev => prev.map(p => p.id === id ? { ...p, completed: !p.completed } : p));
  };

  const handleDeleteStudyPlan = (id: string) => {
    setStudyPlans(prev => prev.filter(p => p.id !== id));
  };

  const handleAddStudyNotebook = (title?: string) => {
    const finalTitle = title || newNotebookTitle;
    if (!finalTitle.trim()) return;
    const notebook: StudyNotebook = {
      id: Date.now().toString(),
      title: finalTitle,
      icon: newNotebookIcon,
      color: newNotebookColor,
      createdAt: Date.now(),
    };
    setStudyNotebooks(prev => [...prev, notebook]);
    setNewNotebookTitle('');
    showToastWithMsg('Caderno criado!');
  };

  const handleDeleteStudyNotebook = (id: string) => {
    setStudyNotebooks(prev => prev.filter(n => n.id !== id));
    setStudyNotes(prev => prev.filter(note => note.notebookId !== id));
    if (selectedNotebookId === id) setSelectedNotebookId(null);
  };

  useEffect(() => {
    let interval: any;
    if (isPomodoroActive && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(prev => prev - 1);
      }, 1000);
    } else if (pomodoroTime === 0) {
      setIsPomodoroActive(false);
      // Play sound or notification here
      if (pomodoroMode === 'work') {
        setPomodoroMode('break');
        setPomodoroTime(5 * 60);
      } else {
        setPomodoroMode('work');
        setPomodoroTime(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isPomodoroActive, pomodoroTime, pomodoroMode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Fluxo de Caixa Projetado Data
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const currentMonthIdx = new Date().getMonth();

  const projectedCashFlow = Array.from({ length: 12 }, (_, i) => {
    const monthIdx = (currentMonthIdx + i) % 12;
    const name = monthNames[monthIdx];
    
    // Get recurring totals
    const monthlyRecurringIncome = transactions.filter(t => t.type === 'income' && t.recurrence === 'Mensal').reduce((sum, t) => sum + t.amount, 0);
    const monthlyRecurringExpense = transactions.filter(t => t.type === 'expense' && t.recurrence === 'Mensal' && t.status === 'Pago').reduce((sum, t) => sum + t.amount, 0);
    const monthlyRecurringVencer = transactions.filter(t => t.type === 'expense' && t.recurrence === 'Mensal' && (t.status === 'A Vencer' || t.status === 'Pendente')).reduce((sum, t) => sum + t.amount, 0);

    let income, expense, vencer;
    
    if (i === 0) {
      // Month 1: Real Current Data
      // We group all income/expenses in their respective categories so the areas are populated
      income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      // We use 'vencer' only for a special highlight or extra projected costs
      vencer = 0; 
    } else {
      // Projections for Months 2-12
      // Recurring ones are the base Saídas (Pink)
      income = monthlyRecurringIncome;
      expense = monthlyRecurringExpense + monthlyRecurringVencer; // All recurring are 'Saídas' in projection
      vencer = 0; 

      // Add actual average of variable items if it exists
      const avgVariableIncome = transactions.length > 0 ? transactions.filter(t => t.type === 'income' && t.recurrence === 'Único').reduce((sum, t) => sum + t.amount, 0) : 0;
      const avgVariableExpense = transactions.length > 0 ? transactions.filter(t => t.type === 'expense' && t.recurrence === 'Único').reduce((sum, t) => sum + t.amount, 0) : 0;
      
      income += avgVariableIncome;
      // We put variable projection as 'vencer' in future months because they are expected/scheduled
      vencer += avgVariableExpense;
    }
    
    return { 
      name, 
      income: Math.round(income), 
      expense: Math.round(expense), 
      vencer: Math.round(vencer),
      saldo: Math.round(income - expense - vencer)
    };
  }).slice(0, 6); // Keep showing 6 months for UI balance

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-roxo-suave' },
    { id: 'reminders', label: 'Lembretes', icon: Bell, color: 'text-red-400' },
    { id: 'calendar', label: 'Calendário', icon: Calendar, color: 'text-amber-500' },
    { id: 'finance', label: 'Financeiro', icon: Wallet, color: 'text-emerald-500' },
    { id: 'programmer', label: 'Projetos', icon: Code, color: 'text-blue-500' },
    { id: 'studies', label: 'Estudos', icon: BookOpen, color: 'text-indigo-400' },
    { id: 'diary', label: 'Diário Pessoal', icon: Smile, color: 'text-pink-400' },
    { id: 'settings', label: 'Configurações', icon: Settings, color: 'text-slate-400' },
  ];

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tokenCards = [
    { id: 'flash', label: 'Gemini Flash', icon: Zap, color: '#6a5acd' },
    { id: 'pro', label: 'Gemini Pro', icon: Cpu, color: '#f8bbd0' },
    { id: 'claude', label: 'Claude', icon: Brain, color: '#0d9488' },
    { id: 'general', label: 'Uso Geral', icon: Layers, color: '#94a3b8' },
  ];

  // Dashboard Data
  const today = new Date().toISOString().split('T')[0];
  const next3Days = Array.from({ length: 3 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const activeRemindersCount = kanbanTasks.filter(t => t.status !== 'done').length;
  const eventsTodayCount = events.filter(e => e.date === today).length;
  const billsDueCount = transactions.filter(t => t.type === 'expense' && t.dueDate && t.dueDate >= today).length;

  const upcomingEvents = events
    .filter(e => next3Days.includes(e.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  const priorityReminders = kanbanTasks
    .filter(t => t.status !== 'done')
    .slice(0, 5);

  const upcomingBills = transactions
    .filter(t => t.type === 'expense' && t.dueDate && t.dueDate >= today)
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    .slice(0, 3);

  const ongoingProjects = projects.filter(p => p.status === 'ongoing');

  const pendingStudyTopicsCount = studyTopics.filter(t => !t.completed).length;
  const todayTimestamp = new Date().setHours(0, 0, 0, 0);
  const todayStudySessionsCount = studySessions.filter(s => s.startTime >= todayTimestamp && s.type === 'work').length;
  const pendingStudyTopics = studyTopics.filter(t => !t.completed).slice(0, 3);

  if (!isAuthenticated) {
    return <LoginView onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen flex bg-bg-dark text-slate-200 font-sans overflow-hidden relative">
      {/* Modals e Overlays Globais */}
      <AnimatePresence>
        {selectedProjectForView && (
          <ProjectModal 
            project={selectedProjectForView} 
            isOpen={!!selectedProjectForView} 
            onClose={() => setSelectedProjectForView(null)} 
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 transition-all duration-300 
          ${isSidebarOpen ? 'w-64 translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 lg:w-20'}
          flex flex-col bg-bg-card border-r border-border-dark overflow-hidden
        `}
      >
        <div className={`p-6 flex items-center justify-between ${isSidebarOpen ? 'bg-white/5 border-b border-white/5 mb-4' : 'lg:justify-center lg:px-0'}`}>
            {isSidebarOpen && (
              <div className="flex items-center gap-2">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 py-2 bg-gradient-to-r from-roxo-suave to-rosa-claro rounded-xl shadow-lg shadow-roxo-suave/20"
                >
                  <h1 className="text-sm font-display font-bold text-white whitespace-nowrap">
                    Planner Diário Raquel
                  </h1>
                </motion.div>
                {/* Mobile Close Button */}
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:block p-2 hover:bg-border-dark rounded-lg transition-colors text-slate-400"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
        </div>

        <nav className={`flex-1 px-3 pt-4 pb-20 space-y-1.5 overflow-y-auto custom-scrollbar ${!isSidebarOpen && 'lg:px-2'}`}>
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as TabType);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center p-3 sm:p-3.5 rounded-xl transition-all group ${
                activeTab === item.id 
                  ? 'bg-roxo-suave/15 text-roxo-suave' 
                  : 'text-slate-500 hover:bg-white/5 active:bg-white/10'
              } ${!isSidebarOpen && 'lg:justify-center'}`}
            >
              <item.icon 
                size={22} 
                className={`${activeTab === item.id ? item.color : 'text-slate-600 group-hover:text-slate-400'}`} 
              />
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="ml-3 font-medium text-sm whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Fixed Header */}
        <header className="bg-bg-dark/80 backdrop-blur-xl border-b border-border-dark z-20 sticky top-0">
          <div className="px-4 py-3 md:px-6 md:py-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-border-dark rounded-lg transition-colors text-slate-400"
              >
                <Menu size={24} />
              </button>
              <h2 className="text-lg font-display font-bold text-white md:max-w-none">
                {sidebarItems.find(i => i.id === activeTab)?.label}
              </h2>
            </div>
            <div className="flex items-center gap-4">
            {activeTab === 'programmer' && (
                <button 
                  onClick={() => setShowAddProject(true)}
                  className="flex items-center gap-2 bg-roxo-suave hover:bg-roxo-suave/80 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-roxo-suave/20 text-sm font-bold"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">Novo Projeto</span>
                </button>
              )}
              <button className="p-2 hover:bg-border-dark rounded-lg transition-colors text-slate-400">
                <Bell size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === 'programmer' && (
            <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <input 
                  type="text" 
                  placeholder="Pesquisar projetos..."
                  className="w-full bg-bg-card border border-border-dark rounded-2xl px-12 py-3 focus:outline-none focus:border-roxo-suave text-white shadow-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Rocket className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              </div>
              <div className="flex gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <span>Total: {filteredProjects.filter(p => p.status === 'completed').length}</span>
              </div>
            </div>
          )}
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 md:space-y-8 p-4 md:p-0 pb-24 md:pb-12"
              >
                {/* Inspiração do Dia */}
                <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-r from-indigo-950 to-slate-900 border border-white/10 shadow-2xl">
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/10 rounded-2xl text-roxo-suave">
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Inspiração do Dia</h4>
                        <AnimatePresence mode="wait">
                          <motion.p 
                            key={inspiration}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-lg font-display font-medium text-white italic max-w-2xl"
                          >
                            "{inspiration}"
                          </motion.p>
                        </AnimatePresence>
                      </div>
                    </div>
                    <button 
                      onClick={generateInspiration}
                      disabled={loadingInspiration}
                      className={`p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 transition-all ${loadingInspiration ? 'animate-spin' : ''}`}
                    >
                      <RefreshCw size={20} />
                    </button>
                  </div>
                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-roxo-suave/10 blur-[100px] rounded-full" />
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <div 
                    onClick={() => setActiveTab('reminders')}
                    className="glass-card p-6 rounded-3xl flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all group"
                  >
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Lembretes Ativos</p>
                      <h3 className="text-3xl font-display font-black text-white">{activeRemindersCount}</h3>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-2xl text-red-400 group-hover:scale-110 transition-transform">
                      <Bell size={24} />
                    </div>
                  </div>
                  
                  <div 
                    onClick={() => setActiveTab('calendar')}
                    className="glass-card p-6 rounded-3xl flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all group"
                  >
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Eventos Hoje</p>
                      <h3 className="text-3xl font-display font-black text-white">{eventsTodayCount}</h3>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 group-hover:scale-110 transition-transform">
                      <Calendar size={24} />
                    </div>
                  </div>

                  <div 
                    onClick={() => setActiveTab('finance')}
                    className="glass-card p-6 rounded-3xl flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all group"
                  >
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Contas a Vencer</p>
                      <h3 className="text-3xl font-display font-black text-white">{billsDueCount}</h3>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform">
                      <DollarSign size={24} />
                    </div>
                  </div>

                  <div 
                    onClick={() => setActiveTab('studies')}
                    className="glass-card p-6 rounded-3xl flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all group"
                  >
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Foco Hoje</p>
                      <h3 className="text-3xl font-display font-black text-white">{todayStudySessionsCount}</h3>
                    </div>
                    <div className="p-3 bg-roxo-suave/10 rounded-2xl text-roxo-suave group-hover:scale-110 transition-transform">
                      <Timer size={24} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Upcoming Appointments */}
                  <div className="glass-card p-6 md:p-8 rounded-3xl">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-lg font-display font-bold text-white flex items-center gap-2">
                        <Calendar size={20} className="text-amber-500" />
                        Próximos Compromissos
                      </h4>
                      <button 
                        onClick={() => setActiveTab('calendar')}
                        className="text-[10px] font-bold text-roxo-suave hover:underline uppercase tracking-widest"
                      >
                        Ver Calendário
                      </button>
                    </div>
                    <div className="space-y-4">
                      {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
                        <div key={event.id} className="p-4 bg-white/5 rounded-2xl border border-border-dark flex justify-between items-center">
                          <div>
                            <p className="text-sm font-bold text-white">{event.title}</p>
                            <p className="text-xs text-slate-500">{new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                            event.type === 'aniversario' ? 'bg-pink-500/10 text-pink-400' : 
                            event.type === 'reuniao' ? 'bg-blue-500/10 text-blue-400' :
                            event.type === 'importante' ? 'bg-red-500/10 text-red-400' :
                            event.type === 'feriado' ? 'bg-emerald-500/10 text-emerald-400' :
                            'bg-roxo-suave/10 text-roxo-suave'
                          }`}>
                            {event.type}
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-slate-500 text-center py-4 italic">Nenhum compromisso nos próximos 3 dias.</p>
                      )}
                    </div>
                  </div>

                  {/* Priority Reminders */}
                  <div className="glass-card p-6 md:p-8 rounded-3xl">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-lg font-display font-bold text-white flex items-center gap-2">
                        <ListTodo size={20} className="text-red-400" />
                        Lembretes Prioritários
                      </h4>
                      <button 
                        onClick={() => setActiveTab('reminders')}
                        className="text-[10px] font-bold text-roxo-suave hover:underline uppercase tracking-widest"
                      >
                        Ver Todos
                      </button>
                    </div>
                    <div className="space-y-3">
                      {priorityReminders.length > 0 ? priorityReminders.map(task => (
                        <div key={task.id} className="p-4 bg-white/5 rounded-2xl border border-border-dark flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${task.status === 'todo' ? 'bg-red-400' : 'bg-amber-400'}`} />
                          <span className="text-sm text-slate-300">{task.title}</span>
                        </div>
                      )) : (
                        <p className="text-sm text-slate-500 text-center py-4 italic">Nenhum lembrete pendente.</p>
                      )}
                    </div>
                  </div>

                  {/* Quick Finance */}
                  <div className="glass-card p-6 md:p-8 rounded-3xl">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-lg font-display font-bold text-white flex items-center gap-2">
                        <Wallet size={20} className="text-emerald-500" />
                        Contas Próximas
                      </h4>
                      <button 
                        onClick={() => setActiveTab('finance')}
                        className="text-[10px] font-bold text-roxo-suave hover:underline uppercase tracking-widest"
                      >
                        Ver Financeiro
                      </button>
                    </div>
                    <div className="space-y-4">
                      {upcomingBills.length > 0 ? upcomingBills.map(bill => (
                        <div key={bill.id} className="p-4 bg-white/5 rounded-2xl border border-border-dark flex justify-between items-center">
                          <div>
                            <p className="text-sm font-bold text-white">{bill.title}</p>
                            <p className="text-xs text-slate-500">{new Date(bill.dueDate! + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                          </div>
                          <div className="text-sm font-black text-red-400">
                            - R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-slate-500 text-center py-4 italic">Nenhuma conta próxima a vencer.</p>
                      )}
                    </div>
                  </div>

                  {/* Project Status */}
                  <div className="glass-card p-6 md:p-8 rounded-3xl">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-lg font-display font-bold text-white flex items-center gap-2">
                        <Rocket size={20} className="text-roxo-suave" />
                        Estado de Projetos
                      </h4>
                      <button 
                        onClick={() => setActiveTab('programmer')}
                        className="text-[10px] font-bold text-roxo-suave hover:underline uppercase tracking-widest"
                      >
                        Ver Projetos
                      </button>
                    </div>
                    <div className="space-y-4">
                      {ongoingProjects.length > 0 ? ongoingProjects.map(project => (
                        <div key={project.id} className="space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-white">{project.title}</span>
                            <span className="text-slate-500">Em andamento</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: '65%' }}
                              className="h-full bg-roxo-suave"
                            />
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-slate-500 text-center py-4 italic">Nenhum projeto em andamento.</p>
                      )}
                    </div>
                  </div>

                  {/* Study Progress */}
                  <div className="glass-card p-6 md:p-8 rounded-3xl">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-lg font-display font-bold text-white flex items-center gap-2">
                        <BookOpen size={20} className="text-indigo-400" />
                        Tópicos de Estudo
                      </h4>
                      <button 
                        onClick={() => setActiveTab('studies')}
                        className="text-[10px] font-bold text-roxo-suave hover:underline uppercase tracking-widest"
                      >
                        Ver Estudos
                      </button>
                    </div>
                    <div className="space-y-3">
                      {pendingStudyTopics.length > 0 ? pendingStudyTopics.map(topic => (
                        <div key={topic.id} className="p-4 bg-white/5 rounded-2xl border border-border-dark flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${topic.priority === 'High' ? 'bg-red-400' : topic.priority === 'Medium' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                            <span className="text-sm text-slate-300">{topic.title}</span>
                          </div>
                          <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                            {topic.priority}
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-slate-500 text-center py-4 italic">Nenhum tópico pendente.</p>
                      )}
                      {pendingStudyTopicsCount > 3 && (
                        <p className="text-[10px] text-slate-500 text-center mt-2">
                          + {pendingStudyTopicsCount - 3} outros tópicos pendentes
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Banco de Ideias */}
                  <div className="glass-card p-6 md:p-8 rounded-3xl lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-lg font-display font-bold text-white flex items-center gap-2">
                        <Lightbulb size={20} className="text-amber-400" />
                        Banco de Ideias
                      </h4>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Insights Rápidos
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="relative">
                        <textarea 
                          value={newIdea}
                          onChange={(e) => setNewIdea(e.target.value)}
                          placeholder="Tive uma ideia incrível..."
                          className="w-full bg-white/5 border border-border-dark rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-roxo-suave min-h-[100px] resize-none"
                        />
                        <button 
                          onClick={() => {
                            if (!newIdea.trim()) return;
                            const newNote = {
                              id: Date.now().toString(),
                              content: newIdea,
                              category: 'Ideia' as const,
                              date: Date.now()
                            };
                            setScratchNotes([newNote, ...scratchNotes]);
                            setNewIdea('');
                          }}
                          className="absolute bottom-4 right-4 bg-gradient-to-r from-roxo-suave to-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:scale-105 transition-all"
                        >
                          Salvar Insight
                        </button>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Últimas Ideias</p>
                        <div className="flex flex-wrap gap-2">
                          {scratchNotes.filter(n => n.category === 'Ideia').slice(0, 3).map(note => (
                            <div key={note.id} className="px-4 py-2 bg-white/5 border border-border-dark rounded-xl text-xs text-slate-300 max-w-xs truncate">
                              {note.content}
                            </div>
                          ))}
                          {scratchNotes.filter(n => n.category === 'Ideia').length === 0 && (
                            <p className="text-xs text-slate-600 italic">Nenhuma ideia salva ainda.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'reminders' && (
              <motion.div
                key="reminders"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 md:space-y-8 p-4 md:p-0"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {/* Project Deadlines */}
                  <div className="glass-card p-5 md:p-6 rounded-3xl">
                    <h4 className="text-lg font-display font-bold text-white mb-6 flex items-center gap-2">
                      <Rocket size={20} className="text-roxo-suave" />
                      Prazos de Projetos
                    </h4>
                    <div className="space-y-4">
                      {projects
                        .filter(p => p.status === 'ongoing' && p.deadline)
                        .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
                        .map(p => {
                          const diff = Math.ceil((new Date(p.deadline!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          return (
                            <div key={p.id} className="p-4 bg-white/5 rounded-2xl border border-border-dark/30">
                              <p className="text-sm font-bold text-white">{p.title}</p>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                  {new Date(p.deadline!).toLocaleDateString('pt-BR')}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${diff <= 3 ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                  {diff < 0 ? 'Atrasado' : diff === 0 ? 'Hoje' : `Em ${diff} dias`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      {projects.filter(p => p.status === 'ongoing' && p.deadline).length === 0 && (
                        <p className="text-slate-600 text-sm italic">Nenhum prazo definido.</p>
                      )}
                    </div>
                  </div>

                  {/* Upcoming Events */}
                  <div className="glass-card p-5 md:p-6 rounded-3xl">
                    <h4 className="text-lg font-display font-bold text-white mb-6 flex items-center gap-2">
                      <Calendar size={20} className="text-amber-500" />
                      Próximos Eventos
                    </h4>
                    <div className="space-y-4">
                      {events
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .filter(e => new Date(e.date).getTime() >= new Date().setHours(0,0,0,0))
                        .map(e => (
                          <div key={e.id} className="p-4 bg-white/5 rounded-2xl border border-border-dark/30">
                            <p className="text-sm font-bold text-white">{e.title}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                              {new Date(e.date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        ))}
                      {events.length === 0 && (
                        <p className="text-slate-600 text-sm italic">Nenhum evento agendado.</p>
                      )}
                    </div>
                  </div>

                  {/* Financial Dues */}
                  <div className="glass-card p-5 md:p-6 rounded-3xl">
                    <h4 className="text-lg font-display font-bold text-white mb-6 flex items-center gap-2">
                      <DollarSign size={20} className="text-emerald-500" />
                      Contas a Vencer
                    </h4>
                    <div className="space-y-4">
                      {transactions
                        .filter(t => t.dueDate && t.type !== 'income')
                        .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
                        .map(t => (
                          <div key={t.id} className="p-4 bg-white/5 rounded-2xl border border-border-dark/30">
                            <div className="flex justify-between items-start">
                              <p className="text-sm font-bold text-white">{t.title}</p>
                              <span className="text-xs font-bold text-rosa-claro">R$ {t.amount.toFixed(2)}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                              Vencimento: {new Date(t.dueDate!).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        ))}
                      {transactions.filter(t => t.dueDate && t.type !== 'income').length === 0 && (
                        <p className="text-slate-600 text-sm italic">Nenhuma conta com vencimento.</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'calendar' && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 md:space-y-8 p-4 md:p-0 pb-24 md:pb-12"
              >
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  {/* Calendar Grid */}
                  <div className="lg:col-span-3 glass-card p-3 md:p-6 rounded-3xl">
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-4 md:mb-6">
                        <h3 className="text-lg md:text-xl font-display font-bold text-white">
                          {currentCalendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())}
                        </h3>
                        <div className="flex gap-2">
                          <button 
                            onClick={prevMonth}
                            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"
                          >
                            <ChevronRight className="rotate-180" size={20} />
                          </button>
                          <button 
                            onClick={nextMonth}
                            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"
                          >
                            <ChevronRight size={20} />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-1 md:gap-2">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                          <div key={day} className="text-center text-[10px] font-bold text-slate-500 uppercase py-2">{day}</div>
                        ))}
                        {/* Empty cells for start of month */}
                        {Array.from({ length: new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1).getDay() }).map((_, i) => <div key={i} />)}
                        {Array.from({ length: new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                          const day = i + 1;
                          const dateStr = `${currentCalendarDate.getFullYear()}-${(currentCalendarDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                          const dayEvents = events.filter(e => e.date === dateStr);
                          const projectDeadlines = projects.filter(p => p.status === 'ongoing' && p.deadline === dateStr);
                          
                          return (
                            <div 
                              key={day} 
                              onClick={() => setSelectedDate(dateStr)}
                              className={`aspect-square border rounded-lg md:rounded-xl p-0.5 md:p-1 flex flex-col transition-all cursor-pointer group hover:bg-white/10 hover:border-roxo-suave/50 ${
                                selectedDate === dateStr 
                                  ? 'border-roxo-suave bg-roxo-suave/10 shadow-[0_0_15px_rgba(106,90,205,0.3)]' 
                                  : 'border-border-dark/30 bg-transparent'
                              }`}
                            >
                              <span className={`text-xs font-bold transition-colors ${selectedDate === dateStr ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}>{day}</span>
                              <div className="flex-1 overflow-y-auto space-y-1 mt-1">
                                {dayEvents.map(e => {
                                  let typeClasses = 'bg-roxo-suave/20 text-roxo-suave';
                                  if (e.type === 'aniversario') typeClasses = 'bg-pink-500/20 text-pink-500';
                                  if (e.type === 'reuniao') typeClasses = 'bg-blue-500/20 text-blue-500';
                                  if (e.type === 'importante') typeClasses = 'bg-red-500/20 text-red-500';
                                  if (e.type === 'feriado') typeClasses = 'bg-emerald-500/20 text-emerald-500';
                                  if (e.type === 'outro') typeClasses = 'bg-slate-500/20 text-slate-500';

                                  return (
                                    <div key={e.id} className={`text-[8px] p-1 rounded ${typeClasses} truncate`}>
                                      {e.type === 'aniversario' ? '🎂 ' : ''}{e.title}
                                    </div>
                                  );
                                })}
                                {projectDeadlines.map(p => (
                                  <div key={p.id} className="text-[8px] p-1 rounded bg-amber-500/20 text-amber-500 truncate font-bold">
                                    🏁 {p.title}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar: Add Event & Upcoming */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card p-6 rounded-3xl">
                      <h4 className="text-lg font-display font-bold text-white mb-6 flex items-center gap-2">
                        <Plus size={20} className="text-amber-500" />
                        Novo Evento
                      </h4>
                      <EventForm 
                        onAdd={(title, date, type, description, projectId) => {
                          addEvent(title, date, type, description, projectId);
                          setSelectedDate(null);
                        }} 
                        projects={projects} 
                        selectedDate={selectedDate}
                      />
                    </div>

                    <div className="glass-card p-6 rounded-3xl">
                      <h4 className="text-lg font-display font-bold text-white mb-6">
                        {selectedDate ? `Eventos para o dia ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}` : 'Próximos Compromissos'}
                      </h4>
                      <div className="space-y-4">
                        {(selectedDate 
                          ? events.filter(e => e.date === selectedDate)
                          : events.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5)
                        ).map(e => (
                          <div key={e.id} className="flex items-center justify-between group">
                            <div>
                              <p className="text-sm font-bold text-white">{e.title}</p>
                              {e.description && <p className="text-[10px] text-slate-400 italic mt-0.5">{e.description}</p>}
                              <p className="text-[10px] text-slate-500 mt-0.5">{new Date(e.date).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <button 
                              onClick={() => deleteEvent(e.id)}
                              className="p-1 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        {events.length === 0 && (
                          <p className="text-slate-600 text-sm italic">Nenhum evento agendado.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'finance' && (
              <motion.div
                key="finance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 md:space-y-8 p-4 md:p-0 pb-24 md:pb-12"
              >
                {/* Financial Summary Cards - CFO KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <div className="glass-card p-5 md:p-6 rounded-3xl border-l-4 border-emerald-500">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-500 text-xs md:text-sm font-medium">Saldo Consolidado</span>
                      <Wallet className="text-emerald-500" size={18} />
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      <h3 className={`text-2xl md:text-3xl font-display font-black ${balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        R$ {balance.toFixed(2).replace('.', ',')}
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full mb-1">
                        +5%
                      </span>
                    </div>
                  </div>
                  <div className="glass-card p-5 md:p-6 rounded-3xl border-l-4 border-roxo-suave">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-500 text-xs md:text-sm font-medium">Previsão de Gastos</span>
                      <TrendingUp className="text-roxo-suave" size={18} />
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      <h3 className="text-2xl md:text-3xl font-display font-black text-white">
                        R$ {(totalExpenses * 1.1).toFixed(2).replace('.', ',')}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded-full mb-1">
                        Projetado
                      </span>
                    </div>
                  </div>
                  <div className="glass-card p-5 md:p-6 rounded-3xl border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-500 text-xs md:text-sm font-medium">Economia Gerada</span>
                      <TrendingDown className="text-blue-500" size={18} />
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      <h3 className="text-2xl md:text-3xl font-display font-black text-white">
                        R$ {(totalIncome - totalExpenses > 0 ? (totalIncome - totalExpenses) * 0.2 : 0).toFixed(2).replace('.', ',')}
                      </h3>
                      <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full mb-1">
                        Meta: 20%
                      </span>
                    </div>
                  </div>
                  <div className="glass-card p-5 md:p-6 rounded-3xl border-l-4 border-amber-500">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-500 text-xs md:text-sm font-medium">Custo de Vida</span>
                      <Target className="text-amber-500" size={18} />
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      <h3 className="text-2xl md:text-3xl font-display font-black text-white">
                        R$ {totalExpenses.toFixed(2).replace('.', ',')}
                      </h3>
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full mb-1">
                        Despesas Totais
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fluxo de Caixa Projetado */}
                <div className="glass-card p-4 md:p-6 rounded-3xl relative overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                      <h4 className="text-base md:text-lg font-display font-bold text-white">Fluxo de Caixa Projetado</h4>
                      <p className="text-[10px] md:text-xs text-slate-500">Realizado vs Agendado (Mensal)</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 md:gap-4 lg:gap-4">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <div className="min-w-2 w-2 md:w-3 h-2 md:h-3 bg-emerald-500 rounded-full" />
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">Entradas</span>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <div className="min-w-2 w-2 md:w-3 h-2 md:h-3 bg-rosa-claro rounded-full" />
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">Saídas</span>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <div className="min-w-2 w-2 md:w-3 h-2 md:h-3 bg-amber-500 rounded-full" />
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">A Vencer</span>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <div className="min-w-2 w-2 md:w-3 h-0.5 bg-roxo-suave" />
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">Saldo</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-64 md:h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={projectedCashFlow} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f8bbd0" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f8bbd0" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorVencer" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                          tickFormatter={(value) => `R$ ${value}`}
                        />
                        <RechartsTooltip 
                          formatter={(value: number, name: string) => [`R$ ${value.toFixed(2).replace('.', ',')}`, name]}
                          contentStyle={{ 
                            backgroundColor: 'rgba(30, 30, 30, 0.9)', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            fontSize: '12px',
                            color: '#fff'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="income" 
                          name="Entradas"
                          stackId="1" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorIncome)" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="expense" 
                          name="Saídas"
                          stackId="1" 
                          stroke="#f8bbd0" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorExpense)" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="vencer" 
                          name="A Vencer"
                          stackId="1" 
                          stroke="#f59e0b" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorVencer)" 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="saldo" 
                          name="Saldo"
                          stroke="#6a5acd" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: '#6a5acd', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Form and Critical Accounts */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card p-5 md:p-6 rounded-3xl">
                      <h4 className="text-base md:text-lg font-display font-bold text-white mb-6 flex items-center gap-2">
                        <Plus size={18} className="text-roxo-suave" />
                        Novo Registro
                      </h4>
                      <TransactionForm onAdd={addTransaction} />
                    </div>

                    {/* Contas Críticas */}
                    <div className="glass-card p-5 md:p-6 rounded-3xl border-t-4 border-red-500">
                      <h4 className="text-base md:text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                        <AlertCircle size={18} className="text-red-500" />
                        Contas Críticas
                      </h4>
                      <div className="space-y-3">
                        {transactions
                          .filter(t => t.type === 'expense' && (t.status === 'Pendente' || t.status === 'A Vencer'))
                          .slice(0, 3)
                          .map(t => (
                            <div key={t.id} className="p-3 bg-red-500/5 rounded-2xl border border-red-500/10 flex justify-between items-center">
                              <div>
                                <p className="text-xs font-bold text-white">{t.title}</p>
                                <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Vence Hoje</p>
                              </div>
                              <span className="text-sm font-black text-red-500">R$ {t.amount.toFixed(2)}</span>
                            </div>
                          ))}
                        {transactions.filter(t => t.type === 'expense' && (t.status === 'Pendente' || t.status === 'A Vencer')).length === 0 && (
                          <p className="text-slate-600 text-sm italic">Nenhuma conta crítica pendente.</p>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={exportToAccountant}
                      className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-3xl flex items-center justify-center gap-3 border border-border-dark transition-all group"
                    >
                      <FileText size={20} className="text-roxo-suave group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-sm">Exportar para Contador</span>
                    </button>
                  </div>

                  {/* Transaction List */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card rounded-3xl overflow-hidden">
                      <div className="p-6 border-b border-border-dark flex justify-between items-center">
                        <h4 className="text-lg font-display font-bold text-white">Últimas Transações</h4>
                        <DollarSign size={20} className="text-slate-500" />
                      </div>
                      <div className="divide-y divide-border-dark max-h-[800px] overflow-y-auto">
                        {transactions.length === 0 ? (
                          <div className="p-12 text-center text-slate-600">
                            <Wallet size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Nenhuma transação encontrada.</p>
                          </div>
                        ) : (
                          transactions.map(t => (
                            <div key={t.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                              <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                                <div className={`p-2 rounded-xl flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rosa-claro/10 text-rosa-claro'}`}>
                                  {t.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    <p className="text-sm font-bold text-white truncate">{t.title}</p>
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase ${
                                      t.status === 'Pago' ? 'bg-emerald-500/20 text-emerald-500' : 
                                      t.status === 'A Vencer' ? 'bg-amber-500/20 text-amber-500' : 
                                      'bg-rosa-claro/20 text-rosa-claro'
                                    }`}>
                                      {t.status}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-2 text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5 uppercase">
                                    <span>{t.category}</span>
                                    <span className="opacity-50 hidden md:inline">•</span>
                                    <span className="hidden md:inline">{t.paymentMethod || 'PIX'}</span>
                                    {t.recurrence && t.recurrence !== 'Único' && (
                                      <>
                                        <span className="opacity-50">•</span>
                                        <span className="text-roxo-suave">{t.recurrence}</span>
                                      </>
                                    )}
                                    {t.dueDate && (
                                      <span className="flex items-center gap-1">
                                        • <Calendar size={10} /> {new Date(t.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                {editingTransactionId === t.id ? (
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="number"
                                      step="0.01"
                                      value={editingTransactionAmount}
                                      onChange={(e) => setEditingTransactionAmount(e.target.value)}
                                      className="w-24 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-roxo-suave"
                                      autoFocus
                                    />
                                    <button 
                                      onClick={() => updateTransactionAmount(t.id, parseFloat(editingTransactionAmount))}
                                      className="p-1.5 bg-emerald-500/20 text-emerald-500 rounded-lg hover:bg-emerald-500/30 transition-all"
                                    >
                                      <Check size={14} />
                                    </button>
                                    <button 
                                      onClick={() => { setEditingTransactionId(null); setEditingTransactionAmount(''); }}
                                      className="p-1.5 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-all"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3">
                                    <span className={`font-display font-bold text-sm md:text-base ${t.type === 'income' ? 'text-emerald-500' : 'text-rosa-claro'}`}>
                                      {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2).replace('.', ',')}
                                    </span>
                                    <button 
                                      onClick={() => {
                                        setEditingTransactionId(t.id);
                                        setEditingTransactionAmount(t.amount.toString());
                                      }}
                                      className="p-1.5 text-slate-500 hover:text-roxo-suave opacity-0 group-hover:opacity-100 transition-all"
                                      title="Editar valor"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                  </div>
                                )}
                                <button 
                                  onClick={() => deleteTransaction(t.id)}
                                  className="p-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'programmer' && (
              <motion.div
                key="programmer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-3xl font-display font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                      Área do Programador
                    </h2>
                    <p className="text-slate-500 text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Dashboard Premium Dark Mode
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={saveNotes}
                      className="flex items-center gap-2 px-6 py-2.5 bg-roxo-suave hover:bg-roxo-suave/80 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-roxo-suave/20 group"
                    >
                      <Save size={16} className="group-hover:scale-110 transition-transform" />
                      Salvar Progresso
                    </button>
                    <button 
                      onClick={resetTokens}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-border-dark"
                    >
                      <RotateCcw size={16} />
                      Limpar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Projects, Kanban, Snippets */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Galeria de Projetos */}
                    <div className="glass-card p-6 rounded-3xl">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-lg font-display font-bold text-white flex items-center gap-2">
                          <FolderOpen size={20} className="text-pink-500" />
                          Galeria de Projetos
                        </h4>
                        <button 
                          onClick={() => {
                            setEditingProjectId(null);
                            setNewProjectTitle('');
                            setNewProjectDesc('');
                            setNewProjectStartDate('');
                            setNewProjectDeadline('');
                            setNewProjectTechStack('');
                            setNewProjectGithubEmail('');
                            setNewProjectGithubUrl('');
                            setNewProjectSupabaseEmail('');
                            setNewProjectSupabaseUrl('');
                            setNewProjectUrl('');
                            setNewProjectDevLocation('');
                            setShowAddProject(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 rounded-xl transition-all font-bold text-xs"
                          title="Adicionar Novo Projeto"
                        >
                          <Plus size={18} />
                          Novo Projeto
                        </button>
                      </div>

                      <AnimatePresence>
                        {showAddProject && activeTab === 'programmer' && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mb-6"
                          >
                            <div className="p-6 bg-white/5 rounded-2xl border border-border-dark space-y-4">
                              <div className="space-y-4">
                                <input 
                                  type="text" 
                                  placeholder="Título do Projeto" 
                                  className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-roxo-suave text-white"
                                  value={newProjectTitle}
                                  onChange={(e) => setNewProjectTitle(e.target.value)}
                                />
                                <textarea 
                                  placeholder="Descrição do Projeto" 
                                  className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-roxo-suave text-white h-24 resize-none"
                                  value={newProjectDesc}
                                  onChange={(e) => setNewProjectDesc(e.target.value)}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">GitHub (E-mail)</label>
                                    <input 
                                      type="text" 
                                      placeholder="E-mail" 
                                      className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-roxo-suave text-white"
                                      value={newProjectGithubEmail}
                                      onChange={(e) => setNewProjectGithubEmail(e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">GitHub (Link)</label>
                                    <input 
                                      type="text" 
                                      placeholder="https://github.com/..." 
                                      className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-roxo-suave text-white"
                                      value={newProjectGithubUrl}
                                      onChange={(e) => setNewProjectGithubUrl(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Supabase (E-mail)</label>
                                    <input 
                                      type="text" 
                                      placeholder="E-mail" 
                                      className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-roxo-suave text-white"
                                      value={newProjectSupabaseEmail}
                                      onChange={(e) => setNewProjectSupabaseEmail(e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Supabase (Link)</label>
                                    <input 
                                      type="text" 
                                      placeholder="https://supabase.com/..." 
                                      className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-roxo-suave text-white"
                                      value={newProjectSupabaseUrl}
                                      onChange={(e) => setNewProjectSupabaseUrl(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">URL do Projeto (Deploy)</label>
                                  <input 
                                    type="text" 
                                    placeholder="https://..." 
                                    className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-roxo-suave text-white"
                                    value={newProjectUrl}
                                    onChange={(e) => setNewProjectUrl(e.target.value)}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Data de Início</label>
                                    <input 
                                      type="date" 
                                      className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-roxo-suave text-white"
                                      value={newProjectStartDate}
                                      onChange={(e) => setNewProjectStartDate(e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Prazo Final</label>
                                    <input 
                                      type="date" 
                                      className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-roxo-suave text-white"
                                      value={newProjectDeadline}
                                      onChange={(e) => setNewProjectDeadline(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <input 
                                  type="text" 
                                  placeholder="Tech Stack (separado por vírgula)" 
                                  className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-roxo-suave text-white"
                                  value={newProjectTechStack}
                                  onChange={(e) => setNewProjectTechStack(e.target.value)}
                                />
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Local de Desenvolvimento</label>
                                  <input 
                                    type="text" 
                                    placeholder="Ex: VS Code, Cloud IDE, LocalHost..." 
                                    className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-roxo-suave text-white"
                                    value={newProjectDevLocation}
                                    onChange={(e) => setNewProjectDevLocation(e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <button 
                                  onClick={addProject}
                                  className="flex-1 bg-roxo-suave text-white py-2 rounded-xl text-sm font-bold hover:bg-roxo-suave/80 transition-colors"
                                >
                                  {editingProjectId ? 'Atualizar Projeto' : 'Criar Projeto'}
                                </button>
                                <button 
                                  onClick={() => {
                                    setShowAddProject(false);
                                    setEditingProjectId(null);
                                  }}
                                  className="px-4 py-2 text-slate-500 hover:text-slate-300 text-sm font-medium"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="grid grid-cols-1 gap-6">
                        {filteredProjects.map(project => (
                          <div key={project.id} className="p-6 bg-white/5 rounded-2xl border border-border-dark flex flex-col group hover:bg-white/10 transition-all relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1 h-full ${project.status === 'ongoing' ? 'bg-roxo-suave' : 'bg-emerald-500'}`} />
                            
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${project.status === 'ongoing' ? 'bg-roxo-suave/10 text-roxo-suave' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                  {project.status === 'ongoing' ? <Clock size={16} /> : <CheckCircle2 size={16} />}
                                </div>
                                <div className="cursor-pointer" onClick={() => project.projectUrl && window.open(project.projectUrl, '_blank')}>
                                  <h5 className="text-sm font-bold text-white group-hover:text-roxo-suave transition-colors">{project.title}</h5>
                                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                                    {project.status === 'ongoing' ? 'Em progresso' : 'Concluído'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => toggleProjectStatus(project.id)}
                                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-roxo-suave transition-colors"
                                  title={project.status === 'ongoing' ? 'Concluir' : 'Reabrir'}
                                >
                                  <CheckCircle2 size={14} />
                                </button>
                                <button 
                                  onClick={() => {
                                    if (window.confirm('Excluir projeto?')) deleteProject(project.id);
                                  }}
                                  className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {project.description && (
                              <p className="text-[11px] text-slate-500 line-clamp-2 mb-4 leading-relaxed pl-11">
                                {project.description}
                              </p>
                            )}

                            {project.devLocation && (
                              <div className="flex items-center gap-2 pl-11 mb-4 text-roxo-suave/80">
                                <Monitor size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Dev: {project.devLocation}</span>
                              </div>
                            )}

                            {/* Connection Lines */}
                            <div className="space-y-3 pl-11 mb-6">
                              {/* Row 1: Projeto */}
                              <div className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-4">
                                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Projeto</label>
                                  <input 
                                    type="text" 
                                    value={project.title}
                                    onChange={(e) => updateProjectField(project.id, 'title', e.target.value)}
                                    className="w-full bg-slate-100/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-roxo-suave text-white"
                                  />
                                </div>
                                <div className="col-span-7">
                                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">URL Repositório/Deploy</label>
                                  <input 
                                    type="text" 
                                    value={project.projectUrl || ''}
                                    onChange={(e) => updateProjectField(project.id, 'projectUrl', e.target.value)}
                                    placeholder="https://..."
                                    className="w-full bg-slate-100/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-roxo-suave text-white"
                                  />
                                </div>
                                <div className="col-span-1 flex justify-end">
                                  <button 
                                    onClick={() => project.projectUrl && window.open(project.projectUrl, '_blank')}
                                    className="p-1.5 bg-roxo-suave/10 hover:bg-roxo-suave/20 text-roxo-suave rounded-lg transition-all"
                                    title="Abrir Link"
                                  >
                                    <ExternalLink size={12} />
                                  </button>
                                </div>
                              </div>

                              {/* Row 2: GitHub */}
                              <div className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-4">
                                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">GitHub (E-mail)</label>
                                  <input 
                                    type="text" 
                                    value={project.githubEmail || ''}
                                    onChange={(e) => updateProjectField(project.id, 'githubEmail', e.target.value)}
                                    placeholder="E-mail"
                                    className="w-full bg-slate-100/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-roxo-suave text-white"
                                  />
                                </div>
                                <div className="col-span-7">
                                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Link Perfil/Repo</label>
                                  <input 
                                    type="text" 
                                    value={project.githubUrl || ''}
                                    onChange={(e) => updateProjectField(project.id, 'githubUrl', e.target.value)}
                                    placeholder="https://github.com/..."
                                    className="w-full bg-slate-100/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-roxo-suave text-white"
                                  />
                                </div>
                                <div className="col-span-1 flex justify-end">
                                  <button 
                                    onClick={() => project.githubUrl && window.open(project.githubUrl, '_blank')}
                                    className="p-1.5 bg-roxo-suave/10 hover:bg-roxo-suave/20 text-roxo-suave rounded-lg transition-all"
                                    title="Abrir Link"
                                  >
                                    <ExternalLink size={12} />
                                  </button>
                                </div>
                              </div>

                              {/* Row 3: Dev Location */}
                              <div className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-4">
                                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Local Dev</label>
                                  <input 
                                    type="text" 
                                    value={project.devLocation || ''}
                                    onChange={(e) => updateProjectField(project.id, 'devLocation', e.target.value)}
                                    placeholder="VS Code, Cloud IDE..."
                                    className="w-full bg-slate-100/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-roxo-suave text-white"
                                  />
                                </div>
                                <div className="col-span-8">
                                  {/* Empty space for alignment or future fields */}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-auto pl-11">
                              <div className="flex gap-2">
                                {project.deadline && (
                                  <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Calendar size={10} />
                                    {new Date(project.deadline).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={() => setSelectedProjectForView(project)}
                                  className="bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-[10px] font-bold transition-all border border-white/5 group"
                                  title="Ver Detalhes em Tela Cheia"
                                >
                                  <Eye size={12} className="group-hover:scale-110 transition-transform" /> Ver
                                </button>
                                <button 
                                  onClick={() => startEditingProject(project)}
                                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 px-3 py-1.5 rounded-lg flex items-center gap-1 text-[10px] font-bold transition-all"
                                  title="Editar Detalhes"
                                >
                                  <Edit2 size={12} /> Editar
                                </button>
                                <button 
                                  onClick={() => handleSaveProject(project.id)}
                                  className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold ${
                                    projectSaved[project.id]
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500'
                                  }`}
                                  title="Salvar Alterações"
                                >
                                  {projectSaved[project.id] ? <Check size={14} /> : <Save size={14} />}
                                  {projectSaved[project.id] ? 'Salvo' : 'Salvar'}
                                </button>
                                <button 
                                  onClick={() => {
                                    if (project.projectUrl) {
                                      window.open(project.projectUrl, '_blank');
                                    } else {
                                      showToastWithMsg('URL do projeto não definida');
                                    }
                                  }}
                                  className="bg-roxo-suave hover:bg-roxo-suave/80 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-[10px] font-bold transition-all"
                                >
                                  Abrir Projeto <ExternalLink size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {filteredProjects.length === 0 && (
                          <div className="py-12 text-center border-2 border-dashed border-border-dark rounded-2xl">
                            <FolderOpen size={32} className="text-slate-700 mx-auto mb-3" />
                            <p className="text-slate-600 text-sm italic">Nenhum projeto encontrado.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Kanban Board */}
                    <div className="glass-card p-8 rounded-3xl relative overflow-hidden">
                      <div className="flex justify-between items-center mb-10">
                        <div>
                          <h4 className="text-xl font-display font-bold text-white flex items-center gap-2">
                            <ListTodo size={24} className="text-blue-400" />
                            Kanban de Micro-Tasks
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Gestão Ágil de Tarefas</p>
                        </div>
                        <button 
                          onClick={() => {
                            const title = window.prompt('O que precisa ser feito?');
                            if (title) addKanbanTask(title);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl transition-all font-bold text-xs"
                        >
                          <Plus size={18} />
                          Nova Task
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(['todo', 'doing', 'done'] as const).map(status => (
                          <div key={status} className="bg-slate-900/50 p-5 rounded-2xl border border-white/5">
                            <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${status === 'todo' ? 'bg-red-400' : status === 'doing' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                {status === 'todo' ? 'A Fazer' : status === 'doing' ? 'Fazendo' : 'Feito/Concluído'}
                              </div>
                              <span className="bg-bg-dark border border-white/5 px-2 py-0.5 rounded-lg text-white font-mono">{kanbanTasks.filter(t => t.status === status).length}</span>
                            </h5>
                            <div className="space-y-3">
                              {kanbanTasks.filter(t => t.status === status).map(task => (
                                <motion.div 
                                  key={task.id} 
                                  layoutId={task.id}
                                  className="p-3 bg-bg-dark rounded-xl border border-border-dark group relative"
                                >
                                  <p className="text-xs text-white mb-3">{task.title}</p>
                                  <div className="flex justify-between items-center">
                                    <div className="flex gap-1">
                                      {status !== 'todo' && (
                                        <button onClick={() => moveKanbanTask(task.id, status === 'done' ? 'doing' : 'todo')} className="p-1 hover:bg-white/5 rounded text-slate-500"><ChevronRight size={12} className="rotate-180" /></button>
                                      )}
                                      {status !== 'done' && (
                                        <button onClick={() => moveKanbanTask(task.id, status === 'todo' ? 'doing' : 'done')} className="p-1 hover:bg-white/5 rounded text-slate-500"><ChevronRight size={12} /></button>
                                      )}
                                    </div>
                                    <button onClick={() => deleteKanbanTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Snippets */}
                    <div className="glass-card p-6 rounded-3xl">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-lg font-display font-bold text-white flex items-center gap-2">
                          <Code size={20} className="text-blue-500" />
                          Code Snippets
                        </h4>
                        <button 
                          onClick={() => setShowAddSnippet(!showAddSnippet)}
                          className={`p-2 rounded-xl transition-all ${showAddSnippet ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-500'}`}
                        >
                          {showAddSnippet ? <X size={18} /> : <Plus size={18} />}
                        </button>
                      </div>

                      <AnimatePresence>
                        {showAddSnippet && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mb-6"
                          >
                            <div className="p-4 bg-white/5 rounded-2xl border border-border-dark space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <input 
                                  type="text" 
                                  placeholder="Título" 
                                  className="bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 text-white"
                                  value={newSnippetTitle}
                                  onChange={(e) => setNewSnippetTitle(e.target.value)}
                                />
                                <input 
                                  type="text" 
                                  placeholder="Linguagem" 
                                  className="bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 text-white"
                                  value={newSnippetLang}
                                  onChange={(e) => setNewSnippetLang(e.target.value)}
                                />
                              </div>
                              <textarea 
                                placeholder="Insira seu código aqui..." 
                                className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 text-white h-32 font-mono"
                                value={newSnippetCode}
                                onChange={(e) => setNewSnippetCode(e.target.value)}
                              />
                              <button 
                                onClick={addSnippet}
                                className="w-full bg-blue-500 text-white py-2 rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors"
                              >
                                Salvar Snippet
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {snippets.map(s => (
                          <div key={s.id} className="bg-slate-800/50 p-4 rounded-2xl border border-border-dark group relative">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{s.language}</span>
                              <button onClick={() => deleteSnippet(s.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                            </div>
                            <h5 className="text-sm font-bold text-white mb-2">{s.title}</h5>
                            <pre className="text-[10px] bg-bg-dark p-2 rounded-lg text-slate-400 overflow-x-auto"><code>{s.code}</code></pre>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Learning Log */}
                    <div className="glass-card p-6 rounded-3xl">
                      <h4 className="text-lg font-display font-bold text-white mb-6 flex items-center gap-2">
                        <BookOpen size={20} className="text-emerald-500" />
                        Log de Aprendizado
                      </h4>
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <input id="logTopic" type="text" placeholder="O que você aprendeu hoje?" className="flex-1 bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 text-white" />
                          <button 
                            onClick={() => {
                              const input = document.getElementById('logTopic') as HTMLInputElement;
                              if (input.value) {
                                addLog(input.value, '');
                                input.value = '';
                              }
                            }}
                            className="bg-emerald-500 text-white px-6 py-2 rounded-xl text-sm font-bold"
                          >
                            Registrar
                          </button>
                        </div>
                        <div className="space-y-3">
                          {logs.map(log => (
                            <div key={log.id} className="p-4 bg-white/5 rounded-2xl border border-border-dark/30 group relative">
                              <div className="flex justify-between items-start">
                                <p className="text-sm font-bold text-white">{log.topic}</p>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] text-slate-500">{new Date(log.date).toLocaleDateString('pt-BR')}</span>
                                  <button onClick={() => deleteLog(log.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 transition-all">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Scratchpad / Quick Notes */}
                    <div className="glass-card p-6 rounded-3xl">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-lg font-display font-bold text-white flex items-center gap-2">
                          <StickyNote size={20} className="text-amber-500" />
                          Anotações Rápidas / Scratchpad
                        </h4>
                        <button 
                          onClick={addScratchNote}
                          className="p-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded-xl transition-all"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                      
                      <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {scratchNotes.map(note => (
                          <div key={note.id} className="p-4 bg-white/5 rounded-2xl border border-border-dark/30 space-y-3 group relative">
                            <div className="flex justify-between items-center">
                              <div className="flex gap-2">
                                {(['Bug', 'Ideia', 'Task', 'Geral'] as const).map(cat => (
                                  <button
                                    key={cat}
                                    onClick={() => updateScratchNote(note.id, note.content, cat)}
                                    className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all ${
                                      note.category === cat 
                                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                                        : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                                    }`}
                                  >
                                    {cat}
                                  </button>
                                ))}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] text-slate-600">{new Date(note.date).toLocaleDateString('pt-BR')}</span>
                                <button 
                                  onClick={() => deleteScratchNote(note.id)}
                                  className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            <textarea
                              value={note.content}
                              onChange={(e) => updateScratchNote(note.id, e.target.value)}
                              placeholder="Escreva algo... (Markdown aceito)"
                              className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-300 placeholder-slate-600 min-h-[80px] resize-none leading-relaxed"
                            />
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleSaveScratchNote(note.id)}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                  savedFeedback[note.id] 
                                    ? 'bg-emerald-500 text-white' 
                                    : 'bg-roxo-suave text-white hover:bg-roxo-suave/80'
                                } shadow-lg ${savedFeedback[note.id] ? 'shadow-emerald-500/20' : 'shadow-roxo-suave/20'}`}
                              >
                                {savedFeedback[note.id] ? (
                                  <>
                                    <CheckCircle2 size={14} />
                                    Salvo!
                                  </>
                                ) : (
                                  <>
                                    <Save size={14} />
                                    Salvar Anotação
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                        {scratchNotes.length === 0 && (
                          <div className="text-center py-12 border-2 border-dashed border-border-dark rounded-2xl">
                            <p className="text-slate-600 text-sm italic">Nenhuma anotação rápida. Clique no + para começar.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Timer, Versions, Links, Debug */}
                  <div className="lg:col-span-1 space-y-8">
                    {/* Pomodoro Timer & Productivity */}
                    <div className="glass-card p-6 rounded-3xl text-center">
                      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Links</h4>
                      <div className="flex flex-col items-center gap-6">
                        <Gauge value={Math.min(projects.length * 10 + snippets.length * 5 + logs.length * 2, 100)} max={100} color="#3b82f6" size={120} strokeWidth={8} label="Pontuação" />
                        
                        <div className="w-full pt-6 border-t border-border-dark">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                            <Timer size={14} className="text-roxo-suave" />
                            Timer Pomodoro
                          </h4>
                          <div className="text-3xl font-display font-black text-white mb-4">
                            {formatTime(pomodoroTime)}
                          </div>
                          <div className="flex justify-center gap-3 mb-4">
                            <button 
                              onClick={() => setIsPomodoroActive(!isPomodoroActive)}
                              className={`p-2.5 rounded-full transition-all ${isPomodoroActive ? 'bg-red-500/10 text-red-500' : 'bg-roxo-suave/10 text-roxo-suave'}`}
                            >
                              {isPomodoroActive ? <Pause size={18} /> : <Play size={18} />}
                            </button>
                            <button 
                              onClick={() => {
                                setIsPomodoroActive(false);
                                setPomodoroTime(pomodoroMode === 'work' ? 25 * 60 : 5 * 60);
                              }}
                              className="p-2.5 bg-white/5 rounded-full text-slate-500 hover:text-white"
                            >
                              <RotateCcw size={18} />
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setPomodoroMode('work');
                                setPomodoroTime(25 * 60);
                                setIsPomodoroActive(false);
                              }}
                              className={`flex-1 py-1 rounded-lg text-[9px] font-bold transition-all ${pomodoroMode === 'work' ? 'bg-roxo-suave text-white' : 'bg-white/5 text-slate-500'}`}
                            >
                              Foco Total
                            </button>
                            <button 
                              onClick={() => {
                                setPomodoroMode('break');
                                setPomodoroTime(5 * 60);
                                setIsPomodoroActive(false);
                              }}
                              className={`flex-1 py-1 rounded-lg text-[9px] font-bold transition-all ${pomodoroMode === 'break' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-500'}`}
                            >
                              Pausa
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vercel & Quick Links */}
                    <div className="glass-card p-6 rounded-3xl">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <ExternalLink size={14} className="text-blue-400" />
                        LINKS
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Next.js', icon: Globe, url: 'https://nextjs.org/docs' },
                          { label: 'Supabase', icon: Database, url: 'https://supabase.com/dashboard/org/ulkbhgjkgonlljgokzfd' },
                          { label: 'GitHub', icon: Github, url: 'https://github.com' },
                          { label: 'Vercel', icon: Zap, url: 'https://vercel.com/raquel-caldas-duartes-projects' }
                        ].map(link => (
                          <a 
                            key={link.label}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white/5 rounded-xl border border-border-dark flex items-center gap-2 hover:bg-white/10 transition-all group"
                          >
                            <link.icon size={12} className="text-blue-400" />
                            <span className="text-[9px] font-bold text-slate-400">{link.label}</span>
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Debug Notes */}
                    <div className="glass-card p-6 rounded-3xl">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Terminal size={14} className="text-amber-500" />
                        Debug Notes
                      </h4>
                      <textarea 
                        className="w-full bg-bg-dark border border-border-dark rounded-xl p-3 text-[10px] font-mono text-amber-500/80 h-32 focus:outline-none focus:border-amber-500/50 resize-none"
                        placeholder="Logs..."
                        value={debugNotes}
                        onChange={(e) => setDebugNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'diary' && (
              <motion.div
                key="diary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Mood Tracker & Chart */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card p-6 rounded-3xl">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-lg font-display font-bold text-white flex items-center gap-2">
                          <Smile size={20} className="text-pink-400" />
                          Como você está hoje?
                        </h4>
                      </div>
                      
                      <div className="flex justify-between gap-1 sm:gap-2 mb-6">
                        {[
                          { icon: Smile, mood: 'happy', color: 'text-emerald-500', label: 'Feliz' },
                          { icon: Activity, mood: 'productive', color: 'text-blue-500', label: 'Produtivo' },
                          { icon: Target, mood: 'neutral', color: 'text-amber-500', label: 'Neutro' },
                          { icon: Clock, mood: 'tired', color: 'text-purple-500', label: 'Cansado' },
                          { icon: X, mood: 'sad', color: 'text-red-500', label: 'Triste' }
                        ].map(m => (
                          <button 
                            key={m.mood}
                            onClick={() => addMood(m.mood as MoodEntry['mood'])}
                            className={`flex flex-col items-center gap-2 p-2 sm:p-3 rounded-2xl transition-all ${moods.find(entry => entry.date === new Date().toISOString().split('T')[0])?.mood === m.mood ? 'bg-white/10 scale-105 shadow-lg shadow-white/5' : 'hover:bg-white/5'}`}
                          >
                            <m.icon size={20} className={`${m.color} sm:w-6 sm:h-6`} />
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{m.label}</span>
                          </button>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Sentimentos Detalhados</label>
                        <div className="flex flex-wrap gap-2">
                          {['Ansioso', 'Grato', 'Produtivo', 'Cansado', 'Inspirado', 'Calmo', 'Estressado', 'Focado'].map(tag => (
                            <button
                              key={tag}
                              onClick={() => {
                                if (selectedFeelings.includes(tag)) {
                                  setSelectedFeelings(selectedFeelings.filter(f => f !== tag));
                                } else {
                                  setSelectedFeelings([...selectedFeelings, tag]);
                                }
                                // Update current mood entry with new feelings
                                const currentMood = moods.find(m => m.date === new Date().toISOString().split('T')[0]);
                                if (currentMood) {
                                  addMood(currentMood.mood, selectedFeelings.includes(tag) ? selectedFeelings.filter(f => f !== tag) : [...selectedFeelings, tag]);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${selectedFeelings.includes(tag) ? 'bg-roxo-suave text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="glass-card p-6 rounded-3xl">
                      <h4 className="text-sm font-display font-bold text-white mb-6 flex items-center gap-2">
                        <Activity size={16} className="text-blue-400" />
                        Variação de Humor (7 dias)
                      </h4>
                      <div className="h-32 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[...moods]
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                            .slice(-7)
                            .map(m => ({
                              date: m.date.split('-').slice(1).join('/'),
                              value: m.mood === 'happy' ? 5 : m.mood === 'productive' ? 4 : m.mood === 'neutral' ? 3 : m.mood === 'tired' ? 2 : 1
                            }))}>
                            <XAxis dataKey="date" hide />
                            <YAxis hide domain={[0, 6]} />
                            <RechartsTooltip 
                              contentStyle={{ backgroundColor: '#1e1e1e', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                              itemStyle={{ color: '#6a5acd' }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#6a5acd" 
                              strokeWidth={3} 
                              dot={{ r: 4, fill: '#6a5acd' }}
                              activeDot={{ r: 6, fill: '#fff' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Journaling with AI */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-6 rounded-3xl relative overflow-hidden">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-roxo-suave/20 rounded-2xl flex items-center justify-center text-roxo-suave">
                            <Sparkles size={20} />
                          </div>
                          <div>
                            <h4 className="text-lg font-display font-bold text-white">Reflexão do Dia</h4>
                            <p className="text-xs text-slate-500">Cultive a gratidão e o autoconhecimento</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setIsPrivateMode(!isPrivateMode)}
                            className={`p-2 rounded-xl transition-all ${isPrivateMode ? 'bg-amber-500/10 text-amber-500' : 'text-slate-400 hover:bg-white/5'}`}
                            title={isPrivateMode ? "Desativar Modo Privado" : "Ativar Modo Privado"}
                          >
                            {isPrivateMode ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                          <button 
                            onClick={saveDiaryEntry}
                            className="flex items-center gap-2 px-4 py-2 bg-roxo-suave text-white rounded-xl text-xs font-bold hover:bg-roxo-suave/80 transition-all"
                          >
                            <Save size={16} />
                            Salvar
                          </button>
                        </div>
                      </div>

                      <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-border-dark group">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-roxo-suave uppercase tracking-widest">Sugestão da IA</span>
                          <button 
                            onClick={suggestAIQuestion}
                            className="p-1 text-slate-500 hover:text-white transition-all"
                          >
                            <RefreshCw size={12} />
                          </button>
                        </div>
                        <p className="text-sm text-white font-medium italic">"{aiQuestion}"</p>
                      </div>

                      <div className="relative">
                        <textarea 
                          value={currentDiaryContent}
                          onChange={(e) => setCurrentDiaryContent(e.target.value)}
                          placeholder="Comece a escrever sua reflexão aqui..."
                          className={`w-full h-64 bg-transparent border-none focus:ring-0 text-slate-300 leading-relaxed resize-none transition-all duration-500 ${isPrivateMode ? 'blur-md hover:blur-none' : ''}`}
                        />
                        {savedFeedback.diary && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-4 right-4 flex items-center gap-2 text-emerald-500 text-xs font-bold bg-emerald-500/10 px-3 py-1.5 rounded-full"
                          >
                            <CheckCircle size={14} />
                            Salvo com sucesso
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Habit Tracker */}
                    <div className="glass-card p-6 rounded-3xl">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-lg font-display font-bold text-white flex items-center gap-2">
                          <Activity size={20} className="text-emerald-400" />
                          Monitor de Hábitos
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Foco Diário</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {habits.map(habit => {
                          const HabitIcon = habit.title === 'Meditação' ? Brain : 
                                           habit.title === 'Leitura' ? Book :
                                           habit.title === 'Exercício' ? Dumbbell : Droplets;
                          
                          // Color based on streak
                          const streakColor = habit.streak > 15 ? 'text-amber-400' : 
                                             habit.streak > 7 ? 'text-roxo-suave' : 
                                             'text-blue-400';

                          return (
                            <button
                              key={habit.id}
                              onClick={() => toggleHabit(habit.id)}
                              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${habit.completedToday ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-border-dark hover:bg-white/10'}`}
                            >
                              <div className={`p-3 rounded-xl ${habit.completedToday ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                <HabitIcon size={20} />
                              </div>
                              <div className="text-center">
                                <p className={`text-xs font-bold ${habit.completedToday ? 'text-white' : 'text-slate-400'}`}>{habit.title}</p>
                                <div className="flex items-center justify-center gap-1 mt-1">
                                  <Zap size={10} className={streakColor} />
                                  <span className={`text-[10px] font-bold ${streakColor}`}>{habit.streak} dias</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meu Espaço de Escrita Livre (Personal Notes) */}
                <div className="glass-card p-6 md:p-8 rounded-3xl relative overflow-hidden">
                  {/* Textured Background Effect */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
                  
                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-roxo-suave/20 rounded-2xl flex items-center justify-center text-roxo-suave">
                          <BookOpen size={24} />
                        </div>
                        <div>
                          <h4 className="text-xl font-display font-bold text-white">Meu Espaço de Escrita Livre</h4>
                          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Anotações Pessoais & Markdown</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={addPersonalNote}
                          className="flex items-center gap-2 px-5 py-2.5 bg-roxo-suave text-white rounded-2xl text-sm font-bold hover:bg-roxo-suave/80 transition-all shadow-lg shadow-roxo-suave/20"
                        >
                          <Plus size={18} />
                          Nova Anotação
                        </button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {personalNotes.filter(n => !n.isArchived).map(note => (
                        <div key={note.id} className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                          <div className="flex flex-col gap-4">
                            {/* Note Header: Title & Context */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <input 
                                type="text"
                                value={note.title}
                                onChange={(e) => updatePersonalNote(note.id, { title: e.target.value })}
                                placeholder="Título da Nota..."
                                className="bg-transparent border-none focus:ring-0 text-lg font-display font-bold text-white placeholder-slate-700 w-full sm:w-1/2"
                              />
                              <div className="flex items-center gap-3">
                                {/* Weather Selector */}
                                <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/5">
                                  {[
                                    { icon: Sun, val: '☀️' },
                                    { icon: CloudRain, val: '🌧️' },
                                    { icon: Cloud, val: '☁️' }
                                  ].map(w => (
                                    <button
                                      key={w.val}
                                      onClick={() => updatePersonalNote(note.id, { weather: w.val as any })}
                                      className={`p-1.5 rounded-lg transition-all ${note.weather === w.val ? 'bg-roxo-suave text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                      <w.icon size={14} />
                                    </button>
                                  ))}
                                </div>
                                {/* Location */}
                                <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-1.5 border border-white/5">
                                  <MapPin size={14} className="text-slate-500" />
                                  <input 
                                    type="text"
                                    value={note.location || ''}
                                    onChange={(e) => updatePersonalNote(note.id, { location: e.target.value })}
                                    placeholder="Local..."
                                    className="bg-transparent border-none focus:ring-0 text-[10px] font-bold text-slate-400 placeholder-slate-700 w-20"
                                  />
                                </div>
                                {/* Category */}
                                <select
                                  value={note.category}
                                  onChange={(e) => updatePersonalNote(note.id, { category: e.target.value as any })}
                                  className="bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-[10px] font-bold text-roxo-suave focus:ring-0 focus:border-roxo-suave/50"
                                >
                                  {['Geral', 'Desabafos', 'Sonhos', 'Ideias para o Futuro'].map(cat => (
                                    <option key={cat} value={cat} className="bg-bg-dark">{cat}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Editor Area */}
                            <div className="relative group">
                              <textarea 
                                value={note.content}
                                onChange={(e) => updatePersonalNote(note.id, { content: e.target.value })}
                                placeholder="Escreva seus pensamentos aqui... (Markdown aceito)"
                                className={`w-full min-h-[150px] bg-white/5 border border-white/5 rounded-2xl p-4 text-slate-300 text-sm leading-relaxed focus:ring-2 focus:ring-roxo-suave/30 focus:border-roxo-suave/50 transition-all resize-y ${note.isLocked ? 'blur-md select-none pointer-events-none' : ''}`}
                              />
                              {note.isLocked && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="bg-bg-dark/80 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col items-center gap-2">
                                    <Lock size={24} className="text-amber-500" />
                                    <span className="text-xs font-bold text-slate-400">Nota Bloqueada</span>
                                    <button 
                                      onClick={() => updatePersonalNote(note.id, { isLocked: false })}
                                      className="mt-2 text-[10px] font-bold text-roxo-suave uppercase tracking-widest hover:underline"
                                    >
                                      Desbloquear
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Markdown Preview (Optional Toggle or always visible if not editing?) */}
                            {note.content && !note.isLocked && (
                              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 block">Preview Markdown</span>
                                <div className="prose prose-invert prose-sm max-w-none text-slate-400">
                                  <Markdown>{note.content}</Markdown>
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-between items-center pt-2">
                              <div className="flex items-center gap-4">
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                  Criado em: {new Date(note.createdAt).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => updatePersonalNote(note.id, { isLocked: !note.isLocked })}
                                  className={`p-2.5 rounded-xl transition-all ${note.isLocked ? 'bg-amber-500/20 text-amber-500' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                  title="Bloquear/Desbloquear"
                                >
                                  {note.isLocked ? <Lock size={18} /> : <Shield size={18} />}
                                </button>
                                <button 
                                  onClick={() => archivePersonalNote(note.id)}
                                  className="p-2.5 bg-white/5 text-slate-400 rounded-xl hover:bg-white/10 transition-all"
                                  title="Arquivar"
                                >
                                  <Archive size={18} />
                                </button>
                                <button 
                                  onClick={() => deletePersonalNote(note.id)}
                                  className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"
                                  title="Excluir"
                                >
                                  <Trash2 size={18} />
                                </button>
                                <button 
                                  onClick={() => handleSaveScratchNote(note.id)} // Reuse feedback logic
                                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                    savedFeedback[note.id] 
                                      ? 'bg-emerald-500 text-white' 
                                      : 'bg-roxo-suave text-white hover:bg-roxo-suave/80'
                                  } shadow-lg shadow-roxo-suave/20`}
                                >
                                  {savedFeedback[note.id] ? <CheckCircle2 size={16} /> : <Save size={16} />}
                                  {savedFeedback[note.id] ? 'Salvo!' : 'Guardar Nota'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {personalNotes.filter(n => !n.isArchived).length === 0 && (
                        <div className="text-center py-16 border-2 border-dashed border-border-dark rounded-3xl">
                          <BookOpen size={48} className="mx-auto mb-4 text-slate-700 opacity-20" />
                          <p className="text-slate-500 font-medium">Seu espaço de escrita está pronto.</p>
                          <p className="text-xs text-slate-600">Comece uma nova anotação para registrar seus desabafos, sonhos ou ideias.</p>
                        </div>
                      )}
                    </div>

                    {/* Archived Section Toggle */}
                    {personalNotes.some(n => n.isArchived) && (
                      <div className="mt-12 pt-8 border-t border-white/5">
                        <h5 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <Archive size={14} />
                          Notas Arquivadas
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {personalNotes.filter(n => n.isArchived).map(note => (
                            <div key={note.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group">
                              <div>
                                <h6 className="text-sm font-bold text-slate-400">{note.title || 'Sem título'}</h6>
                                <p className="text-[10px] text-slate-600">{note.category} • {new Date(note.createdAt).toLocaleDateString('pt-BR')}</p>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button 
                                  onClick={() => archivePersonalNote(note.id)}
                                  className="p-2 text-roxo-suave hover:bg-roxo-suave/10 rounded-lg"
                                  title="Desarquivar"
                                >
                                  <RotateCcw size={14} />
                                </button>
                                <button 
                                  onClick={() => deletePersonalNote(note.id)}
                                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                                  title="Excluir"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline of Memories */}
                <div className="glass-card p-6 md:p-8 rounded-3xl">
                  <div className="flex justify-between items-center mb-8">
                    <h4 className="text-xl font-display font-bold text-white flex items-center gap-3">
                      <History size={24} className="text-roxo-suave" />
                      Recordações Recentes
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {diaryEntries.length > 0 ? (
                      diaryEntries.slice(0, 6).map(entry => (
                        <div key={entry.id} className="p-6 bg-white/5 rounded-2xl border border-border-dark hover:border-roxo-suave/30 transition-all group">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-slate-500" />
                              <span className="text-xs font-bold text-slate-500">{new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-roxo-suave/10 flex items-center justify-center text-roxo-suave opacity-0 group-hover:opacity-100 transition-all">
                              <ChevronRight size={16} />
                            </div>
                          </div>
                          <p className="text-sm text-slate-400 line-clamp-3 italic mb-4">"{entry.content}"</p>
                          {entry.aiQuestion && (
                            <div className="pt-4 border-t border-white/5">
                              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Reflexão sugerida</p>
                              <p className="text-[10px] text-slate-500 italic truncate">{entry.aiQuestion}</p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-border-dark rounded-2xl">
                        <StickyNote size={48} className="mb-4 opacity-20" />
                        <p className="font-medium">Nenhuma memória registrada ainda.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'studies' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-[1600px] mx-auto px-4 sm:px-8 py-6 h-full flex flex-col"
              >
                {/* SaaS Study Header with Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-indigo-500/20">
                      📚
                    </div>
                    <div>
                      <h2 className="text-3xl font-display font-bold text-white tracking-tight">Estudos</h2>
                      <p className="text-slate-400 text-sm font-medium">Sua central de conhecimento e produtividade.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-1 max-w-xl">
                    <div className="relative flex-1 group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                      <input 
                        type="text"
                        placeholder="Pesquisar em notas, tópicos ou planos..."
                        value={studySearchQuery}
                        onChange={(e) => setStudySearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-slate-600"
                      />
                    </div>
                    <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                      <Filter size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
                  {/* Internal Sidebar */}
                  <aside className="lg:w-64 flex flex-col gap-2">
                    {[
                      { id: 'general', label: 'Geral', icon: LayoutDashboard, color: 'text-indigo-400' },
                      { id: 'notes', label: 'Anotações', icon: BookOpen, color: 'text-emerald-400' },
                      { id: 'topics', label: 'Tópicos', icon: ListChecks, color: 'text-rose-400' },
                      { id: 'focus', label: 'Foco (Timer)', icon: Timer, color: 'text-amber-400' },
                      { id: 'planning', label: 'Planejamento', icon: Calendar, color: 'text-sky-400' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveStudyTab(item.id as any)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group ${
                          activeStudyTab === item.id 
                            ? 'bg-white/10 text-white shadow-lg border border-white/10' 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <item.icon size={20} className={activeStudyTab === item.id ? item.color : 'text-slate-600 group-hover:text-slate-400'} />
                        <span className="font-bold text-sm tracking-wide">{item.label}</span>
                        {activeStudyTab === item.id && (
                          <motion.div layoutId="activeStudyTab" className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </button>
                    ))}

                    <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                      <div className="flex items-center justify-between px-4">
                        <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Cadernos</h4>
                        <button 
                          onClick={() => {
                            const name = prompt('Nome do novo caderno:');
                            if (name) handleAddStudyNotebook(name);
                          }}
                          className="p-1 text-slate-600 hover:text-indigo-400 transition-colors"
                        >
                          <FolderPlus size={14} />
                        </button>
                      </div>
                      <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar px-2">
                        <button
                          onClick={() => setSelectedNotebookId(null)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                            selectedNotebookId === null ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          <Layers size={14} />
                          Todos os Blocos
                        </button>
                        {studyNotebooks.map(notebook => (
                          <div key={notebook.id} className="group flex items-center">
                            <button
                              onClick={() => setSelectedNotebookId(notebook.id)}
                              className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                                selectedNotebookId === notebook.id ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                              }`}
                            >
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: notebook.color }} />
                              <span className="truncate">{notebook.title}</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteStudyNotebook(notebook.id)}
                              className="p-1 text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </aside>

                  {/* Main Content Area */}
                  <main className="flex-1 min-h-0 bg-white/[0.02] border border-white/5 rounded-[32px] p-8 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                      {activeStudyTab === 'general' && (
                        <motion.div
                          key="general"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-10"
                        >
                          {/* Dashboard Header */}
                          <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-display font-bold text-white">Dashboard de Estudos</h3>
                            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                              <Sparkles size={16} className="text-indigo-400" />
                              <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Premium Active</span>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                              { label: 'Total de Notas', value: studyNotes.length, icon: BookOpen, color: 'bg-indigo-500/20 text-indigo-400' },
                              { label: 'Tópicos Concluídos', value: studyTopics.filter(t => t.completed).length, icon: CheckCircle2, color: 'bg-emerald-500/20 text-emerald-400' },
                              { label: 'Sessões de Foco', value: studySessions.length, icon: Timer, color: 'bg-amber-500/20 text-amber-400' },
                              { label: 'Tempo Total', value: `${Math.floor(studySessions.reduce((acc, s) => acc + s.duration, 0) / 60)}h`, icon: Clock, color: 'bg-rose-500/20 text-rose-400' },
                            ].map((stat, i) => (
                              <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:border-white/20 transition-all group">
                                <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                  <stat.icon size={24} />
                                </div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                                <h4 className="text-3xl font-display font-bold text-white">{stat.value}</h4>
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Recent Progress */}
                            <div className="glass-card p-8 rounded-3xl border-white/5">
                              <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                                <TrendingUp size={20} className="text-emerald-400" />
                                Evolução Semanal
                              </h4>
                              <div className="h-48 w-full flex items-end gap-2 px-2">
                                {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div className="w-full relative">
                                      <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        className={`w-full rounded-t-lg transition-all ${i === 3 ? 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-white/10 group-hover:bg-white/20'}`}
                                      />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                      {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Priority Topics */}
                            <div className="glass-card p-8 rounded-3xl border-white/5">
                              <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                                <Target size={20} className="text-rose-400" />
                                Prioridades Críticas
                              </h4>
                              <div className="space-y-4">
                                {studyTopics.filter(t => t.priority === 'High' && !t.completed).slice(0, 4).map(topic => (
                                  <div key={topic.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-rose-500/30 transition-all group">
                                    <div className="flex items-center gap-3">
                                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                      <span className="text-sm font-medium text-slate-200">{topic.title}</span>
                                    </div>
                                    <button 
                                      onClick={() => handleToggleStudyTopic(topic.id)}
                                      className="p-2 text-slate-600 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                    >
                                      <Check size={16} />
                                    </button>
                                  </div>
                                ))}
                                {studyTopics.filter(t => t.priority === 'High' && !t.completed).length === 0 && (
                                  <div className="py-8 text-center text-slate-600 italic text-sm">
                                    Nenhuma prioridade alta pendente.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {activeStudyTab === 'notes' && (
                        <motion.div
                          key="notes"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-8"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-2xl font-display font-bold text-white">Notas de Estudo</h3>
                              <p className="text-slate-500 text-sm mt-1">
                                {selectedNotebookId 
                                  ? `Visualizando: ${studyNotebooks.find(n => n.id === selectedNotebookId)?.title}` 
                                  : 'Todos os seus blocos de conhecimento.'}
                              </p>
                            </div>
                            <button 
                              onClick={() => {
                                setEditingStudyNoteId(null);
                                setActiveStudyNoteId(null);
                                setNewStudyNote('');
                                setIsStudyNoteFocusMode(true);
                              }}
                              className="px-6 py-3 bg-indigo-500 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                            >
                              <FilePlus size={20} />
                              Nova Nota
                            </button>
                          </div>

                          {/* Notes Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            <AnimatePresence mode="popLayout">
                              {studyNotes
                                .filter(note => {
                                  const matchesSearch = note.title.toLowerCase().includes(studySearchQuery.toLowerCase()) || 
                                                       note.content.toLowerCase().includes(studySearchQuery.toLowerCase());
                                  const matchesNotebook = selectedNotebookId ? note.notebookId === selectedNotebookId : true;
                                  return matchesSearch && matchesNotebook;
                                })
                                .map(note => (
                                  <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    key={note.id}
                                    onClick={() => handleEditStudyNote(note)}
                                    className="group relative bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-indigo-500/50 hover:bg-white/[0.08] transition-all cursor-pointer flex flex-col h-64"
                                  >
                                    <div className="flex items-start justify-between mb-4">
                                      <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                        <StickyNote size={20} />
                                      </div>
                                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleDeleteStudyNote(note.id); }}
                                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                    <h4 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                                      {note.title || 'Sem título'}
                                    </h4>
                                    <div className="text-sm text-slate-400 line-clamp-4 leading-relaxed flex-1 overflow-hidden">
                                      <Markdown>{note.content}</Markdown>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                        {new Date(note.updatedAt).toLocaleDateString('pt-BR')}
                                      </span>
                                      {note.notebookId && (
                                        <div className="flex items-center gap-1.5">
                                          <div 
                                            className="w-1.5 h-1.5 rounded-full" 
                                            style={{ backgroundColor: studyNotebooks.find(nb => nb.id === note.notebookId)?.color || '#6366f1' }} 
                                          />
                                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            {studyNotebooks.find(nb => nb.id === note.notebookId)?.title}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                ))}
                            </AnimatePresence>
                          </div>

                          {studyNotes.length === 0 && (
                            <div className="py-32 text-center">
                              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <BookOpen size={40} className="text-slate-700" />
                              </div>
                              <h4 className="text-xl font-bold text-slate-400">Nenhuma nota encontrada</h4>
                              <p className="text-slate-600 mt-2">Comece a documentar seu aprendizado hoje.</p>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {activeStudyTab === 'topics' && (
                        <motion.div
                          key="topics"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="max-w-4xl mx-auto space-y-8"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-display font-bold text-white">Tópicos de Estudo</h3>
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /> Alta</span>
                              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> Média</span>
                              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Baixa</span>
                            </div>
                          </div>

                          {/* Add Topic Bar */}
                          <div className="flex flex-col md:flex-row gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl shadow-xl">
                            <input
                              type="text"
                              value={newStudyTopic}
                              onChange={(e) => setNewStudyTopic(e.target.value)}
                              placeholder="O que você precisa aprender?"
                              className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-slate-600 text-lg"
                            />
                            <div className="flex items-center gap-3">
                              <select 
                                value={newStudyTopicPriority}
                                onChange={(e) => setNewStudyTopicPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-slate-400 focus:outline-none focus:border-indigo-500/50"
                              >
                                <option value="Low">Baixa</option>
                                <option value="Medium">Média</option>
                                <option value="High">Alta</option>
                              </select>
                              <button
                                onClick={handleAddStudyTopic}
                                disabled={!newStudyTopic.trim()}
                                className="px-6 py-2.5 bg-white text-black rounded-xl font-bold hover:bg-slate-200 disabled:opacity-50 transition-all flex items-center gap-2"
                              >
                                <Plus size={18} />
                                Adicionar
                              </button>
                            </div>
                          </div>

                          {/* Topics List */}
                          <div className="space-y-3">
                            <AnimatePresence mode="popLayout">
                              {studyTopics
                                .filter(t => t.title.toLowerCase().includes(studySearchQuery.toLowerCase()))
                                .sort((a, b) => {
                                  if (a.completed !== b.completed) return a.completed ? 1 : -1;
                                  const priorityMap = { High: 0, Medium: 1, Low: 2 };
                                  return priorityMap[a.priority] - priorityMap[b.priority];
                                })
                                .map(topic => (
                                  <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    key={topic.id}
                                    className={`group flex items-center justify-between p-5 rounded-2xl border transition-all ${
                                      topic.completed 
                                        ? 'bg-white/[0.01] border-white/5 opacity-60' 
                                        : 'bg-white/5 border-white/10 hover:border-white/20'
                                    }`}
                                  >
                                    <div className="flex items-center gap-4">
                                      <button
                                        onClick={() => handleToggleStudyTopic(topic.id)}
                                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                          topic.completed 
                                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                                            : 'border-white/20 hover:border-indigo-500'
                                        }`}
                                      >
                                        {topic.completed && <Check size={14} strokeWidth={3} />}
                                      </button>
                                      <div>
                                        <span className={`text-base font-medium transition-all ${topic.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                          {topic.title}
                                        </span>
                                        <div className="flex items-center gap-3 mt-1">
                                          <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                              topic.priority === 'High' ? 'bg-rose-500' : 
                                              topic.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`} />
                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{topic.priority}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => handleDeleteStudyTopic(topic.id)}
                                      className="p-2 text-slate-700 hover:text-red-400 hover:bg-red-400/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </motion.div>
                                ))}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )}

                      {activeStudyTab === 'focus' && (
                        <motion.div
                          key="focus"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="max-w-4xl mx-auto flex flex-col items-center justify-center py-10"
                        >
                          {/* Premium Focus Timer */}
                          <div className="w-full max-w-md glass-card p-12 rounded-[48px] border-white/10 text-center relative overflow-hidden shadow-2xl">
                            {/* Animated Background Pulse */}
                            {isPomodoroActive && (
                              <motion.div 
                                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className={`absolute inset-0 ${pomodoroMode === 'work' ? 'bg-indigo-500' : 'bg-emerald-500'} blur-[100px] -z-10`}
                              />
                            )}

                            <div className="flex items-center justify-center gap-3 mb-12">
                              {['work', 'break'].map((mode) => (
                                <button
                                  key={mode}
                                  onClick={() => {
                                    setPomodoroMode(mode as any);
                                    setPomodoroTime(mode === 'work' ? 25 * 60 : 5 * 60);
                                    setIsPomodoroActive(false);
                                  }}
                                  className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                                    pomodoroMode === mode 
                                      ? 'bg-white text-black shadow-lg' 
                                      : 'text-slate-500 hover:text-slate-300'
                                  }`}
                                >
                                  {mode === 'work' ? 'Foco' : 'Pausa'}
                                </button>
                              ))}
                            </div>

                            <div className="relative mb-12">
                              {/* Progress Ring (SVG) */}
                              <svg className="w-64 h-64 mx-auto -rotate-90">
                                <circle
                                  cx="128"
                                  cy="128"
                                  r="120"
                                  stroke="currentColor"
                                  strokeWidth="8"
                                  fill="transparent"
                                  className="text-white/5"
                                />
                                <motion.circle
                                  cx="128"
                                  cy="128"
                                  r="120"
                                  stroke="currentColor"
                                  strokeWidth="8"
                                  fill="transparent"
                                  strokeDasharray="754"
                                  animate={{ strokeDashoffset: 754 - (754 * (pomodoroTime / (pomodoroMode === 'work' ? 25 * 60 : 5 * 60))) }}
                                  className={pomodoroMode === 'work' ? 'text-indigo-500' : 'text-emerald-500'}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-6xl font-display font-black text-white tracking-tighter">
                                  {formatTime(pomodoroTime)}
                                </span>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">
                                  {pomodoroMode === 'work' ? 'Sessão de Estudo' : 'Hora de Relaxar'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-center gap-6">
                              <button
                                onClick={() => setIsPomodoroActive(!isPomodoroActive)}
                                className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all shadow-2xl ${
                                  isPomodoroActive 
                                    ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' 
                                    : 'bg-white text-black hover:scale-105 hover:shadow-white/20'
                                }`}
                              >
                                {isPomodoroActive ? <Pause size={32} /> : <Play size={32} fill="currentColor" />}
                              </button>
                              <button
                                onClick={() => {
                                  setIsPomodoroActive(false);
                                  setPomodoroTime(pomodoroMode === 'work' ? 25 * 60 : 5 * 60);
                                }}
                                className="w-16 h-16 bg-white/5 border border-white/10 rounded-3xl text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
                              >
                                <RotateCcw size={24} />
                              </button>
                            </div>
                          </div>

                          {/* Session History */}
                          <div className="w-full max-w-2xl mt-16 space-y-6">
                            <div className="flex items-center justify-between px-4">
                              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Histórico de Sessões</h4>
                              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                                {studySessions.length} sessões hoje
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {studySessions.slice(0, 4).map(session => (
                                <div key={session.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
                                      <Timer size={16} />
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-white uppercase tracking-wider">{session.type === 'work' ? 'Foco' : 'Pausa'}</p>
                                      <p className="text-[10px] text-slate-500">{new Date(session.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                  </div>
                                  <span className="text-sm font-bold text-slate-300">{session.duration} min</span>
                                </div>
                              ))}
                              {studySessions.length === 0 && (
                                <div className="col-span-full py-10 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-2xl text-slate-600 text-sm">
                                  Nenhuma sessão registrada ainda.
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {activeStudyTab === 'planning' && (
                        <motion.div
                          key="planning"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="max-w-5xl mx-auto space-y-10"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-display font-bold text-white">Cronograma de Estudos</h3>
                            <div className="flex items-center gap-2">
                              <button className="p-2 text-slate-500 hover:text-white transition-colors"><ChevronRight className="rotate-180" size={20} /></button>
                              <span className="text-sm font-bold text-white uppercase tracking-widest">Março 2026</span>
                              <button className="p-2 text-slate-500 hover:text-white transition-colors"><ChevronRight size={20} /></button>
                            </div>
                          </div>

                          {/* Add Plan Form */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl">
                            <div className="md:col-span-2">
                              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 block">O que estudar?</label>
                              <input
                                type="text"
                                value={newStudyPlanTitle}
                                onChange={(e) => setNewStudyPlanTitle(e.target.value)}
                                placeholder="Ex: Revisar React Hooks"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 block">Data</label>
                              <input
                                type="date"
                                value={newStudyPlanDate}
                                onChange={(e) => setNewStudyPlanDate(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                              />
                            </div>
                            <div className="flex items-end">
                              <button
                                onClick={handleAddStudyPlan}
                                disabled={!newStudyPlanTitle.trim() || !newStudyPlanDate}
                                className="w-full py-2.5 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                              >
                                <Plus size={18} />
                                Agendar
                              </button>
                            </div>
                          </div>

                          {/* Grouped Plans */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {['Hoje', 'Amanhã', 'Futuro'].map((group) => {
                              const todayStr = new Date().toISOString().split('T')[0];
                              const tomorrow = new Date();
                              tomorrow.setDate(tomorrow.getDate() + 1);
                              const tomorrowStr = tomorrow.toISOString().split('T')[0];

                              const filteredPlans = studyPlans.filter(plan => {
                                if (group === 'Hoje') return plan.date === todayStr;
                                if (group === 'Amanhã') return plan.date === tomorrowStr;
                                return plan.date > tomorrowStr;
                              });

                              return (
                                <div key={group} className="space-y-6">
                                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{group}</h4>
                                    <span className="px-2 py-0.5 bg-white/5 rounded-md text-[10px] font-bold text-slate-500">{filteredPlans.length}</span>
                                  </div>
                                  <div className="space-y-4">
                                    {filteredPlans.map(plan => (
                                      <div 
                                        key={plan.id} 
                                        className={`p-5 rounded-2xl border transition-all group ${
                                          plan.completed 
                                            ? 'bg-white/[0.01] border-white/5 opacity-50' 
                                            : 'bg-white/5 border-white/10 hover:border-indigo-500/30'
                                        }`}
                                      >
                                        <div className="flex items-start justify-between mb-3">
                                          <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                                            plan.priority === 'High' ? 'bg-rose-500/20 text-rose-400' : 
                                            plan.priority === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                                          }`}>
                                            {plan.priority}
                                          </div>
                                          <button 
                                            onClick={() => handleToggleStudyPlan(plan.id)}
                                            className={`p-1.5 rounded-lg transition-all ${plan.completed ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-600 hover:text-white hover:bg-white/10'}`}
                                          >
                                            <CheckCircle2 size={16} />
                                          </button>
                                        </div>
                                        <h5 className={`text-sm font-bold mb-1 ${plan.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                                          {plan.title}
                                        </h5>
                                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                                          {new Date(plan.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                                        </p>
                                      </div>
                                    ))}
                                    {filteredPlans.length === 0 && (
                                      <div className="py-10 text-center border-2 border-dashed border-white/5 rounded-2xl text-slate-700 text-xs italic">
                                        Nada agendado.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </main>
                </div>

                {/* Focus Mode Overlay for Notes */}
                <AnimatePresence>
                  {isStudyNoteFocusMode && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[200] bg-bg-dark flex flex-col p-8 md:p-20"
                    >
                      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-12">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                              <Edit2 size={20} />
                            </div>
                            <h3 className="text-xl font-display font-bold text-white">
                              {editingStudyNoteId ? 'Editando Nota' : 'Nova Nota de Estudo'}
                            </h3>
                          </div>
                          <button 
                            onClick={() => setIsStudyNoteFocusMode(false)}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"
                          >
                            <Minimize2 size={24} />
                          </button>
                        </div>

                        <div className="flex-1 flex flex-col gap-6">
                          <input 
                            type="text"
                            placeholder="Título da nota..."
                            value={activeStudyNoteTitle}
                            onChange={(e) => setActiveStudyNoteTitle(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-4xl font-display font-bold text-white placeholder-slate-800"
                          />
                          
                          <div className="flex items-center gap-4 py-4 border-y border-white/5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Caderno:</span>
                              <select 
                                value={selectedNotebookId || ''}
                                onChange={(e) => setSelectedNotebookId(e.target.value || null)}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest focus:outline-none focus:border-indigo-500/50"
                              >
                                <option value="">Nenhum</option>
                                {studyNotebooks.map(nb => (
                                  <option key={nb.id} value={nb.id}>{nb.title}</option>
                                ))}
                              </select>
                            </div>
                            <div className="h-4 w-px bg-white/5" />
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Palavras:</span>
                              <span className="text-[10px] font-bold text-indigo-400">{newStudyNote.split(/\s+/).filter(Boolean).length}</span>
                            </div>
                          </div>

                          <textarea
                            value={newStudyNote}
                            onChange={(e) => setNewStudyNote(e.target.value)}
                            placeholder="Comece a escrever seu conhecimento aqui... Suporta Markdown."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-xl text-slate-300 placeholder-slate-800 resize-none leading-relaxed custom-scrollbar py-8"
                          />
                        </div>

                        <div className="mt-12 flex items-center justify-between gap-4">
                          <button
                            onClick={async () => {
                              if (!newStudyNote.trim()) return;
                              try {
                                const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
                                const response = await ai.models.generateContent({
                                  model: "gemini-3-flash-preview",
                                  contents: `Resuma esta nota de estudo de forma concisa e profissional, mantendo os pontos principais. Use Markdown.\n\nNota:\n${newStudyNote}`,
                                });
                                if (response.text) {
                                  setNewStudyNote(prev => prev + "\n\n---\n### Resumo IA\n" + response.text);
                                  showToastWithMsg('Resumo gerado com sucesso!');
                                }
                              } catch (error) {
                                console.error('Erro ao resumir nota:', error);
                                showToastWithMsg('Erro ao conectar com a IA.');
                              }
                            }}
                            className="px-6 py-4 bg-indigo-500/10 text-indigo-400 rounded-2xl font-bold hover:bg-indigo-500/20 transition-all flex items-center gap-2"
                          >
                            <Sparkles size={20} />
                            Resumir com IA
                          </button>
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => setIsStudyNoteFocusMode(false)}
                              className="px-8 py-4 text-slate-500 font-bold hover:text-white transition-all"
                            >
                              Descartar
                            </button>
                            <button
                              onClick={() => {
                                handleSaveStudyNote();
                                setIsStudyNoteFocusMode(false);
                              }}
                              disabled={!newStudyNote.trim() || !activeStudyNoteTitle.trim()}
                              className="px-10 py-4 bg-white text-black rounded-2xl font-bold hover:bg-slate-200 disabled:opacity-50 transition-all shadow-2xl shadow-white/10 flex items-center gap-3"
                            >
                              <Save size={20} />
                              Finalizar e Salvar
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                {/* Personalização Visual */}
                <div className="glass-card p-6 md:p-8 rounded-3xl">
                  <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                    <Palette size={24} className="text-roxo-suave" />
                    Personalização Visual
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Monitor size={16} /> Tema de Fundo
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: 'original', label: 'Dark Mode Original', color: '#1e1e1e' },
                          { id: 'deep', label: 'Deep Black (OLED)', color: '#000000' },
                          { id: 'navy', label: 'Navy Blue', color: '#0a192f' },
                          { id: 'light-rose', label: 'Light Rose', color: '#fff5f7' }
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => setTheme(t.id as any)}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${theme === t.id ? 'border-roxo-suave bg-roxo-suave/10' : 'border-border-dark bg-white/5 hover:bg-white/10'}`}
                          >
                            <span className="text-sm font-medium text-white">{t.label}</span>
                            <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: t.color }} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Zap size={16} /> Cor de Destaque
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {[
                            { color: '#6a5acd', label: 'Roxo' },
                            { color: '#10b981', label: 'Verde' },
                            { color: '#3b82f6', label: 'Azul' },
                            { color: '#f472b6', label: 'Rosa Neon' }
                          ].map(c => (
                            <button
                              key={c.color}
                              onClick={() => setAccentColor(c.color)}
                              className={`w-10 h-10 rounded-full border-2 transition-all ${accentColor === c.color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                              style={{ backgroundColor: c.color }}
                              title={c.label}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Layers size={16} /> Arredondamento dos Cards
                        </label>
                        <div className="px-2">
                          <input 
                            type="range" 
                            min="0" 
                            max="48" 
                            value={borderRadius}
                            onChange={(e) => setBorderRadius(parseInt(e.target.value))}
                            className="w-full accent-roxo-suave"
                          />
                          <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-2">
                            <span>QUADRADO</span>
                            <span>{borderRadius}px</span>
                            <span>ARREDONDADO</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Perfil e Segurança */}
                <div className="glass-card p-6 md:p-8 rounded-3xl">
                  <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                    <Shield size={24} className="text-red-400" />
                    Perfil e Segurança
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gestão de Acesso</label>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-500 font-bold ml-1">E-MAIL ATUAL</p>
                          <input 
                            type="email" 
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            className="w-full bg-white/5 border border-border-dark rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-roxo-suave"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-500 font-bold ml-1">NOVA SENHA</p>
                          <input 
                            type="password" 
                            value={userPassword}
                            onChange={(e) => setUserPassword(e.target.value)}
                            className="w-full bg-white/5 border border-border-dark rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-roxo-suave"
                          />
                        </div>
                        <button className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all">
                          Atualizar Credenciais
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sessão e Sistema</label>
                      <div className="space-y-4">
                        <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl flex flex-col items-center justify-center text-center">
                          <LogOut size={32} className="text-red-400 mb-3" />
                          <p className="text-sm text-slate-300 mb-4">Deseja encerrar sua sessão atual?</p>
                          <button 
                            onClick={() => setIsAuthenticated(false)}
                            className="px-6 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                          >
                            Sair do Sistema
                          </button>
                        </div>

                        <div className="p-4 bg-white/5 border border-border-dark rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-roxo-suave/10 rounded-lg text-roxo-suave">
                              <Volume2 size={18} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">Sons do Sistema</p>
                              <p className="text-[9px] text-slate-500 uppercase tracking-widest">Efeitos ao clicar</p>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const newState = !soundEnabled;
                              setSoundEnabled(newState);
                              // Always play sound on toggle to confirm
                              const audio = new Audio('https://www.soundjay.com/buttons/button-16.mp3');
                              audio.volume = 0.2;
                              audio.play().catch(() => {});
                            }}
                            className={`w-10 h-5 rounded-full transition-all relative ${soundEnabled ? 'bg-roxo-suave' : 'bg-slate-700'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${soundEnabled ? 'left-5.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Integrações */}
                <div className="glass-card p-6 md:p-8 rounded-3xl">
                  <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                    <Globe size={24} className="text-roxo-suave" />
                    Integrações
                  </h3>
                  
                  <div className="space-y-4">
                    <p className="text-sm text-slate-400">
                      Conecte sua conta para sincronizar dados e automatizar sua rotina.
                    </p>
                    
                    <button
                      onClick={handleConnectGoogle}
                      disabled={isGoogleConnected}
                      className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all shadow-lg ${
                        isGoogleConnected 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default' 
                          : 'bg-white text-black hover:scale-105 active:scale-95 shadow-white/10'
                      }`}
                    >
                      {isGoogleConnected ? (
                        <>
                          <CheckCircle2 size={24} className="text-emerald-400" />
                          Google Agenda Conectado
                        </>
                      ) : (
                        <>
                          <Calendar size={24} />
                          Conectar Google Calendar
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Informações do Sistema */}
                <div className="glass-card p-6 md:p-8 rounded-3xl">
                  <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                    <DbIcon size={24} className="text-blue-400" />
                    Informações do Sistema
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="p-4 bg-white/5 rounded-2xl border border-border-dark">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Versão</p>
                      <p className="text-lg font-display font-bold text-white">v2.4.0-stable</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-border-dark">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Banco de Dados</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-lg font-display font-bold text-white">Conectado</p>
                      </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-border-dark">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Armazenamento</p>
                      <p className="text-lg font-display font-bold text-white">Local Sync</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-azul-petroleo text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 border border-white/10"
          >
            <CheckCircle2 size={20} className="text-emerald-400" />
            <span className="font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <ChatWidget 
        billsDueCount={billsDueCount}
        ideas={scratchNotes}
        projectsCount={projects.length}
        studyTopics={studyTopics}
        studySessions={studySessions}
        studyPlans={studyPlans}
        studyNotes={studyNotes}
        habits={habits}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        addStudyTopic={addStudyTopic}
        addStudyNote={addStudyNote}
        startPomodoro={startPomodoro}
      />
    </div>
  );
}

interface ProjectCardProps {
  key?: string;
  project: Project;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function ProjectCard({ 
  project, 
  onToggle, 
  onDelete 
}: ProjectCardProps) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-6 rounded-2xl group relative overflow-hidden"
    >
      <div className={`absolute top-0 left-0 w-1 h-full ${project.status === 'ongoing' ? 'bg-roxo-suave' : 'bg-emerald-500'}`} />
      
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${project.status === 'ongoing' ? 'bg-roxo-suave/10 text-roxo-suave' : 'bg-emerald-500/10 text-emerald-500'}`}>
          {project.status === 'ongoing' ? <Clock size={20} /> : <CheckCircle2 size={20} />}
        </div>
        <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onToggle(project.id)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-roxo-suave transition-colors"
            title={project.status === 'ongoing' ? 'Marcar como concluído' : 'Reabrir projeto'}
          >
            <CheckCircle2 size={18} />
          </button>
          <button 
            onClick={() => {
              if (window.confirm('Deseja realmente excluir este projeto?')) {
                onDelete(project.id);
              }
            }}
            className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
            title="Excluir projeto"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <h4 className="text-lg font-display font-bold text-white mb-2 group-hover:text-roxo-suave transition-colors">
        {project.title}
      </h4>
      <p className="text-sm text-slate-500 line-clamp-2 mb-6 leading-relaxed">
        {project.description || 'Sem descrição definida.'}
      </p>

      <div className="flex flex-col gap-2 mb-4">
        {project.startDate && (
          <div className="flex items-center gap-2 text-roxo-suave text-xs font-bold bg-roxo-suave/10 w-fit px-3 py-1 rounded-full">
            <Calendar size={12} />
            Início: {new Date(project.startDate).toLocaleDateString('pt-BR')}
          </div>
        )}

        {project.deadline && (
          <div className="flex items-center gap-2 text-amber-500 text-xs font-bold bg-amber-500/10 w-fit px-3 py-1 rounded-full">
            <Calendar size={12} />
            Prazo: {new Date(project.deadline).toLocaleDateString('pt-BR')}
          </div>
        )}
      </div>

      {project.techStack && project.techStack.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {project.techStack.map((tech, i) => (
            <span key={i} className="text-[9px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-border-dark">
              {tech}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border-dark">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
          {new Date(project.createdAt).toLocaleDateString('pt-BR')}
        </span>
        <button className="text-roxo-suave flex items-center gap-1 text-xs font-bold hover:gap-2 transition-all">
          Detalhes <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}

function TransactionForm({ onAdd }: { onAdd: (
  type: 'income' | 'expense', 
  title: string, 
  amount: number, 
  category: string, 
  dueDate: string | undefined,
  paymentMethod: 'Cartão' | 'PIX' | 'Boleto' | 'Dinheiro' | undefined,
  status: 'Pendente' | 'Pago' | 'A Vencer',
  recurrence: 'Único' | 'Semanal' | 'Mensal'
) => void }) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Geral');
  const [dueDate, setDueDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cartão' | 'PIX' | 'Boleto' | 'Dinheiro'>('PIX');
  const [status, setStatus] = useState<'Pendente' | 'Pago' | 'A Vencer'>('Pendente');
  const [recurrence, setRecurrence] = useState<'Único' | 'Semanal' | 'Mensal'>('Único');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;
    onAdd(type, title, parseFloat(amount), category, dueDate || undefined, paymentMethod, status, recurrence);
    setTitle('');
    setAmount('');
    setDueDate('');
  };

  const categories = type === 'income' 
    ? ['Salário', 'Freelance', 'Investimento', 'Outros']
    : ['Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Moradia', 'Geral'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex bg-slate-800 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => {
            setType('income');
            setCategory('Salário');
            setStatus('Pago');
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${type === 'income' ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}
        >
          Receita
        </button>
        <button
          type="button"
          onClick={() => {
            setType('expense');
            setCategory('Geral');
            setStatus('Pendente');
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${type === 'expense' ? 'bg-rosa-claro text-white' : 'text-slate-500'}`}
        >
          Despesa
        </button>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Descrição</label>
        <input 
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Supermercado"
          className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-roxo-suave text-white"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Valor (R$)</label>
          <input 
            type="number" 
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-roxo-suave text-white"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Categoria</label>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-roxo-suave text-white appearance-none"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Vencimento</label>
          <input 
            type="date" 
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-roxo-suave text-white appearance-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Meio de Pagamento</label>
          <select 
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as any)}
            className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-roxo-suave text-white appearance-none"
          >
            <option value="PIX">PIX</option>
            <option value="Cartão">Cartão</option>
            <option value="Boleto">Boleto</option>
            <option value="Dinheiro">Dinheiro</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Status</label>
          <select 
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-roxo-suave text-white appearance-none"
          >
            <option value="Pago">{type === 'income' ? 'Recebido' : 'Pago'}</option>
            <option value="Pendente">Pendente</option>
            <option value="A Vencer">{type === 'income' ? 'Programado' : 'A Vencer'}</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Recorrência</label>
          <select 
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as any)}
            className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-roxo-suave text-white appearance-none"
          >
            <option value="Único">Único</option>
            <option value="Semanal">Semanal</option>
            <option value="Mensal">Mensal</option>
          </select>
        </div>
      </div>

      <button 
        type="submit"
        className={`w-full py-3 rounded-xl text-sm font-bold text-white transition-all shadow-lg ${type === 'income' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-roxo-suave shadow-roxo-suave/20'}`}
      >
        Registrar Transação
      </button>
    </form>
  );
}

function EventForm({ onAdd, projects, selectedDate }: { onAdd: (title: string, date: string, type: CalendarEvent['type'], description?: string, projectId?: string) => void, projects: Project[], selectedDate: string | null }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<CalendarEvent['type']>('evento');
  const [projectId, setProjectId] = useState('');

  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;
    onAdd(title, date, type, description || undefined, projectId || undefined);
    setTitle('');
    setDescription('');
    setDate('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Título</label>
        <input 
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Reunião de Alinhamento"
          className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 text-white"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Descrição (Opcional)</label>
        <textarea 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Acrescente descrição aqui"
          className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 text-white resize-none"
          rows={2}
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Data</label>
        <input 
          type="date" 
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 text-white"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Tipo</label>
          <select 
            value={type}
            onChange={(e) => setType(e.target.value as CalendarEvent['type'])}
            className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 text-white appearance-none"
          >
            <option value="evento">Evento</option>
            <option value="aniversario">Aniversário</option>
            <option value="reuniao">Reunião</option>
            <option value="importante">Importante</option>
            <option value="feriado">Feriado</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Projeto (Opcional)</label>
          <select 
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full bg-slate-800 border border-border-dark rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 text-white appearance-none"
          >
            <option value="">Nenhum</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
      </div>
      <button 
        type="submit"
        className="w-full py-3 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all"
      >
        Agendar
      </button>
    </form>
  );
}




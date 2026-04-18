import { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Database, 
  Shield, 
  Zap, 
  Code, 
  CheckCircle2, 
  MessageSquare, 
  Send, 
  Save, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Sparkles,
  Terminal,
  Layers,
  Key,
  Globe,
  Info,
  ExternalLink,
  Play,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";
import { StudyProgress, StudyNote } from '../types';

const SUPABASE_TOPICS = [
  {
    id: 'intro',
    title: 'O que é o Supabase?',
    content: 'Supabase é uma alternativa open-source ao Firebase. Ele fornece um banco de dados PostgreSQL completo, autenticação, armazenamento de arquivos, APIs em tempo real e funções edge. É construído sobre ferramentas open-source e focado em facilitar o desenvolvimento backend para desenvolvedores frontend.',
    icon: Database,
    color: 'text-emerald-500'
  },
  {
    id: 'auth',
    title: 'Como funciona o Auth?',
    content: 'O Supabase Auth permite gerenciar usuários com e-mail/senha, links mágicos ou provedores sociais (Google, GitHub, etc.). Ele usa JWT (JSON Web Tokens) para manter as sessões seguras e se integra perfeitamente com o banco de dados via RLS.',
    icon: Shield,
    color: 'text-blue-500'
  },
  {
    id: 'database',
    title: 'Database (PostgreSQL)',
    content: 'Diferente de bancos NoSQL, o Supabase usa PostgreSQL, um banco relacional robusto. Você trabalha com tabelas (tables), linhas (rows) e colunas (columns). Ele oferece uma interface visual para gerenciar seus dados sem precisar escrever SQL complexo o tempo todo.',
    icon: Layers,
    color: 'text-indigo-500'
  },
  {
    id: 'rls',
    title: 'Políticas de Segurança (RLS)',
    content: 'Row Level Security (RLS) é o coração da segurança no Supabase. Ele permite definir quem pode ver, criar, editar ou deletar cada linha de uma tabela baseando-se no ID do usuário autenticado. É o que torna seguro conectar o frontend direto ao banco.',
    icon: Key,
    color: 'text-amber-500'
  },
  {
    id: 'frontend',
    title: 'Conectando o Frontend',
    content: 'Você usa o `@supabase/supabase-js` para interagir com o backend. Basta inicializar o cliente com sua URL e Chave Pública (Anon Key) e você já pode fazer queries como `supabase.from("tabela").select("*")`.',
    icon: Zap,
    color: 'text-orange-500'
  }
];

const PRACTICE_EXAMPLES = [
  {
    title: 'Criar uma Tabela',
    code: `-- SQL para criar uma tabela de tarefas
create table tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);`,
    lang: 'sql'
  },
  {
    title: 'Fazer Login (Auth)',
    code: `const { data, error } = await supabase.auth.signInWithPassword({
  email: 'exemplo@email.com',
  password: 'sua-senha-segura',
});`,
    lang: 'javascript'
  },
  {
    title: 'Inserir Dados',
    code: `const { data, error } = await supabase
  .from('tasks')
  .insert([
    { title: 'Estudar Supabase', user_id: user.id },
  ])
  .select();`,
    lang: 'javascript'
  },
  {
    title: 'Buscar Dados',
    code: `const { data: tasks, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('is_completed', false)
  .order('created_at', { ascending: false });`,
    lang: 'javascript'
  }
];

interface PhysicsElement {
  id: number;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRotation: number;
  width: number;
  height: number;
  color: string;
}

function GravitySandbox({ isActive, gravity }: { isActive: boolean; gravity: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<PhysicsElement[]>([]);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const labels = ['Google', 'Search', 'Images', 'Maps', 'Play', 'News'];
    const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#4285F4', '#EA4335'];
    
    const initialElements = labels.map((label, i) => ({
      id: i,
      label,
      x: 20 + i * 50,
      y: 20 + (i % 2) * 30,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      rotation: 0,
      vRotation: (Math.random() - 0.5) * 5,
      width: 60,
      height: 30,
      color: colors[i]
    }));
    setElements(initialElements);
  }, []);

  const updatePhysics = () => {
    if (!isActive || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const bounce = 0.6;
    const friction = 0.99;

    setElements(prev => prev.map(el => {
      let { x, y, vx, vy, rotation, vRotation, width, height } = el;

      vy += gravity;
      x += vx;
      y += vy;
      rotation += vRotation;

      if (y + height > containerHeight) {
        y = containerHeight - height;
        vy = -vy * bounce;
        vx *= friction;
        vRotation *= friction;
      }
      if (y < 0) {
        y = 0;
        vy = -vy * bounce;
      }
      if (x + width > containerWidth) {
        x = containerWidth - width;
        vx = -vx * bounce;
      } else if (x < 0) {
        x = 0;
        vx = -vx * bounce;
      }

      return { ...el, x, y, vx, vy, rotation, vRotation };
    }));

    requestRef.current = requestAnimationFrame(updatePhysics);
  };

  useEffect(() => {
    if (isActive) {
      requestRef.current = requestAnimationFrame(updatePhysics);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isActive, gravity]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {elements.map(el => (
        <div
          key={el.id}
          className="absolute flex items-center justify-center rounded-lg border border-white/10 text-[10px] font-bold text-white shadow-lg pointer-events-none select-none"
          style={{
            width: el.width,
            height: el.height,
            left: el.x,
            top: el.y,
            backgroundColor: el.color + '33',
            borderColor: el.color + '66',
            transform: `rotate(${el.rotation}deg)`,
            transition: isActive ? 'none' : 'all 0.5s ease-out'
          }}
        >
          {el.label}
        </div>
      ))}
    </div>
  );
}

export default function EstudosTab() {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: 'Olá! Sou seu assistente de estudos. O que você gostaria de aprender sobre Supabase hoje?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [progress, setProgress] = useState<StudyProgress[]>([]);
  const [isAntiGravityActive, setIsAntiGravityActive] = useState(false);
  const [sandboxKey, setSandboxKey] = useState(0);
  const [gravityValue, setGravityValue] = useState(0.5);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedNotes = localStorage.getItem('raquel_study_notes');
    const savedProgress = localStorage.getItem('raquel_study_progress');
    
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    if (savedProgress) setProgress(JSON.parse(savedProgress));
    else {
      const initialProgress = [
        { id: '1', topic: 'Supabase básico', learned: false },
        { id: '2', topic: 'Auth', learned: false },
        { id: '3', topic: 'Database', learned: false },
        { id: '4', topic: 'RLS', learned: false },
        { id: '5', topic: 'Integração com frontend', learned: false },
      ];
      setProgress(initialProgress);
      localStorage.setItem('raquel_study_progress', JSON.stringify(initialProgress));
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMsg,
        config: {
          systemInstruction: "Você é um assistente de estudos focado em Supabase e desenvolvimento backend. Suas respostas devem ser simples, didáticas, práticas e diretas, ideais para iniciantes. Use markdown para formatar códigos ou listas."
        }
      });
      
      setChatMessages(prev => [...prev, { role: 'bot', text: response.text || 'Desculpe, tive um problema ao processar sua dúvida.' }]);
    } catch (error) {
      console.error('Erro no chat de estudos:', error);
      setChatMessages(prev => [...prev, { role: 'bot', text: 'Erro ao conectar com a IA. Verifique sua conexão ou chave de API.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const saveNote = () => {
    if (!currentNote.trim()) return;
    const newNote: StudyNote = {
      id: Date.now().toString(),
      title: 'Nota de Estudo',
      content: currentNote,
      notebookId: 'default',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setCurrentNote('');
    localStorage.setItem('raquel_study_notes', JSON.stringify(updatedNotes));
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    localStorage.setItem('raquel_study_notes', JSON.stringify(updatedNotes));
  };

  const toggleProgress = (id: string) => {
    const updatedProgress = progress.map(p => 
      p.id === id ? { ...p, learned: !p.learned } : p
    );
    setProgress(updatedProgress);
    localStorage.setItem('raquel_study_progress', JSON.stringify(updatedProgress));
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <BookOpen className="text-roxo-suave" size={32} />
            Central de Estudos Supabase
          </h1>
          <p className="text-slate-400">Aprenda backend de forma interativa e prática.</p>
        </div>
        
        {/* Progress Card */}
        <div className="w-full md:w-72 glass-card p-6 border-emerald-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Seu Progresso</h3>
            <span className="text-xs font-bold text-emerald-500">
              {Math.round((progress.filter(p => p.learned).length / progress.length) * 100)}%
            </span>
          </div>
          <div className="space-y-3">
            {progress.map(item => (
              <button 
                key={item.id}
                onClick={() => toggleProgress(item.id)}
                className="w-full flex items-center gap-3 group"
              >
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  item.learned ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/10 group-hover:border-emerald-500/50'
                }`}>
                  {item.learned && <CheckCircle2 size={12} />}
                </div>
                <span className={`text-xs transition-all ${item.learned ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                  {item.topic}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Explanations & Practice */}
        <div className="lg:col-span-2 space-y-8">
          {/* Explanatory Content */}
          <section className="space-y-4">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Sparkles className="text-amber-500" size={20} />
              Conteúdo Explicativo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SUPABASE_TOPICS.map(topic => (
                <div 
                  key={topic.id}
                  className={`glass-card p-5 transition-all cursor-pointer hover:border-white/20 ${expandedTopic === topic.id ? 'md:col-span-2' : ''}`}
                  onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-white/5 ${topic.color}`}>
                        <topic.icon size={20} />
                      </div>
                      <h3 className="font-bold text-white">{topic.title}</h3>
                    </div>
                    {expandedTopic === topic.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                  <AnimatePresence>
                    {(expandedTopic === topic.id || window.innerWidth < 768) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-sm text-slate-400 leading-relaxed">
                          {topic.content}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </section>

          {/* Practice Section */}
          <section className="space-y-4">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Terminal className="text-blue-500" size={20} />
              Aprender na Prática
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRACTICE_EXAMPLES.map((example, idx) => (
                <div key={idx} className="glass-card overflow-hidden">
                  <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">{example.title}</h3>
                    <span className="text-[10px] bg-roxo-suave/20 text-roxo-suave px-2 py-0.5 rounded-full font-bold uppercase">
                      {example.lang}
                    </span>
                  </div>
                  <div className="p-4 bg-black/40 font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre">
                    {example.code}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Google Anti-Gravity Section */}
          <section className="space-y-6 pt-8 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
                <Globe size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-white">Google Anti-Gravity</h2>
                <p className="text-sm text-slate-500 uppercase font-bold tracking-widest">Experimento Interativo Isolado</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Explanation */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Info size={18} className="text-blue-400" />
                  O que é o Experimento?
                </h3>
                <div className="text-sm text-slate-400 space-y-3 leading-relaxed">
                  <p>
                    O <strong>Google Anti-Gravity</strong> é um experimento interativo da web que simula a "gravidade" fazendo os elementos da página caírem e reagirem a colisões.
                  </p>
                  <p>
                    Diferente de uma animação linear, ele utiliza um motor de física simples em JavaScript para calcular trajetórias, velocidades e impactos em tempo real.
                  </p>
                  <ul className="space-y-2 mt-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-blue-400 rounded-full" />
                      <span>Simula gravidade constante (aceleração vertical)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-blue-400 rounded-full" />
                      <span>Detecta limites do container (colisões)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-blue-400 rounded-full" />
                      <span>Demonstra manipulação avançada do DOM</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Physics Sandbox */}
              <div className="glass-card p-6 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Simulação Segura</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsAntiGravityActive(!isAntiGravityActive)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                        isAntiGravityActive ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isAntiGravityActive ? 'Pausar' : 'Ativar Gravidade'}
                    </button>
                    <button 
                      onClick={() => {
                        setIsAntiGravityActive(false);
                        // Reset logic handled by the component key or internal state
                        setSandboxKey(prev => prev + 1);
                      }}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:bg-white/10"
                    >
                      Resetar
                    </button>
                  </div>
                </div>

                {/* Gravity Control */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Intensidade da Gravidade</label>
                    <span className="text-[10px] font-mono text-blue-400">{gravityValue.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="2.0" 
                    step="0.1" 
                    value={gravityValue}
                    onChange={(e) => setGravityValue(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* The Sandbox Container */}
                <div className="relative w-full h-64 bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                  <GravitySandbox key={sandboxKey} isActive={isAntiGravityActive} gravity={gravityValue} />
                </div>
              </div>

              {/* Educational Block */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Brain size={18} className="text-purple-400" />
                  Como a Animação Funciona?
                </h3>
                <div className="text-sm text-slate-400 space-y-3 leading-relaxed">
                  <p>
                    A simulação utiliza o <strong>DOM (Document Object Model)</strong> para representar cada elemento como um objeto com propriedades físicas.
                  </p>
                  <p>
                    O motor de física roda dentro de um loop <code>requestAnimationFrame</code>, que sincroniza os cálculos com a taxa de atualização do seu monitor (geralmente 60fps).
                  </p>
                  <div className="bg-roxo-suave/5 border border-roxo-suave/10 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-roxo-suave uppercase tracking-widest">O que é DOM?</p>
                    <p className="text-xs">É a interface que permite que scripts (JS) acessem e manipulem o conteúdo, estrutura e estilo de documentos HTML.</p>
                  </div>
                </div>
              </div>

              {/* Code Example */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Code size={18} className="text-emerald-400" />
                  Exemplo de Lógica
                </h3>
                <div className="bg-black/40 rounded-xl p-4 font-mono text-[10px] text-emerald-400 overflow-x-auto">
                  <pre>{`function update() {
  // 1. Aplicar gravidade à velocidade
  velocity.y += gravity;
  
  // 2. Atualizar posição
  position.y += velocity.y;
  
  // 3. Checar colisão com o chão
  if (position.y > floor) {
    position.y = floor;
    velocity.y *= -0.6; // Bounce
  }
  
  // 4. Aplicar ao DOM
  element.style.transform = 
    \`translateY(\${position.y}px)\`;
    
  requestAnimationFrame(update);
}`}</pre>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: AI Assistant & Notes */}
        <div className="space-y-8">
          {/* AI Assistant */}
          <section className="glass-card flex flex-col h-[500px] border-roxo-suave/20">
            <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-roxo-suave/5">
              <div className="w-8 h-8 bg-roxo-suave rounded-lg flex items-center justify-center text-white">
                <MessageSquare size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Assistente de Estudos</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">IA Especialista Supabase</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-xs ${
                    msg.role === 'user' 
                      ? 'bg-roxo-suave text-white rounded-tr-none' 
                      : 'bg-white/5 text-slate-300 border border-white/10 rounded-tl-none'
                  }`}>
                    <Markdown>{msg.text}</Markdown>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/10">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-white/10">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendChat(); }}
                className="flex gap-2"
              >
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Tire sua dúvida..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-roxo-suave"
                />
                <button 
                  type="submit"
                  disabled={isTyping}
                  className="p-2 bg-roxo-suave text-white rounded-lg hover:bg-roxo-suave/80 transition-all disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </section>

          {/* Study Notes */}
          <section className="space-y-4">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Save className="text-pink-500" size={20} />
              Anotações de Estudo
            </h2>
            <div className="glass-card p-4 space-y-4">
              <textarea 
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder="Escreva suas anotações aqui..."
                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-roxo-suave resize-none"
              />
              <button 
                onClick={saveNote}
                className="w-full py-3 bg-roxo-suave hover:bg-roxo-suave/80 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-roxo-suave/20"
              >
                <Save size={16} />
                Salvar Anotação
              </button>

              <div className="space-y-3 mt-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {notes.map(note => (
                  <div key={note.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl group relative">
                    <p className="text-sm text-slate-300 pr-8">{note.content}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px] text-slate-500">
                        {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button 
                        onClick={() => deleteNote(note.id)}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {notes.length === 0 && (
                  <p className="text-center text-xs text-slate-600 py-4 italic">Nenhuma anotação salva ainda.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

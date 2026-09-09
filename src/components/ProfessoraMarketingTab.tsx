import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Brain, 
  BookOpen, 
  MessageSquare, 
  Presentation, 
  FileText, 
  ClipboardList, 
  Lightbulb, 
  Gamepad2, 
  HelpCircle, 
  BookmarkCheck, 
  Sparkles, 
  Copy, 
  Check, 
  Trash2, 
  Save, 
  RefreshCw, 
  Search, 
  Eye, 
  X,
  Layers,
  ArrowRight,
  Target,
  Award,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { GoogleGenAI } from '@google/genai';
import { ProfessoraMarketingItem } from '../types';
import { dataService } from '../services/dataService';

interface ProfessoraMarketingTabProps {
  accentColor?: string;
  borderRadius?: number;
}

type SectionType = 
  | 'plano_aula'
  | 'material_didatico'
  | 'assistente_mercado'
  | 'slides'
  | 'sequencia_didatica'
  | 'folha_atividade'
  | 'ideias_atividades'
  | 'jogos_educativos'
  | 'quiz'
  | 'biblioteca';

export default function ProfessoraMarketingTab({ accentColor = '#6a5acd', borderRadius = 24 }: ProfessoraMarketingTabProps) {
  const [activeSection, setActiveSection] = useState<SectionType>('plano_aula');
  const [libraryItems, setLibraryItems] = useState<ProfessoraMarketingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<ProfessoraMarketingItem | null>(null);
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryCategoryFilter, setLibraryCategoryFilter] = useState<string>('all');

  // Form States
  // 1. Plano de Aula
  const [planoTema, setPlanoTema] = useState('');
  const [planoDuracao, setPlanoDuracao] = useState('100 minutos (2 aulas)');
  const [planoMetodologia, setPlanoMetodologia] = useState('Aprendizagem Baseada em Projetos (PBL)');
  const [planoCompetencias, setPlanoCompetencias] = useState('Análise de Mercado, Segmentação de Público e Posicionamento de Marca (Diretrizes EPTNM)');

  // 2. Material Didático
  const [materialTipo, setMaterialTipo] = useState<'resumo' | 'slides' | 'atividade_pratica'>('resumo');
  const [materialTema, setMaterialTema] = useState('');

  // 3. Assistente de Mercado
  const [assistenteTopico, setAssistenteTopico] = useState('');
  const [assistenteContexto, setAssistenteContexto] = useState('B2C Digital / Redes Sociais');

  // 4. Apresentacao de Slides
  const [slidesTema, setSlidesTema] = useState('');
  const [slidesQtd, setSlidesQtd] = useState('5 a 7 slides');

  // 5. Sequencia Didatica
  const [sequenciaTema, setSequenciaTema] = useState('');
  const [sequenciaCargaHoraria, setSequenciaCargaHoraria] = useState('4 horas/aula');

  // 6. Folha de Atividade
  const [folhaTema, setFolhaTema] = useState('');
  const [folhaNivel, setFolhaNivel] = useState('Médio Técnico (Prático Aplicado)');

  // 7. Ideias de Atividades
  const [ideiasTema, setIdeiasTema] = useState('');
  const [ideiasFormato, setIdeiasFormato] = useState('Trabalho em Equipe / Agência Simulada');

  // 8. Jogos Educativos
  const [jogosTema, setJogosTema] = useState('');
  const [jogosEstilo, setJogosEstilo] = useState('RPG de Negociação e Crise de Imagem');

  // 9. Quiz Interativo
  const [quizTema, setQuizTema] = useState('');
  const [quizQtd, setQuizQtd] = useState('5 questões de múltipla escolha');

  // Generated Content State per Tool
  const [generatedOutput, setGeneratedOutput] = useState<string>('');
  const [generatedTitle, setGeneratedTitle] = useState<string>('');

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    const items = await dataService.fetchProfessoraMarketingItems();
    setLibraryItems(items || []);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
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

  const callGemini = async (prompt: string, systemInstruction: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('Chave da API Gemini não encontrada. Por favor, adicione sua chave nas Configurações.');
    }
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction
      }
    });
    return response.text || 'Não foi possível obter resposta da IA.';
  };

  const handleGenerate = async (category: ProfessoraMarketingItem['category'], title: string, prompt: string) => {
    if (!title.trim()) {
      showToast('Por favor, preencha o tema/assunto principal!');
      return;
    }
    setLoading(true);
    setGeneratedOutput('');
    setGeneratedTitle(title);

    const systemInstruction = `Você é uma mentora especialista e professora sênior de Marketing para Educação Profissional Técnica de Nível Médio (EPTNM).
Suas respostas devem ser estruturadas em Markdown impecável, pedagógicas, alinhadas à prática do mercado atual e com diretrizes reais da educação profissional técnica.
Use tom acolhedor, altamente profissional e dinâmico para os alunos do ensino técnico.`;

    try {
      const result = await callGemini(prompt, systemInstruction);
      setGeneratedOutput(result);
      showToast('Conteúdo gerado com sucesso!');
      
      // Auto-save to library
      const newItem: ProfessoraMarketingItem = {
        id: Date.now().toString(),
        title,
        category,
        content: result,
        createdAt: Date.now()
      };
      await dataService.saveProfessoraMarketingItem(newItem);
      setLibraryItems(prev => [newItem, ...prev]);
    } catch (err: any) {
      console.error('Erro ao gerar com IA:', err);
      showToast(err.message || 'Erro ao gerar conteúdo com a IA.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOutputToLibrary = async () => {
    if (!generatedOutput) return;
    const newItem: ProfessoraMarketingItem = {
      id: Date.now().toString(),
      title: generatedTitle || 'Material Didático de Marketing',
      category: activeSection as ProfessoraMarketingItem['category'],
      content: generatedOutput,
      createdAt: Date.now()
    };
    await dataService.saveProfessoraMarketingItem(newItem);
    setLibraryItems(prev => [newItem, ...prev]);
    showToast('Salvo na Biblioteca do Planner com sucesso! 💾');
  };

  const copyToClipboard = (text: string, id: string = 'output') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copiado para a área de transferência! 📋');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteLibraryItem = async (id: string) => {
    await dataService.deleteProfessoraMarketingItem(id);
    setLibraryItems(prev => prev.filter(i => i.id !== id));
    if (selectedLibraryItem?.id === id) setSelectedLibraryItem(null);
    showToast('Item removido da Biblioteca.');
  };

  const sectionsConfig = [
    { id: 'plano_aula', label: 'Plano de Aula', icon: Brain, color: 'text-purple-400', desc: 'Gerador estruturado para EPTNM' },
    { id: 'material_didatico', label: 'Materiais Didáticos', icon: BookOpen, color: 'text-indigo-400', desc: 'Resumos, slides e guias práticos' },
    { id: 'assistente_mercado', label: 'Assistente de Mercado', icon: MessageSquare, color: 'text-cyan-400', desc: 'Exemplos reais e tendências atuais' },
    { id: 'slides', label: 'Apresentação Slides', icon: Presentation, color: 'text-blue-400', desc: 'Roteiro visual e fala do professor' },
    { id: 'sequencia_didatica', label: 'Sequência Didática', icon: FileText, color: 'text-emerald-400', desc: 'Estruturação da aula em 4 etapas' },
    { id: 'folha_atividade', label: 'Folha de Atividade', icon: ClipboardList, color: 'text-amber-400', desc: 'Exercícios práticos com gabarito' },
    { id: 'ideias_atividades', label: 'Ideias de Atividades', icon: Lightbulb, color: 'text-yellow-400', desc: 'Dinâmicas e agências simuladas' },
    { id: 'jogos_educativos', label: 'Jogos Educativos', icon: Gamepad2, color: 'text-rose-400', desc: 'Gamificação e desafios de marca' },
    { id: 'quiz', label: 'Quiz Interativo', icon: HelpCircle, color: 'text-pink-400', desc: 'Avaliação rápida com gabarito' },
    { id: 'biblioteca', label: 'Biblioteca Salva', icon: BookmarkCheck, color: 'text-teal-400', desc: 'Todos os seus materiais salvos' },
  ];

  const filteredLibrary = libraryItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(librarySearch.toLowerCase()) || 
                          item.content.toLowerCase().includes(librarySearch.toLowerCase());
    const matchesCategory = libraryCategoryFilter === 'all' || item.category === libraryCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-[9999] bg-purple-900/90 text-white border border-purple-500/30 px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 text-sm font-medium"
          >
            <Sparkles size={18} className="text-yellow-300 animate-spin" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/20 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-300">
              <GraduationCap size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-[10px] font-bold uppercase tracking-widest border border-purple-500/30">
                  EPTNM - Nível Médio Técnico
                </span>
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-500/30">
                  Docência & IA
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-black text-white mt-1">
                Professora Marketing IA
              </h2>
              <p className="text-sm text-slate-400 max-w-2xl mt-1">
                Ambiente de apoio didático para o Ensino Técnico Profissionalizante de Nível Médio em Marketing. Crie planos, exercícios, quizzes e apresentações dinâmicas integrados ao mercado real.
              </p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-80 h-80 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* Sub-Tabs Grid Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {sectionsConfig.map((sec) => (
          <button
            key={sec.id}
            onClick={() => {
              setActiveSection(sec.id as SectionType);
              setGeneratedOutput('');
            }}
            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between group ${
              activeSection === sec.id
                ? 'bg-purple-900/30 border-purple-500/50 text-white shadow-lg shadow-purple-500/10 scale-[1.02]'
                : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <sec.icon size={20} className={activeSection === sec.id ? sec.color : 'text-slate-500 group-hover:text-slate-300'} />
              {sec.id === 'biblioteca' && (
                <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full font-bold">
                  {libraryItems.length}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold font-display line-clamp-1">{sec.label}</p>
              <p className="text-[10px] text-slate-500 line-clamp-1">{sec.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Main Feature Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Column */}
        {activeSection !== 'biblioteca' && (
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card p-6 md:p-8 rounded-3xl space-y-5 border border-purple-500/20">
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                  {sectionsConfig.find(s => s.id === activeSection)?.icon && 
                    React.createElement(sectionsConfig.find(s => s.id === activeSection)!.icon, { size: 20 })}
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-white">
                    {sectionsConfig.find(s => s.id === activeSection)?.label}
                  </h3>
                  <p className="text-xs text-slate-400">Preencha os campos para orientar a geração técnica</p>
                </div>
              </div>

              {/* SECTION 1: PLANO DE AULA */}
              {activeSection === 'plano_aula' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tema / Conteúdo da Aula *</label>
                    <input
                      type="text"
                      placeholder="Ex: Funil de Vendas Digital e Inbound Marketing"
                      value={planoTema}
                      onChange={e => setPlanoTema(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Duração Total</label>
                    <input
                      type="text"
                      value={planoDuracao}
                      onChange={e => setPlanoDuracao(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Metodologia Ativa</label>
                    <select
                      value={planoMetodologia}
                      onChange={e => setPlanoMetodologia(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                    >
                      <option value="Aprendizagem Baseada em Projetos (PBL)">Aprendizagem Baseada em Projetos (PBL)</option>
                      <option value="Sala de Aula Invertida">Sala de Aula Invertida</option>
                      <option value="Estudo de Caso Prático de Mercado">Estudo de Caso Prático de Mercado</option>
                      <option value="Gamificação e Desafios de Equipe">Gamificação e Desafios de Equipe</option>
                      <option value="Rotação por Estações de Trabalho">Rotação por Estações de Trabalho</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Competências Diretrizes EPTNM</label>
                    <textarea
                      rows={3}
                      value={planoCompetencias}
                      onChange={e => setPlanoCompetencias(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <button
                    onClick={() => handleGenerate(
                      'plano_aula',
                      `Plano de Aula: ${planoTema}`,
                      `Gere um Plano de Aula completo para a disciplina de Marketing no Ensino Técnico (EPTNM).
Tema: ${planoTema}
Duração: ${planoDuracao}
Metodologia: ${planoMetodologia}
Competências Esperadas: ${planoCompetencias}

Estrutura exigida no plano:
1. Cabeçalho e Dados Gerais
2. Objetivos de Aprendizagem (Gerais e Específicos)
3. Competências e Habilidades EPTNM
4. Conteúdo Programático
5. Desenvolvimento Metodológico Passo a Passo (Introdução, Prática, Conclusão)
6. Recursos Didáticos Necessários
7. Critérios e Formas de Avaliação Formativa.`
                    )}
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                    Gerar Plano de Aula com IA
                  </button>
                </div>
              )}

              {/* SECTION 2: MATERIAL DIDÁTICO */}
              {activeSection === 'material_didatico' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tipo de Material</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setMaterialTipo('resumo')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          materialTipo === 'resumo' ? 'bg-purple-600 border-purple-400 text-white' : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        Resumo Didático
                      </button>
                      <button
                        onClick={() => setMaterialTipo('slides')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          materialTipo === 'slides' ? 'bg-purple-600 border-purple-400 text-white' : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        Estrutura Slides
                      </button>
                      <button
                        onClick={() => setMaterialTipo('atividade_pratica')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          materialTipo === 'atividade_pratica' ? 'bg-purple-600 border-purple-400 text-white' : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        Guia Prático
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tema do Material *</label>
                    <input
                      type="text"
                      placeholder="Ex: Persona, Jornada do Cliente e Copywriting"
                      value={materialTema}
                      onChange={e => setMaterialTema(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <button
                    onClick={() => handleGenerate(
                      'material_didatico',
                      `Material Didático (${materialTipo.toUpperCase()}): ${materialTema}`,
                      `Gere um material didático completo do tipo "${materialTipo}" para alunos de curso técnico em Marketing.
Tema: ${materialTema}

Exigências:
- Linguagem clara, acessível e voltada ao mercado de trabalho.
- Inclua definições formais, exemplos visuais/práticos, erros comuns cometidos por profissionais iniciantes e checklist de aplicação prática.`
                    )}
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <BookOpen size={18} />}
                    Gerar Material Didático
                  </button>
                </div>
              )}

              {/* SECTION 3: ASSISTENTE DE MERCADO */}
              {activeSection === 'assistente_mercado' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Topico ou Conceito de Marketing *</label>
                    <input
                      type="text"
                      placeholder="Ex: Rebranding, Marketing de Influência, Tráfego Pago"
                      value={assistenteTopico}
                      onChange={e => setAssistenteTopico(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nicho / Contexto de Mercado</label>
                    <input
                      type="text"
                      value={assistenteContexto}
                      onChange={e => setAssistenteContexto(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <button
                    onClick={() => handleGenerate(
                      'assistente_mercado',
                      `Análise de Mercado: ${assistenteTopico}`,
                      `Atue como um Assistente de Mercado de Marketing para a professora levar exemplos reais aos alunos técnicos.
Tópico: ${assistenteTopico}
Nicho/Contexto: ${assistenteContexto}

Forneça:
1. 3 Exemplos REAIS de grandes marcas ou marcas brasileiras recentes que utilizaram este conceito com sucesso.
2. Análise da Estratégia e Métrica de Sucesso de cada exemplo.
3. Tendências atuais e inovações para 2026/2027 relacionadas a este tema.
4. Perguntas reflexivas para instigar debate na sala de aula técnica.`
                    )}
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <MessageSquare size={18} />}
                    Consultar Tendências & Casos Reais
                  </button>
                </div>
              )}

              {/* SECTION 4: APRESENTAÇÃO DE SLIDES */}
              {activeSection === 'slides' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tema da Apresentação *</label>
                    <input
                      type="text"
                      placeholder="Ex: Métricas de Marketing Digital (CAC, LTV, ROI)"
                      value={slidesTema}
                      onChange={e => setSlidesTema(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Quantidade de Slides</label>
                    <input
                      type="text"
                      value={slidesQtd}
                      onChange={e => setSlidesQtd(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <button
                    onClick={() => handleGenerate(
                      'slides',
                      `Roteiro de Slides: ${slidesTema}`,
                      `Crie o roteiro detalhado para uma Apresentação de Slides para aula técnica em Marketing.
Tema: ${slidesTema}
Quantidade estimada: ${slidesQtd}

Para CADA slide forneça obrigatoriamente:
- **Slide X: [Título do Slide]**
- 📌 **Conteúdo do Slide (Bullet points curtos)**
- 🗣️ **Fala do Professor (Roteiro verbal explicativo)**
- 💡 **Recurso Visual Recomendado (Imagem, gráfico ou diagrama)**
- ❓ **Pergunta de Checagem Rápida (para interação com a turma)**`
                    )}
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <Presentation size={18} />}
                    Gerar Roteiro de Slides Visual
                  </button>
                </div>
              )}

              {/* SECTION 5: SEQUÊNCIA DIDÁTICA */}
              {activeSection === 'sequencia_didatica' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tema Principal da Sequência *</label>
                    <input
                      type="text"
                      placeholder="Ex: Planejamento de Campanha de Lançamento de Produto"
                      value={sequenciaTema}
                      onChange={e => setSequenciaTema(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Carga Horária Planejada</label>
                    <input
                      type="text"
                      value={sequenciaCargaHoraria}
                      onChange={e => setSequenciaCargaHoraria(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <button
                    onClick={() => handleGenerate(
                      'sequencia_didatica',
                      `Sequência Didática: ${sequenciaTema}`,
                      `Monte uma Sequência Didática completa organizada rigorosamente em 4 etapas didáticas para o ensino técnico em Marketing.
Tema: ${sequenciaTema}
Carga Horária Total: ${sequenciaCargaHoraria}

Etapas obrigatórias:
1. **Etapa 1: Sensibilização & Introdução** (Problematização do tema, diagnóstico prévio e provocação inicial).
2. **Etapa 2: Desenvolvimento Teórico-Prático** (Exposição dialogada, análise de cases e fundamentação dos conceitos).
3. **Etapa 3: Aplicação Prática & Desafio Técnico** (Atividade mão na massa pelos estudantes).
4. **Etapa 4: Sistematização & Avaliação** (Apresentação dos resultados, feedback formativo e fechamento do ciclo).`
                    )}
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <FileText size={18} />}
                    Gerar Sequência Didática em 4 Etapas
                  </button>
                </div>
              )}

              {/* SECTION 6: FOLHA DE ATIVIDADE */}
              {activeSection === 'folha_atividade' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Assunto da Atividade Prática *</label>
                    <input
                      type="text"
                      placeholder="Ex: Elaboração de Briefing e Escolha de Canais de Mídia"
                      value={folhaTema}
                      onChange={e => setFolhaTema(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nível Exigido</label>
                    <input
                      type="text"
                      value={folhaNivel}
                      onChange={e => setFolhaNivel(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <button
                    onClick={() => handleGenerate(
                      'folha_atividade',
                      `Folha de Atividade: ${folhaTema}`,
                      `Crie uma Folha de Atividade Técnica Prática para impressão ou ambiente virtual de aprendizagem.
Tema: ${folhaTema}
Nível: ${folhaNivel}

Estrutura da Folha:
- **Nome da Instituição & Identificação do Aluno**
- **Instruções Gerais**
- **Estudo de Caso Hipotético / Cenário de Empresa fictícia**
- **Questões Práticas (3 a 5 desafios aplicados ao cenário)**
- **Espaço para Rascunho / Framework de Resposta**
- 🔑 **Gabarito / Critérios de Correção Exclusivos do Professor (ao final)**`
                    )}
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <ClipboardList size={18} />}
                    Gerar Folha de Atividades + Gabarito
                  </button>
                </div>
              )}

              {/* SECTION 7: IDEIAS DE ATIVIDADES */}
              {activeSection === 'ideias_atividades' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Conteúdo/Tema Principal *</label>
                    <input
                      type="text"
                      placeholder="Ex: Neuromarketing, Comportamento do Consumidor e Embalagem"
                      value={ideiasTema}
                      onChange={e => setIdeiasTema(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Formato Preferencial</label>
                    <input
                      type="text"
                      value={ideiasFormato}
                      onChange={e => setIdeiasFormato(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <button
                    onClick={() => handleGenerate(
                      'ideias_atividades',
                      `Ideias Práticas: ${ideiasTema}`,
                      `Gere 4 Propostas de Atividades Criativas e Engajadoras para aulas de Marketing Técnico de Nível Médio.
Tema: ${ideiasTema}
Formato: ${ideiasFormato}

Para cada proposta inclua:
- Nome da Dinâmica/Atividade
- Objetivo Pedagógico
- Passo a Passo de Execução
- Entregável final do aluno (ex: Mockup, Vídeo de Pitch, Apresentação)
- Dicas de Engajamento para o Professor.`
                    )}
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <Lightbulb size={18} />}
                    Gerar Propostas de Dinâmicas
                  </button>
                </div>
              )}

              {/* SECTION 8: JOGOS EDUCATIVOS */}
              {activeSection === 'jogos_educativos' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tópico de Marketing para o Jogo *</label>
                    <input
                      type="text"
                      placeholder="Ex: Gestão de Crise de Imagem e Relações Públicas"
                      value={jogosTema}
                      onChange={e => setJogosTema(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Estilo de Gamificação</label>
                    <input
                      type="text"
                      value={jogosEstilo}
                      onChange={e => setJogosEstilo(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <button
                    onClick={() => handleGenerate(
                      'jogos_educativos',
                      `Jogo Educativo: ${jogosTema}`,
                      `Desenvolva uma Dinâmica Gamificada / Jogo Educativo para ser aplicado presencialmente ou online com a turma de Marketing.
Tópico: ${jogosTema}
Estilo: ${jogosEstilo}

Estrutura do Jogo:
- **Nome do Jogo / Desafio**
- **Regras do Jogo e Condições de Vitória**
- **Cartas / Cenários / Roleplay dos Participantes**
- **Sistema de Pontuação e Ranking**
- **Debriefing Pedagógico pós-jogo (conclusão das aprendizagens).**`
                    )}
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <Gamepad2 size={18} />}
                    Criar Jogo Didático
                  </button>
                </div>
              )}

              {/* SECTION 9: QUIZ INTERATIVO */}
              {activeSection === 'quiz' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Assunto do Quiz *</label>
                    <input
                      type="text"
                      placeholder="Ex: Metodologias de Precificação e Matriz BCG"
                      value={quizTema}
                      onChange={e => setQuizTema(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Quantidade de Questões</label>
                    <input
                      type="text"
                      value={quizQtd}
                      onChange={e => setQuizQtd(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <button
                    onClick={() => handleGenerate(
                      'quiz',
                      `Quiz Interativo: ${quizTema}`,
                      `Crie um Quiz Didático Interativo com a quantidade pedida para fixação de conceitos em Marketing Técnico.
Tema: ${quizTema}
Quantidade: ${quizQtd}

Formatos exigidos por questão:
- Pergunta objetiva contextualizada em situação real de empresa.
- 4 alternativas (A, B, C, D) sendo apenas 1 correta.
- Indicação clara da Resposta Correta ao final.
- Justificativa Pedagógica explicando por que a alternativa está certa e por que as outras são incorretas.`
                    )}
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <HelpCircle size={18} />}
                    Gerar Quiz com Gabarito Comentado
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Output Column or Library Full View */}
        <div className={activeSection === 'biblioteca' ? 'lg:col-span-12 space-y-6' : 'lg:col-span-7 space-y-6'}>
          {activeSection !== 'biblioteca' && (
            <div className="glass-card p-6 md:p-8 rounded-3xl space-y-4 border border-purple-500/20 min-h-[500px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                  <h4 className="text-base font-display font-bold text-white flex items-center gap-2">
                    <Sparkles className="text-yellow-400" size={18} />
                    Resultado Gerado pela IA
                  </h4>
                  {generatedOutput && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(generatedOutput, 'main_output')}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/10 transition-all"
                      >
                        {copiedId === 'main_output' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        Copiar
                      </button>
                      <button
                        onClick={handleSaveOutputToLibrary}
                        className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <Save size={14} />
                        Salvar na Biblioteca
                      </button>
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
                    <RefreshCw className="animate-spin text-purple-400" size={40} />
                    <div>
                      <p className="text-base font-display font-bold text-white">Elaborando conteúdo pedagógico especializado...</p>
                      <p className="text-xs text-slate-400 mt-1">Conectando às diretrizes da EPTNM e mercado prático.</p>
                    </div>
                  </div>
                ) : generatedOutput ? (
                  <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                    <Markdown>{generatedOutput}</Markdown>
                  </div>
                ) : (
                  <div className="py-24 text-center space-y-3">
                    <GraduationCap size={48} className="mx-auto text-slate-600 stroke-[1.5]" />
                    <p className="text-slate-400 text-sm font-medium">
                      Preencha os campos ao lado e clique no botão para gerar o seu conteúdo didático.
                    </p>
                  </div>
                )}
              </div>

              {generatedOutput && (
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-500">
                  <span>Salvo automaticamente no seu histórico local.</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check size={14} /> Pronto para uso em sala
                  </span>
                </div>
              )}
            </div>
          )}

          {/* SECTION 10: BIBLIOTECA COMPLETA */}
          {activeSection === 'biblioteca' && (
            <div className="space-y-6">
              {/* Search & Filter Bar */}
              <div className="glass-card p-6 rounded-3xl border border-purple-500/20 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                  <input
                    type="text"
                    placeholder="Pesquisar nos materiais salvos..."
                    value={librarySearch}
                    onChange={e => setLibrarySearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar pb-1">
                  <button
                    onClick={() => setLibraryCategoryFilter('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      libraryCategoryFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    Todos ({libraryItems.length})
                  </button>
                  {sectionsConfig.filter(s => s.id !== 'biblioteca').map(s => (
                    <button
                      key={s.id}
                      onClick={() => setLibraryCategoryFilter(s.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        libraryCategoryFilter === s.id ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLibrary.length > 0 ? (
                  filteredLibrary.map((item) => {
                    const cfg = sectionsConfig.find(s => s.id === item.category);
                    return (
                      <div
                        key={item.id}
                        className="glass-card p-5 rounded-3xl border border-white/10 hover:border-purple-500/30 transition-all flex flex-col justify-between space-y-4 group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-purple-500/10 text-purple-300 rounded-full border border-purple-500/20 flex items-center gap-1.5">
                              {cfg?.icon && React.createElement(cfg.icon, { size: 12 })}
                              {cfg?.label || item.category}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <h4 className="text-base font-display font-bold text-white line-clamp-2 mt-1">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-4 mt-2 font-mono bg-black/20 p-2.5 rounded-xl border border-white/5">
                            {item.content.replace(/[#*`_]/g, '')}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-white/10">
                          <button
                            onClick={() => setSelectedLibraryItem(item)}
                            className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                          >
                            <Eye size={14} /> Visualizar Completo
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(item.content, item.id)}
                              className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all"
                              title="Copiar"
                            >
                              {copiedId === item.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                            <button
                              onClick={() => handleDeleteLibraryItem(item.id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
                              title="Excluir"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-16 text-center space-y-3 glass-card rounded-3xl">
                    <BookmarkCheck size={48} className="mx-auto text-slate-600 stroke-[1.5]" />
                    <p className="text-slate-400 text-sm">Nenhum material encontrado na biblioteca.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal View Library Item */}
      <AnimatePresence>
        {selectedLibraryItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-[#1e1e24] border border-purple-500/30 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                    {sectionsConfig.find(s => s.id === selectedLibraryItem.category)?.label}
                  </span>
                  <h3 className="text-xl font-display font-bold text-white mt-2">
                    {selectedLibraryItem.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedLibraryItem(null)}
                  className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed custom-scrollbar">
                <Markdown>{selectedLibraryItem.content}</Markdown>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Criado em: {new Date(selectedLibraryItem.createdAt).toLocaleString('pt-BR')}
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => copyToClipboard(selectedLibraryItem.content, 'modal')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all"
                  >
                    {copiedId === 'modal' ? <Check size={14} /> : <Copy size={14} />}
                    Copiar Conteúdo Completo
                  </button>
                  <button
                    onClick={() => setSelectedLibraryItem(null)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl font-bold text-xs transition-all"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

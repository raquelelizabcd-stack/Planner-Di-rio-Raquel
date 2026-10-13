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
  Users,
  Plus,
  Edit2,
  Link,
  Unlink,
  CheckCircle2,
  FolderOpen,
  School,
  Layers,
  BarChart3,
  TrendingUp,
  Download,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Sun,
  Moon,
  Send,
  ArrowRight,
  Clock,
  Compass,
  CheckCircle,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { GoogleGenAI } from '@google/genai';
import { ProfessoraMarketingItem, ProfessoraClass } from '../types';
import { dataService } from '../services/dataService';
import { supabase } from '../lib/supabase';

interface ProfessoraMarketingTabProps {
  accentColor?: string;
  borderRadius?: number;
}

// Navegação principal do Ateliê
type AtelieSection = 'visao_geral' | 'turmas' | 'materiais' | 'ia_assistente' | 'relatorios';

// Ferramentas da IA Assistente
type GeneratorTool = 
  | 'plano_aula'
  | 'slides'
  | 'material_didatico'
  | 'sequencia_didatica'
  | 'folha_atividade'
  | 'ideias_atividades'
  | 'jogos_educativos'
  | 'quiz'
  | 'assistente_mercado';

export default function ProfessoraMarketingTab({ accentColor = '#6a5acd', borderRadius = 24 }: ProfessoraMarketingTabProps) {
  // --- MODO DE VISUALIZAÇÃO: PROFESSOR (🎓) vs ALUNO (📘) ---
  const [viewMode, setViewMode] = useState<'professor' | 'aluno'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('atelie_view_mode');
      if (saved === 'aluno' || saved === 'professor') return saved;
    }
    return 'professor';
  });

  // --- TEMA HÍBRIDO (CLARO LAVANDA / ESCURO ATELIÊ) ---
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('atelie_theme_mode');
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light'; // Padrão: Claro Lavanda inspirado no Ateliê de Aulas
  });

  // Salvar preferências no localStorage
  const handleToggleViewMode = (mode: 'professor' | 'aluno') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('atelie_view_mode', mode);
    }
    showToast(`Modo alterado para ${mode === 'professor' ? '🎓 Professor' : '📘 Aluno'}`);
  };

  const handleToggleTheme = () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('atelie_theme_mode', next);
    }
  };

  // --- NAVEGAÇÃO E DADOS PRINCIPAIS ---
  const [currentSection, setCurrentSection] = useState<AtelieSection>('visao_geral');
  const [activeGenerator, setActiveGenerator] = useState<GeneratorTool>('plano_aula');
  const [libraryItems, setLibraryItems] = useState<ProfessoraMarketingItem[]>([]);
  const [classesList, setClassesList] = useState<ProfessoraClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<ProfessoraMarketingItem | null>(null);
  const [selectedTurmaView, setSelectedTurmaView] = useState<ProfessoraClass | null>(null);
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryCategoryFilter, setLibraryCategoryFilter] = useState<string>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // --- TURMAS: FORM & ESTADO ---
  const [turmaCreationMode, setTurmaCreationMode] = useState<'manual' | 'ai'>('manual');
  const [turmaNome, setTurmaNome] = useState('');
  const [turmaDisciplina, setTurmaDisciplina] = useState('');
  const [turmaAnoEscolaridade, setTurmaAnoEscolaridade] = useState('3º Ano Técnico - EPTNM');
  const [turmaDescricao, setTurmaDescricao] = useState('');
  const [editingTurmaId, setEditingTurmaId] = useState<string | null>(null);
  const [createdFeedback, setCreatedFeedback] = useState(false);
  const [turmasSearchQuery, setTurmasSearchQuery] = useState<string>('');
  const [deletingTurmaId, setDeletingTurmaId] = useState<string | null>(null);
  const [reportModalTurma, setReportModalTurma] = useState<ProfessoraClass | null>(null);

  // --- COMPARATIVO DE TURMAS ---
  const [selectedTurmasForComparison, setSelectedTurmasForComparison] = useState<string[]>([]);
  const [comparativoTimeframe, setComparativoTimeframe] = useState<'dia' | 'semana' | 'mes'>('semana');

  // --- ESTADOS DOS GERADORES PEDAGÓGICOS ---
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

  // 4. Apresentação de Slides (Integração com Biblioteca ou Manual)
  const [slidesTema, setSlidesTema] = useState('');
  const [slidesQtd, setSlidesQtd] = useState('5 a 7 slides');
  const [slidesSourceMode, setSlidesSourceMode] = useState<'library' | 'manual'>('manual');
  const [slidesSelectedLibraryItemId, setSlidesSelectedLibraryItemId] = useState<string>('');
  const [slidesLibrarySearch, setSlidesLibrarySearch] = useState<string>('');
  const [slidesLoadedContent, setSlidesLoadedContent] = useState<string>('');

  // 5. Sequência Didática
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

  // Saída Gerada
  const [generatedOutput, setGeneratedOutput] = useState<string>('');
  const [generatedTitle, setGeneratedTitle] = useState<string>('');

  // --- ESTADOS DO MODO ALUNO ---
  const [studentFilterTurma, setStudentFilterTurma] = useState<string>('all');
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [studentQuestion, setStudentQuestion] = useState<string>('');
  const [studentAiAnswer, setStudentAiAnswer] = useState<string>('');
  const [studentAiLoading, setStudentAiLoading] = useState<boolean>(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('atelie_completed_lessons');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [items, classes] = await Promise.all([
      dataService.fetchProfessoraMarketingItems(),
      dataService.fetchProfessoraClasses()
    ]);
    setLibraryItems(items || []);
    setClassesList(classes || []);
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
      throw new Error('Chave da API Gemini não configurada. Por favor, adicione sua chave nas Configurações.');
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

  // --- HANDLERS: TURMAS ---
  const handleGenerateTurmaAI = async () => {
    setLoading(true);
    try {
      const prompt = `Gere dados pedagógicos altamente realistas para uma nova Turma de Ensino Técnico Profissional em Marketing (EPTNM).
Retorne estritamente um objeto JSON com formato:
{
  "nome": "Turma 3002 - Estratégia de Conteúdo e Mídias",
  "disciplina": "Marketing de Conteúdo & Branding Digital",
  "anoEscolaridade": "3º Ano Técnico - EPTNM",
  "descricao": "Turma com foco em réguas de automação, gestão de canais digitais e métricas de desempenho para negócios locais."
}`;
      const responseText = await callGemini(prompt, 'Você é um orientador pedagógico de Marketing Técnico. Responda apenas com o JSON limpo.');
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.nome) setTurmaNome(parsed.nome);
        if (parsed.disciplina) setTurmaDisciplina(parsed.disciplina);
        if (parsed.anoEscolaridade) setTurmaAnoEscolaridade(parsed.anoEscolaridade);
        if (parsed.descricao) setTurmaDescricao(parsed.descricao);
        showToast('✨ Dados da turma gerados com IA!');
      }
    } catch (e: any) {
      showToast('Erro ao gerar dados da turma via IA.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTurma = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!turmaNome.trim() || !turmaDisciplina.trim() || !turmaAnoEscolaridade.trim()) {
      showToast('⚠️ Preencha os campos obrigatórios.');
      return;
    }

    const isDuplicate = classesList.some(c => 
      c.name.toLowerCase().trim() === turmaNome.toLowerCase().trim() && 
      c.id !== editingTurmaId
    );
    if (isDuplicate) {
      showToast('⚠️ Já existe uma turma com este nome.');
      return;
    }

    const matchingItems = libraryItems.filter(item => 
      item.title.toLowerCase().includes(turmaNome.toLowerCase().trim()) ||
      item.title.toLowerCase().includes(turmaDisciplina.toLowerCase().trim()) ||
      (item.metadata?.subject && item.metadata.subject.toLowerCase().includes(turmaDisciplina.toLowerCase().trim()))
    );

    const targetId = editingTurmaId || `turma-${Date.now()}`;
    const matchedIds = matchingItems.map(i => i.id);

    const classData: ProfessoraClass = {
      id: targetId,
      name: turmaNome.trim(),
      subject: turmaDisciplina.trim(),
      gradeYear: turmaAnoEscolaridade.trim(),
      description: turmaDescricao.trim(),
      linkedItemIds: matchedIds,
      status: 'ativa',
      createdAt: editingTurmaId ? (classesList.find(c => c.id === editingTurmaId)?.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now(),
      stats: {
        aulasConcluidas: Math.floor(Math.random() * 8) + 4,
        aulasPendentes: Math.floor(Math.random() * 4) + 1,
        materiaisVinculados: matchedIds.length,
        slidesGerados: Math.floor(Math.random() * 5) + 2,
        progressoMedioAlunos: Math.floor(Math.random() * 25) + 70,
        taxaConclusaoProjetos: Math.floor(Math.random() * 20) + 75
      }
    };

    try {
      if (editingTurmaId) {
        const { error: supabaseError } = await supabase
          .from('professora_marketing_ia')
          .update({
            nome_turma: turmaNome.trim(),
            modulo: turmaDisciplina.trim(),
            periodo: turmaAnoEscolaridade.trim(),
            descricao: turmaDescricao.trim(),
            ultima_atualizacao: new Date().toISOString()
          })
          .eq('id', editingTurmaId);

        if (supabaseError) {
          console.warn('Alerta ao atualizar turma no Supabase:', supabaseError);
        }
      }

      if (matchedIds.length > 0) {
        const updatedLibrary = libraryItems.map(item => {
          if (matchedIds.includes(item.id)) {
            const updatedItem = { ...item, classId: targetId };
            dataService.saveProfessoraMarketingItem(updatedItem);
            return updatedItem;
          }
          return item;
        });
        setLibraryItems(updatedLibrary);
        showToast('📚 Materiais vinculados automaticamente à turma!');
      }

      await dataService.saveProfessoraClass(classData);

      if (editingTurmaId) {
        setClassesList(prev => prev.map(c => c.id === editingTurmaId ? classData : c));
        showToast('✅ Turma atualizada com sucesso!');
        setEditingTurmaId(null);
      } else {
        setClassesList(prev => [classData, ...prev]);
        showToast('✅ Turma criada no Ateliê com sucesso!');
      }

      setCreatedFeedback(true);
      setTimeout(() => setCreatedFeedback(false), 2500);

      setTurmaNome('');
      setTurmaDisciplina('');
      setTurmaAnoEscolaridade('3º Ano Técnico - EPTNM');
      setTurmaDescricao('');
    } catch (err) {
      console.error('Erro ao salvar turma:', err);
      showToast('⚠️ Erro ao salvar turma.');
    }
  };

  const handleEditTurma = (turma: ProfessoraClass) => {
    setCurrentSection('turmas');
    setEditingTurmaId(turma.id);
    setTurmaNome(turma.name);
    setTurmaDisciplina(turma.subject);
    setTurmaAnoEscolaridade(turma.gradeYear);
    setTurmaDescricao(turma.description || '');
    showToast(`✏️ Editando: ${turma.name}`);
    
    setTimeout(() => {
      const el = document.getElementById('turma-form-container');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleToggleTurmaStatus = async (turma: ProfessoraClass) => {
    const newStatus = turma.status === 'inativa' ? 'ativa' : 'inativa';
    const updated = { ...turma, status: newStatus as 'ativa' | 'inativa', updatedAt: Date.now() };
    await dataService.saveProfessoraClass(updated);
    setClassesList(prev => prev.map(c => c.id === turma.id ? updated : c));
    showToast(`Turma "${turma.name}" agora está ${newStatus === 'ativa' ? 'Ativa' : 'Inativa'}.`);
  };

  const handleConfirmDeleteTurma = async (id: string) => {
    await dataService.deleteProfessoraClass(id);
    setClassesList(prev => prev.filter(c => c.id !== id));
    if (selectedTurmaView?.id === id) setSelectedTurmaView(null);
    setDeletingTurmaId(null);
    showToast('Turma removida com sucesso.');
  };

  const handleExportTurmaReport = (turma: ProfessoraClass, format: 'csv' | 'json') => {
    const reportData = {
      id: turma.id,
      nome: turma.name,
      disciplina: turma.subject,
      periodo: turma.gradeYear,
      status: turma.status || 'ativa',
      dataCriacao: new Date(turma.createdAt).toLocaleDateString('pt-BR'),
      ultimaAtualizacao: new Date(turma.updatedAt || turma.createdAt).toLocaleDateString('pt-BR'),
      stats: turma.stats || {
        aulasConcluidas: 8,
        aulasPendentes: 2,
        materiaisVinculados: (turma.linkedItemIds || []).length,
        slidesGerados: 4,
        progressoMedioAlunos: 85,
        taxaConclusaoProjetos: 90
      }
    };

    if (format === 'json') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `relatorio_${turma.name.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Relatório exportado em JSON!');
    } else {
      let csvContent = "data:text/csv;charset=utf-8,ID,Nome,Disciplina,Periodo,Status,AulasConcluidas,AulasPendentes,Materiais,Slides,ProgressoAlunosPercent,TaxaConclusaoPercent\n";
      csvContent += `"${reportData.id}","${reportData.nome}","${reportData.disciplina}","${reportData.periodo}","${reportData.status}",${reportData.stats.aulasConcluidas},${reportData.stats.aulasPendentes},${reportData.stats.materiaisVinculados},${reportData.stats.slidesGerados},${reportData.stats.progressoMedioAlunos},${reportData.stats.taxaConclusaoProjetos}\n`;
      const encodedUri = encodeURI(csvContent);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", encodedUri);
      downloadAnchor.setAttribute("download", `relatorio_${turma.name.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Relatório exportado em CSV!');
    }
  };

  const handleExportComparativeReport = (format: 'csv' | 'json') => {
    const selectedClasses = classesList.filter(c => selectedTurmasForComparison.includes(c.id));
    const targetClasses = selectedClasses.length > 0 ? selectedClasses : classesList;

    if (targetClasses.length === 0) {
      showToast('Nenhuma turma cadastrada para comparar.');
      return;
    }

    if (format === 'json') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(targetClasses, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `comparativo_turmas_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('📊 Comparativo exportado em JSON!');
    } else {
      let csvContent = "data:text/csv;charset=utf-8,ID,Nome,Disciplina,Periodo,Status,AulasConcluidas,AulasPendentes,MateriaisVinculados,SlidesGerados,ProgressoMedioAlunos,TaxaConclusaoProjetos\n";
      targetClasses.forEach(c => {
        const st = c.stats || { aulasConcluidas: 6, aulasPendentes: 2, materiaisVinculados: 4, slidesGerados: 3, progressoMedioAlunos: 80, taxaConclusaoProjetos: 85 };
        csvContent += `"${c.id}","${c.name}","${c.subject}","${c.gradeYear}","${c.status || 'ativa'}",${st.aulasConcluidas || 6},${st.aulasPendentes || 2},${st.materiaisVinculados || 4},${st.slidesGerados || 3},${st.progressoMedioAlunos || 80},${st.taxaConclusaoProjetos || 85}\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", encodedUri);
      downloadAnchor.setAttribute("download", `comparativo_turmas_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('📊 Comparativo exportado em CSV!');
    }
  };

  const handleToggleLinkItemToClass = async (itemId: string, classId: string | undefined) => {
    const updated = libraryItems.map(item => {
      if (item.id === itemId) {
        const newClassId = item.classId === classId ? undefined : classId;
        const newItem = { ...item, classId: newClassId };
        dataService.saveProfessoraMarketingItem(newItem);
        return newItem;
      }
      return item;
    });
    setLibraryItems(updated);
    showToast('Vínculo de turma atualizado!');
  };

  // --- GERADORES DA IA ---
  const handleSelectLibraryItemForSlides = (itemId: string) => {
    setSlidesSelectedLibraryItemId(itemId);
    const item = libraryItems.find(i => i.id === itemId);
    if (item) {
      setSlidesTema(item.title);
      setSlidesLoadedContent(item.content);
      showToast(`Tema "${item.title}" carregado do Ateliê! 📚`);
    } else {
      setSlidesLoadedContent('');
    }
  };

  const handleGenerateSlides = async () => {
    if (!slidesTema.trim()) {
      showToast('Defina o Tema da Apresentação!');
      return;
    }

    const isFromLibrary = slidesSourceMode === 'library' && slidesLoadedContent.trim().length > 0;

    const promptText = isFromLibrary 
      ? `Crie o roteiro detalhado para uma Apresentação de Slides para aula técnica em Marketing com base no CONTEÚDO SALVO DO ATELIÊ DA PROFESSORA.

Tema da Apresentação: ${slidesTema}
Quantidade estimada: ${slidesQtd}

CONTEÚDO BASE EXTRAÍDO DO ATELIÊ:
"""
${slidesLoadedContent}
"""

Para CADA slide forneça obrigatoriamente:
- **Slide X: [Título do Slide]**
- 📌 **Conteúdo do Slide (Bullet points objetivos)**
- 🗣️ **Fala do Professor (Roteiro verbal explicativo)**
- 💡 **Recurso Visual Recomendado (Imagem, gráfico ou diagrama)**
- ❓ **Pergunta de Checagem Rápida (para interação com a turma)**`
      : `Crie o roteiro detalhado para uma Apresentação de Slides para aula técnica em Marketing.
Tema: ${slidesTema}
Quantidade estimada: ${slidesQtd}

Para CADA slide forneça obrigatoriamente:
- **Slide X: [Título do Slide]**
- 📌 **Conteúdo do Slide (Bullet points objetivos)**
- 🗣️ **Fala do Professor (Roteiro verbal explicativo)**
- 💡 **Recurso Visual Recomendado (Imagem, gráfico ou diagrama)**
- ❓ **Pergunta de Checagem Rápida (para interação com a turma)**`;

    await handleGenerate('slides', `Roteiro de Slides: ${slidesTema}`, promptText);

    if (isFromLibrary) {
      showToast('✅ Slides gerados com base no material do Ateliê.');
    }
  };

  const handleGenerate = async (category: ProfessoraMarketingItem['category'], title: string, prompt: string) => {
    if (!title.trim()) {
      showToast('Por favor, preencha o assunto ou tema principal!');
      return;
    }
    setLoading(true);
    setGeneratedOutput('');
    setGeneratedTitle(title);

    const targetClass = classesList.find(c => c.id === selectedClassId);
    const classContext = targetClass 
      ? `\nTurma Alvo: ${targetClass.name} | Disciplina: ${targetClass.subject} (${targetClass.gradeYear})`
      : '';

    const systemInstruction = `Você é uma mentora especialista e professora sênior de Marketing para Educação Profissional Técnica de Nível Médio (EPTNM).
Suas respostas devem ser estruturadas em Markdown impecável, pedagógicas, alinhadas à prática do mercado atual e com diretrizes reais da educação profissional técnica.
Use tom acolhedor, altamente profissional e dinâmico para os alunos do ensino técnico.${classContext}`;

    try {
      const result = await callGemini(prompt, systemInstruction);
      setGeneratedOutput(result);
      showToast('Conteúdo gerado com sucesso!');
      
      const newItem: ProfessoraMarketingItem = {
        id: Date.now().toString(),
        title,
        category,
        content: result,
        classId: selectedClassId || undefined,
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
      category: activeGenerator as ProfessoraMarketingItem['category'],
      content: generatedOutput,
      classId: selectedClassId || undefined,
      createdAt: Date.now()
    };
    await dataService.saveProfessoraMarketingItem(newItem);
    setLibraryItems(prev => [newItem, ...prev]);
    showToast('Salvo no Ateliê com sucesso! 💾');
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
    showToast('Item removido do Ateliê.');
  };

  // --- MODO ALUNO: TIRA-DÚVIDAS IA & CHECKLIST ---
  const handleAskStudentAi = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!studentQuestion.trim()) return;

    setStudentAiLoading(true);
    setStudentAiAnswer('');

    const targetClass = classesList.find(c => c.id === studentFilterTurma);
    const context = targetClass 
      ? `O aluno está matriculado na disciplina "${targetClass.subject}" (${targetClass.name}).`
      : 'O estudante cursa formação técnica em Marketing (EPTNM).';

    const prompt = `Pergunta do estudante: "${studentQuestion}"
Contexto: ${context}
Explique com clareza, empatia e exemplos didáticos do dia a dia ou de marcas reais no Brasil. Ajude-o a entender o conceito e aplicar na prática.`;

    const systemInstruction = `Você é o tutor virtual amigável do Ateliê de Marketing. Responda em Markdown claro, encorajador, pontual e fácil de assimilar por estudantes do ensino técnico profissional.`;

    try {
      const resp = await callGemini(prompt, systemInstruction);
      setStudentAiAnswer(resp);
      showToast('💡 Resposta gerada pela IA de apoio!');
    } catch (err: any) {
      setStudentAiAnswer('Não foi possível responder no momento. Tente novamente em instantes.');
      showToast('Erro ao consultar IA.');
    } finally {
      setStudentAiLoading(false);
    }
  };

  const handleToggleLessonCompleted = (lessonId: string) => {
    let updated: string[];
    if (completedLessons.includes(lessonId)) {
      updated = completedLessons.filter(id => id !== lessonId);
    } else {
      updated = [...completedLessons, lessonId];
    }
    setCompletedLessons(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('atelie_completed_lessons', JSON.stringify(updated));
    }
  };

  // --- CONFIGURAÇÃO DAS FERRAMENTAS PEDAGÓGICAS ---
  const toolsConfig: { id: GeneratorTool; label: string; icon: any; desc: string; duration: string }[] = [
    { id: 'plano_aula', label: 'Plano de Aula', icon: Brain, desc: 'Estruturação pedagógica completa EPTNM', duration: '50 min' },
    { id: 'slides', label: 'Apresentação de Slides', icon: Presentation, desc: 'Roteiro visual e fala do professor com IA', duration: '40 min' },
    { id: 'material_didatico', label: 'Material Didático', icon: BookOpen, desc: 'Resumos, conceitos-chave e guias práticos', duration: '30 min' },
    { id: 'sequencia_didatica', label: 'Sequência Didática', icon: FileText, desc: 'Organização didática estruturada em 4 etapas', duration: '4 aulas' },
    { id: 'folha_atividade', label: 'Folha de Atividade', icon: ClipboardList, desc: 'Exercícios práticos com gabarito comentado', duration: '30 min' },
    { id: 'ideias_atividades', label: 'Ideias de Atividades', icon: Lightbulb, desc: 'Dinâmicas ativas e agência simulada', duration: '45 min' },
    { id: 'jogos_educativos', label: 'Jogos Educativos', icon: Gamepad2, desc: 'Gamificação e desafios de marca em equipe', duration: '50 min' },
    { id: 'quiz', label: 'Quiz Interativo', icon: HelpCircle, desc: 'Questões de fixação com justificativas', duration: '20 min' },
    { id: 'assistente_mercado', label: 'Assistente de Mercado', icon: MessageSquare, desc: 'Casos reais, marcas brasileiras e tendências', duration: '15 min' }
  ];

  // Itens filtrados da biblioteca
  const filteredLibrary = libraryItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(librarySearch.toLowerCase()) || 
                          item.content.toLowerCase().includes(librarySearch.toLowerCase());
    const matchesCategory = libraryCategoryFilter === 'all' || item.category === libraryCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Métricas do Ateliê
  const totalMateriais = libraryItems.length;
  const totalDisciplinas = classesList.length;
  const turmasAtivasCount = classesList.filter(c => c.status !== 'inativa').length;

  // Variáveis de Estilo Híbrido: Claro Lavanda (Ateliê) vs Escuro Elegante
  const isDark = themeMode === 'dark';
  
  const themeClasses = {
    container: isDark ? 'bg-[#12101b] text-slate-100' : 'bg-[#faf8fe] text-slate-800',
    card: isDark ? 'bg-[#1b172a] border-[#2e2646] shadow-black/20' : 'bg-white border-[#ebe4f7] shadow-sm shadow-purple-500/5',
    cardMuted: isDark ? 'bg-[#161324] border-[#28213f]' : 'bg-[#f7f4fd] border-[#ede8f8]',
    border: isDark ? 'border-[#2e2646]' : 'border-[#ebe4f7]',
    title: isDark ? 'text-white' : 'text-[#1e1538]',
    subtitle: isDark ? 'text-slate-400' : 'text-[#645c7b]',
    heroBg: isDark ? 'bg-gradient-to-br from-[#241c3d] via-[#1c1630] to-[#161228] border-purple-500/30' : 'bg-gradient-to-r from-[#f4effa] via-[#f7f2fc] to-[#ede5f9] border-[#e2d9f3]',
    accentPill: isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-[#ede5fa] text-[#6d28d9] border-[#ded3f5]',
    inputBg: isDark ? 'bg-[#151222] border-[#2e2646] text-white' : 'bg-white border-[#e3dcf0] text-[#1e1538]',
    tabActive: isDark ? 'bg-purple-600/30 text-purple-200 border-purple-500/50' : 'bg-[#ede5fa] text-[#6d28d9] border-[#d8c8f5] shadow-xs'
  };

  return (
    <div className={`transition-colors duration-300 rounded-3xl p-4 sm:p-6 md:p-8 space-y-8 ${themeClasses.container}`}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-[9999] bg-[#3a2068] text-white border border-purple-400/40 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs md:text-sm font-semibold"
          >
            <Sparkles size={18} className="text-yellow-300 animate-pulse" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP BAR: BREADCRUMBS + SELETOR MODO PROFESSOR/ALUNO + TEMA HÍBRIDO */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-500/10">
        {/* Breadcrumb estilo Ateliê de Aulas */}
        <div className="flex items-center gap-2 text-xs font-medium text-[#7c7297]">
          <span className="flex items-center gap-1.5 font-semibold text-[#8b5cf6]">
            <Compass size={14} /> Meu espaço
          </span>
          <span>&gt;</span>
          <span className={`capitalize font-bold ${isDark ? 'text-white' : 'text-[#2a1e4a]'}`}>
            {viewMode === 'aluno' 
              ? 'Área do Aluno' 
              : currentSection === 'visao_geral' ? 'Visão geral'
              : currentSection === 'turmas' ? 'Turmas'
              : currentSection === 'materiais' ? 'Meus materiais'
              : currentSection === 'ia_assistente' ? 'IA Assistente'
              : 'Relatórios'}
          </span>
        </div>

        {/* Controles de Topo: Alternador Modo Professor/Aluno + Tema Híbrido */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Alternador de Modo de Visualização */}
          <div className={`flex items-center p-1 rounded-2xl border ${themeClasses.border} ${themeClasses.cardMuted}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 text-[#7d759a] hidden sm:inline">
              Modo:
            </span>
            <button
              onClick={() => handleToggleViewMode('professor')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'professor'
                  ? 'bg-[#7c3aed] text-white shadow-sm shadow-purple-500/30'
                  : 'text-[#6f678e] hover:text-[#7c3aed]'
              }`}
              title="Modo Professor: Gestão completa de turmas, materiais e relatórios"
            >
              <span>🎓</span> Professor
            </button>
            <button
              onClick={() => handleToggleViewMode('aluno')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'aluno'
                  ? 'bg-[#2563eb] text-white shadow-sm shadow-blue-500/30'
                  : 'text-[#6f678e] hover:text-[#2563eb]'
              }`}
              title="Modo Aluno: Conteúdos didáticos, planos de estudo e assistente de dúvidas"
            >
              <span>📘</span> Aluno
            </button>
          </div>

          {/* Botão de Alternância Tema Híbrido (Claro Lavanda / Escuro) */}
          <button
            onClick={handleToggleTheme}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${themeClasses.card} ${themeClasses.border} hover:border-purple-400`}
            title={`Alternar para tema ${isDark ? 'Claro Lavanda' : 'Escuro'}`}
          >
            {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-purple-600" />}
            <span className="hidden sm:inline">{isDark ? 'Claro' : 'Escuro'}</span>
          </button>

          {/* Botão Ação Rápida Ateliê */}
          {viewMode === 'professor' && (
            <button
              onClick={() => {
                setCurrentSection('ia_assistente');
                setActiveGenerator('plano_aula');
              }}
              className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-purple-600/30 active:scale-95"
            >
              <Plus size={15} />
              <span>+ Novo material</span>
            </button>
          )}
        </div>
      </header>

      {/* NAVEGAÇÃO SECUNDÁRIA ESTILO ATELIÊ DE AULAS */}
      {viewMode === 'professor' ? (
        <nav className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'visao_geral', label: 'Visão geral', icon: LayoutDashboard },
            { id: 'turmas', label: 'Turmas', icon: Users, badge: classesList.length },
            { id: 'materiais', label: 'Meus materiais', icon: BookOpen, badge: libraryItems.length },
            { id: 'ia_assistente', label: 'IA Assistente', icon: Sparkles },
            { id: 'relatorios', label: 'Relatórios & Comparativo', icon: BarChart3 }
          ].map(tab => {
            const isActive = currentSection === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setCurrentSection(tab.id as AtelieSection);
                  setGeneratedOutput('');
                }}
                className={`px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? themeClasses.tabActive
                    : `${themeClasses.card} text-[#6c6488] hover:border-purple-300`
                }`}
              >
                <Icon size={16} className={isActive ? 'text-[#7c3aed]' : 'text-[#8f87a8]'} />
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-[#7c3aed] text-white' : 'bg-purple-500/10 text-purple-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      ) : (
        /* Navegação Modo Aluno */
        <nav className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest px-3 py-1 bg-blue-500/10 rounded-xl">
              Portal do Estudante
            </span>
            <span className="text-xs text-[#766e92]">
              Acesse suas aulas, materiais didáticos e tire dúvidas pedagógicas em tempo real.
            </span>
          </div>
        </nav>
      )}

      {/* ============================================================== */}
      {/* 🎓 MODO PROFESSOR: CONTEÚDO PRINCIPAL                          */}
      {/* ============================================================== */}
      <AnimatePresence mode="wait">
        {viewMode === 'professor' ? (
          <motion.div
            key="professor-mode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* ------------------------------------------------------------- */}
            {/* SEÇÃO 1: VISÃO GERAL (O DASHBOARD DO ATELIÊ DE AULAS)          */}
            {/* ------------------------------------------------------------- */}
            {currentSection === 'visao_geral' && (
              <div className="space-y-8">
                {/* HERO BANNER ESTILO ATELIÊ DE AULAS */}
                <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 md:p-10 border transition-all ${themeClasses.heroBg}`}>
                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    {/* Bloco de Texto Principal */}
                    <div className="space-y-4 max-w-xl">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-purple-300/40 bg-white/70 text-[#7c3aed]">
                        <Sparkles size={12} />
                        SEU ATELIÊ DE MARKETING
                      </div>

                      <div className="space-y-2">
                        <p className="text-[11px] font-bold tracking-widest uppercase text-[#8878a8]">
                          PREPARAR HOJE. ENSINAR AMANHÃ.
                        </p>
                        <h1 className={`text-2xl sm:text-3xl md:text-4xl font-display font-extrabold tracking-tight ${themeClasses.title}`}>
                          Grandes aulas começam com uma boa ideia.
                        </h1>
                        <p className={`text-sm md:text-base leading-relaxed ${themeClasses.subtitle}`}>
                          Reúna conteúdos, planeje experiências e prepare materiais didáticos completos para o Ensino Técnico Profissional no seu próprio ritmo.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          onClick={() => {
                            setCurrentSection('ia_assistente');
                            setActiveGenerator('plano_aula');
                          }}
                          className="px-5 py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-2xl text-xs md:text-sm font-bold transition-all shadow-md shadow-purple-600/30 flex items-center gap-2 active:scale-95"
                        >
                          <span>Preparar uma aula</span>
                          <ArrowRight size={16} />
                        </button>
                        <button
                          onClick={() => setCurrentSection('turmas')}
                          className={`px-4 py-3 rounded-2xl text-xs md:text-sm font-bold border transition-all flex items-center gap-2 ${themeClasses.card} hover:border-purple-400`}
                        >
                          <Users size={16} className="text-[#7c3aed]" />
                          <span>Gerenciar Turmas</span>
                        </button>
                      </div>
                    </div>

                    {/* Ilustração / Card 3D Inspirado no Ateliê */}
                    <div className="relative flex justify-center lg:justify-end">
                      <div className="relative w-64 sm:w-72 p-6 rounded-3xl bg-white text-slate-800 shadow-2xl border border-purple-100 rotate-1 hover:rotate-0 transition-transform duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                            PLANO DE AULA
                          </span>
                          <Brain size={20} className="text-purple-500" />
                        </div>
                        <h4 className="text-lg font-display font-bold text-slate-800 leading-snug">
                          Ideias que viram aprendizado.
                        </h4>
                        <p className="text-xs text-slate-500 mt-2">
                          Estruture competências da EPTNM, cronogramas de aula e dinâmicas ativas em minutos.
                        </p>
                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-700">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle size={14} className="text-emerald-500" /> Preparar para inspirar
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MÉTRICAS EM CARDS CLAROS E ESPAÇADOS (Idênticos ao Ateliê) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                  {/* Card 1: Materiais */}
                  <div className={`p-6 rounded-3xl border flex items-center gap-4 transition-all ${themeClasses.card}`}>
                    <div className="p-4 rounded-2xl bg-[#ede5fa] text-[#7c3aed]">
                      <BookOpen size={26} />
                    </div>
                    <div>
                      <h3 className={`text-2xl sm:text-3xl font-display font-black ${themeClasses.title}`}>
                        {String(totalMateriais).padStart(2, '0')}
                      </h3>
                      <p className={`text-xs sm:text-sm font-medium ${themeClasses.subtitle}`}>
                        Materiais no ateliê
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Disciplinas em preparação */}
                  <div className={`p-6 rounded-3xl border flex items-center gap-4 transition-all ${themeClasses.card}`}>
                    <div className="p-4 rounded-2xl bg-[#fef3c7] text-[#d97706]">
                      <Layers size={26} />
                    </div>
                    <div>
                      <h3 className={`text-2xl sm:text-3xl font-display font-black ${themeClasses.title}`}>
                        {String(totalDisciplinas).padStart(2, '0')}
                      </h3>
                      <p className={`text-xs sm:text-sm font-medium ${themeClasses.subtitle}`}>
                        Disciplinas em preparação
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Turmas ativas */}
                  <div className={`p-6 rounded-3xl border flex items-center gap-4 transition-all ${themeClasses.card}`}>
                    <div className="p-4 rounded-2xl bg-[#d1fae5] text-[#059669]">
                      <CheckCircle2 size={26} />
                    </div>
                    <div>
                      <h3 className={`text-2xl sm:text-3xl font-display font-black ${themeClasses.title}`}>
                        {String(turmasAtivasCount).padStart(2, '0')}
                      </h3>
                      <p className={`text-xs sm:text-sm font-medium ${themeClasses.subtitle}`}>
                        Prontas para ensinar
                      </p>
                    </div>
                  </div>
                </div>

                {/* SEÇÃO: POR ONDE COMEÇAR? (3 PROPOSTAS RÁPIDAS) */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className={`text-lg md:text-xl font-display font-bold ${themeClasses.title}`}>
                        Por onde começar?
                      </h3>
                      <p className={`text-xs md:text-sm ${themeClasses.subtitle}`}>
                        Três propostas para tirar sua primeira aula técnica do papel hoje.
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentSection('ia_assistente')}
                      className="text-xs font-bold text-[#7c3aed] hover:underline flex items-center gap-1 self-start sm:self-auto"
                    >
                      Ver todas as ferramentas IA <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Card Proposta 1 */}
                    <div 
                      onClick={() => {
                        setCurrentSection('ia_assistente');
                        setActiveGenerator('plano_aula');
                        setPlanoTema('O marketing no nosso cotidiano');
                      }}
                      className={`p-6 rounded-3xl border cursor-pointer group transition-all hover:scale-[1.01] hover:border-purple-400 ${themeClasses.card}`}
                    >
                      <div className="p-3 w-fit rounded-2xl bg-[#ede5fa] text-[#7c3aed] mb-4 group-hover:bg-[#7c3aed] group-hover:text-white transition-colors">
                        <Lightbulb size={22} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8878a8]">
                        Plano de aula · 50 min
                      </span>
                      <h4 className={`text-base font-display font-bold mt-1 group-hover:text-[#7c3aed] transition-colors ${themeClasses.title}`}>
                        O marketing no nosso cotidiano
                      </h4>
                      <p className={`text-xs mt-2 leading-relaxed ${themeClasses.subtitle}`}>
                        Conceitos, exemplos locais e um roteiro pronto para conduzir uma aula engajadora.
                      </p>
                    </div>

                    {/* Card Proposta 2 */}
                    <div 
                      onClick={() => {
                        setCurrentSection('ia_assistente');
                        setActiveGenerator('ideias_atividades');
                        setIdeiasTema('Os 4 Ps na prática');
                      }}
                      className={`p-6 rounded-3xl border cursor-pointer group transition-all hover:scale-[1.01] hover:border-amber-400 ${themeClasses.card}`}
                    >
                      <div className="p-3 w-fit rounded-2xl bg-[#fef3c7] text-[#d97706] mb-4 group-hover:bg-[#d97706] group-hover:text-white transition-colors">
                        <Layers size={22} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8878a8]">
                        Atividade · 30 min
                      </span>
                      <h4 className={`text-base font-display font-bold mt-1 group-hover:text-[#d97706] transition-colors ${themeClasses.title}`}>
                        Os 4 Ps na prática
                      </h4>
                      <p className={`text-xs mt-2 leading-relaxed ${themeClasses.subtitle}`}>
                        Uma atividade mão na massa para conectar produto, preço, praça e promoção.
                      </p>
                    </div>

                    {/* Card Proposta 3 */}
                    <div 
                      onClick={() => {
                        setCurrentSection('ia_assistente');
                        setActiveGenerator('quiz');
                        setQuizTema('Diagnóstico inicial de Marketing');
                      }}
                      className={`p-6 rounded-3xl border cursor-pointer group transition-all hover:scale-[1.01] hover:border-emerald-400 ${themeClasses.card}`}
                    >
                      <div className="p-3 w-fit rounded-2xl bg-[#d1fae5] text-[#059669] mb-4 group-hover:bg-[#059669] group-hover:text-white transition-colors">
                        <CheckCircle size={22} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8878a8]">
                        Avaliação · 20 min
                      </span>
                      <h4 className={`text-base font-display font-bold mt-1 group-hover:text-[#059669] transition-colors ${themeClasses.title}`}>
                        Diagnóstico inicial de Marketing
                      </h4>
                      <p className={`text-xs mt-2 leading-relaxed ${themeClasses.subtitle}`}>
                        Conheça o ponto de partida do conhecimento prévio da sua futura turma.
                      </p>
                    </div>
                  </div>
                </div>

                {/* CARD MOTIVACIONAL DO ATELIÊ NO RODAPÉ */}
                <div className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${themeClasses.cardMuted}`}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-[#ede5fa] text-[#7c3aed]">
                      <GraduationCap size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#7c3aed]">
                        ENSINO TÉCNICO · MARKETING
                      </p>
                      <h4 className={`text-sm md:text-base font-display font-bold mt-0.5 ${themeClasses.title}`}>
                        Uma aula de cada vez.
                      </h4>
                      <p className={`text-xs ${themeClasses.subtitle}`}>
                        Seu próximo capítulo começa na preparação de hoje. Transforme ideias em boas aulas.
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-[#8c82a8] font-medium self-end sm:self-auto">
                    Professora Raquel Duarte
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* SEÇÃO 2: TURMAS (GESTÃO COMPLETA, CADASTRO, VÍNCULOS, RELATÓRIO)*/}
            {/* ------------------------------------------------------------- */}
            {currentSection === 'turmas' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Formulário de Criação/Edição de Turma */}
                  <div className="lg:col-span-5 space-y-4">
                    <form 
                      id="turma-form-container" 
                      onSubmit={handleSaveTurma} 
                      className={`p-6 md:p-8 rounded-3xl space-y-5 border shadow-sm ${themeClasses.card}`}
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-purple-500/10">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-[#ede5fa] rounded-2xl text-[#7c3aed]">
                            <School size={22} />
                          </div>
                          <div>
                            <h3 className={`text-lg font-display font-bold ${themeClasses.title}`}>
                              {editingTurmaId ? 'Editar Turma' : 'Cadastrar Nova Turma'}
                            </h3>
                            <p className={`text-xs ${themeClasses.subtitle}`}>
                              Gestão pedagógica da turma EPTNM
                            </p>
                          </div>
                        </div>
                        {editingTurmaId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTurmaId(null);
                              setTurmaNome('');
                              setTurmaDisciplina('');
                              setTurmaDescricao('');
                            }}
                            className="text-xs text-rose-500 hover:underline font-semibold"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>

                      {/* Modo de Cadastro: Manual vs Automático IA */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block">
                          Modo de Preenchimento
                        </label>
                        <div className="grid grid-cols-2 gap-2 p-1 bg-purple-500/5 rounded-2xl border border-purple-500/10">
                          <button
                            type="button"
                            onClick={() => setTurmaCreationMode('manual')}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                              turmaCreationMode === 'manual'
                                ? 'bg-[#7c3aed] text-white shadow-xs'
                                : 'text-[#6f678e] hover:text-[#7c3aed]'
                            }`}
                          >
                            <Edit2 size={13} />
                            Manual
                          </button>
                          <button
                            type="button"
                            onClick={() => setTurmaCreationMode('ai')}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                              turmaCreationMode === 'ai'
                                ? 'bg-[#7c3aed] text-white shadow-xs'
                                : 'text-[#6f678e] hover:text-[#7c3aed]'
                            }`}
                          >
                            <Sparkles size={13} />
                            Automático (IA)
                          </button>
                        </div>
                      </div>

                      {/* Botão de Preenchimento Automático IA */}
                      {turmaCreationMode === 'ai' && (
                        <div className="p-4 bg-[#f5effd] dark:bg-purple-950/20 border border-purple-300/40 rounded-2xl space-y-2.5">
                          <p className="text-xs text-[#6d28d9] dark:text-purple-300 font-medium leading-relaxed">
                            A IA do Gemini formulará uma proposta completa de turma alinhada às competências técnicas do curso de Marketing.
                          </p>
                          <button
                            type="button"
                            onClick={handleGenerateTurmaAI}
                            disabled={loading}
                            className="w-full py-2.5 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#6d28d9] hover:to-[#5b21b6] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                          >
                            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            Preencher Automaticamente com IA
                          </button>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                            Nome da Turma *
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Turma 3001 - Marketing Digital"
                            value={turmaNome}
                            onChange={e => setTurmaNome(e.target.value)}
                            className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                            Disciplina / Módulo *
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Marketing de Conteúdo & Mídias Sociais"
                            value={turmaDisciplina}
                            onChange={e => setTurmaDisciplina(e.target.value)}
                            className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                            Ano de Escolaridade / Período *
                          </label>
                          <select
                            value={turmaAnoEscolaridade}
                            onChange={e => setTurmaAnoEscolaridade(e.target.value)}
                            className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                          >
                            <option value="1º Ano Técnico - EPTNM">1º Ano Técnico - EPTNM</option>
                            <option value="2º Ano Técnico - EPTNM">2º Ano Técnico - EPTNM</option>
                            <option value="3º Ano Técnico - EPTNM">3º Ano Técnico - EPTNM</option>
                            <option value="Módulo Subsequente / Pós-Médio">Módulo Subsequente / Pós-Médio</option>
                            <option value="Curso Livre / Extensão">Curso Livre / Extensão</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                            Descrição / Observações da Turma
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Ex: Particularidades da turma, horários, projetos integradores..."
                            value={turmaDescricao}
                            onChange={e => setTurmaDescricao(e.target.value)}
                            className={`w-full rounded-2xl p-4 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                          />
                        </div>

                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          className={`w-full py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-2xl font-bold shadow-md shadow-purple-600/30 flex items-center justify-center gap-2.5 transition-all ${
                            createdFeedback ? 'bg-emerald-600 hover:bg-emerald-600' : ''
                          }`}
                        >
                          {createdFeedback ? (
                            <>
                              <CheckCircle2 size={20} className="animate-bounce" />
                              <span>{editingTurmaId ? 'Turma Atualizada!' : 'Turma Cadastrada com Sucesso!'}</span>
                            </>
                          ) : (
                            <>
                              {editingTurmaId ? <Save size={18} /> : <Plus size={18} />}
                              <span>{editingTurmaId ? 'Salvar Alterações da Turma' : 'Criar Turma no Ateliê'}</span>
                            </>
                          )}
                        </motion.button>
                      </div>
                    </form>
                  </div>

                  {/* Lista de Turmas Cadastradas */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-purple-500/10">
                      <div>
                        <h3 className={`text-lg font-display font-bold flex items-center gap-2 ${themeClasses.title}`}>
                          <School className="text-[#7c3aed]" size={22} />
                          Turmas Cadastradas ({classesList.length})
                        </h3>
                        <p className={`text-xs ${themeClasses.subtitle}`}>
                          Acompanhe planos, materiais vinculados e relatórios de progresso.
                        </p>
                      </div>

                      {/* Busca por Turma */}
                      <div className="relative w-full sm:w-64">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8878a8]" />
                        <input
                          type="text"
                          placeholder="Buscar por turma ou módulo..."
                          value={turmasSearchQuery}
                          onChange={e => setTurmasSearchQuery(e.target.value)}
                          className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {classesList.length > 0 ? (
                        classesList
                          .filter(t => 
                            t.name.toLowerCase().includes(turmasSearchQuery.toLowerCase()) || 
                            t.subject.toLowerCase().includes(turmasSearchQuery.toLowerCase())
                          )
                          .map((turma) => {
                            const linkedItems = libraryItems.filter(item => item.classId === turma.id);
                            const isActive = turma.status !== 'inativa';

                            return (
                              <div
                                key={turma.id}
                                className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${themeClasses.card} ${
                                  !isActive ? 'opacity-60' : 'hover:border-purple-400'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-purple-500/10 text-[#7c3aed] rounded-full border border-purple-200/50">
                                        {turma.gradeYear}
                                      </span>
                                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-blue-500/10 text-blue-600 rounded-full border border-blue-200/50">
                                        {linkedItems.length} materiais vinculados
                                      </span>
                                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                                        isActive
                                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200/60'
                                          : 'bg-slate-500/10 text-slate-500 border-slate-200'
                                      }`}>
                                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                        {isActive ? 'Ativa' : 'Inativa'}
                                      </span>
                                    </div>

                                    <h4 className={`text-xl font-display font-bold ${themeClasses.title}`}>
                                      {turma.name}
                                    </h4>
                                    <p className="text-sm font-semibold text-[#7c3aed] mt-0.5">
                                      📘 {turma.subject}
                                    </p>
                                    {turma.description && (
                                      <p className={`text-xs mt-2 p-3 rounded-2xl border ${themeClasses.cardMuted}`}>
                                        {turma.description}
                                      </p>
                                    )}
                                  </div>

                                  {/* Botões de Ação */}
                                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                    <button
                                      onClick={() => handleToggleTurmaStatus(turma)}
                                      className={`p-2 rounded-xl transition-all border ${
                                        isActive 
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                      }`}
                                      title={isActive ? "Desativar Turma" : "Ativar Turma"}
                                    >
                                      {isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                    </button>

                                    <button
                                      onClick={() => setReportModalTurma(turma)}
                                      className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all"
                                      title="Ver Relatório Detalhado"
                                    >
                                      <BarChart3 size={16} />
                                    </button>

                                    <button
                                      onClick={() => handleEditTurma(turma)}
                                      className="p-2 bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all"
                                      title="Editar Turma"
                                    >
                                      <Edit2 size={16} />
                                    </button>

                                    <button
                                      onClick={() => setDeletingTurmaId(turma.id)}
                                      className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
                                      title="Excluir Turma"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>

                                {/* Rodapé do Card da Turma */}
                                <div className="pt-3 border-t border-purple-500/10 flex flex-wrap items-center justify-between gap-2">
                                  <button
                                    onClick={() => setSelectedTurmaView(turma)}
                                    className="text-xs font-bold text-[#7c3aed] hover:underline flex items-center gap-1.5"
                                  >
                                    <FolderOpen size={15} /> Ver materiais vinculados ({linkedItems.length})
                                  </button>
                                  <span className="text-[10px] text-[#8878a8]">
                                    Criada em: {new Date(turma.createdAt).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                      ) : (
                        <div className={`py-16 text-center space-y-3 rounded-3xl border ${themeClasses.cardMuted}`}>
                          <Users size={48} className="mx-auto text-[#8878a8] stroke-[1.5]" />
                          <p className={`text-sm ${themeClasses.subtitle}`}>
                            Nenhuma turma encontrada. Cadastre uma nova turma no formulário ao lado!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* SEÇÃO 3: MEUS MATERIAIS & BIBLIOTECA SALVA                   */}
            {/* ------------------------------------------------------------- */}
            {currentSection === 'materiais' && (
              <div className="space-y-6">
                {/* Barra de Busca e Filtro de Categorias */}
                <div className={`p-6 rounded-3xl border flex flex-col md:flex-row gap-4 items-center justify-between ${themeClasses.card}`}>
                  <div className="relative w-full md:w-96">
                    <input
                      type="text"
                      placeholder="Pesquisar nos materiais do ateliê..."
                      value={librarySearch}
                      onChange={e => setLibrarySearch(e.target.value)}
                      className={`w-full rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                    />
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8878a8]" />
                  </div>

                  <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 scrollbar-none">
                    <button
                      onClick={() => setLibraryCategoryFilter('all')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        libraryCategoryFilter === 'all'
                          ? 'bg-[#7c3aed] text-white'
                          : `${themeClasses.cardMuted} text-[#6c6488] hover:border-purple-300`
                      }`}
                    >
                      Todos ({libraryItems.length})
                    </button>
                    {toolsConfig.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setLibraryCategoryFilter(t.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                          libraryCategoryFilter === t.id
                            ? 'bg-[#7c3aed] text-white'
                            : `${themeClasses.cardMuted} text-[#6c6488] hover:border-purple-300`
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid de Materiais */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLibrary.length > 0 ? (
                    filteredLibrary.map((item) => {
                      const cfg = toolsConfig.find(s => s.id === item.category);
                      const linkedClass = classesList.find(c => c.id === item.classId);
                      const Icon = cfg?.icon || BookOpen;

                      return (
                        <div
                          key={item.id}
                          className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-4 group hover:border-purple-400 ${themeClasses.card}`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-[#ede5fa] text-[#7c3aed] rounded-full border border-purple-200/60 flex items-center gap-1.5">
                                <Icon size={12} />
                                {cfg?.label || item.category}
                              </span>
                              <span className="text-[10px] text-[#8878a8]">
                                {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>

                            {linkedClass && (
                              <span className="inline-block text-[10px] bg-blue-500/10 text-blue-600 font-bold px-2.5 py-0.5 rounded-lg mb-2 border border-blue-200/50">
                                🏫 {linkedClass.name}
                              </span>
                            )}

                            <h4 className={`text-base font-display font-bold line-clamp-2 mt-1 group-hover:text-[#7c3aed] transition-colors ${themeClasses.title}`}>
                              {item.title}
                            </h4>
                            <p className={`text-xs line-clamp-4 mt-2 p-3 rounded-2xl border ${themeClasses.cardMuted}`}>
                              {item.content.replace(/[#*`_]/g, '')}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-purple-500/10">
                            <button
                              onClick={() => setSelectedLibraryItem(item)}
                              className="text-xs font-bold text-[#7c3aed] hover:underline flex items-center gap-1"
                            >
                              <Eye size={14} /> Visualizar Completo
                            </button>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => copyToClipboard(item.content, item.id)}
                                className={`p-2 rounded-xl border transition-all ${themeClasses.cardMuted} hover:border-purple-300`}
                                title="Copiar"
                              >
                                {copiedId === item.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                              </button>
                              <button
                                onClick={() => handleDeleteLibraryItem(item.id)}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-rose-200"
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
                    <div className={`col-span-full py-16 text-center space-y-3 rounded-3xl border ${themeClasses.cardMuted}`}>
                      <BookmarkCheck size={48} className="mx-auto text-[#8878a8] stroke-[1.5]" />
                      <p className={`text-sm ${themeClasses.subtitle}`}>
                        Nenhum material encontrado no ateliê. Crie um novo plano ou atividade na aba IA Assistente!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* SEÇÃO 4: IA ASSISTENTE (TODAS AS 9 FERRAMENTAS PEDAGÓGICAS)    */}
            {/* ------------------------------------------------------------- */}
            {currentSection === 'ia_assistente' && (
              <div className="space-y-6">
                {/* Seletor de Turma Alvo para Vínculo */}
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${themeClasses.card}`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#ede5fa] text-[#7c3aed] rounded-xl">
                      <Users size={18} />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${themeClasses.title}`}>
                        Vincular Geração a uma Turma (Opcional)
                      </p>
                      <p className={`text-[11px] ${themeClasses.subtitle}`}>
                        O material gerado será automaticamente salvo e associado à turma selecionada.
                      </p>
                    </div>
                  </div>
                  <select
                    value={selectedClassId}
                    onChange={e => setSelectedClassId(e.target.value)}
                    className={`w-full sm:w-72 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                  >
                    <option value="">Nenhuma turma selecionada (Material Geral)</option>
                    {classesList.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.gradeYear})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grid de Seleção da Ferramenta IA */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
                  {toolsConfig.map(t => {
                    const isActive = activeGenerator === t.id;
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setActiveGenerator(t.id);
                          setGeneratedOutput('');
                        }}
                        className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between gap-1.5 ${
                          isActive
                            ? 'bg-[#7c3aed] text-white border-purple-600 shadow-md shadow-purple-600/20'
                            : `${themeClasses.card} text-[#6c6488] hover:border-purple-300`
                        }`}
                      >
                        <Icon size={18} className={isActive ? 'text-white' : 'text-[#7c3aed]'} />
                        <span className="text-[11px] font-bold line-clamp-1">{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Painel do Gerador Ativo: Formulário (Esquerda) e Resultado (Direita) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Coluna Esquerda: Formulário de Entrada */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className={`p-6 md:p-8 rounded-3xl space-y-5 border shadow-sm ${themeClasses.card}`}>
                      <div className="flex items-center gap-3 pb-3 border-b border-purple-500/10">
                        <div className="p-2.5 bg-[#ede5fa] rounded-2xl text-[#7c3aed]">
                          {React.createElement(toolsConfig.find(t => t.id === activeGenerator)?.icon || Sparkles, { size: 20 })}
                        </div>
                        <div>
                          <h3 className={`text-lg font-display font-bold ${themeClasses.title}`}>
                            {toolsConfig.find(t => t.id === activeGenerator)?.label}
                          </h3>
                          <p className={`text-xs ${themeClasses.subtitle}`}>
                            {toolsConfig.find(t => t.id === activeGenerator)?.desc}
                          </p>
                        </div>
                      </div>

                      {/* 1. PLANO DE AULA */}
                      {activeGenerator === 'plano_aula' && (
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                              Tema / Conteúdo da Aula *
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Funil de Vendas Digital e Inbound Marketing"
                              value={planoTema}
                              onChange={e => setPlanoTema(e.target.value)}
                              className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                              Duração Total
                            </label>
                            <input
                              type="text"
                              value={planoDuracao}
                              onChange={e => setPlanoDuracao(e.target.value)}
                              className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                              Metodologia Ativa
                            </label>
                            <select
                              value={planoMetodologia}
                              onChange={e => setPlanoMetodologia(e.target.value)}
                              className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                            >
                              <option value="Aprendizagem Baseada em Projetos (PBL)">Aprendizagem Baseada em Projetos (PBL)</option>
                              <option value="Sala de Aula Invertida">Sala de Aula Invertida</option>
                              <option value="Estudo de Caso Prático de Mercado">Estudo de Caso Prático de Mercado</option>
                              <option value="Gamificação e Desafios de Equipe">Gamificação e Desafios de Equipe</option>
                              <option value="Rotação por Estações de Trabalho">Rotação por Estações de Trabalho</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                              Competências Diretrizes EPTNM
                            </label>
                            <textarea
                              rows={3}
                              value={planoCompetencias}
                              onChange={e => setPlanoCompetencias(e.target.value)}
                              className={`w-full rounded-2xl p-4 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
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
                            className="w-full py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-2xl font-bold shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                          >
                            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Brain size={18} />}
                            Gerar Plano de Aula com IA
                          </button>
                        </div>
                      )}

                      {/* 2. SLIDES COM INTEGRAÇÃO BIBLIOTECA */}
                      {activeGenerator === 'slides' && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block">
                              Origem do Tema da Apresentação
                            </label>
                            <div className="grid grid-cols-2 gap-2 p-1 bg-purple-500/5 rounded-2xl border border-purple-500/10">
                              <button
                                type="button"
                                onClick={() => setSlidesSourceMode('manual')}
                                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                                  slidesSourceMode === 'manual' ? 'bg-[#7c3aed] text-white' : 'text-[#6c6488]'
                                }`}
                              >
                                Manual
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSlidesSourceMode('library');
                                  loadData();
                                }}
                                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                                  slidesSourceMode === 'library' ? 'bg-[#7c3aed] text-white' : 'text-[#6c6488]'
                                }`}
                              >
                                Do Ateliê
                              </button>
                            </div>
                          </div>

                          {slidesSourceMode === 'library' ? (
                            <div className="p-4 rounded-2xl border space-y-3 bg-purple-50/50 dark:bg-purple-950/20 border-purple-200">
                              <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="Buscar material no ateliê..."
                                  value={slidesLibrarySearch}
                                  onChange={e => setSlidesLibrarySearch(e.target.value)}
                                  className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl focus:outline-none ${themeClasses.inputBg}`}
                                />
                              </div>
                              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                                {libraryItems
                                  .filter(i => i.title.toLowerCase().includes(slidesLibrarySearch.toLowerCase()))
                                  .map(i => (
                                    <button
                                      key={i.id}
                                      type="button"
                                      onClick={() => handleSelectLibraryItemForSlides(i.id)}
                                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                                        slidesSelectedLibraryItemId === i.id
                                          ? 'bg-[#7c3aed] text-white border-purple-600'
                                          : `${themeClasses.card} text-slate-700 dark:text-slate-200 hover:border-purple-300`
                                      }`}
                                    >
                                      <span className="font-semibold line-clamp-1">{i.title}</span>
                                      {slidesSelectedLibraryItemId === i.id && <Check size={14} />}
                                    </button>
                                  ))}
                              </div>
                              <input
                                type="text"
                                placeholder="Tema selecionado (editável)..."
                                value={slidesTema}
                                onChange={e => setSlidesTema(e.target.value)}
                                className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none ${themeClasses.inputBg}`}
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                                Tema da Apresentação *
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: Métricas de Marketing Digital (CAC, LTV, ROI)"
                                value={slidesTema}
                                onChange={e => setSlidesTema(e.target.value)}
                                className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                              />
                            </div>
                          )}

                          <div>
                            <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                              Quantidade de Slides
                            </label>
                            <input
                              type="text"
                              value={slidesQtd}
                              onChange={e => setSlidesQtd(e.target.value)}
                              className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                            />
                          </div>

                          <button
                            onClick={handleGenerateSlides}
                            disabled={loading}
                            className="w-full py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-2xl font-bold shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                          >
                            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Presentation size={18} />}
                            Gerar Roteiro de Slides com IA
                          </button>
                        </div>
                      )}

                      {/* 3. MATERIAL DIDÁTICO */}
                      {activeGenerator === 'material_didatico' && (
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                              Tipo de Material
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {(['resumo', 'slides', 'atividade_pratica'] as const).map(tipo => (
                                <button
                                  key={tipo}
                                  type="button"
                                  onClick={() => setMaterialTipo(tipo)}
                                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                                    materialTipo === tipo
                                      ? 'bg-[#7c3aed] text-white border-purple-600'
                                      : `${themeClasses.cardMuted} text-[#6c6488]`
                                  }`}
                                >
                                  {tipo === 'resumo' ? 'Resumo' : tipo === 'slides' ? 'Slides' : 'Guia Prático'}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                              Tema do Material *
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Persona, Jornada do Consumidor e Copywriting"
                              value={materialTema}
                              onChange={e => setMaterialTema(e.target.value)}
                              className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                            />
                          </div>
                          <button
                            onClick={() => handleGenerate(
                              'material_didatico',
                              `Material Didático (${materialTipo.toUpperCase()}): ${materialTema}`,
                              `Gere um material didático do tipo "${materialTipo}" para alunos de curso técnico em Marketing.
Tema: ${materialTema}
Linguagem prática, exemplos de mercado e checklist de aplicação.`
                            )}
                            disabled={loading}
                            className="w-full py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-2xl font-bold shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                          >
                            {loading ? <RefreshCw className="animate-spin" size={18} /> : <BookOpen size={18} />}
                            Gerar Material Didático
                          </button>
                        </div>
                      )}

                      {/* 4. SEQUÊNCIA DIDÁTICA (4 ETAPAS) */}
                      {activeGenerator === 'sequencia_didatica' && (
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                              Tema da Sequência *
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Planejamento de Campanha de Lançamento"
                              value={sequenciaTema}
                              onChange={e => setSequenciaTema(e.target.value)}
                              className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                              Carga Horária
                            </label>
                            <input
                              type="text"
                              value={sequenciaCargaHoraria}
                              onChange={e => setSequenciaCargaHoraria(e.target.value)}
                              className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                            />
                          </div>
                          <button
                            onClick={() => handleGenerate(
                              'sequencia_didatica',
                              `Sequência Didática: ${sequenciaTema}`,
                              `Monte uma Sequência Didática organizada rigorosamente em 4 etapas didáticas para Marketing EPTNM:
Tema: ${sequenciaTema}
Carga: ${sequenciaCargaHoraria}
Etapas: 1. Sensibilização | 2. Teórico-Prático | 3. Aplicação Mão na Massa | 4. Sistematização e Feedback.`
                            )}
                            disabled={loading}
                            className="w-full py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-2xl font-bold shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                          >
                            {loading ? <RefreshCw className="animate-spin" size={18} /> : <FileText size={18} />}
                            Gerar Sequência em 4 Etapas
                          </button>
                        </div>
                      )}

                      {/* 5. FOLHA DE ATIVIDADE */}
                      {activeGenerator === 'folha_atividade' && (
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                              Assunto da Atividade *
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Elaboração de Briefing e Canais de Mídia"
                              value={folhaTema}
                              onChange={e => setFolhaTema(e.target.value)}
                              className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                              Nível Exigido
                            </label>
                            <input
                              type="text"
                              value={folhaNivel}
                              onChange={e => setFolhaNivel(e.target.value)}
                              className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                            />
                          </div>
                          <button
                            onClick={() => handleGenerate(
                              'folha_atividade',
                              `Folha de Atividade: ${folhaTema}`,
                              `Crie uma Folha de Atividade Técnica Prática para impressão ou ambiente virtual.
Tema: ${folhaTema}
Inclua: Instruções, Cenário de empresa fictícia, 3 a 5 questões práticas e Gabarito/Critérios do Professor ao final.`
                            )}
                            disabled={loading}
                            className="w-full py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-2xl font-bold shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                          >
                            {loading ? <RefreshCw className="animate-spin" size={18} /> : <ClipboardList size={18} />}
                            Gerar Folha de Atividade + Gabarito
                          </button>
                        </div>
                      )}

                      {/* 6. IDEIAS DE ATIVIDADES */}
                      {activeGenerator === 'ideias_atividades' && (
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                              Tema Principal *
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Neuromarketing e Comportamento do Consumidor"
                              value={ideiasTema}
                              onChange={e => setIdeiasTema(e.target.value)}
                              className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                              Formato Preferencial
                            </label>
                            <input
                              type="text"
                              value={ideiasFormato}
                              onChange={e => setIdeiasFormato(e.target.value)}
                              className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                            />
                          </div>
                          <button
                            onClick={() => handleGenerate(
                              'ideias_atividades',
                              `Ideias de Atividades: ${ideiasTema}`,
                              `Gere 4 Propostas de Atividades Criativas e Dinâmicas para aulas de Marketing Técnico:
Tema: ${ideiasTema} | Formato: ${ideiasFormato}
Cada proposta deve ter Nome, Objetivo, Passo a Passo e Entregável do Aluno.`
                            )}
                            disabled={loading}
                            className="w-full py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-2xl font-bold shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                          >
                            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Lightbulb size={18} />}
                            Gerar Ideias de Atividades
                          </button>
                        </div>
                      )}

                      {/* 7. JOGOS EDUCATIVOS */}
                      {activeGenerator === 'jogos_educativos' && (
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                              Tópico para o Jogo *
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Gestão de Crise de Imagem e RP"
                              value={jogosTema}
                              onChange={e => setJogosTema(e.target.value)}
                              className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                              Estilo de Gamificação
                            </label>
                            <input
                              type="text"
                              value={jogosEstilo}
                              onChange={e => setJogosEstilo(e.target.value)}
                              className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                            />
                          </div>
                          <button
                            onClick={() => handleGenerate(
                              'jogos_educativos',
                              `Jogo Educativo: ${jogosTema}`,
                              `Desenvolva uma Dinâmica Gamificada / Jogo Educativo de Marketing.
Tópico: ${jogosTema} | Estilo: ${jogosEstilo}
Regras, papéis dos alunos, pontuação e debriefing final.`
                            )}
                            disabled={loading}
                            className="w-full py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-2xl font-bold shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                          >
                            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Gamepad2 size={18} />}
                            Criar Jogo Didático
                          </button>
                        </div>
                      )}

                      {/* 8. QUIZ INTERATIVO */}
                      {activeGenerator === 'quiz' && (
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                              Assunto do Quiz *
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Matriz BCG e Estratégias de Precificação"
                              value={quizTema}
                              onChange={e => setQuizTema(e.target.value)}
                              className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                              Quantidade de Questões
                            </label>
                            <input
                              type="text"
                              value={quizQtd}
                              onChange={e => setQuizQtd(e.target.value)}
                              className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                            />
                          </div>
                          <button
                            onClick={() => handleGenerate(
                              'quiz',
                              `Quiz Interativo: ${quizTema}`,
                              `Crie um Quiz Didático Interativo com ${quizQtd} para fixação de conceitos em Marketing.
4 alternativas (A, B, C, D), resposta correta e justificativa comentada por questão.`
                            )}
                            disabled={loading}
                            className="w-full py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-2xl font-bold shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                          >
                            {loading ? <RefreshCw className="animate-spin" size={18} /> : <HelpCircle size={18} />}
                            Gerar Quiz com Gabarito
                          </button>
                        </div>
                      )}

                      {/* 9. ASSISTENTE DE MERCADO */}
                      {activeGenerator === 'assistente_mercado' && (
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                              Conceito de Marketing *
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Rebranding, Marketing de Influência, Tráfego Pago"
                              value={assistenteTopico}
                              onChange={e => setAssistenteTopico(e.target.value)}
                              className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#8878a8] uppercase tracking-widest block mb-1">
                              Contexto / Nicho
                            </label>
                            <input
                              type="text"
                              value={assistenteContexto}
                              onChange={e => setAssistenteContexto(e.target.value)}
                              className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 ${themeClasses.inputBg}`}
                            />
                          </div>
                          <button
                            onClick={() => handleGenerate(
                              'assistente_mercado',
                              `Análise de Mercado: ${assistenteTopico}`,
                              `Assistente de Mercado para Professora de Marketing:
Conceito: ${assistenteTopico} | Contexto: ${assistenteContexto}
Forneça 3 exemplos reais de marcas no Brasil, métricas de sucesso, tendências atuais e perguntas para debate em sala.`
                            )}
                            disabled={loading}
                            className="w-full py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-2xl font-bold shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                          >
                            {loading ? <RefreshCw className="animate-spin" size={18} /> : <MessageSquare size={18} />}
                            Consultar Casos Reais & Mercado
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Coluna Direita: Resultado Gerado em Markdown */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className={`p-6 md:p-8 rounded-3xl space-y-4 border min-h-[500px] flex flex-col justify-between shadow-sm ${themeClasses.card}`}>
                      <div>
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-purple-500/10">
                          <h4 className={`text-base font-display font-bold flex items-center gap-2 ${themeClasses.title}`}>
                            <Sparkles className="text-amber-500" size={18} />
                            Resultado Gerado pela IA
                          </h4>
                          {generatedOutput && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => copyToClipboard(generatedOutput, 'output_active')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${themeClasses.cardMuted}`}
                              >
                                {copiedId === 'output_active' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                Copiar
                              </button>
                              <button
                                onClick={handleSaveOutputToLibrary}
                                className="px-3.5 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                              >
                                <Save size={14} />
                                Salvar no Ateliê
                              </button>
                            </div>
                          )}
                        </div>

                        {loading ? (
                          <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
                            <RefreshCw className="animate-spin text-[#7c3aed]" size={40} />
                            <div>
                              <p className={`text-base font-display font-bold ${themeClasses.title}`}>
                                Elaborando material didático especializado...
                              </p>
                              <p className={`text-xs mt-1 ${themeClasses.subtitle}`}>
                                Conectando metodologias ativas e diretrizes da formação técnica.
                              </p>
                            </div>
                          </div>
                        ) : generatedOutput ? (
                          <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed overflow-y-auto max-h-[600px] pr-2">
                            <Markdown>{generatedOutput}</Markdown>
                          </div>
                        ) : (
                          <div className="py-24 text-center space-y-3">
                            <GraduationCap size={48} className="mx-auto text-[#8878a8] stroke-[1.5]" />
                            <p className={`text-sm font-medium ${themeClasses.subtitle}`}>
                              Preencha os campos ao lado e gere conteúdos didáticos com assistência pedagógica da IA.
                            </p>
                          </div>
                        )}
                      </div>

                      {generatedOutput && (
                        <div className="pt-4 border-t border-purple-500/10 flex items-center justify-between text-xs text-[#8878a8]">
                          <span>Salvo automaticamente no seu ateliê local.</span>
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <Check size={14} /> Pronto para levar para a sala de aula
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* SEÇÃO 5: RELATÓRIOS & COMPARATIVO DE TURMAS                  */}
            {/* ------------------------------------------------------------- */}
            {currentSection === 'relatorios' && (
              <div className="space-y-8">
                <div className={`p-6 md:p-8 rounded-3xl border space-y-6 shadow-sm ${themeClasses.card}`}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-purple-500/10">
                    <div>
                      <h3 className={`text-xl font-display font-bold flex items-center gap-2 ${themeClasses.title}`}>
                        <BarChart3 size={24} className="text-emerald-500" />
                        Comparativo de Desempenho entre Turmas
                      </h3>
                      <p className={`text-xs mt-1 ${themeClasses.subtitle}`}>
                        Selecione turmas para comparar métricas pedagógicas, taxa de conclusão e materiais aplicados.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className={`flex items-center p-1 rounded-xl border ${themeClasses.border} ${themeClasses.cardMuted}`}>
                        {(['dia', 'semana', 'mes'] as const).map(tf => (
                          <button
                            key={tf}
                            onClick={() => setComparativoTimeframe(tf)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              comparativoTimeframe === tf
                                ? 'bg-[#7c3aed] text-white'
                                : 'text-[#6c6488]'
                            }`}
                          >
                            {tf === 'dia' ? 'Dia' : tf === 'semana' ? 'Semana' : 'Mês'}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => handleExportComparativeReport('csv')}
                        className="px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Download size={14} /> Exportar CSV
                      </button>

                      <button
                        onClick={() => handleExportComparativeReport('json')}
                        className="px-3.5 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Download size={14} /> Exportar JSON
                      </button>
                    </div>
                  </div>

                  {/* Seletor de Turmas para Comparar */}
                  <div className={`p-4 rounded-2xl border space-y-3 ${themeClasses.cardMuted}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#7a6f95]">
                        Turmas para comparar ({selectedTurmasForComparison.length} selecionadas):
                      </span>
                      <button
                        onClick={() => {
                          if (selectedTurmasForComparison.length === classesList.length) {
                            setSelectedTurmasForComparison([]);
                          } else {
                            setSelectedTurmasForComparison(classesList.map(c => c.id));
                          }
                        }}
                        className="text-xs text-[#7c3aed] hover:underline font-semibold"
                      >
                        {selectedTurmasForComparison.length === classesList.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {classesList.map(c => {
                        const isChecked = selectedTurmasForComparison.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            onClick={() => {
                              if (isChecked) {
                                setSelectedTurmasForComparison(prev => prev.filter(id => id !== c.id));
                              } else {
                                setSelectedTurmasForComparison(prev => [...prev, c.id]);
                              }
                            }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                              isChecked
                                ? 'bg-[#7c3aed] text-white border-purple-600 shadow-xs'
                                : `${themeClasses.card} text-[#6c6488] hover:border-purple-300`
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isChecked ? 'bg-white' : 'bg-slate-400'}`} />
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Gráficos Visuais Comparativos */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gráfico 1: Aulas Concluídas */}
                    <div className={`p-5 rounded-3xl border space-y-4 ${themeClasses.cardMuted}`}>
                      <h4 className={`text-sm font-bold flex items-center gap-2 ${themeClasses.title}`}>
                        <TrendingUp size={16} className="text-[#7c3aed]" />
                        Aulas Concluídas vs Pendentes
                      </h4>

                      <div className="space-y-3 pt-2">
                        {classesList
                          .filter(c => selectedTurmasForComparison.length === 0 || selectedTurmasForComparison.includes(c.id))
                          .map(turma => {
                            const st = turma.stats || { aulasConcluidas: 8, aulasPendentes: 2 };
                            const total = (st.aulasConcluidas || 8) + (st.aulasPendentes || 2);
                            const percentConcluidas = Math.round(((st.aulasConcluidas || 8) / total) * 100);

                            return (
                              <div key={turma.id} className="space-y-1.5">
                                <div className="flex justify-between text-xs">
                                  <span className={`font-bold ${themeClasses.title}`}>{turma.name}</span>
                                  <span className="text-slate-500 font-mono">
                                    {st.aulasConcluidas} concluídas / {st.aulasPendentes} pendentes
                                  </span>
                                </div>
                                <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                  <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                                    style={{ width: `${percentConcluidas}%` }}
                                    title={`Concluídas: ${percentConcluidas}%`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Gráfico 2: Progresso Médio */}
                    <div className={`p-5 rounded-3xl border space-y-4 ${themeClasses.cardMuted}`}>
                      <h4 className={`text-sm font-bold flex items-center gap-2 ${themeClasses.title}`}>
                        <GraduationCap size={16} className="text-emerald-500" />
                        Progresso Médio dos Estudantes (%)
                      </h4>

                      <div className="space-y-3 pt-2">
                        {classesList
                          .filter(c => selectedTurmasForComparison.length === 0 || selectedTurmasForComparison.includes(c.id))
                          .map(turma => {
                            const st = turma.stats || { progressoMedioAlunos: 82 };
                            const prog = st.progressoMedioAlunos || 82;

                            return (
                              <div key={turma.id} className="space-y-1.5">
                                <div className="flex justify-between text-xs">
                                  <span className={`font-bold ${themeClasses.title}`}>{turma.name}</span>
                                  <span className="font-mono font-bold text-emerald-600">{prog}%</span>
                                </div>
                                <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                                  <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                                    style={{ width: `${prog}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  {/* Tabela de Métricas Comparativas */}
                  <div className="space-y-3 pt-2">
                    <h4 className={`text-sm font-bold flex items-center gap-2 ${themeClasses.title}`}>
                      <Layers size={16} className="text-[#7c3aed]" />
                      Tabela Comparativa de Métricas
                    </h4>

                    <div className="overflow-x-auto rounded-2xl border border-purple-500/10">
                      <table className="w-full text-left text-xs">
                        <thead className={`border-b uppercase text-[10px] tracking-wider text-[#8878a8] ${themeClasses.cardMuted}`}>
                          <tr>
                            <th className="p-3.5">Nome da Turma</th>
                            <th className="p-3.5">Disciplina</th>
                            <th className="p-3.5">Período</th>
                            <th className="p-3.5">Status</th>
                            <th className="p-3.5 text-center">Materiais</th>
                            <th className="p-3.5 text-center">Slides</th>
                            <th className="p-3.5 text-center">Progresso</th>
                            <th className="p-3.5 text-center">Taxa Conclusão</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-500/10">
                          {classesList
                            .filter(c => selectedTurmasForComparison.length === 0 || selectedTurmasForComparison.includes(c.id))
                            .map(turma => {
                              const st = turma.stats || { materiaisVinculados: 3, slidesGerados: 4, progressoMedioAlunos: 85, taxaConclusaoProjetos: 90 };
                              const isActive = turma.status !== 'inativa';

                              return (
                                <tr key={turma.id} className="hover:bg-purple-500/5 transition-colors">
                                  <td className={`p-3.5 font-bold ${themeClasses.title}`}>{turma.name}</td>
                                  <td className="p-3.5 text-[#7c3aed] font-medium">{turma.subject}</td>
                                  <td className="p-3.5 text-slate-500">{turma.gradeYear}</td>
                                  <td className="p-3.5">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                      {isActive ? 'Ativa' : 'Inativa'}
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-center font-mono font-bold">{st.materiaisVinculados || 0}</td>
                                  <td className="p-3.5 text-center font-mono font-bold text-purple-600">{st.slidesGerados || 0}</td>
                                  <td className="p-3.5 text-center font-mono font-bold text-emerald-600">{st.progressoMedioAlunos || 85}%</td>
                                  <td className="p-3.5 text-center font-mono font-bold text-indigo-600">{st.taxaConclusaoProjetos || 88}%</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* ============================================================== */
          /* 📘 MODO ALUNO: INTERFACE SIMPLIFICADA E INTUITIVA              */
          /* ============================================================== */
          <motion.div
            key="aluno-mode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Banner de Boas-Vindas do Estudante */}
            <div className={`p-6 sm:p-8 rounded-3xl border ${themeClasses.heroBg} flex flex-col md:flex-row md:items-center justify-between gap-6`}>
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 border border-blue-200">
                  <span>📘</span> Espaço do Estudante de Marketing
                </span>
                <h2 className={`text-2xl sm:text-3xl font-display font-extrabold ${themeClasses.title}`}>
                  Bem-vindo às suas Aulas & Materiais Didáticos
                </h2>
                <p className={`text-sm ${themeClasses.subtitle}`}>
                  Aqui você encontra os roteiros, resumos, folhas de atividade e tira dúvidas com a IA de apoio aos estudos.
                </p>
              </div>

              {/* Seletor de Turma do Aluno */}
              <div className="flex flex-col gap-1.5 min-w-[240px]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#8878a8]">
                  Filtrar por Disciplina / Turma:
                </label>
                <select
                  value={studentFilterTurma}
                  onChange={e => setStudentFilterTurma(e.target.value)}
                  className={`w-full rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 ${themeClasses.inputBg}`}
                >
                  <option value="all">Todas as turmas e disciplinas</option>
                  {classesList.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SEÇÃO 1 DO ALUNO: IA DE APOIO / TIRA-DÚVIDAS DO ALUNO */}
            <div className={`p-6 md:p-8 rounded-3xl border shadow-sm space-y-4 ${themeClasses.card}`}>
              <div className="flex items-center gap-3 pb-3 border-b border-purple-500/10">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <Brain size={22} />
                </div>
                <div>
                  <h3 className={`text-lg font-display font-bold ${themeClasses.title}`}>
                    IA de Apoio ao Estudante · Tira-Dúvidas de Marketing
                  </h3>
                  <p className={`text-xs ${themeClasses.subtitle}`}>
                    Ficou com dúvida sobre algum conceito de aula? Pergunte ao assistente pedagógico.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAskStudentAi} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: O que são os 4 Ps do Marketing? Como calcular o CAC? Como montar um briefing?"
                    value={studentQuestion}
                    onChange={e => setStudentQuestion(e.target.value)}
                    className={`flex-1 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 ${themeClasses.inputBg}`}
                  />
                  <button
                    type="submit"
                    disabled={studentAiLoading || !studentQuestion.trim()}
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95 shadow-sm shadow-blue-600/30"
                  >
                    {studentAiLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                    <span>Perguntar</span>
                  </button>
                </div>

                {/* Sugestões Rápidas de Perguntas */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#8878a8]">
                  <span>Sugestões:</span>
                  {[
                    'Exemplos reais dos 4 Ps',
                    'Diferença entre CAC e LTV',
                    'Como funciona o funil de vendas'
                  ].map(sug => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setStudentQuestion(sug)}
                      className="px-2.5 py-1 rounded-lg border text-xs font-medium bg-blue-50/50 hover:bg-blue-100/50 text-blue-700 border-blue-200 transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </form>

              {/* Resposta da IA do Aluno */}
              {studentAiAnswer && (
                <div className={`p-5 rounded-2xl border space-y-3 bg-blue-50/30 dark:bg-blue-950/20 border-blue-200`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
                      <Sparkles size={14} /> Resposta Pedagógica:
                    </span>
                    <button
                      onClick={() => copyToClipboard(studentAiAnswer, 'student_answer')}
                      className="text-xs text-[#8878a8] hover:text-blue-600 flex items-center gap-1"
                    >
                      <Copy size={12} /> Copiar
                    </button>
                  </div>
                  <div className="prose dark:prose-invert text-sm max-w-none leading-relaxed">
                    <Markdown>{studentAiAnswer}</Markdown>
                  </div>
                </div>
              )}
            </div>

            {/* SEÇÃO 2 DO ALUNO: AULAS E MATERIAIS DIDÁTICOS PUBLICADOS */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-purple-500/10">
                <div>
                  <h3 className={`text-xl font-display font-bold flex items-center gap-2 ${themeClasses.title}`}>
                    <BookOpen size={22} className="text-blue-600" />
                    Materiais & Roteiros de Aula
                  </h3>
                  <p className={`text-xs ${themeClasses.subtitle}`}>
                    Materiais didáticos preparados pela Professora Raquel Duarte para seus estudos.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar conteúdo didático..."
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl focus:outline-none focus:border-blue-500 ${themeClasses.inputBg}`}
                  />
                </div>
              </div>

              {/* Grid de Cards Didáticos do Aluno */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {libraryItems
                  .filter(item => {
                    const matchesClass = studentFilterTurma === 'all' || item.classId === studentFilterTurma;
                    const matchesSearch = item.title.toLowerCase().includes(studentSearch.toLowerCase()) || 
                                          item.content.toLowerCase().includes(studentSearch.toLowerCase());
                    return matchesClass && matchesSearch;
                  })
                  .map(item => {
                    const isDone = completedLessons.includes(item.id);
                    const linkedClass = classesList.find(c => c.id === item.classId);

                    return (
                      <div
                        key={item.id}
                        className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${themeClasses.card} ${
                          isDone ? 'border-emerald-300 dark:border-emerald-800' : 'hover:border-blue-400'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                              {item.category.replace('_', ' ')}
                            </span>
                            {isDone && (
                              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <CheckCircle size={12} /> Estudado
                              </span>
                            )}
                          </div>

                          {linkedClass && (
                            <p className="text-[11px] font-semibold text-[#7c3aed] mb-1">
                              🏫 {linkedClass.name}
                            </p>
                          )}

                          <h4 className={`text-base font-display font-bold line-clamp-2 ${themeClasses.title}`}>
                            {item.title}
                          </h4>
                          <p className={`text-xs line-clamp-3 mt-2 p-3 rounded-2xl border ${themeClasses.cardMuted}`}>
                            {item.content.replace(/[#*`_]/g, '')}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-purple-500/10 flex items-center justify-between">
                          <button
                            onClick={() => setSelectedLibraryItem(item)}
                            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Eye size={14} /> Abrir Material
                          </button>

                          <button
                            onClick={() => handleToggleLessonCompleted(item.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                              isDone
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : `${themeClasses.cardMuted} text-[#6c6488] hover:border-emerald-400`
                            }`}
                          >
                            <CheckCircle2 size={13} className={isDone ? 'text-emerald-600' : 'text-slate-400'} />
                            <span>{isDone ? 'Concluído' : 'Marcar visto'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* MODAIS COMPARTILHADOS (PRESERVADOS E ESTILIZADOS)               */}
      {/* ============================================================== */}

      {/* 1. MODAL DETALHES DA TURMA E VÍNCULOS */}
      <AnimatePresence>
        {selectedTurmaView && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-4xl p-6 md:p-8 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border ${themeClasses.card}`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-purple-500/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-purple-500/10 text-[#7c3aed] rounded-full">
                      {selectedTurmaView.gradeYear}
                    </span>
                    <span className="text-xs font-medium text-[#7c3aed]">
                      {selectedTurmaView.subject}
                    </span>
                  </div>
                  <h3 className={`text-2xl font-display font-bold mt-1 ${themeClasses.title}`}>
                    {selectedTurmaView.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTurmaView(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 space-y-6">
                {selectedTurmaView.description && (
                  <div className={`p-4 rounded-2xl border ${themeClasses.cardMuted}`}>
                    <p className="text-xs font-bold text-[#7c3aed] uppercase tracking-wider mb-1">Observações da Turma:</p>
                    <p className={`text-sm ${themeClasses.subtitle}`}>{selectedTurmaView.description}</p>
                  </div>
                )}

                <div>
                  <h4 className={`text-base font-display font-bold mb-3 flex items-center gap-2 ${themeClasses.title}`}>
                    <FolderOpen size={18} className="text-[#7c3aed]" />
                    Materiais e Planos Vinculados nesta Turma
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {libraryItems.filter(i => i.classId === selectedTurmaView.id).length > 0 ? (
                      libraryItems.filter(i => i.classId === selectedTurmaView.id).map(item => (
                        <div key={item.id} className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${themeClasses.cardMuted}`}>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c3aed]">
                                {item.category.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <p className={`text-sm font-bold line-clamp-1 ${themeClasses.title}`}>{item.title}</p>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-purple-500/10">
                            <button
                              onClick={() => setSelectedLibraryItem(item)}
                              className="text-xs font-bold text-[#7c3aed] hover:underline flex items-center gap-1"
                            >
                              <Eye size={12} /> Ver Completo
                            </button>
                            <button
                              onClick={() => handleToggleLinkItemToClass(item.id, selectedTurmaView.id)}
                              className="text-xs text-rose-500 hover:underline flex items-center gap-1"
                            >
                              <Unlink size={12} /> Desvincular
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={`col-span-full py-8 text-center rounded-2xl border ${themeClasses.cardMuted}`}>
                        <p className="text-sm text-slate-500">Nenhum material vinculado a esta turma ainda.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vincular outros materiais existentes */}
                <div className="pt-4 border-t border-purple-500/10">
                  <h4 className={`text-sm font-display font-bold mb-3 flex items-center gap-2 ${themeClasses.title}`}>
                    <Link size={16} className="text-[#7c3aed]" />
                    Vincular Outros Materiais do Ateliê a esta Turma
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                    {libraryItems.filter(i => i.classId !== selectedTurmaView.id).map(item => (
                      <div key={item.id} className={`p-3 rounded-xl border flex items-center justify-between ${themeClasses.cardMuted}`}>
                        <div>
                          <p className={`text-xs font-bold line-clamp-1 ${themeClasses.title}`}>{item.title}</p>
                          <span className="text-[10px] text-[#8878a8] uppercase">
                            {item.category.replace('_', ' ')}
                          </span>
                        </div>
                        <button
                          onClick={() => handleToggleLinkItemToClass(item.id, selectedTurmaView.id)}
                          className="px-3 py-1 bg-[#ede5fa] hover:bg-[#7c3aed] text-[#7c3aed] hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          <Link size={12} /> Vincular
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-purple-500/10 flex items-center justify-end">
                <button
                  onClick={() => setSelectedTurmaView(null)}
                  className="px-5 py-2.5 bg-[#7c3aed] text-white rounded-xl font-bold text-xs"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. MODAL RELATÓRIO INDIVIDUAL DA TURMA */}
      <AnimatePresence>
        {reportModalTurma && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`p-6 md:p-8 max-w-2xl w-full rounded-3xl space-y-6 shadow-2xl border ${themeClasses.card}`}
            >
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-purple-500/10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 bg-purple-500/10 text-[#7c3aed] rounded-full">
                      {reportModalTurma.gradeYear}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      reportModalTurma.status !== 'inativa' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {reportModalTurma.status !== 'inativa' ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <h3 className={`text-xl font-display font-bold ${themeClasses.title}`}>
                    {reportModalTurma.name}
                  </h3>
                  <p className="text-xs text-[#7c3aed] font-semibold">📘 {reportModalTurma.subject}</p>
                </div>
                <button
                  onClick={() => setReportModalTurma(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Grid de Métricas da Turma */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className={`p-4 rounded-2xl border ${themeClasses.cardMuted}`}>
                  <span className="text-[10px] font-bold text-[#8878a8] uppercase tracking-wider block mb-1">Aulas Vinculadas</span>
                  <p className={`text-xl font-display font-bold ${themeClasses.title}`}>
                    {(reportModalTurma.stats?.aulasConcluidas || 8) + (reportModalTurma.stats?.aulasPendentes || 2)} aulas
                  </p>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    {reportModalTurma.stats?.aulasConcluidas || 8} concluídas
                  </span>
                </div>

                <div className={`p-4 rounded-2xl border ${themeClasses.cardMuted}`}>
                  <span className="text-[10px] font-bold text-[#8878a8] uppercase tracking-wider block mb-1">Materiais Didáticos</span>
                  <p className="text-xl font-display font-bold text-[#7c3aed]">
                    {(reportModalTurma.linkedItemIds || []).length} itens
                  </p>
                  <span className="text-[10px] text-slate-400">Vinculados no Ateliê</span>
                </div>

                <div className={`p-4 rounded-2xl border ${themeClasses.cardMuted}`}>
                  <span className="text-[10px] font-bold text-[#8878a8] uppercase tracking-wider block mb-1">Slides Gerados</span>
                  <p className="text-xl font-display font-bold text-indigo-600">
                    {reportModalTurma.stats?.slidesGerados || 4} apresentações
                  </p>
                  <span className="text-[10px] text-slate-400">Roteiros visuais</span>
                </div>

                <div className={`p-4 rounded-2xl border ${themeClasses.cardMuted}`}>
                  <span className="text-[10px] font-bold text-[#8878a8] uppercase tracking-wider block mb-1">Progresso dos Alunos</span>
                  <p className="text-xl font-display font-bold text-emerald-600">
                    {reportModalTurma.stats?.progressoMedioAlunos || 85}%
                  </p>
                  <span className="text-[10px] text-slate-400">Desenvolvimento médio</span>
                </div>

                <div className={`p-4 rounded-2xl border ${themeClasses.cardMuted}`}>
                  <span className="text-[10px] font-bold text-[#8878a8] uppercase tracking-wider block mb-1">Taxa de Conclusão</span>
                  <p className="text-xl font-display font-bold text-blue-600">
                    {reportModalTurma.stats?.taxaConclusaoProjetos || 90}%
                  </p>
                  <span className="text-[10px] text-slate-400">Entregas de projetos</span>
                </div>

                <div className={`p-4 rounded-2xl border ${themeClasses.cardMuted}`}>
                  <span className="text-[10px] font-bold text-[#8878a8] uppercase tracking-wider block mb-1">Última Atualização</span>
                  <p className="text-sm font-mono text-slate-700 dark:text-slate-300">
                    {new Date(reportModalTurma.updatedAt || reportModalTurma.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                  <span className="text-[10px] text-slate-400">Sincronizado Supabase</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-purple-500/10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportTurmaReport(reportModalTurma, 'csv')}
                    className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Download size={14} /> Exportar CSV
                  </button>
                  <button
                    onClick={() => handleExportTurmaReport(reportModalTurma, 'json')}
                    className="px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Download size={14} /> Exportar JSON
                  </button>
                </div>
                <button
                  onClick={() => setReportModalTurma(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. MODAL CONFIRMAÇÃO DE EXCLUSÃO DE TURMA */}
      <AnimatePresence>
        {deletingTurmaId && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`p-6 max-w-md w-full space-y-4 rounded-3xl border shadow-2xl ${themeClasses.card}`}
            >
              <div className="flex items-center gap-3 text-rose-500">
                <AlertTriangle size={26} />
                <h3 className={`text-lg font-display font-bold ${themeClasses.title}`}>Confirmar Exclusão</h3>
              </div>
              <p className={`text-sm ${themeClasses.subtitle}`}>
                Tem certeza que deseja remover esta turma? Os dados da turma serão excluídos com segurança no Supabase.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeletingTurmaId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleConfirmDeleteTurma(deletingTurmaId)}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  Sim, Excluir Turma
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. MODAL VISUALIZAÇÃO COMPLETA DE MATERIAL DIDÁTICO */}
      <AnimatePresence>
        {selectedLibraryItem && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-4xl p-6 md:p-8 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border ${themeClasses.card}`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-purple-500/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-purple-500/10 text-[#7c3aed] rounded-full">
                      {selectedLibraryItem.category.replace('_', ' ')}
                    </span>
                    {selectedLibraryItem.classId && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-blue-500/10 text-blue-600 rounded-full">
                        🏫 {classesList.find(c => c.id === selectedLibraryItem.classId)?.name || 'Turma Vinculada'}
                      </span>
                    )}
                  </div>
                  <h3 className={`text-xl font-display font-bold mt-2 ${themeClasses.title}`}>
                    {selectedLibraryItem.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedLibraryItem(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 prose dark:prose-invert max-w-none text-sm leading-relaxed">
                <Markdown>{selectedLibraryItem.content}</Markdown>
              </div>

              <div className="pt-4 border-t border-purple-500/10 flex items-center justify-between">
                <span className="text-xs text-[#8878a8]">
                  Criado em: {new Date(selectedLibraryItem.createdAt).toLocaleString('pt-BR')}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(selectedLibraryItem.content, 'modal_view')}
                    className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-xs"
                  >
                    {copiedId === 'modal_view' ? <Check size={14} /> : <Copy size={14} />}
                    Copiar Conteúdo
                  </button>
                  <button
                    onClick={() => setSelectedLibraryItem(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all"
                  >
                    Fechar
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

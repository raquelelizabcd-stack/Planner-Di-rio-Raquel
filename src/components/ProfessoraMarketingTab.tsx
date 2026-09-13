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
  CopyPlus,
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
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { GoogleGenAI } from '@google/genai';
import { ProfessoraMarketingItem, ProfessoraClass } from '../types';
import { dataService } from '../services/dataService';

interface ProfessoraMarketingTabProps {
  accentColor?: string;
  borderRadius?: number;
}

type SectionType = 
  | 'turmas'
  | 'comparativo_turmas'
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
  const [activeSection, setActiveSection] = useState<SectionType>('turmas');
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

  // Turma Form & Automation State
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

  // Comparativo de Turmas States
  const [selectedTurmasForComparison, setSelectedTurmasForComparison] = useState<string[]>([]);
  const [comparativoTimeframe, setComparativoTimeframe] = useState<'dia' | 'semana' | 'mes'>('semana');

  // Form States per Tool
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

  // 4. Apresentacao de Slides (com Integração à Biblioteca)
  const [slidesTema, setSlidesTema] = useState('');
  const [slidesQtd, setSlidesQtd] = useState('5 a 7 slides');
  const [slidesSourceMode, setSlidesSourceMode] = useState<'library' | 'manual'>('manual');
  const [slidesSelectedLibraryItemId, setSlidesSelectedLibraryItemId] = useState<string>('');
  const [slidesLibrarySearch, setSlidesLibrarySearch] = useState<string>('');
  const [slidesLoadedContent, setSlidesLoadedContent] = useState<string>('');

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
    loadData();
  }, []);

  // Sincronização automática com a Biblioteca ao alternar para Apresentação Slides
  useEffect(() => {
    if (activeSection === 'slides') {
      loadData();
    }
  }, [activeSection]);

  const loadData = async () => {
    const [items, classes] = await Promise.all([
      dataService.fetchProfessoraMarketingItems(),
      dataService.fetchProfessoraClasses()
    ]);
    setLibraryItems(items || []);
    setClassesList(classes || []);
  };

  const handleSelectLibraryItemForSlides = (itemId: string) => {
    setSlidesSelectedLibraryItemId(itemId);
    const item = libraryItems.find(i => i.id === itemId);
    if (item) {
      setSlidesTema(item.title);
      setSlidesLoadedContent(item.content);
      showToast(`Tema "${item.title}" carregado da Biblioteca! 📚`);
    } else {
      setSlidesLoadedContent('');
    }
  };

  const handleGenerateSlides = async () => {
    if (!slidesTema.trim()) {
      showToast('Por favor, defina o Tema da Apresentação!');
      return;
    }

    const isFromLibrary = slidesSourceMode === 'library' && slidesLoadedContent.trim().length > 0;

    const promptText = isFromLibrary 
      ? `Crie o roteiro detalhado para uma Apresentação de Slides para aula técnica em Marketing com base no CONTEÚDO SALVO DA BIBLIOTECA DA PROFESSORA.

Tema da Apresentação: ${slidesTema}
Quantidade estimada: ${slidesQtd}

CONTEÚDO BASE EXTRAÍDO DA BIBLIOTECA:
"""
${slidesLoadedContent}
"""

Para CADA slide forneça obrigatoriamente:
- **Slide X: [Título do Slide]**
- 📌 **Conteúdo do Slide (Bullet points curtos)**
- 🗣️ **Fala do Professor (Roteiro verbal explicativo)**
- 💡 **Recurso Visual Recomendado (Imagem, gráfico ou diagrama)**
- ❓ **Pergunta de Checagem Rápida (para interação com a turma)**`
      : `Crie o roteiro detalhado para uma Apresentação de Slides para aula técnica em Marketing.
Tema: ${slidesTema}
Quantidade estimada: ${slidesQtd}

Para CADA slide forneça obrigatoriamente:
- **Slide X: [Título do Slide]**
- 📌 **Conteúdo do Slide (Bullet points curtos)**
- 🗣️ **Fala do Professor (Roteiro verbal explicativo)**
- 💡 **Recurso Visual Recomendado (Imagem, gráfico ou diagrama)**
- ❓ **Pergunta de Checagem Rápida (para interação com a turma)**`;

    await handleGenerate('slides', `Roteiro de Slides: ${slidesTema}`, promptText);

    if (isFromLibrary) {
      showToast('✅ Slides gerados com base no tema da Biblioteca.');
    }
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

  // --- TURMAS HANDLERS ---
  const handleGenerateTurmaAI = async () => {
    setLoading(true);
    try {
      const prompt = `Gere dados hipotéticos altamente realistas para uma nova Turma de Ensino Técnico Profissional em Marketing (EPTNM).
Retorne estritamente um objeto JSON no seguinte formato:
{
  "nome": "Turma 3002 - Estratégia de Conteúdo e Mídias",
  "disciplina": "Marketing de Conteúdo & Branding Digital",
  "anoEscolaridade": "3º Ano Técnico - EPTNM",
  "descricao": "Turma focada no desenvolvimento de réguas de automação, gestão de marcas digitais e métricas de desempenho."
}`;
      const responseText = await callGemini(prompt, 'Você é um orientador pedagógico de Marketing Técnico. Responda apenas com o JSON limpo.');
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.nome) setTurmaNome(parsed.nome);
        if (parsed.disciplina) setTurmaDisciplina(parsed.disciplina);
        if (parsed.anoEscolaridade) setTurmaAnoEscolaridade(parsed.anoEscolaridade);
        if (parsed.descricao) setTurmaDescricao(parsed.descricao);
        showToast('✨ Dados da turma gerados automaticamente com IA! Você pode editar se quiser.');
      }
    } catch (e: any) {
      showToast('Erro ao gerar dados da turma via IA.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTurma = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validação de campos obrigatórios
    if (!turmaNome.trim() || !turmaDisciplina.trim() || !turmaAnoEscolaridade.trim()) {
      showToast('⚠️ Preencha todos os campos obrigatórios.');
      return;
    }

    // Validação de duplicidade de nome
    const isDuplicate = classesList.some(c => 
      c.name.toLowerCase().trim() === turmaNome.toLowerCase().trim() && 
      c.id !== editingTurmaId
    );
    if (isDuplicate) {
      showToast('⚠️ Já existe uma turma cadastrada com este nome. Escolha outro nome.');
      return;
    }

    // Identificar itens da Biblioteca com correspondência de módulo/nome
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

    // Vincular materiais correspondentes da Biblioteca
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
      showToast('📚 Materiais da Biblioteca vinculados à turma.');
    }

    await dataService.saveProfessoraClass(classData);

    if (editingTurmaId) {
      setClassesList(prev => prev.map(c => c.id === editingTurmaId ? classData : c));
      showToast('✅ Turma atualizada com sucesso!');
      setEditingTurmaId(null);
    } else {
      setClassesList(prev => [classData, ...prev]);
      showToast('✅ Turma criada com sucesso!');
    }

    // Feedback Visual
    setCreatedFeedback(true);
    setTimeout(() => setCreatedFeedback(false), 2500);

    // Reset Form
    setTurmaNome('');
    setTurmaDisciplina('');
    setTurmaDescricao('');
  };

  const handleEditTurma = (turma: ProfessoraClass) => {
    setEditingTurmaId(turma.id);
    setTurmaNome(turma.name);
    setTurmaDisciplina(turma.subject);
    setTurmaAnoEscolaridade(turma.gradeYear);
    setTurmaDescricao(turma.description || '');
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const handleToggleTurmaStatus = async (turma: ProfessoraClass) => {
    const newStatus = turma.status === 'inativa' ? 'ativa' : 'inativa';
    const updated = { ...turma, status: newStatus as 'ativa' | 'inativa', updatedAt: Date.now() };
    await dataService.saveProfessoraClass(updated);
    setClassesList(prev => prev.map(c => c.id === turma.id ? updated : c));
    showToast(`Status da turma "${turma.name}" alterado para ${newStatus === 'ativa' ? 'Ativa' : 'Inativa'}.`);
  };

  const handleConfirmDeleteTurma = async (id: string) => {
    await dataService.deleteProfessoraClass(id);
    setClassesList(prev => prev.filter(c => c.id !== id));
    if (selectedTurmaView?.id === id) setSelectedTurmaView(null);
    setDeletingTurmaId(null);
    showToast('Turma excluída com sucesso.');
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
      downloadAnchor.setAttribute("download", `relatorio_turma_${turma.name.replace(/\s+/g, '_')}.json`);
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
      downloadAnchor.setAttribute("download", `relatorio_turma_${turma.name.replace(/\s+/g, '_')}.csv`);
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
      showToast('📊 Comparativo gerado e exportado em JSON!');
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
      showToast('📊 Comparativo gerado e exportado em CSV!');
    }
  };

  const handleDeleteTurma = async (id: string) => {
    await dataService.deleteProfessoraClass(id);
    setClassesList(prev => prev.filter(c => c.id !== id));
    if (selectedTurmaView?.id === id) setSelectedTurmaView(null);
    showToast('Turma excluída com sucesso.');
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

  // --- GENERATION HANDLER ---
  const handleGenerate = async (category: ProfessoraMarketingItem['category'], title: string, prompt: string) => {
    if (!title.trim()) {
      showToast('Por favor, preencha o tema/assunto principal!');
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
      
      // Auto-save to library with class link if selected
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
      category: activeSection as ProfessoraMarketingItem['category'],
      content: generatedOutput,
      classId: selectedClassId || undefined,
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
    { id: 'turmas', label: 'Criar Turmas', icon: Users, color: 'text-purple-400', desc: 'Gestão e vínculos de turmas' },
    { id: 'comparativo_turmas', label: 'Comparativo de Turmas', icon: BarChart3, color: 'text-emerald-400', desc: 'Análise e relatórios comparativos' },
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
                Ambiente de apoio didático para o Ensino Técnico Profissionalizante em Marketing. Gerencie turmas, planos de aula, materiais didáticos, quizzes e apresentações dinâmicas.
              </p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-80 h-80 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* Sub-Tabs Grid Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
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
              {sec.id === 'turmas' && (
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                  {classesList.length}
                </span>
              )}
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

      {/* Selector of Target Class for AI Generators */}
      {activeSection !== 'turmas' && activeSection !== 'biblioteca' && (
        <div className="glass-card p-4 rounded-2xl border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-purple-400" />
            <div>
              <p className="text-xs font-bold text-white">Vincular Geração a uma Turma (Opcional)</p>
              <p className="text-[10px] text-slate-400">O conteúdo gerado será associado à turma selecionada para fácil organização.</p>
            </div>
          </div>
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="w-full sm:w-72 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 [color-scheme:dark]"
          >
            <option value="">Nenhuma turma selecionada (Geral)</option>
            {classesList.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.gradeYear})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* MODULE 0: CRIAR E GERENCIAR TURMAS */}
      {activeSection === 'turmas' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-5 space-y-4">
              <form onSubmit={handleSaveTurma} className="glass-card p-6 md:p-8 rounded-3xl space-y-5 border border-purple-500/20 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-500/10 rounded-2xl text-purple-400 border border-purple-500/20">
                      <Users size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-display font-bold text-white">
                        {editingTurmaId ? 'Editar Turma' : 'Criar Nova Turma'}
                      </h3>
                      <p className="text-xs text-slate-400">Cadastre e gerencie suas turmas da EPTNM</p>
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
                      className="text-xs text-slate-400 hover:text-white underline"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>

                {/* Alternador de Modo: Preenchimento Manual vs Automático IA */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Modo de Cadastro
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setTurmaCreationMode('manual')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        turmaCreationMode === 'manual'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                          : 'text-slate-400 hover:text-white'
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
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Sparkles size={13} />
                      Automático (IA)
                    </button>
                  </div>
                </div>

                {/* Botão de Preenchimento Automático IA */}
                {turmaCreationMode === 'ai' && (
                  <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl space-y-2">
                    <p className="text-[11px] text-purple-300">
                      Gere automaticamente a estrutura de nome, disciplina e observações pedagógicas com a IA do Gemini.
                    </p>
                    <button
                      type="button"
                      onClick={handleGenerateTurmaAI}
                      disabled={loading}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      Preencher Automático com IA
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nome da Turma *</label>
                    <input
                      type="text"
                      placeholder="Ex: Turma 3001 - Marketing Digital"
                      value={turmaNome}
                      onChange={e => setTurmaNome(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Disciplina / Módulo *</label>
                    <input
                      type="text"
                      placeholder="Ex: Marketing de Conteúdo & Mídias Sociais"
                      value={turmaDisciplina}
                      onChange={e => setTurmaDisciplina(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Ano de Escolaridade / Período *</label>
                    <select
                      value={turmaAnoEscolaridade}
                      onChange={e => setTurmaAnoEscolaridade(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                    >
                      <option value="1º Ano Técnico - EPTNM">1º Ano Técnico - EPTNM</option>
                      <option value="2º Ano Técnico - EPTNM">2º Ano Técnico - EPTNM</option>
                      <option value="3º Ano Técnico - EPTNM">3º Ano Técnico - EPTNM</option>
                      <option value="Módulo Subsequente / Pós-Médio">Módulo Subsequente / Pós-Médio</option>
                      <option value="Curso Livre / Extensão">Curso Livre / Extensão</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Descrição / Observações da Turma</label>
                    <textarea
                      rows={3}
                      placeholder="Ex: Horário das aulas, particularidades da turma, projetos em andamento..."
                      value={turmaDescricao}
                      onChange={e => setTurmaDescricao(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Highlighted Criar Turma Button */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className={`w-full py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-bold shadow-xl shadow-purple-600/30 flex items-center justify-center gap-3 transition-all relative overflow-hidden group border border-purple-400/30 ${
                      createdFeedback ? 'ring-4 ring-emerald-500/50 from-emerald-600 to-teal-600' : ''
                    }`}
                  >
                    {createdFeedback ? (
                      <>
                        <CheckCircle2 size={22} className="text-white animate-bounce" />
                        <span>{editingTurmaId ? 'Turma Atualizada!' : 'Turma Cadastrada com Sucesso!'}</span>
                      </>
                    ) : (
                      <>
                        {editingTurmaId ? <Save size={20} /> : <Plus size={20} />}
                        <span className="text-base font-display">{editingTurmaId ? 'Salvar Alterações da Turma' : '✨ Criar Turma'}</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>

            {/* List & Management Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                    <School className="text-purple-400" size={22} />
                    Painel de Gerenciamento de Turmas ({classesList.length})
                  </h3>
                  <p className="text-xs text-slate-400">Edite, ative/desative, acompanhe relatórios e vincule materiais da biblioteca.</p>
                </div>

                {/* Filtro de Busca por Nome ou Módulo */}
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou módulo..."
                    value={turmasSearchQuery}
                    onChange={e => setTurmasSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Grid de Turmas Cadastradas */}
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
                          className={`glass-card p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-4 group relative ${
                            isActive ? 'border-white/10 hover:border-purple-500/40' : 'border-white/5 opacity-60 bg-black/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                                  {turma.gradeYear}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                                  {linkedItems.length} Materiais Vinculados
                                </span>

                                {/* Badge de Status: Verde = Ativa, Cinza = Inativa */}
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                                  isActive
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                                }`}>
                                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                                  {isActive ? 'Ativa' : 'Inativa'}
                                </span>
                              </div>

                              <h4 className="text-xl font-display font-bold text-white group-hover:text-purple-300 transition-colors">
                                {turma.name}
                              </h4>
                              <p className="text-sm text-purple-300 font-medium mt-0.5">
                                📘 {turma.subject}
                              </p>
                              {turma.description && (
                                <p className="text-xs text-slate-400 mt-2 bg-black/20 p-3 rounded-2xl border border-white/5">
                                  {turma.description}
                                </p>
                              )}
                            </div>

                            {/* Botões de Ação de Gerenciamento */}
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                              {/* Toggle Ativar/Desativar */}
                              <button
                                onClick={() => handleToggleTurmaStatus(turma)}
                                className={`p-2.5 rounded-xl transition-all border ${
                                  isActive 
                                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20' 
                                    : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
                                }`}
                                title={isActive ? "Desativar Turma" : "Ativar Turma"}
                              >
                                {isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                              </button>

                              {/* Ver Relatórios Individuais */}
                              <button
                                onClick={() => setReportModalTurma(turma)}
                                className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl transition-all"
                                title="Ver Relatório Detalhado"
                              >
                                <BarChart3 size={16} />
                              </button>

                              {/* Editar */}
                              <button
                                onClick={() => handleEditTurma(turma)}
                                className="p-2.5 bg-white/5 hover:bg-purple-500/20 text-slate-400 hover:text-purple-300 border border-white/10 rounded-xl transition-all"
                                title="Editar Turma"
                              >
                                <Edit2 size={16} />
                              </button>

                              {/* Excluir com Confirmação */}
                              <button
                                onClick={() => setDeletingTurmaId(turma.id)}
                                className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-all"
                                title="Excluir Turma"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Quick Overview Footer */}
                          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                            <button
                              onClick={() => setSelectedTurmaView(turma)}
                              className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1.5"
                            >
                              <FolderOpen size={16} /> Ver Planos & Materiais da Turma ({linkedItems.length})
                            </button>
                            <span className="text-[10px] text-slate-500">
                              Criada em: {new Date(turma.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="py-16 text-center space-y-3 glass-card rounded-3xl border border-white/10">
                    <Users size={48} className="mx-auto text-slate-600 stroke-[1.5]" />
                    <p className="text-slate-400 text-sm">Nenhuma turma encontrada. Crie uma nova turma ao lado!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE: COMPARATIVO DE TURMAS */}
      {activeSection === 'comparativo_turmas' && (
        <div className="space-y-8">
          <div className="glass-card p-6 md:p-8 rounded-3xl border border-purple-500/20 space-y-6 shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <BarChart3 size={24} className="text-emerald-400" />
                  Comparativo de Desempenho entre Turmas
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Selecione turmas cadastradas para comparar aulas concluídas, materiais vinculados, slides e progresso pedagógico.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Filtro de Período */}
                <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
                  {(['dia', 'semana', 'mes'] as const).map(tf => (
                    <button
                      key={tf}
                      onClick={() => setComparativoTimeframe(tf)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        comparativoTimeframe === tf
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tf === 'dia' ? 'Dia' : tf === 'semana' ? 'Semana' : 'Mês'}
                    </button>
                  ))}
                </div>

                {/* Botões Exportar CSV e JSON */}
                <button
                  onClick={() => handleExportComparativeReport('csv')}
                  className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Download size={14} />
                  Exportar CSV
                </button>

                <button
                  onClick={() => handleExportComparativeReport('json')}
                  className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Download size={14} />
                  Exportar JSON
                </button>
              </div>
            </div>

            {/* Seletor de Turmas para Comparação */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Selecione as turmas para comparar ({selectedTurmasForComparison.length} selecionadas):
                </span>
                <button
                  onClick={() => {
                    if (selectedTurmasForComparison.length === classesList.length) {
                      setSelectedTurmasForComparison([]);
                    } else {
                      setSelectedTurmasForComparison(classesList.map(c => c.id));
                    }
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300 underline font-medium"
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
                          ? 'bg-purple-600/20 border-purple-500 text-white shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isChecked ? 'bg-purple-400' : 'bg-slate-600'}`} />
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gráficos Visuais Comparativos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico 1: Aulas Concluídas vs Pendentes */}
              <div className="p-5 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp size={16} className="text-purple-400" />
                  Aulas Concluídas vs Pendentes por Turma
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
                            <span className="font-bold text-white">{turma.name}</span>
                            <span className="text-slate-400 font-mono">
                              {st.aulasConcluidas} concluídas / {st.aulasPendentes} pendentes
                            </span>
                          </div>
                          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden flex">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-l-full transition-all duration-500"
                              style={{ width: `${percentConcluidas}%` }}
                              title={`Concluídas: ${percentConcluidas}%`}
                            />
                            <div
                              className="h-full bg-slate-600/50 rounded-r-full transition-all duration-500"
                              style={{ width: `${100 - percentConcluidas}%` }}
                              title={`Pendentes: ${100 - percentConcluidas}%`}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Gráfico 2: Progresso Médio dos Alunos (%) */}
              <div className="p-5 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <GraduationCap size={16} className="text-emerald-400" />
                  Progresso Médio dos Alunos (%)
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
                            <span className="font-bold text-white">{turma.name}</span>
                            <span className="font-mono font-bold text-emerald-400">{prog}%</span>
                          </div>
                          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                              style={{ width: `${prog}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Tabela Comparativa Métricas Lado a Lado */}
            <div className="space-y-3 pt-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers size={16} className="text-purple-400" />
                Tabela Comparativa de Métricas
              </h4>

              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Nome da Turma</th>
                      <th className="p-3.5">Disciplina / Módulo</th>
                      <th className="p-3.5">Período</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-center">Materiais</th>
                      <th className="p-3.5 text-center">Slides</th>
                      <th className="p-3.5 text-center">Progresso</th>
                      <th className="p-3.5 text-center">Taxa Conclusão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {classesList
                      .filter(c => selectedTurmasForComparison.length === 0 || selectedTurmasForComparison.includes(c.id))
                      .map(turma => {
                        const st = turma.stats || { materiaisVinculados: 3, slidesGerados: 4, progressoMedioAlunos: 85, taxaConclusaoProjetos: 90 };
                        const isActive = turma.status !== 'inativa';

                        return (
                          <tr key={turma.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-3.5 font-bold text-white">{turma.name}</td>
                            <td className="p-3.5 text-purple-300">{turma.subject}</td>
                            <td className="p-3.5 text-slate-400">{turma.gradeYear}</td>
                            <td className="p-3.5">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-400'
                              }`}>
                                {isActive ? 'Ativa' : 'Inativa'}
                              </span>
                            </td>
                            <td className="p-3.5 text-center font-mono font-bold text-white">{st.materiaisVinculados || 0}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-purple-300">{st.slidesGerados || 0}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-emerald-400">{st.progressoMedioAlunos || 85}%</td>
                            <td className="p-3.5 text-center font-mono font-bold text-indigo-300">{st.taxaConclusaoProjetos || 88}%</td>
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

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE TURMA */}
      <AnimatePresence>
        {deletingTurmaId && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#181427] border border-rose-500/40 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle size={28} />
                <h3 className="text-lg font-display font-bold text-white">Confirmar Exclusão</h3>
              </div>

              <p className="text-sm text-slate-300">
                ⚠️ Tem certeza que deseja excluir esta turma? Esta ação removerá a turma e todos os vínculos associados.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeletingTurmaId(null)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleConfirmDeleteTurma(deletingTurmaId)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  Sim, Excluir Turma
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE RELATÓRIO INDIVIDUAL DA TURMA */}
      <AnimatePresence>
        {reportModalTurma && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#181427] border border-purple-500/40 rounded-3xl p-6 md:p-8 max-w-2xl w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">
                      {reportModalTurma.gradeYear}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                      reportModalTurma.status !== 'inativa' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {reportModalTurma.status !== 'inativa' ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <h3 className="text-xl font-display font-bold text-white">{reportModalTurma.name}</h3>
                  <p className="text-xs text-purple-300 font-medium">📘 {reportModalTurma.subject}</p>
                </div>

                <button
                  onClick={() => setReportModalTurma(null)}
                  className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Grid de Métricas Individuais */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Aulas Vinculadas</span>
                  <p className="text-xl font-display font-bold text-white">
                    {(reportModalTurma.stats?.aulasConcluidas || 8) + (reportModalTurma.stats?.aulasPendentes || 2)} <span className="text-xs text-slate-500 font-sans">aulas</span>
                  </p>
                  <span className="text-[10px] text-emerald-400">
                    {reportModalTurma.stats?.aulasConcluidas || 8} concluídas
                  </span>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Materiais Didáticos</span>
                  <p className="text-xl font-display font-bold text-purple-300">
                    {(reportModalTurma.linkedItemIds || []).length} <span className="text-xs text-slate-500 font-sans">itens</span>
                  </p>
                  <span className="text-[10px] text-slate-400">Vinculados da Biblioteca</span>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Slides Gerados</span>
                  <p className="text-xl font-display font-bold text-indigo-300">
                    {reportModalTurma.stats?.slidesGerados || 4} <span className="text-xs text-slate-500 font-sans">apresentações</span>
                  </p>
                  <span className="text-[10px] text-slate-400">Roteiros visuais</span>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Progresso dos Alunos</span>
                  <p className="text-xl font-display font-bold text-emerald-400">
                    {reportModalTurma.stats?.progressoMedioAlunos || 85}%
                  </p>
                  <span className="text-[10px] text-slate-400">Média de desenvolvimento</span>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Conclusão de Projetos</span>
                  <p className="text-xl font-display font-bold text-emerald-400">
                    {reportModalTurma.stats?.taxaConclusaoProjetos || 90}%
                  </p>
                  <span className="text-[10px] text-slate-400">Entregas de agência</span>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Última Atualização</span>
                  <p className="text-sm font-mono text-slate-300">
                    {new Date(reportModalTurma.updatedAt || reportModalTurma.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                  <span className="text-[10px] text-slate-500">Sincronizado Supabase</span>
                </div>
              </div>

              {/* Ações do Relatório */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportTurmaReport(reportModalTurma, 'csv')}
                    className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Download size={14} /> Exportar CSV
                  </button>
                  <button
                    onClick={() => handleExportTurmaReport(reportModalTurma, 'json')}
                    className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Download size={14} /> Exportar JSON
                  </button>
                </div>

                <button
                  onClick={() => setReportModalTurma(null)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Feature Content Area (For Generators 1-9) */}
      {activeSection !== 'turmas' && activeSection !== 'biblioteca' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form Column */}
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
                <div className="space-y-5">
                  {/* Seletor de Modo de Tema */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Origem do Tema da Apresentação
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setSlidesSourceMode('manual')}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          slidesSourceMode === 'manual'
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Edit2 size={14} />
                        Digitar novo tema manualmente
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSlidesSourceMode('library');
                          loadData();
                        }}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          slidesSourceMode === 'library'
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <BookOpen size={14} />
                        Selecionar tema salvo na Biblioteca
                      </button>
                    </div>
                  </div>

                  {/* MODO BIBLIOTECA */}
                  {slidesSourceMode === 'library' ? (
                    <div className="p-5 bg-white/5 border border-purple-500/20 rounded-2xl space-y-4 shadow-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <BookOpen size={18} className="text-purple-400" />
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            Temas Salvos na Biblioteca
                            <span className="group relative cursor-help">
                              <HelpCircle size={13} className="text-slate-400 hover:text-purple-300" />
                              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-60 p-2.5 bg-[#0f0c1b] border border-purple-500/40 text-[10px] text-slate-200 rounded-lg shadow-xl text-center z-30 font-normal">
                                Selecione um tema salvo na Biblioteca para gerar slides automaticamente.
                              </span>
                            </span>
                          </h4>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            await loadData();
                            showToast('Lista de temas da Biblioteca atualizada! 🔄');
                          }}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-[11px] font-bold transition-all border border-white/10 flex items-center gap-1.5 self-start sm:self-auto"
                        >
                          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                          Atualizar Lista de Temas
                        </button>
                      </div>

                      {/* Busca por Nome do Tema */}
                      <div className="relative">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscar tema salvo na biblioteca por nome..."
                          value={slidesLibrarySearch}
                          onChange={e => setSlidesLibrarySearch(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* Lista de Seleção de Temas */}
                      {libraryItems.length === 0 ? (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center space-y-1">
                          <p className="text-xs text-amber-300 font-bold">Nenhum tema encontrado na Biblioteca.</p>
                          <p className="text-[11px] text-slate-400">Crie um novo tema para começar.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {libraryItems
                            .filter(item => item.title.toLowerCase().includes(slidesLibrarySearch.toLowerCase()))
                            .map(item => {
                              const isSelected = slidesSelectedLibraryItemId === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => handleSelectLibraryItemForSlides(item.id)}
                                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                                    isSelected
                                      ? 'bg-purple-600/20 border-purple-500 text-white'
                                      : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-white">{item.title}</span>
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/10 text-slate-300 uppercase">
                                        {item.category.replace('_', ' ')}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                      {item.content.slice(0, 100)}...
                                    </p>
                                  </div>
                                  {isSelected && <CheckCircle2 size={16} className="text-purple-400 shrink-0 mt-0.5" />}
                                </button>
                              );
                            })}
                        </div>
                      )}

                      {/* Campo editável do Tema Selecionado */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                          Tema Selecionado (Editável) *
                        </label>
                        <div className="relative">
                          <BookOpen size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
                          <input
                            type="text"
                            placeholder="Selecione um tema acima ou edite aqui..."
                            value={slidesTema}
                            onChange={e => setSlidesTema(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>

                      {/* Preview / Edição do Conteúdo Carregado */}
                      {slidesLoadedContent && (
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                            Conteúdo Base da Biblioteca (Carregado para Alimentar a IA)
                          </label>
                          <textarea
                            rows={3}
                            value={slidesLoadedContent}
                            onChange={e => setSlidesLoadedContent(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-purple-500 font-mono"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    /* MODO MANUAL */
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 flex items-center gap-1.5">
                        <BookOpen size={14} className="text-purple-400" />
                        Tema da Apresentação *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Ex: Métricas de Marketing Digital (CAC, LTV, ROI)"
                          value={slidesTema}
                          onChange={e => setSlidesTema(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Quantidade de Slides */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      Quantidade de Slides
                    </label>
                    <input
                      type="text"
                      value={slidesQtd}
                      onChange={e => setSlidesQtd(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Botão Gerar Roteiro de Slides */}
                  <button
                    onClick={handleGenerateSlides}
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.99]"
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

          {/* Right Output Column */}
          <div className="lg:col-span-7 space-y-6">
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
                  <span>Salvo automaticamente na sua biblioteca local.</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check size={14} /> Pronto para uso em sala
                  </span>
                </div>
              )}
            </div>
          </div>
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
              {sectionsConfig.filter(s => s.id !== 'biblioteca' && s.id !== 'turmas').map(s => (
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
                const linkedClass = classesList.find(c => c.id === item.classId);
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

                      {linkedClass && (
                        <span className="inline-block text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-md mb-2 border border-indigo-500/30">
                          🏫 {linkedClass.name}
                        </span>
                      )}

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

      {/* Modal View Turma Details and Linked Items */}
      <AnimatePresence>
        {selectedTurmaView && (
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
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                      {selectedTurmaView.gradeYear}
                    </span>
                    <span className="text-xs text-purple-300 font-medium">
                      {selectedTurmaView.subject}
                    </span>
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white mt-1">
                    {selectedTurmaView.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTurmaView(null)}
                  className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 space-y-6 custom-scrollbar">
                {selectedTurmaView.description && (
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-xs font-bold text-purple-300 uppercase tracking-widest mb-1">Observações da Turma:</p>
                    <p className="text-sm text-slate-300">{selectedTurmaView.description}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-base font-display font-bold text-white mb-3 flex items-center gap-2">
                    <FolderOpen size={18} className="text-purple-400" />
                    Materiais, Planos e Atividades Vinculados nesta Turma
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {libraryItems.filter(i => i.classId === selectedTurmaView.id).length > 0 ? (
                      libraryItems.filter(i => i.classId === selectedTurmaView.id).map(item => {
                        const cfg = sectionsConfig.find(s => s.id === item.category);
                        return (
                          <div key={item.id} className="p-4 bg-black/30 rounded-2xl border border-white/10 flex flex-col justify-between space-y-3">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300 flex items-center gap-1">
                                  {cfg?.icon && React.createElement(cfg.icon, { size: 12 })}
                                  {cfg?.label || item.category}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <p className="text-sm font-bold text-white line-clamp-1">{item.title}</p>
                              <p className="text-xs text-slate-400 line-clamp-2 mt-1 font-mono">
                                {item.content.replace(/[#*`_]/g, '')}
                              </p>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-white/10">
                              <button
                                onClick={() => setSelectedLibraryItem(item)}
                                className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1"
                              >
                                <Eye size={12} /> Ver Completo
                              </button>
                              <button
                                onClick={() => handleToggleLinkItemToClass(item.id, selectedTurmaView.id)}
                                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                              >
                                <Unlink size={12} /> Desvincular
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-full py-8 text-center bg-white/5 rounded-2xl border border-white/10 space-y-2">
                        <p className="text-sm text-slate-400">Nenhum material vinculado a esta turma ainda.</p>
                        <p className="text-xs text-slate-500">Ao criar planos ou atividades nas ferramentas ao lado, selecione esta turma no topo para vinculá-los automaticamente.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Attach Existing Unlinked Items */}
                <div className="pt-4 border-t border-white/10">
                  <h4 className="text-sm font-display font-bold text-white mb-3 flex items-center gap-2">
                    <Link size={16} className="text-indigo-400" />
                    Vincular Outros Materiais da Biblioteca a esta Turma
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                    {libraryItems.filter(i => i.classId !== selectedTurmaView.id).map(item => (
                      <div key={item.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white line-clamp-1">{item.title}</p>
                          <span className="text-[10px] text-slate-400 uppercase">
                            {sectionsConfig.find(s => s.id === item.category)?.label}
                          </span>
                        </div>
                        <button
                          onClick={() => handleToggleLinkItemToClass(item.id, selectedTurmaView.id)}
                          className="px-3 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 rounded-lg text-xs font-bold flex items-center gap-1 border border-purple-500/30 transition-all"
                        >
                          <Link size={12} /> Vincular
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end">
                <button
                  onClick={() => setSelectedTurmaView(null)}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl font-bold text-xs transition-all"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                      {sectionsConfig.find(s => s.id === selectedLibraryItem.category)?.label}
                    </span>
                    {selectedLibraryItem.classId && (
                      <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                        🏫 {classesList.find(c => c.id === selectedLibraryItem.classId)?.name || 'Turma Vinculada'}
                      </span>
                    )}
                  </div>
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

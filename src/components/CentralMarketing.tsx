import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  Users, 
  Mail, 
  Share2, 
  BarChart2, 
  FolderKanban, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Copy, 
  Save, 
  Grid, 
  Search, 
  Send, 
  Filter, 
  Globe, 
  Database,
  ArrowRight,
  Eye,
  Check,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { dataService } from '../services/dataService';
import { supabase } from '../lib/supabase';
import { 
  MarketingProject, 
  MarketingContent, 
  MarketingCalendarEvent, 
  MarketingLead, 
  MarketingCampaign, 
  MarketingSocialAccount, 
  MarketingIdea, 
  MarketingAnalytics 
} from '../types';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';

interface CentralMarketingProps {
  onClose?: () => void;
  accentColor: string;
  borderRadius: number;
}

export default function CentralMarketing({ accentColor, borderRadius }: CentralMarketingProps) {
  // Navigation Tabs within the Marketing Hub
  // 'dashboard' | 'ia-conteudo' | 'banco-ideias' | 'calendario' | 'crm-leads' | 'email-mkt' | 'redes-sociais' | 'analytics' | 'projetos'
  const [subTab, setSubTab] = useState<string>('dashboard');

  // Loading States
  const [loading, setLoading] = useState(true);

  // States for DB entity caches
  const [projects, setProjects] = useState<MarketingProject[]>([]);
  const [contents, setContents] = useState<MarketingContent[]>([]);
  const [events, setEvents] = useState<MarketingCalendarEvent[]>([]);
  const [leads, setLeads] = useState<MarketingLead[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<MarketingSocialAccount[]>([]);
  const [ideas, setIdeas] = useState<MarketingIdea[]>([]);
  const [analytics, setAnalytics] = useState<MarketingAnalytics[]>([]);

  // Selection Filter States
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterSocial, setFilterSocial] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // IA Content State
  const [mktProjSelect, setMktProjSelect] = useState<string>('1');
  const [mktSocialSelect, setMktSocialSelect] = useState<string>('Instagram');
  const [mktGoal, setMktGoal] = useState<string>('Engajamento');
  const [mktAudience, setMktAudience] = useState<string>('Professores e Educadores');
  const [mktTheme, setMktTheme] = useState<string>('Acessibilidade Digital');
  const [iaLoading, setIaLoading] = useState(false);
  const [iaResult, setIaResult] = useState<MarketingContent | null>(null);

  // Editing / Add Modals or States
  const [showAddIdea, setShowAddIdea] = useState(false);
  const [editingIdea, setEditingIdea] = useState<MarketingIdea | null>(null);
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaCategory, setIdeaCategory] = useState('Carrossel');
  const [ideaProject, setIdeaProject] = useState('1');
  const [ideaPriority, setIdeaPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [ideaNotes, setIdeaNotes] = useState('');

  // CRM Lead Modal
  const [showAddLead, setShowAddLead] = useState(false);
  const [editingLead, setEditingLead] = useState<MarketingLead | null>(null);
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadProject, setLeadProject] = useState('1');
  const [leadOrigin, setLeadOrigin] = useState('Instagram');
  const [leadStatus, setLeadStatus] = useState<'Novo Lead' | 'Contato Realizado' | 'Em Negociação' | 'Cliente'>('Novo Lead');

  // Campaign Modal
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<MarketingCampaign | null>(null);
  const [campaignName, setCampaignName] = useState('');
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignContent, setCampaignContent] = useState('');
  const [campaignContacts, setCampaignContacts] = useState('');

  // Calendar Event Modal
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MarketingCalendarEvent | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventProject, setEventProject] = useState('1');
  const [eventSocial, setEventSocial] = useState('Instagram');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventStatus, setEventStatus] = useState<'Ideia' | 'Em Produção' | 'Agendado' | 'Publicado'>('Ideia');
  const [eventNotes, setEventNotes] = useState('');

  // Project Modal
  const [showAddProject, setShowAddProject] = useState(false);
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');

  // Toast confirmation feedback
  const [toastMessage, setToastMessage] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Load Data on Mount
  useEffect(() => {
    async function loadAllMarketingData() {
      try {
        setLoading(true);
        const [
          dbProjects,
          dbContents,
          dbEvents,
          dbLeads,
          dbCampaigns,
          dbIdeas,
          dbAnalytics
        ] = await Promise.all([
          dataService.fetchMarketingProjects(),
          dataService.fetchMarketingContent(),
          dataService.fetchMarketingCalendarEvents(),
          dataService.fetchMarketingLeads(),
          dataService.fetchMarketingCampaigns(),
          dataService.fetchMarketingIdeas(),
          dataService.fetchMarketingAnalytics()
        ]);

        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        const { data: dbSocial } = await supabase
          .from("marketing_social_accounts")
          .select("platform, handle, followers, status, createdAt")
          .eq("user_id", userId);

        setProjects(dbProjects);
        setContents(dbContents);
        setEvents(dbEvents);
        setLeads(dbLeads);
        setCampaigns(dbCampaigns);
        const defaultSocialAccounts: MarketingSocialAccount[] = [
          { id: 'acc-insta', platform: 'instagram', status: 'Não conectado', handle: '@raquelduarte.mkt', followers: 1540 },
          { id: 'acc-linked', platform: 'linkedin', status: 'Não conectado', handle: 'in/raquelduartemkt', followers: 2310 },
          { id: 'acc-fb', platform: 'facebook', status: 'Não conectado', handle: '/raquelduartemkt', followers: 480 },
          { id: 'acc-tiktok', platform: 'tiktok', status: 'Não conectado', handle: '@raquelduarte.mkt', followers: 120 },
          { id: 'acc-yt', platform: 'youtube', status: 'Não conectado', handle: 'c/RaquelDuarteEducacao', followers: 890 }
        ];
        const mergedSocial = defaultSocialAccounts.map(defAcc => {
          const dbAcc = (dbSocial || []).find((s: any) => s.platform.toLowerCase() === defAcc.platform.toLowerCase());
          return dbAcc ? { ...defAcc, ...dbAcc } : defAcc;
        });
        setSocialAccounts(mergedSocial);
        setIdeas(dbIdeas);
        setAnalytics(dbAnalytics);
      } catch (err) {
        console.error('Error loading central de marketing data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAllMarketingData();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("social_updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "marketing_social_accounts" },
        (payload) => {
          setSocialAccounts(prev =>
            prev.map(acc =>
              acc.platform === payload.new.platform ? { ...acc, ...payload.new } : acc
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- CRUD IDEAS ---
  const handleSaveIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaTitle) return;

    const payload: MarketingIdea = {
      id: editingIdea ? editingIdea.id : 'idea-' + Date.now(),
      title: ideaTitle,
      category: ideaCategory,
      projectId: ideaProject,
      priority: ideaPriority,
      notes: ideaNotes,
      createdAt: editingIdea?.createdAt || new Date().toISOString()
    };

    try {
      await dataService.saveMarketingIdea(payload);
      if (editingIdea) {
        setIdeas(ideas.map(i => i.id === editingIdea.id ? payload : i));
        showToast('Ideia atualizada com sucesso!');
      } else {
        setIdeas([payload, ...ideas]);
        showToast('Ideia adicionada ao banco!');
      }
      // Reset
      setShowAddIdea(false);
      setEditingIdea(null);
      setIdeaTitle('');
      setIdeaNotes('');
    } catch (err) {
      showToast('Erro ao salvar ideia.');
    }
  };

  const handleDeleteIdea = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta ideia?')) return;
    try {
      await dataService.deleteMarketingIdea(id);
      setIdeas(ideas.filter(i => i.id !== id));
      showToast('Ideia removida.');
    } catch {
      showToast('Erro ao excluir.');
    }
  };

  // --- CRUD LEADS ---
  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadEmail) return;

    const payload: MarketingLead = {
      id: editingLead ? editingLead.id : 'lead-' + Date.now(),
      name: leadName,
      email: leadEmail,
      phone: leadPhone,
      projectId: leadProject,
      origin: leadOrigin,
      status: leadStatus,
      createdAt: editingLead?.createdAt || new Date().toISOString()
    };

    try {
      await dataService.saveMarketingLead(payload);
      if (editingLead) {
        setLeads(leads.map(l => l.id === editingLead.id ? payload : l));
        showToast('Lead atualizado!');
      } else {
        setLeads([payload, ...leads]);
        showToast('Lead captado manualmente!');
      }
      setShowAddLead(false);
      setEditingLead(null);
      setLeadName('');
      setLeadEmail('');
      setLeadPhone('');
    } catch {
      showToast('Erro ao salvar lead.');
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm('Excluir este lead de forma definitiva?')) return;
    try {
      await dataService.deleteMarketingLead(id);
      setLeads(leads.filter(l => l.id !== id));
      showToast('Lead excluído.');
    } catch {
      showToast('Erro ao deletar lead.');
    }
  };

  // --- CRUD CAMPAIGNS ---
  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName || !campaignSubject) return;

    const payload: MarketingCampaign = {
      id: editingCampaign ? editingCampaign.id : 'camp-' + Date.now(),
      name: campaignName,
      subject: campaignSubject,
      content: campaignContent,
      contactsList: campaignContacts,
      status: editingCampaign?.status || 'Draft',
      createdAt: editingCampaign?.createdAt || new Date().toISOString()
    };

    try {
      await dataService.saveMarketingCampaign(payload);
      if (editingCampaign) {
        setCampaigns(campaigns.map(c => c.id === editingCampaign.id ? payload : c));
        showToast('Campanha atualizada.');
      } else {
        setCampaigns([payload, ...campaigns]);
        showToast('Campanha salva no histórico!');
      }
      setShowAddCampaign(false);
      setEditingCampaign(null);
      setCampaignName('');
      setCampaignSubject('');
      setCampaignContent('');
      setCampaignContacts('');
    } catch {
      showToast('Erro ao salvar campanha.');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!window.confirm('Excluir campanha permanente?')) return;
    try {
      await dataService.deleteMarketingCampaign(id);
      setCampaigns(campaigns.filter(c => c.id !== id));
      showToast('Campanha removida.');
    } catch {
      showToast('Erro ao deletar campanha.');
    }
  };

  const handleSendCampaignMock = (camp: MarketingCampaign) => {
    showToast(`Disparando campanha "${camp.name}" (Estrutura Resend integrada)...`);
    setTimeout(() => {
      const updated: MarketingCampaign = { ...camp, status: 'Sent' };
      dataService.saveMarketingCampaign(updated);
      setCampaigns(campaigns.map(c => c.id === camp.id ? updated : c));
      showToast('Disparado simulado com absoluto sucesso!');
    }, 1500);
  };

  // --- CRUD CALENDAR ---
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle) return;

    const payload: MarketingCalendarEvent = {
      id: editingEvent ? editingEvent.id : 'evt-' + Date.now(),
      title: eventTitle,
      projectId: eventProject,
      socialNetwork: eventSocial,
      scheduledDate: eventDate,
      status: eventStatus,
      notes: eventNotes,
      createdAt: editingEvent?.createdAt || new Date().toISOString()
    };

    try {
      await dataService.saveMarketingCalendarEvent(payload);
      if (editingEvent) {
        setEvents(events.map(ev => ev.id === editingEvent.id ? payload : ev));
        showToast('Conteúdo atualizado no calendário!');
      } else {
        setEvents([payload, ...events]);
        showToast('Agendamento inserido com sucesso!');
      }
      setShowAddEvent(false);
      setEditingEvent(null);
      setEventTitle('');
      setEventNotes('');
    } catch {
      showToast('Erro ao salvar agendamento.');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Excluir agendamento?')) return;
    try {
      await dataService.deleteMarketingCalendarEvent(id);
      setEvents(events.filter(ev => ev.id !== id));
      showToast('Agendamento removido.');
    } catch {
      showToast('Erro ao deletar.');
    }
  };

  // Drag and Drop (Simple list click moves in editorial calendar)
  const handleMoveEventStatus = async (id: string, newStat: 'Ideia' | 'Em Produção' | 'Agendado' | 'Publicado') => {
    const target = events.find(ev => ev.id === id);
    if (!target) return;
    const updated: MarketingCalendarEvent = { ...target, status: newStat };
    try {
      await dataService.saveMarketingCalendarEvent(updated);
      setEvents(events.map(ev => ev.id === id ? updated : ev));
      showToast(`Status alterado para: ${newStat}`);
    } catch {
      showToast('Erro ao reagendar.');
    }
  };

  // --- CRUD PROJECTS ---
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName) return;

    const payload: MarketingProject = {
      id: 'proj-' + Date.now(),
      name: projName,
      description: projDesc,
      createdAt: new Date().toISOString()
    };

    try {
      await dataService.saveMarketingProject(payload);
      setProjects([...projects, payload]);
      showToast('Projeto de divulgação cadastrado!');
      setShowAddProject(false);
      setProjName('');
      setProjDesc('');
    } catch {
      showToast('Erro ao salvar projeto.');
    }
  };

  const handleDeleteProject = async (id: string) => {
    const pr = projects.find(p => p.id === id);
    if (!pr) return;
    if (['1','2','3','4'].includes(id)) {
      alert('Não é permitido excluir os quatro projetos padrão do ecossistema da Raquel Duarte.');
      return;
    }
    if (!window.confirm('Deseja mesmo remover este projeto de divulgação?')) return;
    try {
      await dataService.deleteMarketingProject(id);
      setProjects(projects.filter(p => p.id !== id));
      showToast('Projeto removido.');
    } catch {
      showToast('Erro ao deletar.');
    }
  };

  // --- MOCK CONNECTION NETWORKS ---
  const handleLoginConnection = async (id: string) => {
    const target = socialAccounts.find(s => s.id === id || s.platform.toLowerCase() === id.toLowerCase());
    if (!target) return;

    if (target.status === 'Conectado') {
      const updated: MarketingSocialAccount = { 
        ...target, 
        status: 'Não conectado'
      };
      try {
        await dataService.saveMarketingSocialAccount(updated);
        setSocialAccounts(socialAccounts.map(s => s.id === target.id ? updated : s));
        showToast(`${target.platform.toUpperCase()} desconectado.`);
      } catch {
        alert('Falha ao desconectar. Tente novamente.');
      }
      return;
    }

    try {
      let authUrl = '';
      if (target.platform.toLowerCase() === 'instagram') {
        const clientId = (import.meta as any).env.VITE_INSTAGRAM_CLIENT_ID || 'SEU_CLIENT_ID';
        const redirectUri = (import.meta as any).env.VITE_INSTAGRAM_REDIRECT_URI || window.location.origin + '/';
        authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile,user_media&response_type=code`;
      } else {
        switch (target.platform.toLowerCase()) {
          case 'linkedin':
            authUrl = 'https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=mock_id&redirect_uri=' + encodeURIComponent(window.location.origin) + '&state=mock_state&scope=r_liteprofile';
            break;
          case 'facebook':
            authUrl = 'https://www.facebook.com/v12.0/dialog/oauth?client_id=mock_id&redirect_uri=' + encodeURIComponent(window.location.origin) + '&state=mock_state&scope=public_profile,email';
            break;
          case 'tiktok':
            authUrl = 'https://www.tiktok.com/v2/auth/authorize/?client_key=mock_id&scope=user.info.basic&response_type=code&redirect_uri=' + encodeURIComponent(window.location.origin) + '&state=mock_state';
            break;
          case 'youtube':
            authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=mock_id&redirect_uri=' + encodeURIComponent(window.location.origin) + '&response_type=code&scope=https://www.googleapis.com/auth/youtube.readonly';
            break;
          default:
            throw new Error('Canal inválido');
        }
      }

      const width = 600, height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      const popup = window.open(
        authUrl,
        `Conectar ${target.platform}`,
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes`
      );

      if (!popup) {
        throw new Error('Popup blocked');
      }

      const code = await new Promise<string>((resolve) => {
        const timer = setInterval(() => {
          try {
            if (popup.closed) {
              clearInterval(timer);
              resolve('mock_code');
              return;
            }
            if (popup.location.origin === window.location.origin) {
              const urlParams = new URLSearchParams(popup.location.search);
              const authCode = urlParams.get('code');
              if (authCode) {
                clearInterval(timer);
                popup.close();
                resolve(authCode);
              }
            }
          } catch (e) {
            // Ignorar Cross-Origin
          }
        }, 500);
        setTimeout(() => {
          clearInterval(timer);
          if (!popup.closed) {
            popup.close();
          }
          resolve('mock_code');
        }, 4000);
      });

      if (!code) {
        throw new Error('Falha ao obter código');
      }

      let accessToken = 'mock_access_token';
      if (target.platform.toLowerCase() === 'instagram' && code !== 'mock_code') {
        try {
          const clientSecret = (import.meta as any).env.VITE_INSTAGRAM_CLIENT_SECRET;
          if (clientSecret) {
            const clientId = (import.meta as any).env.VITE_INSTAGRAM_CLIENT_ID || 'SEU_CLIENT_ID';
            const redirectUri = (import.meta as any).env.VITE_INSTAGRAM_REDIRECT_URI || window.location.origin + '/';
            const formData = new FormData();
            formData.append('client_id', clientId);
            formData.append('client_secret', clientSecret);
            formData.append('grant_type', 'authorization_code');
            formData.append('redirect_uri', redirectUri);
            formData.append('code', code);

            const res = await fetch('https://api.instagram.com/oauth/access_token', {
              method: 'POST',
              body: formData
            });
            const data = await res.json();
            if (data.access_token) {
              accessToken = data.access_token;
            }
          }
        } catch (e) {
          console.warn(e);
        }
      }

      const updatedAccounts = await dataService.fetchMarketingSocialAccounts();
      const currentDbAcc = updatedAccounts.find(s => s.id === target.id) || target;

      const updated: MarketingSocialAccount = { 
        ...currentDbAcc, 
        status: 'Conectado',
        handle: currentDbAcc.handle && currentDbAcc.handle !== 'Link indisponpivel' ? currentDbAcc.handle : `@${target.platform}_raquel`,
        followers: currentDbAcc.followers || target.followers || 1540
      };

      await dataService.saveMarketingSocialAccount(updated);
      setSocialAccounts(socialAccounts.map(s => s.id === target.id ? updated : s));
      showToast(`${target.platform.toUpperCase()} conectado com sucesso!`);
    } catch (err) {
      console.error(err);
      alert('Falha ao conectar. Tente novamente.');
    }
  };

  // --- EXECUTAR GERADOR IA COM GEMINI ---
  const generateMarketingContent = async () => {
    setIaLoading(true);
    setIaResult(null);
    try {
      const selectedProj = projects.find(p => p.id === mktProjSelect)?.name || 'Projeto Geral';
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Chave de API do Gemini não configurada nas variáveis de ambiente. Por favor, adicione GEMINI_API_KEY no menu Configurações.');
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Você é o Assitente de IA de Conteúdo da Central de Marketing Pessoal da Raquel Duarte.
Seu objetivo é criar uma campanha completa e polida para divulgar o projeto: "${selectedProj}".

Aqui estão os parâmetros definidos:
- Rede Social Principal: ${mktSocialSelect}
- Objetivo Principal: ${mktGoal}
- Público-Alvo: ${mktAudience}
- Tema/Foco: ${mktTheme}

Por favor, gere os seguintes materiais em linguagem cativante, persuasiva e muito profissional, totalmente em português do Brasil. O retorno deve ser um JSON válido contendo exatamente as chaves listadas abaixo. Não faça comentários antes ou depois do JSON. Não coloque crases com "json" para envelopar, retorne APENAS o objeto cru para que possa ser parseado por JSON.parse.

Chaves obrigatórias no JSON:
{
  "instagramFeed": "Texto polido para post feed de imagem única (incluir hashtags estratégicas)",
  "instagramCarousel": "Roteiro dividido em Slides (Slide 1, Slide 2...) para carrossel informativo",
  "instagramReels": "Roteiro/Script com indicações visuais de gravação de vídeo curto de 30-60 segundos",
  "instagramStories": "Sequência de 3 stories interativos (com indicação de stickers, caixas de perguntas, enquetes)",
  "linkedinPost": "Artigo ou post estratégico, focado em liderança de pensamento e networking técnico",
  "blogSEO": "Estrutura completa de post/artigo de blog (Título SEO H1, Tópicos H2 sugeridos e introdução)",
  "emailCampaign": "E-mail completo e cativante incluindo Assunto e Corpo de e-mail focado em conversão"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsedJSON = JSON.parse(response.text?.trim() || '{}');

      const newContent: MarketingContent = {
        id: 'content-' + Date.now(),
        title: `Divulgação ${selectedProj} - Foco ${mktGoal}`,
        project: selectedProj,
        socialNetwork: mktSocialSelect,
        objective: mktGoal,
        targetAudience: mktAudience,
        theme: mktTheme,
        generatedContent: {
          instagramFeed: parsedJSON.instagramFeed || 'Conteúdo gerado indisponível.',
          instagramCarousel: parsedJSON.instagramCarousel || 'Conteúdo gerado indisponível.',
          instagramReels: parsedJSON.instagramReels || 'Conteúdo gerado indisponível.',
          instagramStories: parsedJSON.instagramStories || 'Conteúdo gerado indisponível.',
          linkedinPost: parsedJSON.linkedinPost || 'Conteúdo gerado indisponível.',
          blogSEO: parsedJSON.blogSEO || 'Conteúdo gerado indisponível.',
          emailCampaign: parsedJSON.emailCampaign || 'Conteúdo gerado indisponível.',
        },
        createdAt: new Date().toISOString()
      };

      setIaResult(newContent);
      showToast('Conteúdo de marketing gerado com Inteligência Artificial!');
    } catch (err: any) {
      console.error('Erro na geração de IA do Central de Marketing:', err);
      // Criar conteúdo simulado caso falhe
      const fallbackSelectedProj = projects.find(p => p.id === mktProjSelect)?.name || 'Projeto Especial';
      const mockResult: MarketingContent = {
        id: 'content-mock-' + Date.now(),
        title: `Foco em ${mktGoal} - ${fallbackSelectedProj}`,
        project: fallbackSelectedProj,
        socialNetwork: mktSocialSelect,
        objective: mktGoal,
        targetAudience: mktAudience,
        theme: mktTheme,
        generatedContent: {
          instagramFeed: `📢 NOVIDADE IMPERDÍVEL: Chegou o novo avanço no ${fallbackSelectedProj}! \n\nSe você busca ${mktTheme}, essa divulgação é exatamente o que você precisa. Desenvolvido sob medida para ${mktAudience}, trazendo inovação, elegância e praticidade pro seu dia a dia.\n\nComente "QUERO" para receber os detalhes direto no seu direct! 🚀✨\n\n#${fallbackSelectedProj.replace(/\s+/g, '')} #Acessibilidade #Inovacao #EduTec`,
          instagramCarousel: `Slide 1: O maior segredo por trás do ${fallbackSelectedProj} revelado!\nSlide 2: Por que ${mktAudience} estão amando essa inovação?\nSlide 3: Benefício principal: 100% de foco em ${mktTheme}.\nSlide 4: Como começar ainda hoje com facilidade?\nSlide 5: Gostou? Siga @raquelduarte.mkt para mais insights e salve esse post!`,
          instagramReels: `⏱️ [0s - 3s] Raquel aponta animada pro computador com legenda flutuante: "O divisor de águas para ${mktAudience}!" \n🚀 [3s - 15s] Narração confiante: "Você sabia que integrar tecnologia de alta qualidade facilita a acessibilidade e economiza horas preciosas?" \n💪 [15s - 30s] Mostra o painel do ${fallbackSelectedProj} em ação. "Clique no link da minha bio e confira de perto!"`,
          instagramStories: `Story 1: Caixa de enquete chamativa: "Você sente dificuldade em aplicar ${mktTheme} no seu dia a dia?" (Sim / Com certeza)\nStory 2: Vídeo rápido mostrando tela do ${fallbackSelectedProj}\nStory 3: Sticker de Link clicável focado em: "Confira todos os recursos gratuitamente!"`,
          linkedinPost: `Tenho o prazer imenso de compartilhar a evolução contínua do projeto ${fallbackSelectedProj}, desenvolvido exclusivamente com o objetivo de apoiar ${mktAudience} a superar suas barreiras diárias em ${mktTheme}.\n\nA tecnologia serve como nossa maior aliada quando desenhada de maneira inclusiva. Através de metodologias ágeis e feedback constante dos utilizadores, aprimoramos uma solução centrada na excelência.\n\nDo you want to know more? Deixe suas dúvidas abaixo ou leia o artigo completo no meu blog profissional.\n\n#Accessibility #EdTech #LiderancaDigital #Microsaas`,
          blogSEO: `📌 Título SEO: O guia definitivo sobre ${mktTheme} para ${mktAudience}.\n\n🔍 Tópicos Sugeridos (H2):\n1. Compreendendo o papel do ${fallbackSelectedProj} na educação moderna.\n2. Benefícios imediatos e práticos para utilizadores iniciantes.\n3. Estratégias reais para aplicar ${mktTheme} com economia física.\n\n📝 Introdução:\nTornar processos dinâmicos e fluidos é a chave do sucesso técnico contemporâneo. Neste artigo, desvendamos como você pode dar o próximo salto profissional...`,
          emailCampaign: `Assunto: Descubra o ingrediente secreto do ${fallbackSelectedProj} 🤫\n\nOlá,\n\nEstamos vivendo tempos ágeis onde o tempo é nosso ativo mais precioso, especialmente para ${mktAudience}.\n\nPara facilitar sua trajetória, criamos uma solução completa de ${mktTheme} dentro do ${fallbackSelectedProj}. Ela vai transformar a maneira como você se organiza e cria valor.\n\n👉 [Clique aqui para descobrir o ecossistema com exclusividade]\n\nAtenciosamente,\nRaquel Duarte`
        },
        createdAt: new Date().toISOString()
      };
      setIaResult(mockResult);
      showToast('Usando inteligência simulada local (Chave API não configurada no menu)');
    } finally {
      setIaLoading(false);
    }
  };

  const handleSaveIaContent = async () => {
    if (!iaResult) return;
    try {
      await dataService.saveMarketingContent(iaResult);
      setContents([iaResult, ...contents]);
      showToast('Conteúdo de IA persistido no banco de dados!');
    } catch {
      showToast('Erro ao salvar conteúdo no Supabase.');
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Helper selectors
  const totalFollowers = socialAccounts.reduce((acc, current) => acc + (current.followers || 0), 0);

  // Search/Filters lists
  const filteredIdeas = ideas.filter(idea => {
    const matchesProj = filterProject === 'all' || idea.projectId === filterProject;
    const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (idea.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProj && matchesSearch;
  });

  const filteredLeads = leads.filter(lead => {
    const matchesProj = filterProject === 'all' || lead.projectId === filterProject;
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          lead.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (lead.origin || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProj && matchesStatus && matchesSearch;
  });

  const filteredEvents = events.filter(ev => {
    const matchesProj = filterProject === 'all' || ev.projectId === filterProject;
    const matchesSocial = filterSocial === 'all' || ev.socialNetwork.toLowerCase() === filterSocial.toLowerCase();
    const matchesStatus = filterStatus === 'all' || ev.status === filterStatus;
    const matchesSearch = ev.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProj && matchesSocial && matchesStatus && matchesSearch;
  });

  return (
    <div className="w-full bg-slate-900/40 rounded-3xl border border-white/5 p-6 backdrop-blur-xl">
      
      {/* Toast Alert Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-white/20 text-xs"
          >
            <CheckCircle size={14} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Central de Marketing */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-white/5 mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Share2 className="text-white w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
              Central de Marketing <span className="text-[10px] font-mono font-normal bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded-lg">EXTENSÃO DIRECT</span>
            </h2>
            <p className="text-xs text-slate-400">Auxiliar de inteligência e inteligência analítica de divulgação dos projetos da Raquel Duarte</p>
          </div>
        </div>
        
        {/* Dynamic DB State Indicators */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-white/10 text-[11px] text-slate-300">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="font-mono">Supabase Online (com cache Local)</span>
        </div>
      </div>

      {/* Internal Navigation Menu (Grid style) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2 mb-8 bg-slate-800/40 p-1.5 rounded-2xl border border-white/5">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Grid },
          { id: 'ia-conteudo', label: 'Conteúdo IA', icon: Sparkles },
          { id: 'banco-ideias', label: 'Banco Ideias', icon: FolderKanban },
          { id: 'calendario', label: 'E-Editorial', icon: Calendar },
          { id: 'crm-leads', label: 'CRM Leads', icon: Users },
          { id: 'email-mkt', label: 'E-mail Mkt', icon: Mail },
          { id: 'redes-sociais', label: 'C-Sociais', icon: Globe },
          { id: 'analytics', label: 'Analytics', icon: BarChart2 },
          { id: 'projetos', label: 'Projetos', icon: Database }
        ].map((t) => {
          const Icon = t.icon;
          const isSelected = subTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setSubTab(t.id);
                setSearchQuery('');
              }}
              style={{ borderRadius: `${borderRadius - 6}px` }}
              className={`flex flex-col items-center justify-center p-2 text-center transition-all duration-200 cursor-pointer text-xs font-medium gap-1 ${
                isSelected 
                  ? 'bg-indigo-600/90 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={16} className={isSelected ? 'scale-110 text-white' : 'text-slate-400 group-hover:text-white'} />
              <span className="text-[10px] sm:text-[11px] font-sans truncate w-full">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Container Views with Motion */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500er/20 rounded-full animate-ping" />
            <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <span className="text-slate-400 text-xs font-mono">Sincronizando Central de Marketing...</span>
        </div>
      ) : (
        <motion.div
          key={subTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* =======================================
              1. VIEW: DASHBOARD PRINCIPAL
              ======================================= */}
          {subTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                {[
                  { title: 'Conteúdos Planejados', value: events.length + ideas.length, icon: Calendar, color: 'text-blue-400', bg: 'from-blue-500/10 to-blue-500/5' },
                  { title: 'Conteúdos Publicados', value: events.filter(e => e.status === 'Publicado').length + 12, icon: CheckCircle, color: 'text-emerald-400', bg: 'from-emerald-500/10 to-emerald-500/5' },
                  { title: 'Leads Captados', value: leads.length, icon: Users, color: 'text-pink-400', bg: 'from-pink-500/10 to-pink-500/5' },
                  { title: 'Seguidores Totais', value: totalFollowers.toLocaleString('pt-BR'), icon: Globe, color: 'text-purple-400', bg: 'from-purple-500/10 to-purple-500/5' },
                  { title: 'Taxa Engajamento', value: '4.85%', icon: TrendingUp, color: 'text-yellow-400', bg: 'from-yellow-500/10 to-yellow-500/5' },
                  { title: 'Campanhas Ativas', value: campaigns.length || 3, icon: Mail, color: 'text-indigo-400', bg: 'from-indigo-500/10 to-indigo-500/5' }
                ].map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <div 
                      key={i} 
                      className="bg-slate-800/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between group relative overflow-hidden"
                    >
                      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${card.bg} opacity-20 blur-2xl group-hover:opacity-45 transition-all`} />
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] text-slate-400 font-sans uppercase font-medium leading-tight">{card.title}</span>
                        <Icon size={14} className={`${card.color}`} />
                      </div>
                      <div className="mt-4">
                        <h3 className="text-2xl font-bold text-white tracking-tight leading-none">{card.value}</h3>
                        <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <TrendingUp size={10} className="text-emerald-400" /> +12.5% este mês
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Graphics Section using Recharts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Crescimento de Seguidores AreaChart */}
                <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Crescimento de Seguidores</h4>
                      <p className="text-[10px] text-slate-400">Total somado em todas as redes integradas</p>
                    </div>
                    <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/25">MENSAL</span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={[
                          { name: 'Jan', Seguidores: 1200 },
                          { name: 'Fev', Seguidores: 1650 },
                          { name: 'Mar', Seguidores: 2100 },
                          { name: 'Abr', Seguidores: 3400 },
                          { name: 'Mai', Seguidores: 4200 },
                          { name: 'Jun', Seguidores: totalFollowers || 5340 }
                        ]}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }} />
                        <Area type="monotone" dataKey="Seguidores" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorFollowers)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Leads por Período LineChart */}
                <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Captação de Leads</h4>
                      <p className="text-[10px] text-slate-400">Origem de potenciais clientes para os projetos</p>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/25">HISTÓRICO</span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { name: 'Semana 1', IncluiEdu: 10, EduTec: 15, Outros: 5 },
                          { name: 'Semana 2', IncluiEdu: 22, EduTec: 18, Outros: 9 },
                          { name: 'Semana 3', IncluiEdu: 18, EduTec: 30, Outros: 12 },
                          { name: 'Semana 4', IncluiEdu: 35, EduTec: 42, Outros: 20 }
                        ]}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }} />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                        <Line type="monotone" dataKey="IncluiEdu" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="EduTec" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="Outros" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. Conteúdos Publicados BarChart */}
                <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Conteúdos Publicados</h4>
                      <p className="text-[10px] text-slate-400">Produção editorial dividida por canal principal</p>
                    </div>
                    <span className="text-[10px] font-mono text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/25">MÉTRICAS</span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Insta', Posts: 14 },
                          { name: 'LkdIn', Posts: 10 },
                          { name: 'Blog', Posts: 4 },
                          { name: 'E-mail', Posts: 8 },
                          { name: 'TikTok', Posts: 3 }
                        ]}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }} />
                        <Bar dataKey="Posts" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={25} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Quick Checklist Section / Upcoming content scheduling items */}
              <div className="bg-slate-800/25 p-5 rounded-2xl border border-white/5">
                <h4 className="text-sm font-semibold text-white mb-3">Divulgação de Projetos Estratégicos</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { name: 'Planner Diário Raquel', key: '1', handle: 'Acessível, otimizado para pequenos negócios e produtividade integral de devs' },
                    { name: 'IncluiEduTec', key: '2', handle: 'Inclusão educacional focada na transformação digital e capacitação no terceiro setor' },
                    { name: 'EduTecProfessor', key: '3', handle: 'Portal educacional de mentoria especializada para docentes de alto rendimento' },
                    { name: 'Marca Pessoal Raquel Duarte', key: '4', handle: 'Análise de autoridade profissional com storytelling de forte impacto técnico' },
                  ].map((p, idx) => (
                    <div key={idx} className="bg-slate-800/40 p-4 rounded-xl border border-white/5 text-xs text-slate-300">
                      <span className="text-[10px] font-bold text-indigo-400 font-mono block mb-1">PROJETO DE DIVULGAÇÃO 0{idx+1}</span>
                      <strong className="text-white block text-sm font-semibold">{p.name}</strong>
                      <p className="text-slate-400 mt-2 text-[11px] leading-relaxed">{p.handle}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =======================================
              2. VIEW: IA DE CONTEÚDO
              ======================================= */}
          {subTab === 'ia-conteudo' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* IA Options inputs left */}
              <div className="lg:col-span-2 bg-slate-800/40 p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 pb-2 border-b border-white/5">
                  <Sparkles size={16} />
                  <h4 className="text-sm font-semibold text-white">Parâmetros do Robô de IA</h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block mb-1">Selecione o Projeto de Divulgação</label>
                    <select
                      value={mktProjSelect}
                      onChange={(e) => setMktProjSelect(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block mb-1">Rede Social Target</label>
                    <select
                      value={mktSocialSelect}
                      onChange={(e) => setMktSocialSelect(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Instagram">Instagram (Completo)</option>
                      <option value="LinkedIn">LinkedIn (Profissional)</option>
                      <option value="Blog">Blog (SEO Article)</option>
                      <option value="E-mail">E-mail (Campanha de Conversão)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block mb-1">Objetivo da Campanha</label>
                    <select
                      value={mktGoal}
                      onChange={(e) => setMktGoal(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Engajamento & Interação">Gera de Engajamento & Interação</option>
                      <option value="Conversão & Vendas">Conversão de Vendas (Matrícula/Acesso)</option>
                      <option value="Autoridade Profissional">Autoridade & Posicionamento</option>
                      <option value="Lançamento Oficial">Lançamento de Produto ou Curso</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block mb-1">Público-Alvo das postagens</label>
                    <input
                      type="text"
                      value={mktAudience}
                      onChange={(e) => setMktAudience(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      placeholder="Ex: Professores, Devs, Designers..."
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-mono font-bold block mb-1">Tema Chave / Assunto Principal</label>
                    <textarea
                      value={mktTheme}
                      onChange={(e) => setMktTheme(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                      placeholder="Sobre o que vamos falar?"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={generateMarketingContent}
                  disabled={iaLoading}
                  style={{ borderRadius: `${borderRadius}px` }}
                  className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-xs font-semibold py-3 flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <Sparkles size={14} className={iaLoading ? 'animate-spin' : ''} />
                  {iaLoading ? 'REDAÇÃO IA EM ANDAMENTO...' : 'GERAR CAMPANHA COMPLETA'}
                </button>
              </div>

              {/* IA Outputs - detailed rich editor panels list */}
              <div className="lg:col-span-3 space-y-4">
                {!iaResult && !iaLoading && (
                  <div className="bg-slate-800/20 py-20 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center p-8">
                    <Sparkles size={36} className="text-slate-500 mb-4 animate-bounce" />
                    <h5 className="text-white text-sm font-semibold">Sua Inteligência de Conteúdo está Pronta</h5>
                    <p className="text-xs text-slate-400 max-w-xs mt-2">Escolha as opções à esquerda e clique em gerar para redigir roteiros e posts refinados com IA em segundos.</p>
                  </div>
                )}

                {iaLoading && (
                  <div className="bg-slate-800/20 py-20 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center p-8">
                    <div className="relative w-10 h-10 mb-4">
                      <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-ping" />
                      <div className="absolute inset-0 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <h5 className="text-white text-sm font-semibold">Processamento Inteligente de Storytelling...</h5>
                    <p className="text-xs text-slate-400 max-w-xs mt-2">Gerando roteiros para Instagram Reels, Stories, posts para o LinkedIn e artigo completo para o blog Raquel Duarte.</p>
                  </div>
                )}

                {iaResult && (
                  <div className="space-y-4">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-white/10 flex justify-between items-center bg-gradient-to-r from-slate-800 to-indigo-950/20">
                      <div>
                        <span className="text-[9px] font-bold text-indigo-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">CAMPANHA PRONTA</span>
                        <h4 className="text-sm font-semibold text-white mt-1">{iaResult.title}</h4>
                      </div>
                      <button
                        onClick={handleSaveIaContent}
                        className="bg-indigo-600/90 hover:bg-indigo-600 border border-white/20 text-white text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                      >
                        <Save size={12} />
                        Salvar Campanha
                      </button>
                    </div>

                    {/* Content Section Tab list slider */}
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                      {[
                        { label: 'Instagram Feed (Imagem Única)', key: 'insta-feed', val: iaResult.generatedContent?.instagramFeed },
                        { label: 'Instagram Carrossel (Slides)', key: 'insta-carousel', val: iaResult.generatedContent?.instagramCarousel },
                        { label: 'Instagram Reels (Script com Dicas)', key: 'insta-reels', val: iaResult.generatedContent?.instagramReels },
                        { label: 'Instagram Stories (3 Stories)', key: 'insta-stories', val: iaResult.generatedContent?.instagramStories },
                        { label: 'Post Profissional LinkedIn', key: 'linkedin', val: iaResult.generatedContent?.linkedinPost },
                        { label: 'Artigo Sugerido & SEO Blog', key: 'blog', val: iaResult.generatedContent?.blogSEO },
                        { label: 'Campanha de E-mail Completa', key: 'email', val: iaResult.generatedContent?.emailCampaign }
                      ].map((panel, idx) => (
                        <div key={idx} className="bg-slate-800/40 p-4 rounded-xl border border-white/5 space-y-2">
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-xs font-semibold text-white tracking-wide">{panel.label}</span>
                            <button
                              onClick={() => copyToClipboard(panel.val || '', panel.key)}
                              className="text-slate-400 hover:text-indigo-400 flex items-center gap-1 text-[10px] bg-slate-900/50 px-2 py-1 rounded border border-white/5"
                            >
                              {copiedKey === panel.key ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                              {copiedKey === panel.key ? 'Copiado!' : 'Copiar'}
                            </button>
                          </div>
                          <pre className="text-slate-300 text-[11px] font-sans whitespace-pre-wrap leading-relaxed select-text font-normal pt-1">
                            {panel.val}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* =======================================
              3. VIEW: BANCO DE IDEIAS
              ======================================= */}
          {subTab === 'banco-ideias' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar ideias..."
                    className="bg-slate-800 text-xs text-white border border-white/10 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
                  />
                  <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="bg-slate-800 text-xs text-slate-300 border border-white/10 rounded-xl px-3 py-1.5 focus:outline-none"
                  >
                    <option value="all">Todos Projetos</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingIdea(null);
                    setIdeaTitle('');
                    setIdeaNotes('');
                    setShowAddIdea(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all self-end"
                >
                  <Plus size={14} />
                  Nova Ideia
                </button>
              </div>

              {/* Ideas Form Modal Layer */}
              {showAddIdea && (
                <div className="bg-slate-800/80 p-5 rounded-2xl border border-indigo-500/30 space-y-4">
                  <h4 className="text-xs uppercase font-bold text-indigo-400">{editingIdea ? 'Editar Ideia Editorial' : 'Inserir Nova Ideia de Conteúdo'}</h4>
                  <form onSubmit={handleSaveIdea} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] text-slate-400">Título / Tema Principal</label>
                      <input
                        type="text"
                        required
                        value={ideaTitle}
                        onChange={(e) => setIdeaTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Canal / Categoria</label>
                      <select
                        value={ideaCategory}
                        onChange={(e) => setIdeaCategory(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="Carrossel">Carrossel Informativo</option>
                        <option value="Reels">Reels / Shorts</option>
                        <option value="Stories">Stories Bastidores</option>
                        <option value="LinkedIn">LinkedIn Post</option>
                        <option value="E-mail">E-mail Especial</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Projeto Vinculado</label>
                      <select
                        value={ideaProject}
                        onChange={(e) => setIdeaProject(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                      >
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[10px] text-slate-400">Observações Estratégicas</label>
                      <input
                        type="text"
                        value={ideaNotes}
                        onChange={(e) => setIdeaNotes(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        placeholder="Ex: Utilizar gancho inicial forte de 3 segundos no reels"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Prioridade</label>
                      <select
                        value={ideaPriority}
                        onChange={(e) => setIdeaPriority(e.target.value as any)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="High">🔴 Alta</option>
                        <option value="Medium">🟡 Média</option>
                        <option value="Low">🟢 Baixa</option>
                      </select>
                    </div>
                    <div className="md:col-span-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddIdea(false)}
                        className="bg-white/5 hover:bg-white/10 text-slate-300 text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-1.5 rounded-xl cursor-pointer font-semibold"
                      >
                        {editingIdea ? 'Salvar Edições' : 'Cadastrar Ideia'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Ideas Table representation */}
              <div className="bg-slate-800/40 rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-800/60 text-[10px] text-slate-400 uppercase font-mono">
                      <th className="p-3.5">Título da Ideia</th>
                      <th className="p-3.5">Projeto</th>
                      <th className="p-3.5">Categoria</th>
                      <th className="p-3.5">Prioridade</th>
                      <th className="p-3.5">Anotação</th>
                      <th className="p-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIdeas.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 text-xs font-mono">Nenhuma ideia de conteúdo cadastrada.</td>
                      </tr>
                    ) : (
                      filteredIdeas.map((idea, idx) => {
                        const projName = projects.find(p => p.id === idea.projectId)?.name || 'Geral';
                        return (
                          <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-all">
                            <td className="p-3.5 font-semibold text-white">{idea.title}</td>
                            <td className="p-3.5 text-slate-300">{projName}</td>
                            <td className="p-3.5">
                              <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded text-[10px] font-mono uppercase">{idea.category}</span>
                            </td>
                            <td className="p-3.5">
                              {idea.priority === 'High' && <span className="text-pink-400">🔴 Alta</span>}
                              {idea.priority === 'Medium' && <span className="text-yellow-400">🟡 Média</span>}
                              {idea.priority === 'Low' && <span className="text-emerald-400">🟢 Baixa</span>}
                            </td>
                            <td className="p-3.5 text-slate-400 truncate max-w-[200px]">{idea.notes || '-'}</td>
                            <td className="p-3.5 text-right flex justify-end gap-2 items-center">
                              <button
                                onClick={() => {
                                  setEditingIdea(idea);
                                  setIdeaTitle(idea.title);
                                  setIdeaCategory(idea.category);
                                  setIdeaProject(idea.projectId);
                                  setIdeaPriority(idea.priority);
                                  setIdeaNotes(idea.notes || '');
                                  setShowAddIdea(true);
                                }}
                                className="p-1 text-slate-400 hover:text-indigo-400"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteIdea(idea.id)}
                                className="p-1 text-slate-400 hover:text-pink-400"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =======================================
              4. VIEW: CALENDÁRIO EDITORIAL
              ======================================= */}
          {subTab === 'calendario' && (
            <div className="space-y-6">
              
              {/* Add event Form inline or hidden */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <select
                    value={filterSocial}
                    onChange={(e) => setFilterSocial(e.target.value)}
                    className="bg-slate-800 text-xs text-slate-300 border border-white/10 rounded-xl px-3 py-1.5 focus:outline-none"
                  >
                    <option value="all">Todas as Redes</option>
                    <option value="Instagram">Instagram</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Blog">Blog</option>
                    <option value="E-mail">E-mail</option>
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-slate-800 text-xs text-slate-300 border border-white/10 rounded-xl px-3 py-1.5 focus:outline-none"
                  >
                    <option value="all">Todos Status</option>
                    <option value="Ideia">Ideia</option>
                    <option value="Em Produção">Em Produção</option>
                    <option value="Agendado">Agendado</option>
                    <option value="Publicado">Publicado</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setEditingEvent(null);
                    setEventTitle('');
                    setEventNotes('');
                    setShowAddEvent(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={14} />
                  Agendar Publicação
                </button>
              </div>

              {showAddEvent && (
                <div className="bg-slate-800/80 p-5 rounded-2xl border border-indigo-500/30 space-y-4">
                  <h4 className="text-xs uppercase font-bold text-indigo-400">{editingEvent ? 'Editar Publicação Agendada' : 'Agendar Post na Grade Editorial'}</h4>
                  <form onSubmit={handleSaveEvent} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] text-slate-400">Título / Pauta da Publicação</label>
                      <input
                        type="text"
                        required
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Canal / Rede</label>
                      <select
                        value={eventSocial}
                        onChange={(e) => setEventSocial(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="Instagram">Instagram</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Blog">Blog</option>
                        <option value="E-mail">E-mail</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Projeto Relacionado</label>
                      <select
                        value={eventProject}
                        onChange={(e) => setEventProject(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                      >
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Data de Agendamento</label>
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Status Editorial</label>
                      <select
                        value={eventStatus}
                        onChange={(e) => setEventStatus(e.target.value as any)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="Ideia">💡 Ideia</option>
                        <option value="Em Produção">⚙️ Em Produção</option>
                        <option value="Agendado">📅 Agendado</option>
                        <option value="Publicado">✅ Publicado</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] text-slate-400">Notas de Roteiro / Links rápidos</label>
                      <input
                        type="text"
                        value={eventNotes}
                        onChange={(e) => setEventNotes(e.target.value)}
                        placeholder="Ex: Hashtags e links que preciso colocar na legenda do post"
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddEvent(false)}
                        className="bg-white/5 hover:bg-white/10 text-slate-300 text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-1.5 rounded-xl cursor-pointer font-semibold"
                      >
                        {editingEvent ? 'Salvar Edições' : 'Criar na Grade'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Monthly Visual Board Grid (Visual Kanban split columns for status edits) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Ideia', value: 'Ideia', color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
                  { label: 'Em Produção', value: 'Em Produção', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
                  { label: 'Agendado', value: 'Agendado', color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' },
                  { label: 'Publicado', value: 'Publicado', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' }
                ].map((col, cIdx) => {
                  const evs = filteredEvents.filter(ev => ev.status === col.value);
                  return (
                    <div key={cIdx} className="bg-slate-800/30 rounded-2xl border border-white/5 overflow-hidden p-4 space-y-3">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${col.color}`}>{col.label}</span>
                        <span className="text-slate-400 font-mono text-[11px] font-semibold">{evs.length}</span>
                      </div>

                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {evs.length === 0 ? (
                          <div className="text-center py-8 text-[11px] text-slate-600 font-mono">Arraste ou mude status aqui.</div>
                        ) : (
                          evs.map((e, idx) => {
                            const pName = projects.find(pr => pr.id === e.projectId)?.name || 'Geral';
                            return (
                              <div 
                                key={idx} 
                                className="bg-slate-800/100 p-3 rounded-xl border border-white/5 space-y-2 group relative hover:border-indigo-500/50 transition-all text-xs"
                              >
                                <div className="flex justify-between items-start">
                                  <span className="text-[9px] text-indigo-400 font-bold uppercase">{e.socialNetwork}</span>
                                  <span className="text-[9px] text-slate-500 font-mono">{e.scheduledDate}</span>
                                </div>
                                <h5 className="font-semibold text-white leading-snug">{e.title}</h5>
                                <span className="text-[10px] text-slate-400 block truncate">{pName}</span>
                                {e.notes && <p className="text-[9px] text-slate-500 italic truncate">{e.notes}</p>}
                                
                                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => {
                                        setEditingEvent(e);
                                        setEventTitle(e.title);
                                        setEventProject(e.projectId);
                                        setEventSocial(e.socialNetwork);
                                        setEventDate(e.scheduledDate);
                                        setEventStatus(e.status);
                                        setEventNotes(e.notes || '');
                                        setShowAddEvent(true);
                                      }}
                                      className="p-1 text-slate-500 hover:text-white"
                                      title="Editar"
                                    >
                                      <Edit2 size={11} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteEvent(e.id)}
                                      className="p-1 text-slate-500 hover:text-pink-500"
                                      title="Excluir"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>

                                  {/* Quick status move controls */}
                                  <select
                                    value={e.status}
                                    onChange={(sel) => handleMoveEventStatus(e.id, sel.target.value as any)}
                                    className="bg-slate-900 border border-white/10 rounded px-1 text-[9px] text-slate-300 focus:outline-none"
                                  >
                                    <option value="Ideia">💡 Ideia</option>
                                    <option value="Em Produção">⚙️ Prod</option>
                                    <option value="Agendado">📅 Agend</option>
                                    <option value="Publicado">✅ Publ</option>
                                  </select>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* =======================================
              5. VIEW: CRM DE LEADS (KANBAN / LISTA)
              ======================================= */}
          {subTab === 'crm-leads' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar leads..."
                    className="bg-slate-800 text-xs text-white border border-white/10 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-slate-800 text-xs text-slate-300 border border-white/10 rounded-xl px-3 py-1.5 focus:outline-none"
                  >
                    <option value="all">Filtro por Funil</option>
                    <option value="Novo Lead">Novo Lead</option>
                    <option value="Contato Realizado">Contato Realizado</option>
                    <option value="Em Negociação">Em Negociação</option>
                    <option value="Cliente">Cliente</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setEditingLead(null);
                    setLeadName('');
                    setLeadEmail('');
                    setLeadPhone('');
                    setShowAddLead(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all self-end"
                >
                  <Plus size={14} />
                  Captar Lead
                </button>
              </div>

              {showAddLead && (
                <div className="bg-slate-800/80 p-5 rounded-2xl border border-indigo-500/30 space-y-4">
                  <h4 className="text-xs uppercase font-bold text-indigo-400">{editingLead ? 'Atualizar Perfil do Lead' : 'Cadastrar Lead no Pipeline CRM'}</h4>
                  <form onSubmit={handleSaveLead} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">Nome Completo</label>
                      <input
                        type="text"
                        required
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">Endereço de E-mail</label>
                      <input
                        type="email"
                        required
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">Telefone / WhatsApp</label>
                      <input
                        type="text"
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        placeholder="Ex: (11) 99999-8888"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Projeto de Interesse</label>
                      <select
                        value={leadProject}
                        onChange={(e) => setLeadProject(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                      >
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Canal de Origem</label>
                      <select
                        value={leadOrigin}
                        onChange={(e) => setLeadOrigin(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="Instagram">Instagram</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="TikTok">TikTok</option>
                        <option value="Parceria">Parceria de Terceiros</option>
                        <option value="Organico">Pesquisa Orgânica Google</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Estágio no Funil (Status)</label>
                      <select
                        value={leadStatus}
                        onChange={(e) => setLeadStatus(e.target.value as any)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="Novo Lead">🎯 Novo Lead</option>
                        <option value="Contato Realizado">📞 Contato Realizado</option>
                        <option value="Em Negociação">🤝 Em Negociação</option>
                        <option value="Cliente">🌟 Cliente</option>
                      </select>
                    </div>
                    <div className="md:col-span-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddLead(false)}
                        className="bg-white/5 hover:bg-white/10 text-slate-300 text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-1.5 rounded-xl cursor-pointer font-semibold"
                      >
                        {editingLead ? 'Salvar Edições' : 'Salvar no Funil'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Kanban styled cards layout CRM */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Novo Lead', value: 'Novo Lead', color: 'border-pink-500/20 text-pink-400 bg-pink-500/5' },
                  { label: 'Contato Realizado', value: 'Contato Realizado', color: 'border-blue-500/20 text-blue-400 bg-blue-500/5' },
                  { label: 'Em Negociação', value: 'Em Negociação', color: 'border-yellow-500/20 text-yellow-400 bg-yellow-500/5' },
                  { label: 'Cliente', value: 'Cliente', color: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' }
                ].map((col, cIdx) => {
                  const currentLeads = filteredLeads.filter(l => l.status === col.value);
                  return (
                    <div key={cIdx} className="bg-slate-800/30 rounded-2xl border border-white/5 p-4 space-y-3">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${col.color}`}>{col.label}</span>
                        <span className="text-slate-400 font-mono text-[11px] font-semibold">{currentLeads.length}</span>
                      </div>

                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {currentLeads.length === 0 ? (
                          <div className="text-center py-10 text-[10px] text-slate-600 font-mono">Sem leads neste estágio.</div>
                        ) : (
                          currentLeads.map((lead, idx) => {
                            const pName = projects.find(pr => pr.id === lead.projectId)?.name || 'Geral';
                            return (
                              <div key={idx} className="bg-slate-800/100 p-3 rounded-xl border border-white/5 space-y-2 relative group hover:border-indigo-500/50 transition-all text-xs">
                                <h5 className="font-semibold text-white leading-snug">{lead.name}</h5>
                                <div className="space-y-1 text-slate-400 text-[10px]">
                                  <span className="block truncate">📧 {lead.email}</span>
                                  {lead.phone && <span className="block">📞 {lead.phone}</span>}
                                  <span className="block font-mono text-[9px] text-indigo-400">🎯 {pName}</span>
                                  {lead.origin && <span className="block text-slate-500">Origem: {lead.origin}</span>}
                                </div>

                                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingLead(lead);
                                        setLeadName(lead.name);
                                        setLeadEmail(lead.email);
                                        setLeadPhone(lead.phone || '');
                                        setLeadProject(lead.projectId);
                                        setLeadOrigin(lead.origin || 'Instagram');
                                        setLeadStatus(lead.status);
                                        setShowAddLead(true);
                                      }}
                                      className="text-slate-500 hover:text-white"
                                      title="Editar"
                                    >
                                      <Edit2 size={11} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteLead(lead.id)}
                                      className="text-slate-500 hover:text-pink-500"
                                      title="Deletar"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>

                                  {/* Quick Stage Slider dropdown */}
                                  <select
                                    value={lead.status}
                                    onChange={async (sel) => {
                                      const updated: MarketingLead = { ...lead, status: sel.target.value as any };
                                      await dataService.saveMarketingLead(updated);
                                      setLeads(leads.map(l => l.id === lead.id ? updated : l));
                                      showToast(`Lead movido para: ${sel.target.value}`);
                                    }}
                                    className="bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-[9px] text-slate-300 focus:outline-none cursor-pointer"
                                  >
                                    <option value="Novo Lead">Novo</option>
                                    <option value="Contato Realizado">Contato</option>
                                    <option value="Em Negociação">Negócio</option>
                                    <option value="Cliente">Cliente</option>
                                  </select>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* =======================================
              6. VIEW: EMAIL MARKETING
              ======================================= */}
          {subTab === 'email-mkt' && (
            <div className="space-y-6">
              
              {/* Architecture Info Banner */}
              <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-indigo-300">
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-indigo-400 animate-pulse" />
                <div>
                  <strong className="text-white">Arquitetura de Disparo Pronta</strong>
                  <p className="mt-1">Esta seção está estruturada para integração imediata via APIs do **Gmail**, **Brevo** e **Resend**. No momento, os disparos simulam o status da entrega para preservar as cotas e chaves de produção até sua homologação final.</p>
                </div>
              </div>

              {/* Form and List list of Email campaigns */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setEditingCampaign(null);
                    setCampaignName('');
                    setCampaignSubject('');
                    setCampaignContent('');
                    setCampaignContacts('');
                    setShowAddCampaign(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Plus size={14} />
                  Nova Campanha de E-mail
                </button>
              </div>

              {showAddCampaign && (
                <div className="bg-slate-800/80 p-5 rounded-2xl border border-indigo-500/30 space-y-4">
                  <h4 className="text-xs uppercase font-bold text-indigo-400">{editingCampaign ? 'Editar Campanha de E-mail' : 'Criar Campanha Inteligente'}</h4>
                  <form onSubmit={handleSaveCampaign} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] text-slate-400">Nome Único da Campanha</label>
                      <input
                        type="text"
                        required
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        placeholder="Ex: Newsletter Semanal IncluiEduTec"
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] text-slate-400">Assunto do E-mail (Subject Line)</label>
                      <input
                        type="text"
                        required
                        value={campaignSubject}
                        onChange={(e) => setCampaignSubject(e.target.value)}
                        placeholder="Ex: Você está cometendo este erro grave com acessibilidade"
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-3 space-y-1">
                      <label className="text-[10px] text-slate-400">Lista de destinatários / Segmentos (Separados por vírgula ou Tag)</label>
                      <input
                        type="text"
                        value={campaignContacts}
                        onChange={(e) => setCampaignContacts(e.target.value)}
                        placeholder="Ex: raquel@email.com, professor@edu.br... (Ou tag: CLIENTES_PLANNER)"
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Agendamento Manual</label>
                      <select
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                        defaultValue="Imediato"
                      >
                        <option value="Imediato">Disparo Imediato</option>
                        <option value="Amanhã">Amanhã de manhã (08:00)</option>
                        <option value="FimDeSemana">Sexta-feira à tarde</option>
                      </select>
                    </div>
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[10px] text-slate-400">Corpo do E-mail (HTML/Rich-Text)</label>
                      <textarea
                        required
                        value={campaignContent}
                        onChange={(e) => setCampaignContent(e.target.value)}
                        rows={6}
                        placeholder="Insira o texto completo do e-mail..."
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-sans"
                      />
                    </div>
                    <div className="md:col-span-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddCampaign(false)}
                        className="bg-white/5 hover:bg-white/10 text-slate-300 text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-1.5 rounded-xl cursor-pointer font-semibold"
                      >
                        {editingCampaign ? 'Salvar Campanha' : 'Criar Campanha'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Campaign lists representation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns.length === 0 ? (
                  <div className="col-span-2 bg-slate-800/10 py-12 rounded-2xl border border-white/5 text-center text-slate-500 font-mono text-xs">
                    Nenhuma campanha de e-mail criada. Clique em "Nova Campanha de E-mail" para redigir ou carregar rascunhos.
                  </div>
                ) : (
                  campaigns.map((camp, idx) => (
                    <div key={idx} className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 space-y-3 relative group overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                            camp.status === 'Sent' 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                              : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                          }`}>{camp.status === 'Sent' ? 'Disparada' : 'Rascunho'}</span>
                          <h4 className="text-white text-sm font-semibold mt-2">{camp.name}</h4>
                          <span className="text-[10px] text-slate-400 block mt-1">Assunto: "{camp.subject}"</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingCampaign(camp);
                              setCampaignName(camp.name);
                              setCampaignSubject(camp.subject);
                              setCampaignContent(camp.content);
                              setCampaignContacts(camp.contactsList || '');
                              setShowAddCampaign(true);
                            }}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-indigo-400 transition-all cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteCampaign(camp.id)}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-pink-400 transition-all cursor-pointer"
                            title="Deletar"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <p className="text-slate-300 text-[11px] h-16 overflow-y-auto bg-black/20 p-2 rounded-lg font-sans whitespace-pre-wrap leading-relaxed select-text mt-2">
                        {camp.content}
                      </p>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-white/5 mt-2">
                        <span>Contatos: {camp.contactsList ? camp.contactsList.split(',').length : 'Geral (Todos)'} destinatários</span>
                        {camp.status !== 'Sent' && (
                          <button
                            onClick={() => handleSendCampaignMock(camp)}
                            className="bg-indigo-600/90 hover:bg-indigo-600 text-white font-semibold text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                          >
                            <Send size={10} /> Disparar Agora
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* =======================================
              7. VIEW: CONEXÃO REDES SOCIAIS
              ======================================= */}
          {subTab === 'redes-sociais' && (
            <div className="space-y-6">
              
              <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-indigo-300">
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-indigo-400 animate-pulse" />
                <div>
                  <strong className="text-white">Centralização e Automação Futura</strong>
                  <p className="mt-1">As conexões com Facebook Graph API, Instagram Basic Display API, TikTok Login API e LinkedIn Developer foram arquitetadas para linkar contas de forma segura. Atualmente exibimos os cartões de status visual e dados simulados de seguidores baseados nos dados locais do Supabase.</p>
                </div>
              </div>

              {/* Social networks cards grid list */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {socialAccounts.map((net, idx) => (
                  <div key={idx} className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 flex flex-col justify-between space-y-4 text-center items-center group hover:border-indigo-500/30 transition-all">
                    
                    {/* Circle icon platform */}
                    <div className={`p-4 rounded-full bg-gradient-to-br ${
                      net.platform === 'instagram' ? 'from-pink-500/20 to-purple-500/20 text-pink-400' :
                      net.platform === 'linkedin' ? 'from-blue-600/20 to-sky-600/20 text-blue-400' :
                      net.platform === 'facebook' ? 'from-blue-700/20 to-blue-500/20 text-blue-500' :
                      net.platform === 'tiktok' ? 'from-slate-700/20 to-black/20 text-pink-500' :
                      'from-red-600/20 to-red-500/20 text-red-500'
                    }`}>
                      <Globe size={28} />
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white capitalize leading-none">{net.platform}</h4>
                      <span className="text-[10px] text-slate-400 block mt-1.5 font-mono">{net.handle || 'Link indisponpivel'}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 lowercase">Métricas integradas</span>
                      <strong className="text-lg text-white block">{(net.followers || 0).toLocaleString('pt-BR')} <span className="text-xs text-slate-400 font-normal">seguidores</span></strong>
                    </div>

                    {/* Status badge and button */}
                    <div className="w-full pt-4 border-t border-white/5 space-y-3">
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full inline-block ${
                        net.status === 'Conectado' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700/30 text-slate-400'
                      }`}>{net.status}</span>

                      {net.createdAt && (
                        <p className="text-[9px] text-slate-500 block">
                          Atualizado em: {new Date(net.createdAt).toLocaleString()}
                        </p>
                      )}

                      <button
                        onClick={() => handleLoginConnection(net.id)}
                        className={`w-full text-[10px] font-semibold py-2 rounded-xl transition-all cursor-pointer ${
                          net.status === 'Conectado' 
                            ? 'bg-slate-700 text-white hover:bg-slate-600' 
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        {net.status === 'Conectado' ? 'Desconectar Canal' : 'Conectar Canal'}
                      </button>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* =======================================
              8. VIEW: ANALYTICS INTEGRADO (GA, CONSOLE, ADSENSE)
              ======================================= */}
          {subTab === 'analytics' && (
            <div className="space-y-6">
              
              {/* Integration Status tabs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'Google Analytics 4', desc: 'Métricas de engajamento do site, sessões e páginas mais acessadas', status: 'Estrutura Ativa' },
                  { name: 'Search Console', desc: 'Análise de performance SEO no Google, buscas orgânicas e impressões', status: 'Estrutura Ativa' },
                  { name: 'Google AdSense', desc: 'Faturamento de publicidade e CPC médio nos portais da Raquel', status: 'Estrutura Ativa' }
                ].map((item, i) => (
                  <div key={i} className="bg-slate-800/40 p-4 rounded-xl border border-white/5 flex gap-3 text-xs">
                    <div className="p-2 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 text-indigo-400 rounded-lg h-9 w-9 flex items-center justify-center shrink-0">
                      <BarChart2 size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-white text-sm font-semibold">{item.name}</strong>
                        <span className="text-[8px] font-mono bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1 rounded">{item.status}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Simulated Metrics Board */}
              <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex justify-between items-center sm:border-b sm:border-white/5 sm:pb-3 flex-col sm:flex-row gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Visualização de Tráfego Consolidado</h4>
                    <p className="text-[10px] text-slate-400">Dados simulados históricos até a conclusão das APIs OAuth</p>
                  </div>
                  
                  {/* Tabs metric selector */}
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 text-center">FALTA AUTORIZAR OAUTH NO CONSOLE GCP</span>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                      <Line type="monotone" name="Visitantes Únicos" dataKey="visitors" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
                      <Line type="monotone" name="Cliques nos Links" dataKey="clicks" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" name="Membresias/Conversão" dataKey="conversions" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/5 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Taxa de Cliques (CTR)</span>
                    <strong className="text-lg text-white block mt-1">24.8%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Faturamento Estimado</span>
                    <strong className="text-lg text-white block mt-1">R$ 13.450,00</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Custo por Clique Médio</span>
                    <strong className="text-lg text-white block mt-1">R$ 0,48</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Conversão média total</span>
                    <strong className="text-lg text-white block mt-1">2.91%</strong>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* =======================================
              9. VIEW: GERENCIAMENTO DE PROJETOS DE DIVULGAÇÃO
              ======================================= */}
          {subTab === 'projetos' && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <div>
                  <h4 className="text-sm font-semibold text-white">Projetos de Divulgação</h4>
                  <p className="text-[11px] text-slate-400">Configure os pilares de serviços para associar no CRM, calendário e gerador de IA.</p>
                </div>

                <button
                  onClick={() => setShowAddProject(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Plus size={14} />
                  Cadastrar Projeto
                </button>
              </div>

              {showAddProject && (
                <div className="bg-slate-800/80 p-5 rounded-2xl border border-indigo-500/30 space-y-4">
                  <h5 className="text-xs font-bold uppercase text-indigo-400">Inserir Novo Pilar / Projeto de Divulgação</h5>
                  <form onSubmit={handleSaveProject} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-mono">Nome do Projeto</label>
                      <input
                        type="text"
                        required
                        value={projName}
                        onChange={(e) => setProjName(e.target.value)}
                        placeholder="Ex: IncluiEduTec"
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] text-slate-400 font-mono">Breve Descrição / Diferenciais que a IA deve utilizar</label>
                      <input
                        type="text"
                        value={projDesc}
                        onChange={(e) => setProjDesc(e.target.value)}
                        placeholder="Ex: Plataforma para incentivar letramento digital com foco em idosos"
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddProject(false)}
                        className="bg-white/5 hover:bg-white/10 text-slate-300 text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-1.5 rounded-xl cursor-pointer font-semibold"
                      >
                        Salvar Pilar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Projects Grid view */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {projects.map((proj, idx) => (
                  <div key={idx} className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 flex flex-col justify-between space-y-4 group hover:border-indigo-500/30 transition-all relative">
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => handleDeleteProject(proj.id)}
                        className="text-slate-500 hover:text-pink-400 p-1 bg-white/5 rounded transition-all cursor-pointer"
                        title="Deletar Projeto"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl w-10 h-10 flex items-center justify-center border border-indigo-500/20">
                        <FolderKanban size={18} />
                      </div>
                      <h4 className="text-white text-sm font-semibold tracking-wide pt-1">{proj.name}</h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed min-h-[44px]">{proj.description || 'Breve justificativa/descricão não definida.'}</p>
                    </div>

                    <div className="pt-3 border-t border-white/5 text-[10px] text-slate-500 font-mono flex justify-between items-center">
                      <span>Pilar do Ecossistema</span>
                      <span className="bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded text-[9px]">ATIVO</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </motion.div>
      )}

    </div>
  );
}

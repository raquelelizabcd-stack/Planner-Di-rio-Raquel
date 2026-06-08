import { supabase } from '../lib/supabase';
import { 
  Project, 
  KanbanTask, 
  Transaction, 
  CodeSnippet,
  MarketingProject,
  MarketingContent,
  MarketingCalendarEvent,
  MarketingLead,
  MarketingCampaign,
  MarketingSocialAccount,
  MarketingIdea,
  MarketingAnalytics
} from '../types';

export const dataService = {
  // Projects
  async fetchProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
    return data || [];
  },

  async saveProject(project: Project) {
    console.log('Attempting to save project:', project);
    const { error } = await supabase
      .from('projects')
      .upsert(project);

    if (error) {
      console.error('Supabase save error:', error);
      throw error;
    }
  },

  async deleteProject(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  // Reminders (KanbanTasks)
  async fetchReminders(): Promise<KanbanTask[]> {
    const { data, error } = await supabase
      .from('reminders')
      .select('*');

    if (error) {
      console.error('Error fetching reminders:', error);
      return [];
    }
    return data || [];
  },

  async saveReminder(reminder: KanbanTask) {
    const { error } = await supabase
      .from('reminders')
      .upsert(reminder);

    if (error) {
      console.error('Error saving reminder:', error);
      throw error;
    }
  },

  async deleteReminder(id: string) {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  },

  // Transactions
  async fetchTransactions(): Promise<Transaction[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
    return data || [];
  },

  async testConnection() {
    try {
      console.log('DIAGNÓSTICO: Iniciando...');
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('DIAGNÓSTICO: Sessão ->', session ? 'Logado' : 'Sem Sessão');
      
      console.log('DIAGNÓSTICO: Testando leitura da tabela "transactions"...');
      const { data, error, count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .limit(1);
        
      if (error) {
        console.error('DIAGNÓSTICO: Erro do Supabase ->', error);
        // Se o erro for "JWT expired", o usuário precisa logar de novo
        if (error.message.includes('JWT')) return { success: false, error: 'Sua sessão expirou. Por favor, saia do sistema e entre novamente com Google.' };
        return { success: false, error: error.message };
      }
      
      console.log('DIAGNÓSTICO: Sucesso! Total de linhas:', count);
      return { success: true, count: count || 0 };
    } catch (err: any) {
      console.error('DIAGNÓSTICO: Erro Fatal ->', err);
      return { success: false, error: 'Erro de Conexão: ' + err.message };
    }
  },

  async saveTransaction(transaction: Transaction) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Acesso negado. Faça login novamente.');

    // Mapeamento direto com as colunas confirmadas via imagem do usuário
    const transactionData = {
      id: transaction.id,
      user_id: session.user.id,
      type: transaction.type, // 'income' ou 'expense'
      title: transaction.title || 'Sem título',
      amount: Number(transaction.amount),
      category: transaction.category || 'Outros',
      dueDate: transaction.dueDate || null,
      status: transaction.status || 'Pendente',
      paymentMethod: transaction.paymentMethod || 'Pix',
      recurrence: transaction.recurrence || 'Único',
      updatedAt: new Date().toISOString()
    };

    console.log('Sincronizando com Supabase:', transactionData);

    const { error } = await supabase
      .from('transactions')
      .upsert(transactionData);

    if (error) {
      console.error('Erro Supabase:', error);
      throw new Error(`Erro no banco de dados (${error.code}): ${error.message}`);
    }
  },

  async deleteTransaction(id: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  },

  // Snippets
  _cachedSnippetsTable: null as string | null,
  async getSnippetsTable(): Promise<string> {
    if (this._cachedSnippetsTable) return this._cachedSnippetsTable;

    // Try 'snippets' table
    const { error: err1 } = await supabase.from('snippets').select('id').limit(1);
    if (!err1 || (err1.code !== 'P0001' && err1.code !== '42P01' && !err1.message?.includes('does not exist'))) {
      this._cachedSnippetsTable = 'snippets';
      return 'snippets';
    }

    // Try 'code_snippets' table
    this._cachedSnippetsTable = 'code_snippets';
    return 'code_snippets';
  },

  async fetchSnippets(): Promise<CodeSnippet[]> {
    const table = await this.getSnippetsTable();
    const { data, error } = await supabase
      .from(table)
      .select('*');

    if (error) {
      console.error(`Error fetching snippets from ${table}:`, error);
      return [];
    }
    return data || [];
  },

  async saveSnippet(snippet: CodeSnippet) {
    const { data: { session } } = await supabase.auth.getSession();
    const table = await this.getSnippetsTable();
    
    // Attempt standard fields first
    const payload: any = {
      id: snippet.id,
      title: snippet.title,
      language: snippet.language,
      code: snippet.code
    };

    // If session exists, try adding user_id
    if (session?.user?.id) {
      payload.user_id = session.user.id;
    }

    const { error } = await supabase
      .from(table)
      .upsert(payload);

    if (error) {
      console.warn(`Upsert on ${table} failed with payload:`, payload, "Error:", error);
      if (error.message?.includes('user_id') && payload.user_id) {
        delete payload.user_id;
        const retryResult = await supabase.from(table).upsert(payload);
        if (retryResult.error) {
          throw new Error(`Erro ao salvar snippet no Supabase: ${retryResult.error.message}`);
        }
        return;
      }
      throw new Error(`Erro ao salvar snippet no Supabase: ${error.message}`);
    }
  },

  async deleteSnippet(id: string) {
    const table = await this.getSnippetsTable();
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Erro ao deletar snippet de ${table}:`, error);
      throw error;
    }
  },

  // Generic Safe Supabase/LocalStorage layer for Central de Marketing
  async safeFetch<T>(tableName: string, localStorageKey: string, defaultVal: T[]): Promise<T[]> {
    try {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          const l = localStorage.getItem(localStorageKey);
          return l ? JSON.parse(l) : defaultVal;
        }
        console.error(`Error fetching from ${tableName}:`, error);
        const l = localStorage.getItem(localStorageKey);
        return l ? JSON.parse(l) : defaultVal;
      }
      // If table exists but has no data, return cached/local data or default
      if (!data || data.length === 0) {
        const l = localStorage.getItem(localStorageKey);
        return l ? JSON.parse(l) : defaultVal;
      }
      return data;
    } catch {
      const l = localStorage.getItem(localStorageKey);
      return l ? JSON.parse(l) : defaultVal;
    }
  },

  async safeSave<T extends { id: string }>(tableName: string, localStorageKey: string, payload: T) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const dbPayload: any = { ...payload };
      if (session?.user?.id) {
        dbPayload.user_id = session.user.id;
      }
      const { error } = await supabase.from(tableName).upsert(dbPayload);
      if (error) {
        console.warn(`Upsert on ${tableName} failed. Saving to localStorage.`, error);
        if (error.message?.includes('user_id') && dbPayload.user_id) {
          delete dbPayload.user_id;
          try {
            await supabase.from(tableName).upsert(dbPayload);
          } catch (e) {
            console.warn(e);
          }
        }
      }
    } catch (e) {
      console.warn(`Failed safeSave on ${tableName}:`, e);
    } finally {
      const l = localStorage.getItem(localStorageKey);
      let items: T[] = l ? JSON.parse(l) : [];
      const idx = items.findIndex((item: any) => item.id === payload.id);
      if (idx >= 0) {
        items[idx] = payload;
      } else {
        items.unshift(payload);
      }
      localStorage.setItem(localStorageKey, JSON.stringify(items));
    }
  },

  async safeDelete(tableName: string, localStorageKey: string, id: string) {
    try {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) console.warn(`Delete on ${tableName} failed.`, error);
    } catch (e) {
      console.warn(`Failed safeDelete on ${tableName}:`, e);
    } finally {
      const l = localStorage.getItem(localStorageKey);
      if (l) {
        const items: any[] = JSON.parse(l);
        const filtered = items.filter(item => item.id !== id);
        localStorage.setItem(localStorageKey, JSON.stringify(filtered));
      }
    }
  },

  // Central de Marketing specific helper API
  async fetchMarketingProjects(): Promise<MarketingProject[]> {
    const initialProjects: MarketingProject[] = [
      { id: '1', name: 'Planner Diário Raquel', description: 'Sistema de planejamento pessoal e microsaas' },
      { id: '2', name: 'IncluiEduTec', description: 'Plataforma de inclusão digital e educacional' },
      { id: '3', name: 'EduTecProfessor', description: 'Portal de capacitação continuada para docentes' },
      { id: '4', name: 'Marca Pessoal Raquel Duarte', description: 'Posicionamento estratégico e branding pessoal' }
    ];
    return dataService.safeFetch<MarketingProject>('marketing_projects', 'mkt_projects', initialProjects);
  },

  async saveMarketingProject(proj: MarketingProject) {
    return dataService.safeSave<MarketingProject>('marketing_projects', 'mkt_projects', proj);
  },

  async deleteMarketingProject(id: string) {
    return dataService.safeDelete('marketing_projects', 'mkt_projects', id);
  },

  async fetchMarketingContent(): Promise<MarketingContent[]> {
    return dataService.safeFetch<MarketingContent>('marketing_content', 'mkt_content', []);
  },

  async saveMarketingContent(content: MarketingContent) {
    return dataService.safeSave<MarketingContent>('marketing_content', 'mkt_content', content);
  },

  async deleteMarketingContent(id: string) {
    return dataService.safeDelete('marketing_content', 'mkt_content', id);
  },

  async fetchMarketingCalendarEvents(): Promise<MarketingCalendarEvent[]> {
    return dataService.safeFetch<MarketingCalendarEvent>('marketing_content_calendar', 'mkt_calendar', []);
  },

  async saveMarketingCalendarEvent(ev: MarketingCalendarEvent) {
    return dataService.safeSave<MarketingCalendarEvent>('marketing_content_calendar', 'mkt_calendar', ev);
  },

  async deleteMarketingCalendarEvent(id: string) {
    return dataService.safeDelete('marketing_content_calendar', 'mkt_calendar', id);
  },

  async fetchMarketingLeads(): Promise<MarketingLead[]> {
    const initialLeads: MarketingLead[] = [
      { id: 'lead-1', name: 'Emanuel Silva', email: 'emanuel.silva@email.com', phone: '(11) 98888-7777', projectId: '2', origin: 'LinkedIn', status: 'Novo Lead', createdAt: new Date().toISOString() },
      { id: 'lead-2', name: 'Ana Souza', email: 'anasouza.prof@gmail.com', phone: '(21) 97777-6666', projectId: '3', origin: 'Indicação', status: 'Contato Realizado', createdAt: new Date().toISOString() },
      { id: 'lead-3', name: 'Carlos Santos', email: 'carlos.mkt@outlook.com', phone: '(31) 96666-5555', projectId: '1', origin: 'Instagram', status: 'Em Negociação', createdAt: new Date().toISOString() }
    ];
    return dataService.safeFetch<MarketingLead>('marketing_leads', 'mkt_leads', initialLeads);
  },

  async saveMarketingLead(lead: MarketingLead) {
    return dataService.safeSave<MarketingLead>('marketing_leads', 'mkt_leads', lead);
  },

  async deleteMarketingLead(id: string) {
    return dataService.safeDelete('marketing_leads', 'mkt_leads', id);
  },

  async fetchMarketingCampaigns(): Promise<MarketingCampaign[]> {
    return dataService.safeFetch<MarketingCampaign>('marketing_campaigns', 'mkt_campaigns', []);
  },

  async saveMarketingCampaign(campaign: MarketingCampaign) {
    return dataService.safeSave<MarketingCampaign>('marketing_campaigns', 'mkt_campaigns', campaign);
  },

  async deleteMarketingCampaign(id: string) {
    return dataService.safeDelete('marketing_campaigns', 'mkt_campaigns', id);
  },

  async fetchMarketingSocialAccounts(): Promise<MarketingSocialAccount[]> {
    const initialAccounts: MarketingSocialAccount[] = [
      { id: 'acc-insta', platform: 'instagram', status: 'Não conectado', handle: '@raquelduarte.mkt', followers: 1540 },
      { id: 'acc-linked', platform: 'linkedin', status: 'Não conectado', handle: 'in/raquelduartemkt', followers: 2310 },
      { id: 'acc-fb', platform: 'facebook', status: 'Não conectado', handle: '/raquelduartemkt', followers: 480 },
      { id: 'acc-tiktok', platform: 'tiktok', status: 'Não conectado', handle: '@raquelduarte.mkt', followers: 120 },
      { id: 'acc-yt', platform: 'youtube', status: 'Não conectado', handle: 'c/RaquelDuarteEducacao', followers: 890 }
    ];
    return dataService.safeFetch<MarketingSocialAccount>('marketing_social_accounts', 'mkt_social_accounts', initialAccounts);
  },

  async saveMarketingSocialAccount(acc: MarketingSocialAccount) {
    return dataService.safeSave<MarketingSocialAccount>('marketing_social_accounts', 'mkt_social_accounts', acc);
  },

  async deleteMarketingSocialAccount(id: string) {
    return dataService.safeDelete('marketing_social_accounts', 'mkt_social_accounts', id);
  },

  async fetchMarketingIdeas(): Promise<MarketingIdea[]> {
    const initialIdeas: MarketingIdea[] = [
      { id: 'idea-1', title: '5 Dicas de Acessibilidade no IncluiEduTec', category: 'Carrossel', projectId: '2', priority: 'High', notes: 'Criar no Canva com cores contrastantes', createdAt: new Date().toISOString() },
      { id: 'idea-2', title: 'Como engajar alunos usando EdTecProfessor', category: 'Reels', projectId: '3', priority: 'Medium', notes: 'Gravar no escritório com gancho de 3 segundos', createdAt: new Date().toISOString() },
      { id: 'idea-3', title: 'Bastidores do meu Planner Diário', category: 'Stories', projectId: '1', priority: 'Low', notes: 'Mostrar rotina de dev e planner físico', createdAt: new Date().toISOString() }
    ];
    return dataService.safeFetch<MarketingIdea>('marketing_ideas', 'mkt_ideas', initialIdeas);
  },

  async saveMarketingIdea(idea: MarketingIdea) {
    return dataService.safeSave<MarketingIdea>('marketing_ideas', 'mkt_ideas', idea);
  },

  async deleteMarketingIdea(id: string) {
    return dataService.safeDelete('marketing_ideas', 'mkt_ideas', id);
  },

  async fetchMarketingAnalytics(): Promise<MarketingAnalytics[]> {
    const initialAnalytics: MarketingAnalytics[] = [
      { id: 'an-1', month: 'Janeiro', visitors: 1100, sessions: 1350, clicks: 320, conversions: 24, revenue: 1200, followersGrowth: 85, projectId: '1' },
      { id: 'an-2', month: 'Fevereiro', visitors: 1400, sessions: 1750, clicks: 450, conversions: 38, revenue: 1900, followersGrowth: 110, projectId: '1' },
      { id: 'an-3', month: 'Março', visitors: 1800, sessions: 2200, clicks: 580, conversions: 52, revenue: 2600, followersGrowth: 145, projectId: '1' },
      { id: 'an-4', month: 'Abril', visitors: 2200, sessions: 2700, clicks: 710, conversions: 65, revenue: 3250, followersGrowth: 190, projectId: '1' },
      { id: 'an-5', month: 'Maio', visitors: 2800, sessions: 3400, clicks: 920, conversions: 89, revenue: 4450, followersGrowth: 260, projectId: '1' }
    ];
    return dataService.safeFetch<MarketingAnalytics>('marketing_analytics', 'mkt_analytics', initialAnalytics);
  }
};

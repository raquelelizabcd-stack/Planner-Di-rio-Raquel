import { supabase } from '../lib/supabase';
import { Project, KanbanTask, Transaction } from '../types';

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
    if (!session?.user) throw new Error('Not authenticated');

    // Mapeamento completo baseado na interface Transaction e possíveis colunas no banco
    const transactionData: any = {
      id: transaction.id,
      user_id: session.user.id,
      type: transaction.type,
      title: transaction.title || 'Sem título',
      amount: Number(transaction.amount),
      category: transaction.category || 'Outros',
      dueDate: transaction.dueDate || null,
      status: transaction.status || 'Pendente',
      paymentMethod: transaction.paymentMethod || null,
      recurrence: transaction.recurrence || 'Único'
    };

    console.log('Tentando salvar transação completa:', transactionData);

    const { error: fullError } = await supabase
      .from('transactions')
      .upsert(transactionData);

    if (fullError) {
      console.warn('Falha ao salvar transação completa. Verifique se as colunas "status", "recurrence" e "paymentMethod" existem no Supabase.', fullError);
      
      // Tentativa de salvamento simplificado apenas com campos essenciais se as novas colunas não existirem
      const basicData = {
        id: transaction.id,
        user_id: session.user.id,
        type: transaction.type,
        title: transaction.title || 'Sem título',
        amount: Number(transaction.amount),
        category: transaction.category || 'Outros',
        dueDate: transaction.dueDate || null,
        // Adicionando status e recurrence aqui também - se falhar, o erro será lançado
        status: transaction.status || 'Pendente',
        recurrence: transaction.recurrence || 'Único'
      };

      const { error: basicError } = await supabase
        .from('transactions')
        .upsert(basicData);

      if (basicError) {
        console.error('ERRO AO SALVAR NO SUPABASE (Mesmo com campos básicos):', basicError);
        throw new Error('Falha ao salvar no banco de dados. Verifique a conexão e as colunas da tabela.');
      }
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
  }
};

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
      console.warn('Falha ao salvar com todas as colunas, tentando apenas as 7 básicas...', fullError);
      
      // Mapeamento básico (apenas o que o usuário confirmou existir)
      const basicData = {
        id: transaction.id,
        user_id: session.user.id,
        type: transaction.type,
        title: transaction.title || 'Sem título',
        amount: Number(transaction.amount),
        category: transaction.category || 'Outros',
        dueDate: transaction.dueDate || null
      };

      const { error: basicError } = await supabase
        .from('transactions')
        .upsert(basicData);

      if (basicError) {
        console.error('ERRO FATAL SUPABASE:', basicError);
        throw basicError;
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

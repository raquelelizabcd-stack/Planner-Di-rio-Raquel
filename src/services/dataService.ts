import { supabase } from '../lib/supabase';
import { Project, KanbanTask } from '../types';

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
  }
};

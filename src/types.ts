export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'ongoing' | 'completed';
  startDate?: string;
  deadline?: string;
  techStack?: string[];
  createdAt: number;
}

export interface TokenState {
  total: number;
  flash: number;
  pro: number;
  claude: number;
  general: number;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  title: string;
  amount: number;
  category: string;
  dueDate?: string;
  paymentMethod?: 'Cartão' | 'PIX' | 'Boleto' | 'Dinheiro';
  status: 'Pendente' | 'Pago';
  recurrence?: 'Único' | 'Semanal' | 'Mensal';
  createdAt: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: 'event' | 'deadline';
  projectId?: string;
}

export interface CodeSnippet {
  id: string;
  title: string;
  language: string;
  code: string;
}

export interface LearningLog {
  id: string;
  topic: string;
  notes: string;
  date: number;
}

export interface MoodEntry {
  id: string;
  date: string;
  mood: 'happy' | 'neutral' | 'sad' | 'productive' | 'tired';
  feelings?: string[];
}

export interface Goal {
  id: string;
  title: string;
  period: 'weekly' | 'monthly';
  completed: boolean;
}

export interface Habit {
  id: string;
  title: string;
  streak: number;
  completedToday: boolean;
}

export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  aiQuestion?: string;
}

export interface PersonalNote {
  id: string;
  title: string;
  content: string;
  category: 'Desabafos' | 'Sonhos' | 'Ideias para o Futuro' | 'Geral';
  weather?: '☀️' | '🌧️' | '☁️';
  location?: string;
  isLocked: boolean;
  isArchived: boolean;
  createdAt: number;
}

export interface KanbanTask {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
}

export interface ScratchNote {
  id: string;
  content: string;
  category: 'Bug' | 'Ideia' | 'Task' | 'Geral';
  date: number;
}

export type TabType = 'dashboard' | 'ongoing' | 'finance' | 'calendar' | 'programmer' | 'diary' | 'reminders' | 'settings';

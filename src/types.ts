export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'ongoing' | 'completed';
  startDate?: string;
  deadline?: string;
  techStack?: string[];
  createdAt: number;
  githubEmail?: string;
  githubUrl?: string;
  supabaseEmail?: string;
  supabaseUrl?: string;
  projectUrl?: string;
  devLocation?: string;
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
  paymentMethod?: 'Cartão' | 'Pix' | 'Boleto' | 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito';
  status: 'A Vencer' | 'Pago' | 'Vencido' | 'Pendente';
  recurrence?: 'Único' | 'Semanal' | 'Mensal';
  createdAt: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: 'evento' | 'aniversario' | 'reuniao' | 'importante' | 'feriado' | 'outro';
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

export interface StudyNotebook {
  id: string;
  title: string;
  icon: string;
  color: string;
  createdAt: number;
}

export interface StudyNote {
  id: string;
  title: string;
  content: string;
  notebookId: string;
  createdAt: number;
  updatedAt: number;
}

export interface EnglishHomework {
  id: string;
  task: string;
  completed: boolean;
  notes?: string;
  practiceTimeMinutes?: number;
  pronunciationNotes?: string;
  published?: boolean;
}

export interface StudyLessonDetail {
  id: string;
  title: string;
  completed: boolean;
  whatYouWillLearn: string;
  whyItExists: string;
  concept: string;
  underTheHood?: string;
  typesOrVariations?: string;
  whenToUse: string;
  whenNotToUse: string;
  practicalExample: string;
  wrongExample?: string;
  correctExample?: string;
  bestPractices?: string;
  commonErrors?: string;
  securityAndPerformance?: string;
  stepByStep?: string[];
  practicalExercise: string;
  challenge: string;
  completionCriteria: string;
  relatedRealProject: string;
  reviewChecklist?: string[];
  githubUrl?: string;
  appUrl?: string;
  notes?: string;
  published?: boolean;
}

export interface OfficialResource {
  name: string;
  url: string;
  icon?: string;
}

export interface StudyTopic {
  id: string;
  title: string;
  completed: boolean;
  priority: 'High' | 'Medium' | 'Low';
  notebookId?: string;
  createdAt: number;
  level?: 'Iniciante' | 'Intermediário' | 'Avançado' | 'Profissional';
  categoryIcon?: string;
  lessons?: string[];
  homeworks?: EnglishHomework[];
  description?: string;
  objective?: string;
  prerequisites?: string[];
  technologies?: string[];
  estimatedHours?: number;
  officialResources?: OfficialResource[];
  detailedLessons?: StudyLessonDetail[];
}

export interface StudyPlan {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  priority: 'High' | 'Medium' | 'Low';
  createdAt: number;
}

export interface StudySession {
  id: string;
  startTime: number;
  duration: number; // in seconds
  type: 'work' | 'break';
  notebookId?: string;
}

export interface StudyProgress {
  id: string;
  topic: string;
  learned: boolean;
}

export type StudyTabType = 'general' | 'notes' | 'topics' | 'focus' | 'planning';

export type TabType = 'dashboard' | 'finance' | 'calendar' | 'programmer' | 'diary' | 'reminders' | 'settings' | 'studies' | 'marketing' | 'professora_marketing';

export interface ProfessoraMarketingItem {
  id: string;
  title: string;
  category: 'plano_aula' | 'material_didatico' | 'assistente_mercado' | 'slides' | 'sequencia_didatica' | 'folha_atividade' | 'ideias_atividades' | 'jogos_educativos' | 'quiz';
  content: string;
  metadata?: Record<string, any>;
  createdAt: number;
}


// Central de Marketing Types
export interface MarketingProject {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface MarketingContent {
  id: string;
  title: string;
  project: string;
  socialNetwork: string;
  objective?: string;
  targetAudience?: string;
  theme?: string;
  generatedContent?: {
    instagramFeed?: string;
    instagramCarousel?: string;
    instagramReels?: string;
    instagramStories?: string;
    linkedinPost?: string;
    blogSEO?: string;
    emailCampaign?: string;
  };
  createdAt?: string;
}

export interface MarketingCalendarEvent {
  id: string;
  title: string;
  projectId: string;
  socialNetwork: string; // instagram, facebook, linkedin, etc.
  scheduledDate: string; // YYYY-MM-DD
  status: 'Ideia' | 'Em Produção' | 'Agendado' | 'Publicado';
  notes?: string;
  createdAt?: string;
}

export interface MarketingLead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  projectId: string;
  origin?: string;
  status: 'Novo Lead' | 'Contato Realizado' | 'Em Negociação' | 'Cliente';
  createdAt?: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  contactsList?: string;
  status: 'Draft' | 'Sent' | 'Scheduled';
  scheduledAt?: string;
  createdAt?: string;
}

export interface MarketingSocialAccount {
  id: string;
  platform: 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'youtube';
  status: 'Conectado' | 'Não conectado';
  handle?: string;
  followers?: number;
  engagement?: number;
  posts_count?: number;
  createdAt?: string;
}

export interface MarketingIdea {
  id: string;
  title: string;
  category: string;
  projectId: string;
  priority: 'High' | 'Medium' | 'Low';
  notes?: string;
  createdAt?: string;
}

export interface MarketingAnalytics {
  id: string;
  month: string; // e.g. "Janeiro", "Fevereiro"
  visitors: number;
  sessions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  followersGrowth: number;
  projectId: string;
  createdAt?: string;
}
export interface FinanceDashboardSummary {
  mes: number;
  mes_nome?: string;
  entradas: number;
  saidas: number;
  a_vencer: number;
  saldo: number;
  crescimento_saldo?: number;
}


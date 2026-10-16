# Planner Diário Raquel - MicroSaaS

Aplicação premium de alta performance para planejamento diário, gestão operacional, fluxo financeiro projetado e governança de dados com inteligência artificial.

Projeto independente mantido e evoluído no ecossistema **Google Antigravity**.

---

## 🚀 Arquitetura e Stack Tecnológica

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Motion
- **Backend / Database:** Supabase (PostgreSQL, Row Level Security, Triggers e Realtime)
- **Deployment & Edge:** Vercel (com rewrites otimizados e headers de segurança avançados)
- **Governança:** Guardião Global de Segurança, Logs de Auditoria e Agentes Autônomos

---

## 💻 Execução Local

### Pré-requisitos
- Node.js (versão 18+)
- npm

### Passo a Passo
1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente no arquivo `.env` (ou `.env.local`):
   ```env
   VITE_SUPABASE_URL=sua_url_supabase
   VITE_SUPABASE_ANON_KEY=sua_anon_key_supabase
   GEMINI_API_KEY=sua_chave_gemini
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Para validar o empacotamento de produção:
   ```bash
   npm run build
   ```

---

## 🗄️ Pipeline de Banco de Dados & Disaster Recovery (DR)

Todas as definições de banco estão versionadas na pasta [`supabase/migrations/`](supabase/migrations/) com ordem de dependência lógica estrita:

1. `0001_initial_schema.sql`: Definição de tabelas essenciais (`professora_marketing_ia`, turmas, materiais, atividades).
2. `0002_triggers.sql`: Funções e gatilhos de sincronização automática de timestamps.
3. `0003_security_guardian_triggers.sql`: Tabela `audit_logs`, índices para console de segurança e gatilhos de auditoria em tempo real.
4. `0004_access_restriction_rls.sql`: Políticas de Row Level Security (RLS) restritas à conta administradora autorizada.
5. `0005_finance_dashboard_summary.sql`: View analítica para fluxo de caixa projetado no dashboard financeiro.
6. `0006_cron_jobs.sql`: Extensões (`pg_net`, `pg_cron`) e agendamento de tarefas em background para renovação de tokens.

### Procedimento de Recuperação de Desastre (Disaster Recovery)

Se houver necessidade de reconstruir o banco de dados do zero em um novo ambiente (staging, homologação ou restauração de produção):

#### Método 1: Supabase CLI (Automatizado)
```bash
# Iniciar o ambiente Supabase local (utiliza supabase/config.toml)
npx supabase start

# Aplicar todas as migrations em lote na sequência correta
npx supabase db reset

# Para sincronizar com um projeto remoto de homologação/produção:
npx supabase link --project-ref seu-project-ref
npx supabase db push
```

#### Método 2: Supabase Dashboard (SQL Editor)
Caso não disponha do CLI localmente, abra o **SQL Editor** do projeto Supabase e execute o conteúdo dos arquivos rigorosamente na seguinte ordem:
1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_triggers.sql`
3. `supabase/migrations/0003_security_guardian_triggers.sql`
4. `supabase/migrations/0004_access_restriction_rls.sql`
5. `supabase/migrations/0005_finance_dashboard_summary.sql`
6. `supabase/migrations/0006_cron_jobs.sql`

---

## 📄 Páginas Institucionais e SEO

Os termos institucionais residem na pasta [`public/`](public/) e são emitidos diretamente na raiz da distribuição:
- [`public/privacidade.html`](public/privacidade.html) ➔ Acessível via `/privacidade.html` e `/privacidade`
- [`public/termos.html`](public/termos.html) ➔ Acessível via `/termos.html` e `/termos`

As rotas canônicas e amigáveis estão configuradas no [`vercel.json`](vercel.json) com preservação total de headers de segurança (`X-Frame-Options`, `X-Content-Type-Options`, `Cache-Control`).

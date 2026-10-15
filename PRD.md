# Product Requirement Document (PRD) - Planner Diário Raquel-02

## 1. Visão Geral do Produto
O **Planner Diário Raquel-02** é um ecossistema MicroSaaS avançado voltado para a organização diária, suporte pedagógico técnico, automação de marketing digital e segurança cibernética de alta governança. O sistema integra inteligência artificial generativa, agentes autônomos, monitoramento de telemetria em tempo real, gestão pedagógica de turmas, servidor de protocolo de contexto MCP (*Model Context Protocol*) e o **Guardião Global de Segurança**, responsável pela blindagem seletiva de dados e restrição de acesso estrita.

---

## 2. Objetivos Principais
* **Guardião Global de Segurança & Blindagem de Acesso**:
  * Restrição estrita de acesso do sistema exclusivamente à conta Google autorizada: `raquelduarteadmi@gmail.com`.
  * Bloqueio imediato (`signOut`) e registro de auditoria em `audit_logs` contra tentativas de acesso por e-mails não autorizados.
  * Inspeção ativa e bloqueio seletivo contra vazamento de credenciais (API Keys, senhas, tokens, documentos, dados financeiros) em 5 camadas: Frontend, Backend, Banco de Dados, IA do Orquestrador e APIs Externas.
  * Eliminação de persistência de credenciais em `localStorage`, `sessionStorage` e `cookies`, utilizando armazenamento volátil em memória (RAM).
  * Cabeçalhos globais de segurança e controle de cache estrito (`Cache-Control: no-store, no-cache`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
* **Automação de Conteúdo e Publicação**: Gerar postagens e infográficos no padrão estético da marca (paleta Neon em fundo escuro) com disparo/agendamento para LinkedIn e Instagram.
* **Módulo Professora Marketing IA**:
  * Automação na criação, edição e gestão de turmas, materiais didáticos e relatórios comparativos de desempenho das turmas.
  * Integração de temas de apresentação de slides com a Biblioteca do Planner.
* **Agentes IA Autônomos & Painel Multi-IA**:
  1. **Guardião de Segurança**: Telemetria, histórico de bloqueios, testes de vulnerabilidade em tempo real e console interativo de segurança.
  2. **Agente de Publicação IA**: Geração de legendas, hashtags estratégicas e infográficos (limite rígido de 200 tokens/post).
  3. **Agente Marketing**: Varredura e resumo de notícias e tendências em até 5 tópicos (limite de 300 tokens), salvando diretamente na Biblioteca do Planner.
  4. **Agente Debug IA**: Leitura e análise de logs de erro do sistema, geração de diagnósticos e registro automático de lista de bugs com controle de resolução.
  5. **Agente de Suporte Pedagógico**: Elaboração de planos de aula completos e estruturados em 6 blocos obrigatórios alinhados ao Ensino Técnico.
  6. **Painel Multi-IA & Orquestrador**: Controle centralizado, telemetria e histórico visual do consumo de tokens com sanitização de prompts e respostas em tempo real.
* **Métricas de Redes Sociais & Instagram Graph API**:
  * Sincronização direta dos seguidores reais do Instagram (conta `raqueldevfullstack`) gravando em `marketing_followers` e `marketing_social_accounts`.
  * Rotina de sincronização automática de 6 horas para revalidação de métricas e relatórios no Supabase.
* **Servidor MCP Serverless (v1.1.0)**: Endpoints serverless protegidos por middleware de segurança para leitura de contexto, métricas de redes sociais, histórico de logs e rotas de renovação de token no Supabase (`/mcp/context`, `/mcp/metrics`, `/mcp/renew-token`).

---

## 3. Especificações Técnicas e Arquitetura

### 3.1 Stack Tecnológico
* **Frontend**: React 19, TypeScript, Vite 6, TailwindCSS 4, Motion (Framer Motion), Lucide Icons.
* **Backend Serverless**: Vercel Serverless Functions (`/api/mcp-server.ts`) protegidas por `SecurityMiddleware`.
* **Banco de Dados & Autenticação**: Supabase (PostgreSQL 17 com Row Level Security [RLS], Triggers SQL de Auditoria, Cron Jobs de 6h e Google OAuth 2.0).
* **Provedores de IA**: Google Gemini API (`@google/genai`), OpenAI ChatGPT (`gpt-4o-mini`).
* **Segurança & Sessão**: Volatile Memory Storage (RAM), Proteções Anti-Clickjacking, Sanitização Regex Multicamada.

### 3.2 Estrutura do Banco de Dados (Supabase)
* **Segurança e Auditoria**:
  * `audit_logs`: Registro imutável de eventos de autenticação, bloqueios do Guardião, tentativas de injeção de credenciais e anomalias.
  * Políticas RLS estritas: Tabelas com RLS habilitado permitindo operações somente quando `auth.jwt() ->> 'email' = 'raquelduarteadmi@gmail.com'`.
  * Triggers SQL: Triggers preventivos que impedem a inserção de credenciais ou dados mascarados diretamente no banco.
* **Professora Marketing IA**: `professora_marketing_ia`, `professora_marketing_ia_materiais`, `professora_marketing_ia_desempenho`. Triggers automatizados para atualizações de timestamps (`updated_at`).
* **Redes Sociais & Métricas**: `marketing_social_accounts`, `marketing_followers`, `weekly_reports`.
* **Agentes Autônomos & Tokens**: `agent_statuses`, `agent_execution_logs`, `antigravity_token_meter`, `debug_ia_records`, `agent_posts`.
* **Estudos & Produtividade**: `study_plans`, `projects`, `reminders`.

### 3.3 Protocolo MCP (Model Context Protocol) v1.1.0
* **Nome do Servidor**: `PlannerDiRio_MCP`
* **Endereço Base**: `https://planner-di-rio-raquel.vercel.app/api/mcp-server`
* **Camada de Proteção**: `SecurityMiddleware` valida autorização, parâmetros e cabeçalhos de cada requisição antes de processar as ferramentas MCP.
* **Capacidades**:
  * `getMetrics`: Consulta métricas consolidadas (Alcance, Curtidas, Comentários, Leads, Taxa de Conversão).
  * `renewToken`: Integração para renovação de tokens OAuth de mídias sociais.
  * `getAgentLogs`: Consulta o histórico de execuções dos agentes autônomos e logs de auditoria.

---

## 4. Requisitos de Segurança & Governança (Guardião Global)

### 4.1 Autenticação e Restrição de Acesso
* **Login Unificado**: Exibição prioritária do botão "🔐 Entrar com Google".
* **Validação de Whitelist**: Após o evento `SIGNED_IN`, verificação compulsória do e-mail. Se `email !== 'raquelduarteadmi@gmail.com'`:
  1. Execução imediata de `supabase.auth.signOut()`.
  2. Bloqueio completo de navegação e renderização de tela de bloqueio com aviso visual de restrição.
  3. Envio de evento de log para a tabela `audit_logs` do Supabase.
* **Prevenção de Persistência Indevida**:
  * Desativação de armazenamento de credenciais em `localStorage`, `sessionStorage` e `cookies`.
  * Rotina defensiva automática na inicialização para expurgar tokens ou chaves residuais no navegador.

### 4.2 Inspeção Multicamada com Bloqueio Seletivo
* **Frontend**: Sanitização de formulários, inputs, textareas, tooltips e mensagens renderizadas.
* **Backend & MCP**: Interceptação de rotas e payloads, rejeitando requisições não autorizadas com HTTP 403 e sanitizando logs de servidor.
* **Banco de Dados (Supabase)**: O `dataService` sanitiza objetos antes de qualquer `upsert` ou `insert`.
* **IA do Orquestrador**: Inspeciona prompts e respostas antes da exibição ao usuário final, prevenindo vazamento acidental de tokens e chaves privadas.
* **Console do Guardião de Segurança**: Interface no Escritório Virtual para simular injeções, visualizar status de cada camada e acompanhar o log de auditoria em tempo real.

---

## 5. Requisitos Funcionais

### 5.1 Módulo Professora Marketing IA
* Interface dedicada para criação, edição e encerramento de turmas.
* Geração automatizada de resumos, roteiros pedagógicos e relatórios comparativos entre turmas.
* Associação com a Biblioteca do Planner para vinculação direta de temas de slides.

### 5.2 Gestão de Tokens & Painel Multi-IA
* Painel Multi-IA com histórico visual e métricas de consumo de tokens por agente em tempo real.
* Exibição do consumo semanal e mensal com alertas automáticos ao atingir 80% do limite estipulado no plano.
* Aba dedicada para o **Guardião de Segurança** com telemetria das 5 camadas ativas.

### 5.3 Supabase, Instagram Graph API & Automação Cron
* Rotina automática de 6 horas no Supabase para sincronização de seguidores e engajamento da conta `@raqueldevfullstack`.
* Revalidação e reconciliação em tempo real dos dados do Dashboard com o Supabase.
* Cron jobs SQL para renovação periódica de tokens OAuth do servidor MCP.

---

## 6. Histórico de Versões e Entregas

| Versão | Data | Principais Funcionalidades Entregues |
| :--- | :---: | :--- |
| **v1.0.0** | 2026-02 | Lançamento inicial: Dashboard, Calendário, Produtividade e Estudos. |
| **v1.1.0** | 2026-03 | Integração Supabase, Servidor MCP v1.1.0, Módulo Professora Marketing IA e Painel Multi-IA com Medidor de Tokens. |
| **v1.2.0** | 2026-10 | **Blindagem de Segurança e Guardião Global**: Restrição estrita de conta (`raquelduarteadmi@gmail.com`), RLS integral, sessão volátil em RAM, eliminação de formulários expostos, cabeçalhos de segurança anti-cache, triggers de auditoria e console interativo de segurança. |

---

## 7. Próximos Passos e Roadmap
- [x] Atualizar Servidor Serverless MCP para v1.1.0 com middleware de segurança.
- [x] Integrar tipos dos Agentes IA no `dataService.ts`.
- [x] Validar compilação TypeScript com `tsc --noEmit`.
- [x] Estrutura completa de banco de dados e triggers Supabase para o módulo Professora Marketing IA.
- [x] Automação de gestão de turmas, edição, sincronização de materiais e relatórios comparativos.
- [x] Painel Multi-IA com controle e histórico de consumo de tokens.
- [x] Rotina automática de 6h para sincronização de métricas reais do Instagram (`raqueldevfullstack`) no Supabase.
- [x] Implementação do Guardião Global de Segurança com inspeção em 5 camadas e bloqueio seletivo.
- [x] Restrição de acesso estrita ao e-mail autorizado (`raquelduarteadmi@gmail.com`) com RLS no banco de dados.
- [x] Eliminação de persistência de credenciais em cache e adoção de armazenamento volátil em RAM.
- [x] Atualização de variáveis de ambiente seguras no `.env` com proteção ativa no `.gitignore`.
- [ ] Expandir testes automatizados de integração com as APIs oficiais do LinkedIn Graph API e Instagram Graph API.
- [ ] Testes de carga e resiliência dos endpoints serverless do MCP sob picos de requisição.

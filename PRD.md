# Product Requirement Document (PRD) - Planner Diário Raquel-02

## 1. Visão Geral do Produto
O **Planner Diário Raquel-02** é um ecossistema MicroSaaS avançado voltado para a organização diária, suporte pedagógico técnico e automação de marketing digital para educadores e profissionais de marketing. O sistema integra inteligência artificial generativa, agentes autônomos, monitoramento em tempo real, gestão pedagógica de turmas e um servidor de protocolo de contexto MCP (Model Context Protocol).

---

## 2. Objetivos Principais
* **Automação de Conteúdo e Publicação**: Gerar postagens e infográficos no padrão estético da marca (paleta Neon em fundo escuro) com disparo/agendamento para LinkedIn e Instagram.
* **Módulo Professora Marketing IA**:
  * Automação na criação, edição e gestão de turmas, materiais didáticos e relatórios comparativos de desempenho das turmas.
  * Integração de temas de apresentação de slides com a Biblioteca do Planner.
* **Agentes IA Autônomos & Painel Multi-IA**:
  1. **Agente de Publicação IA**: Geração de legendas, hashtags estratégicas e infográficos (limite rígido de 200 tokens/post).
  2. **Agente Marketing**: Varredura e resumo de notícias e tendências em até 5 tópicos (limite de 300 tokens), salvando diretamente na Biblioteca do Planner.
  3. **Agente Debug IA**: Leitura e análise de logs de erro do sistema, geração de diagnósticos e registro automático de lista de bugs com controle de resolução.
  4. **Agente de Suporte Pedagógico**: Elaboração de planos de aula completos e estruturados em 6 blocos obrigatórios alinhados ao Ensino Técnico.
  5. **Painel Multi-IA**: Controle centralizado, telemetria e histórico visual do consumo de tokens em tempo real.
* **Métricas de Redes Sociais & Instagram Graph API**:
  * Sincronização direta dos seguidores reais do Instagram (conta `raqueldevfullstack`) gravando em `marketing_followers` e `marketing_social_accounts`.
  * Rotina de sincronização automática de 6 horas para revalidação de métricas e relatórios no Supabase.
* **Servidor MCP Serverless (v1.1.0)**: Disponibilizar endpoints serverless para leitura de contexto, métricas de redes sociais, histórico de logs e rotas OAuth de renovação de token no Supabase (`/mcp/context`, `/mcp/metrics`, `/mcp/renew-token`).

---

## 3. Especificações Técnicas e Arquitetura

### 3.1 Stack Tecnológico
* **Frontend**: React 19, TypeScript, Vite 6, TailwindCSS 4, Motion (Framer Motion).
* **Backend Serverless**: Vercel Serverless Functions (`/api/mcp-server.ts`).
* **Banco de Dados & Autenticação**: Supabase (PostgreSQL com RLS, Triggers SQL, Cron Jobs de 6h e OAuth 2.0).
* **Provedores de IA**: Google Gemini API (`@google/genai`), OpenAI ChatGPT (`gpt-4o-mini`).

### 3.2 Estrutura do Banco de Dados (Supabase)
* **Professora Marketing IA**: `professora_marketing_ia`, `professora_marketing_ia_materiais`, `professora_marketing_ia_desempenho`. Triggers automatizados para atualizações de timestamps (`updated_at`) e políticas RLS de usuário (`auth.uid()`).
* **Redes Sociais & Métricas**: `marketing_social_accounts`, `marketing_followers`, `weekly_reports`.
* **Agentes Autônomos & Tokens**: `agent_statuses`, `agent_execution_logs`, `antigravity_token_meter`, `debug_ia_records`, `agent_posts`.

### 3.3 Protocolo MCP (Model Context Protocol) v1.1.0
* **Nome do Servidor**: `PlannerDiRio_MCP`
* **Endereço Base**: `https://planner-di-rio-raquel.vercel.app/api/mcp-server`
* **Capacidades**:
  * `getMetrics`: Consulta métricas consolidadas (Alcance, Curtidas, Comentários, Leads, Taxa de Conversão).
  * `renewToken`: Integração para renovação de tokens OAuth de mídias sociais.
  * `getAgentLogs`: Consulta o histórico de execuções dos agentes autônomos.

---

## 4. Requisitos Funcionais

### 4.1 Módulo Professora Marketing IA
* Interface dedicada para criação, edição e encerramento de turmas.
* Geração automatizada de resumos, roteiros pedagógicos e relatórios comparativos entre turmas.
* Associação com a Biblioteca do Planner para vinculação direta de temas de slides.

### 4.2 Gestão de Tokens & Painel Multi-IA
* Painel Multi-IA com histórico visual e métricas de consumo de tokens por agente em tempo real.
* Exibição do consumo semanal e mensal com alertas automáticos ao atingir 80% do limite estipulado no plano.

### 4.3 Supabase, Instagram Graph API & Automação Cron
* Rotina automática de 6 horas no Supabase para sincronização de seguidores e engajamento da conta `@raqueldevfullstack`.
* Revalidação e reconciliação em tempo real dos dados do Dashboard com o Supabase.
* Cron jobs SQL para renovação periódica de tokens OAuth do servidor MCP.

---

## 5. Próximos Passos e Roadmap
- [x] Atualizar Servidor Serverless MCP para v1.1.0.
- [x] Integrar tipos dos Agentes IA no `dataService.ts`.
- [x] Validar compilação TypeScript com `tsc --noEmit`.
- [x] Estrutura completa de banco de dados e triggers Supabase para o módulo Professora Marketing IA.
- [x] Automação de gestão de turmas, edição, sincronização de materiais e relatórios comparativos.
- [x] Painel Multi-IA com controle e histórico de consumo de tokens.
- [x] Rotina automática de 6h para sincronização de métricas reais do Instagram (`raqueldevfullstack`) no Supabase.
- [ ] Expandir testes automatizados de integração com as APIs oficiais do LinkedIn Graph API e Instagram Graph API.


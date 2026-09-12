# Product Requirement Document (PRD) - Planner Diário Raquel-02

## 1. Visão Geral do Produto
O **Planner Diário Raquel-02** é um ecossistema MicroSaaS avançado voltado para a organização diária, suporte pedagógico técnico e automação de marketing digital para educadores e profissionais de marketing. O sistema integra inteligência artificial generativa, agentes autônomos, monitoramento em tempo real e um servidor de protocolo de contexto MCP (Model Context Protocol).

---

## 2. Objetivos Principais
* **Automação de Conteúdo e Publicação**: Gerar postagens e infográficos no padrão estético da marca (paleta Neon em fundo escuro) com disparo/agendamento para LinkedIn e Instagram.
* **Agentes IA Autônomos**:
  1. **Agente de Publicação IA**: Geração de legendas, hashtags estratégicas e infográficos (limite rígido de 200 tokens/post).
  2. **Agente Marketing**: Varredura e resumo de notícias e tendências em até 5 tópicos (limite de 300 tokens), salvando diretamente na Biblioteca do Planner.
  3. **Agente Debug IA**: Leitura e análise de logs de erro do sistema, geração de diagnósticos e registro automático de lista de bugs com controle de resolução.
  4. **Agente de Suporte Pedagógico**: Elaboração de planos de aula completos e estruturados em 6 blocos obrigatórios alinhados ao Ensino Técnico.
* **Servidor MCP Serverless (v1.1.0)**: Disponibilizar endpoints serverless para leitura de contexto, métricas de redes sociais, histórico de logs e rotas OAuth de renovação de token no Supabase (`/mcp/context`, `/mcp/metrics`, `/mcp/renew-token`).

---

## 3. Especificações Técnicas e Arquitetura

### 3.1 Stack Tecnológico
* **Frontend**: React 19, TypeScript, Vite 6, TailwindCSS 4, Motion (Framer Motion).
* **Backend Serverless**: Vercel Serverless Functions (`/api/mcp-server.ts`).
* **Banco de Dados & Autenticação**: Supabase (PostgreSQL, Cron Jobs SQL e OAuth 2.0).
* **Provedores de IA**: Google Gemini API (`@google/genai`), OpenAI ChatGPT (`gpt-4o-mini`).

### 3.2 Protocolo MCP (Model Context Protocol) v1.1.0
* **Nome do Servidor**: `PlannerDiRio_MCP`
* **Endereço Base**: `https://planner-di-rio-raquel.vercel.app/api/mcp-server`
* **Capacidades**:
  * `getMetrics`: Consulta métricas consolidadas (Alcance, Curtidas, Comentários, Leads, Taxa de Conversão).
  * `renewToken`: Integração para renovação de tokens OAuth de mídias sociais.
  * `getAgentLogs`: Consulta o histórico de execuções dos agentes autônomos.

---

## 4. Requisitos Funcionais

### 4.1 Gestão de Tokens & Medidor Google Antigravity
* Exibição visual do consumo semanal e mensal de tokens em tempo real.
* Alertas automáticos ao atingir 80% do limite mensal estipulado no plano.
* Distribuição de consumo discriminada por agente autônomo.

### 4.2 Supabase & Automação Cron
* Cron jobs agendados no Supabase SQL para renovação periódica de tokens OAuth do servidor MCP.
* Tabelas de persistência: `agent_statuses`, `agent_execution_logs`, `antigravity_token_meter`, `debug_ia_records`, `agent_posts`, `weekly_reports`.

---

## 5. Próximos Passos e Roadmap
- [x] Atualizar Servidor Serverless MCP para v1.1.0.
- [x] Integrar tipos dos Agentes IA no `dataService.ts`.
- [x] Validar compilação TypeScript com `tsc --noEmit`.
- [ ] Expandir testes automatizados de integração com as APIs oficiais do LinkedIn Graph API e Instagram Graph API.

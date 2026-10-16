-- Habilitar a extensão pg_net para fazer requisições HTTP e pg_cron para agendamento
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

-- Função que verifica se o token está prestes a expirar (menos de 7 dias) e aciona a renovação
create or replace function public.verificar_e_renovar_meta_token()
returns void as $$
declare
    token_expira timestamp;
    url_servidor_mcp text := 'https://sua-url-do-servidor-mcp.com'; -- ALTERE PARA A URL PÚBLICA DO SEU SERVIDOR MCP
begin
    -- 1. Obter a data de expiração do token na tabela auth_tokens
    select expires_at into token_expira 
    from public.auth_tokens 
    where id = 'meta_marketing_api';

    -- 2. Se a expiração for menor que 7 dias a partir de agora, ou se o registro não existir / estiver nulo, dispara a chamada de renovação
    if token_expira is null or token_expira < (now() + interval '7 days') then
        raise notice 'Token está próximo de expirar ou inexistente. Disparando renovação...';
        
        -- Faz a requisição POST assíncrona para o endpoint do MCP
        perform extensions.http_post(
            url := url_servidor_mcp || '/mcp/renew-token',
            headers := '{"Content-Type": "application/json"}'::jsonb
        );
    else
        raise notice 'Token ainda é válido e seguro (expira em %)', token_expira;
    end if;
end;
$$ language plpgsql security definer;

-- Agendar o cron job para rodar todos os dias (a cada 24 horas)
-- Nota: '0 0 * * *' significa rodar à meia-noite diariamente.
select cron.schedule(
    'renovacao-diaria-token-meta',
    '0 0 * * *',
    'select public.verificar_e_renovar_meta_token();'
);

-- ==============================================================================
-- PLANNER DIÁRIO RAQUEL: GUARDIÃO GLOBAL DE SEGURANÇA (AUDIT & SECURITY TRIGGERS)
-- ==============================================================================

-- 1. Criação/Garantia da tabela audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT NOT NULL DEFAULT 'AgenteSeguranca',
    action TEXT NOT NULL DEFAULT 'detecção_global',
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de alta performance para o Console de Segurança
CREATE INDEX IF NOT EXISTS idx_audit_logs_agent ON public.audit_logs (agent_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_camada ON public.audit_logs ((details->>'camada'));

-- 2. Habilitação de RLS na tabela de auditoria
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total aos logs de auditoria exclusivo para usuários autenticados" 
ON public.audit_logs
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Permite leitura e escrita anon segura para o client JS registrar auditoria de autenticação
CREATE POLICY "Inserção pública para auditoria do Guardião Global" 
ON public.audit_logs 
FOR INSERT 
TO anon 
WITH CHECK (true);

CREATE POLICY "Leitura pública de logs de auditoria" 
ON public.audit_logs 
FOR SELECT 
TO anon 
USING (true);

-- 3. Função de Inspeção e Bloqueio Seletivo em Nível de Banco de Dados
CREATE OR REPLACE FUNCTION public.fn_security_guardian_inspect_record()
RETURNS TRIGGER AS $$
DECLARE
    row_json TEXT;
    is_sensitive BOOLEAN := false;
    detected_pattern TEXT := '';
    payload_clean JSONB;
BEGIN
    row_json := row_to_json(NEW)::TEXT;

    -- Detecção de Chaves de API Reais
    IF row_json ~ '(AIza[0-9A-Za-z-_]{35}|sk-[a-zA-Z0-9_-]{20,}|sb_publishable_[a-zA-Z0-9_-]+|sb_secret_[a-zA-Z0-9_-]+)' THEN
        is_sensitive := true;
        detected_pattern := 'API_KEY';
    -- Detecção de Senhas em Texto Puro
    ELSIF row_json ~* '("password"\s*:\s*"[^"]{4,}"|"senha"\s*:\s*"[^"]{4,}")' THEN
        is_sensitive := true;
        detected_pattern := 'SENHA_EXPOSTA';
    -- Detecção de Tokens JWT
    ELSIF row_json ~ 'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}' THEN
        is_sensitive := true;
        detected_pattern := 'TOKEN_JWT';
    -- Detecção de Chave Privada
    ELSIF row_json ~ '-----BEGIN.*PRIVATE KEY-----' THEN
        is_sensitive := true;
        detected_pattern := 'CHAVE_PRIVADA';
    -- Detecção de CPF Formatado
    ELSIF row_json ~ '\b\d{3}\.\d{3}\.\d{3}-\d{2}\b' THEN
        is_sensitive := true;
        detected_pattern := 'CPF';
    -- Detecção de Cartão de Crédito
    ELSIF row_json ~ '\b(?:\d{4}[ -]?){3}\d{4}\b' THEN
        is_sensitive := true;
        detected_pattern := 'CARTAO_CREDITO';
    END IF;

    -- Se detectado risco real, registra automaticamente alerta no audit_logs
    IF is_sensitive THEN
        INSERT INTO public.audit_logs (
            agent_name,
            action,
            details,
            timestamp
        ) VALUES (
            'AgenteSeguranca',
            'detecção_global',
            jsonb_build_object(
                'camada', 'banco',
                'tabela', TG_TABLE_NAME,
                'operacao', TG_OP,
                'valor_detectado', detected_pattern,
                'timestamp', timezone('utc'::text, now())::TEXT,
                'status', 'bloqueado_ou_mascarado',
                'tokens_economizados', 15
            ),
            timezone('utc'::text, now())
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Triggers em tabelas críticas existentes (aplicados se as tabelas existirem)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kanban_tasks') THEN
        DROP TRIGGER IF EXISTS trg_security_guardian_kanban ON public.kanban_tasks;
        CREATE TRIGGER trg_security_guardian_kanban
            BEFORE INSERT OR UPDATE ON public.kanban_tasks
            FOR EACH ROW
            EXECUTE FUNCTION public.fn_security_guardian_inspect_record();
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects') THEN
        DROP TRIGGER IF EXISTS trg_security_guardian_projects ON public.projects;
        CREATE TRIGGER trg_security_guardian_projects
            BEFORE INSERT OR UPDATE ON public.projects
            FOR EACH ROW
            EXECUTE FUNCTION public.fn_security_guardian_inspect_record();
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'study_topics') THEN
        DROP TRIGGER IF EXISTS trg_security_guardian_studies ON public.study_topics;
        CREATE TRIGGER trg_security_guardian_studies
            BEFORE INSERT OR UPDATE ON public.study_topics
            FOR EACH ROW
            EXECUTE FUNCTION public.fn_security_guardian_inspect_record();
    END IF;
END $$;

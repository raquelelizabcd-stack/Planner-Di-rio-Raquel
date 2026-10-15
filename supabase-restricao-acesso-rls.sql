-- ==============================================================================
-- PLANNER DIÁRIO RAQUEL: RLS RESTRITO À CONTA raquelduarteadmi@gmail.com
-- Execute no SQL Editor do Supabase (depois de supabase-security-guardian-triggers.sql).
-- ATENÇÃO: remove TODAS as políticas existentes no schema public e recria só as abaixo.
-- Qualquer outra conta (mesmo autenticada via Google) fica sem acesso aos dados.
-- ==============================================================================

DO $$
DECLARE
    t RECORD;
    p RECORD;
    admin_email CONSTANT TEXT := 'raquelduarteadmi@gmail.com';
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        -- 1. Ativa RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);

        -- 2. Remove políticas anteriores (inclui as permissivas de anon)
        FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t.tablename);
        END LOOP;

        -- 3. SELECT / INSERT / UPDATE / DELETE somente para o e-mail autorizado
        EXECUTE format(
            'CREATE POLICY "admin_select" ON public.%I FOR SELECT TO authenticated USING (auth.email() = %L)',
            t.tablename, admin_email);
        EXECUTE format(
            'CREATE POLICY "admin_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.email() = %L)',
            t.tablename, admin_email);
        EXECUTE format(
            'CREATE POLICY "admin_update" ON public.%I FOR UPDATE TO authenticated USING (auth.email() = %L) WITH CHECK (auth.email() = %L)',
            t.tablename, admin_email, admin_email);
        EXECUTE format(
            'CREATE POLICY "admin_delete" ON public.%I FOR DELETE TO authenticated USING (auth.email() = %L)',
            t.tablename, admin_email);
    END LOOP;
END $$;

-- 4. Exceção única: audit_logs aceita INSERT de qualquer usuário autenticado, para que o
--    Guardião registre "login_bloqueado" de contas não autorizadas ANTES do signOut.
--    A LEITURA continua exclusiva do administrador (política admin_select acima).
CREATE POLICY "auditoria_login_bloqueado_insert"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (action = 'login_bloqueado' AND agent_name = 'AgenteSeguranca');

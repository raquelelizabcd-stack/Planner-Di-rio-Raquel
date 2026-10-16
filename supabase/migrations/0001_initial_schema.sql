-- ==============================================================================
-- ESTRUTURA COMPLETA DE BANCO DE DADOS SUPABASE: PROFESSORA MARKETING IA
-- ==============================================================================

-- 1. TABELA PRINCIPAL: professora_marketing_ia
CREATE TABLE IF NOT EXISTS public.professora_marketing_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    nome_turma TEXT NOT NULL,
    modulo TEXT,
    periodo TEXT,
    descricao TEXT,
    status TEXT NOT NULL DEFAULT 'Ativa',
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
    ultima_atualizacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.professora_marketing_ia ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para professora_marketing_ia
DROP POLICY IF EXISTS "Permitir tudo para dono da turma em professora_marketing_ia" ON public.professora_marketing_ia;

CREATE POLICY "Permitir tudo para dono da turma em professora_marketing_ia"
    ON public.professora_marketing_ia
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 2. TABELA COMPLEMENTAR: professora_marketing_ia_materiais
CREATE TABLE IF NOT EXISTS public.professora_marketing_ia_materiais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turma_id UUID NOT NULL REFERENCES public.professora_marketing_ia(id) ON DELETE CASCADE,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'resumo', -- ex.: resumo, guia, estrutura
    conteudo TEXT,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.professora_marketing_ia_materiais ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para professora_marketing_ia_materiais
DROP POLICY IF EXISTS "Permitir tudo para dono da turma em materiais" ON public.professora_marketing_ia_materiais;

CREATE POLICY "Permitir tudo para dono da turma em materiais"
    ON public.professora_marketing_ia_materiais
    FOR ALL
    USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.professora_marketing_ia t
            WHERE t.id = professora_marketing_ia_materiais.turma_id
            AND t.user_id = auth.uid()
        )
    )
    WITH CHECK (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.professora_marketing_ia t
            WHERE t.id = professora_marketing_ia_materiais.turma_id
            AND t.user_id = auth.uid()
        )
    );


-- 3. TABELA COMPLEMENTAR: professora_marketing_ia_slides
CREATE TABLE IF NOT EXISTS public.professora_marketing_ia_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turma_id UUID NOT NULL REFERENCES public.professora_marketing_ia(id) ON DELETE CASCADE,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    tema TEXT NOT NULL,
    quantidade_slides INTEGER NOT NULL DEFAULT 5,
    conteudo_gerado TEXT,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.professora_marketing_ia_slides ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para professora_marketing_ia_slides
DROP POLICY IF EXISTS "Permitir tudo para dono da turma em slides" ON public.professora_marketing_ia_slides;

CREATE POLICY "Permitir tudo para dono da turma em slides"
    ON public.professora_marketing_ia_slides
    FOR ALL
    USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.professora_marketing_ia t
            WHERE t.id = professora_marketing_ia_slides.turma_id
            AND t.user_id = auth.uid()
        )
    )
    WITH CHECK (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.professora_marketing_ia t
            WHERE t.id = professora_marketing_ia_slides.turma_id
            AND t.user_id = auth.uid()
        )
    );


-- 4. TABELA DE RELACIONAMENTO: professora_marketing_ia_relatorios
CREATE TABLE IF NOT EXISTS public.professora_marketing_ia_relatorios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turma_id UUID NOT NULL REFERENCES public.professora_marketing_ia(id) ON DELETE CASCADE,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    tipo_relatorio TEXT NOT NULL DEFAULT 'desempenho', -- ex.: desempenho, comparativo
    dados_relatorio JSONB NOT NULL DEFAULT '{}'::jsonb,
    data_geracao TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.professora_marketing_ia_relatorios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para professora_marketing_ia_relatorios
DROP POLICY IF EXISTS "Permitir tudo para dono da turma em relatorios" ON public.professora_marketing_ia_relatorios;

CREATE POLICY "Permitir tudo para dono da turma em relatorios"
    ON public.professora_marketing_ia_relatorios
    FOR ALL
    USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.professora_marketing_ia t
            WHERE t.id = professora_marketing_ia_relatorios.turma_id
            AND t.user_id = auth.uid()
        )
    )
    WITH CHECK (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.professora_marketing_ia t
            WHERE t.id = professora_marketing_ia_relatorios.turma_id
            AND t.user_id = auth.uid()
        )
    );


-- ==============================================================================
-- TRIGGERS DE ATUALIZAÇÃO AUTOMÁTICA DE TIMESTAMPS
-- ==============================================================================

-- 1. Trigger para professora_marketing_ia
CREATE OR REPLACE FUNCTION update_timestamp_professora_marketing_ia()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ultima_atualizacao = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_timestamp_professora_marketing_ia ON public.professora_marketing_ia;

CREATE TRIGGER update_timestamp_professora_marketing_ia
BEFORE UPDATE ON public.professora_marketing_ia
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_professora_marketing_ia();


-- 2. Trigger para professora_marketing_ia_materiais
CREATE OR REPLACE FUNCTION update_timestamp_professora_marketing_ia_materiais()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_criacao = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_timestamp_professora_marketing_ia_materiais ON public.professora_marketing_ia_materiais;

CREATE TRIGGER update_timestamp_professora_marketing_ia_materiais
BEFORE UPDATE ON public.professora_marketing_ia_materiais
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_professora_marketing_ia_materiais();


-- 3. Trigger para professora_marketing_ia_slides
CREATE OR REPLACE FUNCTION update_timestamp_professora_marketing_ia_slides()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_criacao = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_timestamp_professora_marketing_ia_slides ON public.professora_marketing_ia_slides;

CREATE TRIGGER update_timestamp_professora_marketing_ia_slides
BEFORE UPDATE ON public.professora_marketing_ia_slides
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_professora_marketing_ia_slides();


-- 4. Trigger para professora_marketing_ia_relatorios
CREATE OR REPLACE FUNCTION update_timestamp_professora_marketing_ia_relatorios()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_geracao = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_timestamp_professora_marketing_ia_relatorios ON public.professora_marketing_ia_relatorios;

CREATE TRIGGER update_timestamp_professora_marketing_ia_relatorios
BEFORE UPDATE ON public.professora_marketing_ia_relatorios
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_professora_marketing_ia_relatorios();


-- ==============================================================================
-- FUNÇÃO DE AUTOMAÇÃO E SINCRONIZAÇÃO AO CRIAR NOVA TURMA
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.criar_turma_completa_professora(
    p_nome_turma TEXT,
    p_modulo TEXT,
    p_periodo TEXT,
    p_descricao TEXT,
    p_status TEXT DEFAULT 'Ativa'
)
RETURNS UUID AS $$
DECLARE
    v_turma_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- 1. Criar Turma Principal
    INSERT INTO public.professora_marketing_ia (
        user_id, nome_turma, modulo, periodo, descricao, status
    ) VALUES (
        v_user_id, p_nome_turma, p_modulo, p_periodo, p_descricao, COALESCE(p_status, 'Ativa')
    )
    RETURNING id INTO v_turma_id;

    -- 2. Gerar Material Didático Inicial Vinculado
    INSERT INTO public.professora_marketing_ia_materiais (
        turma_id, user_id, titulo, tipo, conteudo
    ) VALUES (
        v_turma_id, v_user_id, 
        'Guia Didático Inicial - ' || p_nome_turma, 
        'resumo', 
        'Conteúdo base e plano didático gerado automaticamente para o módulo: ' || COALESCE(p_modulo, 'Geral')
    );

    -- 3. Gerar Apresentação de Slides Inicial Vinculada
    INSERT INTO public.professora_marketing_ia_slides (
        turma_id, user_id, tema, quantidade_slides, conteudo_gerado
    ) VALUES (
        v_turma_id, v_user_id, 
        'Introdução ao Módulo: ' || COALESCE(p_modulo, p_nome_turma), 
        5, 
        'Slide 1: Boas-vindas\nSlide 2: Objetivos de Aprendizagem\nSlide 3: Cronograma\nSlide 4: Projeto Prático\nSlide 5: Avaliação'
    );

    -- 4. Gerar Relatório de Desempenho Inicial Vinculado
    INSERT INTO public.professora_marketing_ia_relatorios (
        turma_id, user_id, tipo_relatorio, dados_relatorio
    ) VALUES (
        v_turma_id, v_user_id, 
        'desempenho', 
        jsonb_build_object(
            'progressoMedioAlunos', 0,
            'aulasConcluidas', 0,
            'aulasPendentes', 10,
            'taxaConclusaoProjetos', 0
        )
    );

    RETURN v_turma_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

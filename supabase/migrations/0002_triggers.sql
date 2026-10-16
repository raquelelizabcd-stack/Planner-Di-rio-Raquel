-- ==============================================================================
-- TRIGGERS DE ATUALIZAÇÃO AUTOMÁTICA DE TIMESTAMPS: PROFESSORA MARKETING IA
-- ==============================================================================

-- 1. Trigger para a tabela professora_marketing_ia
-- Atualiza o campo 'ultima_atualizacao' para o momento atual (now())
CREATE OR REPLACE FUNCTION update_timestamp_professora_marketing_ia()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ultima_atualizacao = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_timestamp_professora_marketing_ia ON professora_marketing_ia;

CREATE TRIGGER update_timestamp_professora_marketing_ia
BEFORE UPDATE ON professora_marketing_ia
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_professora_marketing_ia();


-- 2. Trigger para a tabela professora_marketing_ia_materiais
-- Atualiza o campo 'data_criacao' para o momento atual (now()) em caso de edição
CREATE OR REPLACE FUNCTION update_timestamp_professora_marketing_ia_materiais()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_criacao = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_timestamp_professora_marketing_ia_materiais ON professora_marketing_ia_materiais;

CREATE TRIGGER update_timestamp_professora_marketing_ia_materiais
BEFORE UPDATE ON professora_marketing_ia_materiais
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_professora_marketing_ia_materiais();


-- 3. Trigger para a tabela professora_marketing_ia_slides
-- Atualiza o campo 'data_criacao' para o momento atual (now()) em caso de edição
CREATE OR REPLACE FUNCTION update_timestamp_professora_marketing_ia_slides()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_criacao = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_timestamp_professora_marketing_ia_slides ON professora_marketing_ia_slides;

CREATE TRIGGER update_timestamp_professora_marketing_ia_slides
BEFORE UPDATE ON professora_marketing_ia_slides
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_professora_marketing_ia_slides();


-- 4. Trigger para a tabela professora_marketing_ia_relatorios
-- Atualiza o campo 'data_geracao' para o momento atual (now()) em caso de edição
CREATE OR REPLACE FUNCTION update_timestamp_professora_marketing_ia_relatorios()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_geracao = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_timestamp_professora_marketing_ia_relatorios ON professora_marketing_ia_relatorios;

CREATE TRIGGER update_timestamp_professora_marketing_ia_relatorios
BEFORE UPDATE ON professora_marketing_ia_relatorios
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_professora_marketing_ia_relatorios();

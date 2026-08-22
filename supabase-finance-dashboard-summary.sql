-- Migration para a View finance_dashboard_summary do Fluxo de Caixa Projetado
-- Executar este script no SQL Editor do Supabase

CREATE OR REPLACE VIEW public.finance_dashboard_summary AS
WITH meses AS (
  SELECT generate_series(1, 12) AS mes
),
dados_mensais AS (
  SELECT
    date_part('year', "dueDate"::date) AS ano,
    date_part('month', "dueDate"::date) AS mes,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS entradas,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS saidas,
    SUM(CASE WHEN status = 'A Vencer' THEN amount ELSE 0 END) AS a_vencer,
    SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS saldo
  FROM public.transactions
  WHERE date_part('year', "dueDate"::date) = date_part('year', CURRENT_DATE)
  GROUP BY ano, mes
)
SELECT
  meses.mes,
  COALESCE(dados_mensais.entradas, 0) AS entradas,
  COALESCE(dados_mensais.saidas, 0) AS saidas,
  COALESCE(dados_mensais.a_vencer, 0) AS a_vencer,
  COALESCE(dados_mensais.saldo, 0) AS saldo
FROM meses
LEFT JOIN dados_mensais ON meses.mes = dados_mensais.mes
ORDER BY meses.mes;

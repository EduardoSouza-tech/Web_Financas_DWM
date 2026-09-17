-- ============================================
-- MIGRAÇÃO 003 - RENDA ESPERADA POR PERFIL
-- ============================================
-- Renda mensal esperada de cada perfil da família, usada nas previsões.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS expected_income DECIMAL(10, 2);

-- Aproveita a renda que já estava cadastrada na conta para o primeiro perfil
UPDATE public.profiles p
SET expected_income = u.monthly_income
FROM public.users u
WHERE p.user_id = u.id
  AND p.position = 0
  AND p.expected_income IS NULL
  AND u.monthly_income > 0;

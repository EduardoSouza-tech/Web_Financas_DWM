-- ============================================
-- MIGRAÇÃO 006 - FOTO DE PERFIL
-- ============================================
-- Foto de cada perfil da família, já reduzida no navegador (256x256) e guardada como data URL.
-- Fica protegida pelas mesmas regras (RLS) da tabela profiles: só a própria conta enxerga.
-- Ordem: ... 005_debt_payments.sql -> este arquivo. Pode ser executado mais de uma vez. Não apaga dados.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_image TEXT;

-- Aceita só imagem em data URL e limita o tamanho (~150 KB), para a lista de perfis continuar leve
DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_avatar_image_check
    CHECK (avatar_image IS NULL OR (avatar_image LIKE 'data:image/%' AND length(avatar_image) <= 200000));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- MIGRAÇÃO 002 - PERFIS DA FAMÍLIA
-- ============================================
-- Cada conta (auth.users / public.users) pode ter vários perfis.
-- Transações, dívidas, conquistas e categorias passam a pertencer a um perfil.
-- Ordem: 1) schema.sql  2) este arquivo  3) 003_expected_income.sql
-- Pode ser executado mais de uma vez.

-- ============================================
-- TABELA: profiles
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  avatar_color TEXT NOT NULL DEFAULT '#8b5cf6',
  avatar_emoji TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profiles" ON public.profiles;
CREATE POLICY "Users can view own profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profiles" ON public.profiles;
CREATE POLICY "Users can insert own profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profiles" ON public.profiles;
CREATE POLICY "Users can update own profiles"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own profiles" ON public.profiles;
CREATE POLICY "Users can delete own profiles"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COLUNA profile_id NAS TABELAS DE DADOS
-- ============================================
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.debts        ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.categories   ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_transactions_profile_id ON public.transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_debts_profile_id        ON public.debts(profile_id);
CREATE INDEX IF NOT EXISTS idx_achievements_profile_id ON public.achievements(profile_id);
CREATE INDEX IF NOT EXISTS idx_categories_profile_id   ON public.categories(profile_id);

-- ============================================
-- BACKFILL: um perfil para cada usuário existente
-- ============================================
-- Contas criadas antes do schema.sql não têm linha em public.users
INSERT INTO public.users (id, email, name)
SELECT a.id, a.email, COALESCE(a.raw_user_meta_data->>'name', 'Usuário')
FROM auth.users a
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = a.id);

INSERT INTO public.profiles (user_id, name, position)
SELECT u.id, u.name, 0
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = u.id);

UPDATE public.transactions t SET profile_id = p.id
FROM public.profiles p WHERE p.user_id = t.user_id AND p.position = 0 AND t.profile_id IS NULL;

UPDATE public.debts d SET profile_id = p.id
FROM public.profiles p WHERE p.user_id = d.user_id AND p.position = 0 AND d.profile_id IS NULL;

UPDATE public.achievements a SET profile_id = p.id
FROM public.profiles p WHERE p.user_id = a.user_id AND p.position = 0 AND a.profile_id IS NULL;

UPDATE public.categories c SET profile_id = p.id
FROM public.profiles p WHERE p.user_id = c.user_id AND p.position = 0 AND c.profile_id IS NULL;

ALTER TABLE public.transactions ALTER COLUMN profile_id SET NOT NULL;
ALTER TABLE public.debts        ALTER COLUMN profile_id SET NOT NULL;
ALTER TABLE public.achievements ALTER COLUMN profile_id SET NOT NULL;
-- categories.profile_id fica opcional: NULL = categoria compartilhada pela família

-- ============================================
-- GARANTIR QUE O PERFIL É DO MESMO USUÁRIO
-- (impede gravar dados num perfil de outra conta)
-- ============================================
CREATE OR REPLACE FUNCTION public.check_profile_owner()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.profile_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = NEW.profile_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Perfil não pertence a este usuário';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_transactions_profile ON public.transactions;
CREATE TRIGGER check_transactions_profile BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.check_profile_owner();
DROP TRIGGER IF EXISTS check_debts_profile ON public.debts;
CREATE TRIGGER check_debts_profile BEFORE INSERT OR UPDATE ON public.debts
  FOR EACH ROW EXECUTE FUNCTION public.check_profile_owner();
DROP TRIGGER IF EXISTS check_achievements_profile ON public.achievements;
CREATE TRIGGER check_achievements_profile BEFORE INSERT OR UPDATE ON public.achievements
  FOR EACH ROW EXECUTE FUNCTION public.check_profile_owner();
DROP TRIGGER IF EXISTS check_categories_profile ON public.categories;
CREATE TRIGGER check_categories_profile BEFORE INSERT OR UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.check_profile_owner();

-- ============================================
-- NOVO USUÁRIO: criar também o primeiro perfil
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT := COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário');
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, user_name);

  INSERT INTO public.profiles (user_id, name, position)
  VALUES (NEW.id, user_name, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

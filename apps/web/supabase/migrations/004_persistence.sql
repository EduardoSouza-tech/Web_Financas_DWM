-- ============================================
-- MIGRAÇÃO 004 - SALVAR TODOS OS DADOS DO SISTEMA
-- ============================================
-- Cartões, compras parceladas, assinaturas, metas (com aportes) e conciliação de faturas.
-- Ordem: schema.sql -> 002_profiles.sql -> 003_expected_income.sql -> este arquivo.
-- Pode ser executado mais de uma vez. Não apaga dados.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TRANSAÇÕES: forma de pagamento e parcelas
-- ============================================
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash';
-- Sem chave estrangeira de propósito: excluir o cartão não pode apagar nem "desligar" as compras
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS card_id UUID;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS installments INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS first_installment INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS first_invoice_month TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.transactions ALTER COLUMN amount TYPE DECIMAL(12, 2);

DO $$ BEGIN
  ALTER TABLE public.transactions ADD CONSTRAINT transactions_payment_method_check
    CHECK (payment_method IN ('cash', 'credit_card'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.transactions ADD CONSTRAINT transactions_installments_check
    CHECK (installments >= 1 AND first_installment >= 1 AND first_installment <= installments);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- FUNÇÃO AUXILIAR: RLS + dono do perfil + updated_at numa tabela
-- ============================================
CREATE OR REPLACE FUNCTION public.setup_profile_table(tbl TEXT, has_updated_at BOOLEAN)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

  EXECUTE format('DROP POLICY IF EXISTS "Users can view own %1$s" ON public.%1$I', tbl);
  EXECUTE format('CREATE POLICY "Users can view own %1$s" ON public.%1$I FOR SELECT USING (auth.uid() = user_id)', tbl);
  EXECUTE format('DROP POLICY IF EXISTS "Users can insert own %1$s" ON public.%1$I', tbl);
  EXECUTE format('CREATE POLICY "Users can insert own %1$s" ON public.%1$I FOR INSERT WITH CHECK (auth.uid() = user_id)', tbl);
  EXECUTE format('DROP POLICY IF EXISTS "Users can update own %1$s" ON public.%1$I', tbl);
  EXECUTE format('CREATE POLICY "Users can update own %1$s" ON public.%1$I FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', tbl);
  EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %1$s" ON public.%1$I', tbl);
  EXECUTE format('CREATE POLICY "Users can delete own %1$s" ON public.%1$I FOR DELETE USING (auth.uid() = user_id)', tbl);

  EXECUTE format('DROP TRIGGER IF EXISTS check_%1$s_profile ON public.%1$I', tbl);
  EXECUTE format('CREATE TRIGGER check_%1$s_profile BEFORE INSERT OR UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.check_profile_owner()', tbl);

  IF has_updated_at THEN
    EXECUTE format('DROP TRIGGER IF EXISTS update_%1$s_updated_at ON public.%1$I', tbl);
    EXECUTE format('CREATE TRIGGER update_%1$s_updated_at BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', tbl);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CARTÕES
-- ============================================
CREATE TABLE IF NOT EXISTS public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT 'visa',
  credit_limit DECIMAL(12, 2) NOT NULL DEFAULT 0,
  closing_day INTEGER NOT NULL DEFAULT 5 CHECK (closing_day BETWEEN 1 AND 31),
  due_day INTEGER NOT NULL DEFAULT 15 CHECK (due_day BETWEEN 1 AND 31),
  last_four_digits TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
SELECT public.setup_profile_table('cards', TRUE);

-- ============================================
-- ASSINATURAS
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'yearly')),
  billing_day INTEGER NOT NULL CHECK (billing_day BETWEEN 1 AND 31),
  billing_month INTEGER CHECK (billing_month BETWEEN 1 AND 12),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'credit_card')),
  card_id UUID,
  icon TEXT NOT NULL DEFAULT '📱',
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'cancelled')),
  -- [{ "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" | null }]: cobra só dentro dos períodos
  periods JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
SELECT public.setup_profile_table('subscriptions', TRUE);

-- ============================================
-- METAS E APORTES
-- ============================================
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🎯',
  type TEXT NOT NULL DEFAULT 'other',
  target_amount DECIMAL(12, 2) NOT NULL CHECK (target_amount > 0),
  initial_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  deadline DATE NOT NULL,
  monthly_contribution DECIMAL(12, 2) NOT NULL DEFAULT 0,
  auto_contribute BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
SELECT public.setup_profile_table('goals', TRUE);

CREATE TABLE IF NOT EXISTS public.goal_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal_id ON public.goal_contributions(goal_id);
SELECT public.setup_profile_table('goal_contributions', FALSE);

-- ============================================
-- CONCILIAÇÃO DE FATURAS
-- ============================================
CREATE TABLE IF NOT EXISTS public.card_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  card_id UUID NOT NULL,
  month TEXT NOT NULL, -- YYYY-MM (mês do fechamento)
  checked TEXT[] NOT NULL DEFAULT '{}', -- parcelas conferidas
  statement_amount DECIMAL(12, 2),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (profile_id, card_id, month)
);
CREATE INDEX IF NOT EXISTS idx_card_invoices_user_id ON public.card_invoices(user_id);
SELECT public.setup_profile_table('card_invoices', TRUE);

-- ============================================
-- CATEGORIAS: uma por nome e tipo em cada conta
-- ============================================
DO $$ BEGIN
  ALTER TABLE public.categories ADD CONSTRAINT categories_user_name_type_key UNIQUE (user_id, name, type);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $$;

-- ============================================
-- CONQUISTAS: a dívida é apagada ao quitar, então debt_id é só referência
-- ============================================
ALTER TABLE public.achievements ALTER COLUMN amount TYPE DECIMAL(12, 2);

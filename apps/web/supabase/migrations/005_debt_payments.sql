-- ============================================
-- MIGRAÇÃO 005 - PAGAMENTOS DE DÍVIDAS
-- ============================================
-- Cada pagamento (parcela do mês, adiantamento ou quitação) fica registrado com data e valor.
-- Dívida quitada deixa de ser apagada: passa a status 'paid' e mantém o histórico.
-- Ordem: ... 004_persistence.sql -> este arquivo. Pode ser executado mais de uma vez. Não apaga dados.

ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.debts ALTER COLUMN total_amount TYPE DECIMAL(12, 2);
ALTER TABLE public.debts ALTER COLUMN remaining_amount TYPE DECIMAL(12, 2);
ALTER TABLE public.debts ALTER COLUMN monthly_payment TYPE DECIMAL(12, 2);

DO $$ BEGIN
  ALTER TABLE public.debts ADD CONSTRAINT debts_status_check CHECK (status IN ('active', 'paid'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.debt_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Excluir a dívida (lançamento errado) apaga os pagamentos dela; quitar não apaga nada
  debt_id UUID REFERENCES public.debts(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  installments INTEGER NOT NULL DEFAULT 1 CHECK (installments >= 0),
  kind TEXT NOT NULL CHECK (kind IN ('installment', 'advance', 'payoff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_debt_payments_user_id ON public.debt_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON public.debt_payments(debt_id);

-- RLS, dono do perfil (função criada na 004)
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;
SELECT public.setup_profile_table('debt_payments', FALSE);

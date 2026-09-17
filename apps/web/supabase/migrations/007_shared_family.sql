-- ============================================
-- MIGRAÇÃO 007 - DESPESAS, RECEITAS E DÍVIDAS COMPARTILHADAS
-- ============================================
-- Uma transação (ou assinatura) pode ser dividida entre vários perfis da família.
-- Uma dívida pode ser dividida em partes, e cada perfil paga a sua.
-- Ordem: ... 006_profile_photos.sql -> este arquivo. Pode ser executado mais de uma vez. Não apaga dados.

-- ============================================
-- DIVISÃO DE TRANSAÇÕES
-- ============================================
-- Sem linhas aqui, a transação inteira é do profile_id dela (comportamento antigo).
CREATE TABLE IF NOT EXISTS public.transaction_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (transaction_id, profile_id)
);
CREATE INDEX IF NOT EXISTS idx_transaction_splits_user_id ON public.transaction_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_splits_transaction_id ON public.transaction_splits(transaction_id);
SELECT public.setup_profile_table('transaction_splits', FALSE);

-- ============================================
-- DIVISÃO DE ASSINATURAS
-- ============================================
-- [{ "profile_id": "...", "amount": 27.95 }]; vazio = assinatura inteira do perfil dela
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS splits JSONB NOT NULL DEFAULT '[]';

-- ============================================
-- DIVISÃO DE DÍVIDAS
-- ============================================
-- Cada perfil paga a sua parte; a parcela só fica quitada quando todas as partes forem pagas.
CREATE TABLE IF NOT EXISTS public.debt_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  debt_id UUID REFERENCES public.debts(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Parte da parcela que cabe a este perfil (em dinheiro)
  share_amount DECIMAL(12, 2) NOT NULL CHECK (share_amount >= 0),
  -- Quantas parcelas este perfil já pagou
  installments_paid INTEGER NOT NULL DEFAULT 0 CHECK (installments_paid >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (debt_id, profile_id)
);
CREATE INDEX IF NOT EXISTS idx_debt_shares_user_id ON public.debt_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_debt_shares_debt_id ON public.debt_shares(debt_id);
SELECT public.setup_profile_table('debt_shares', TRUE);

-- Qual parcela cada pagamento cobriu (para saber quando a parcela fecha)
ALTER TABLE public.debt_payments ADD COLUMN IF NOT EXISTS installment_number INTEGER;

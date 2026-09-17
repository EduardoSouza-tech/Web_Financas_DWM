-- ============================================
-- SEED DATA - Categorias Padrão
-- ============================================
-- Este arquivo insere categorias padrão para testes
-- Em produção, as categorias serão criadas no primeiro login do usuário

-- NOTA: Substitua 'USER_ID_AQUI' pelo ID real do seu usuário de teste

-- ============================================
-- CATEGORIAS DE DESPESA
-- ============================================
INSERT INTO public.categories (user_id, name, icon, budget_limit, type) VALUES
  ('USER_ID_AQUI', 'Alimentação', '🍔', 800.00, 'expense'),
  ('USER_ID_AQUI', 'Transporte', '🚗', 400.00, 'expense'),
  ('USER_ID_AQUI', 'Saúde', '🏥', 300.00, 'expense'),
  ('USER_ID_AQUI', 'Educação', '📚', 500.00, 'expense'),
  ('USER_ID_AQUI', 'Lazer', '🎮', 300.00, 'expense'),
  ('USER_ID_AQUI', 'Moradia', '🏠', 1500.00, 'expense'),
  ('USER_ID_AQUI', 'Utilidades', '💡', 400.00, 'expense'),
  ('USER_ID_AQUI', 'Assinaturas', '📱', 200.00, 'expense'),
  ('USER_ID_AQUI', 'Vestuário', '👕', 250.00, 'expense'),
  ('USER_ID_AQUI', 'Outros', '📦', 150.00, 'expense');

-- ============================================
-- CATEGORIAS DE RECEITA
-- ============================================
INSERT INTO public.categories (user_id, name, icon, budget_limit, type) VALUES
  ('USER_ID_AQUI', 'Salário', '💰', NULL, 'income'),
  ('USER_ID_AQUI', 'Freelance', '💼', NULL, 'income'),
  ('USER_ID_AQUI', 'Investimentos', '📈', NULL, 'income'),
  ('USER_ID_AQUI', 'Outros', '🎁', NULL, 'income');

-- ============================================
-- TRANSAÇÕES DE EXEMPLO (Opcional)
-- ============================================
-- Receitas
INSERT INTO public.transactions (user_id, type, amount, category, description, date) VALUES
  ('USER_ID_AQUI', 'income', 8000.00, 'Salário', 'Salário mensal', '2024-01-01'),
  ('USER_ID_AQUI', 'income', 1500.00, 'Freelance', 'Projeto web design', '2024-01-05');

-- Despesas
INSERT INTO public.transactions (user_id, type, amount, category, description, date) VALUES
  ('USER_ID_AQUI', 'expense', 450.00, 'Alimentação', 'Supermercado', '2024-01-03'),
  ('USER_ID_AQUI', 'expense', 120.00, 'Transporte', 'Combustível', '2024-01-04'),
  ('USER_ID_AQUI', 'expense', 200.00, 'Lazer', 'Cinema e restaurante', '2024-01-06'),
  ('USER_ID_AQUI', 'expense', 1200.00, 'Moradia', 'Aluguel', '2024-01-01'),
  ('USER_ID_AQUI', 'expense', 350.00, 'Utilidades', 'Energia + Água + Internet', '2024-01-02'),
  ('USER_ID_AQUI', 'expense', 89.90, 'Assinaturas', 'Netflix + Spotify', '2024-01-01');

-- ============================================
-- DÍVIDAS DE EXEMPLO (Opcional)
-- ============================================
INSERT INTO public.debts (
  user_id, 
  name, 
  type, 
  total_amount, 
  remaining_amount, 
  monthly_payment, 
  interest_rate, 
  installments_paid, 
  total_installments, 
  next_due_date, 
  creditor, 
  color
) VALUES
  (
    'USER_ID_AQUI',
    'Cartão Parcelado C6',
    'Parcelamento',
    2400.00,
    1600.00,
    400.00,
    3.99,
    2,
    6,
    '2024-02-15',
    'Banco C6',
    '#FF6B6B'
  ),
  (
    'USER_ID_AQUI',
    'Empréstimo Pessoal',
    'Empréstimo',
    10000.00,
    8500.00,
    500.00,
    2.49,
    3,
    20,
    '2024-02-10',
    'Nubank',
    '#4ECDC4'
  );

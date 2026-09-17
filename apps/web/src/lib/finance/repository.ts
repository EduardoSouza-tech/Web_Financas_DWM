/**
 * Leitura e gravação no Supabase. Converte os campos do app (camelCase) para as colunas do banco
 * (snake_case). Todas as tabelas têm RLS: cada usuário só enxerga as próprias linhas.
 */
import { supabase } from '@/lib/supabase';
import type { DebtPayment, DebtShare, Goal, GoalContribution, Subscription } from './engine';
import type { Split } from './credit-card';
import type { DebtAchievement } from './achievements';

// Tipos do app (mantidos soltos aqui para não criar dependência circular com o contexto)
export interface TransactionRecord {
  id: string;
  profile_id?: string;
  date: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  paymentMethod?: 'cash' | 'credit_card';
  cardId?: string;
  installments?: number;
  firstInstallment?: number;
  firstInvoiceMonth?: string;
  tags?: string[];
  /** Divisão entre perfis; vazio = tudo de quem lançou */
  splits?: Split[];
}

export interface InvoiceRecord {
  profile_id?: string;
  cardId: string;
  month: string;
  checked: string[];
  statementAmount?: number;
  paidAt?: string;
}

export interface CategoryRecord {
  id: string;
  name: string;
  icon: string;
  budgetLimit?: number;
  type: 'income' | 'expense';
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (id: unknown): id is string => typeof id === 'string' && UUID_RE.test(id);

export function newUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));
const optNum = (v: unknown) => (v === null || v === undefined ? undefined : Number(v));

async function run<T>(label: string, query: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await query;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

// ============================================
// Mapeamentos
// ============================================

const toTransaction = (r: any): TransactionRecord => ({
  id: r.id,
  profile_id: r.profile_id,
  date: r.date,
  description: r.description,
  category: r.category,
  type: r.type,
  amount: num(r.amount),
  paymentMethod: r.payment_method ?? 'cash',
  cardId: r.card_id ?? undefined,
  installments: r.installments ?? 1,
  firstInstallment: r.first_installment ?? 1,
  firstInvoiceMonth: r.first_invoice_month ?? undefined,
  tags: r.tags ?? [],
  splits: [],
});

const fromTransaction = (userId: string, t: TransactionRecord) => ({
  id: t.id,
  user_id: userId,
  profile_id: t.profile_id,
  date: t.date,
  description: t.description,
  category: t.category,
  type: t.type,
  amount: t.amount,
  payment_method: t.paymentMethod ?? 'cash',
  card_id: t.paymentMethod === 'credit_card' && isUuid(t.cardId) ? t.cardId : null,
  installments: t.installments ?? 1,
  first_installment: t.firstInstallment ?? 1,
  first_invoice_month: t.firstInvoiceMonth ?? null,
  tags: t.tags ?? [],
});

const toDebt = (r: any) => ({
  id: r.id,
  profile_id: r.profile_id,
  name: r.name,
  type: r.type,
  totalAmount: num(r.total_amount),
  remainingAmount: num(r.remaining_amount),
  monthlyPayment: num(r.monthly_payment),
  interestRate: num(r.interest_rate),
  installmentsPaid: r.installments_paid,
  totalInstallments: r.total_installments,
  nextDueDate: r.next_due_date,
  creditor: r.creditor,
  color: r.color,
  status: r.status ?? 'active',
  paidAt: r.paid_at ?? undefined,
});

const fromDebt = (userId: string, d: any) => ({
  id: d.id,
  user_id: userId,
  profile_id: d.profile_id,
  name: d.name,
  type: d.type,
  total_amount: d.totalAmount,
  remaining_amount: Math.max(0, d.remainingAmount),
  monthly_payment: d.monthlyPayment,
  interest_rate: d.interestRate,
  installments_paid: d.installmentsPaid,
  total_installments: d.totalInstallments,
  next_due_date: d.nextDueDate,
  creditor: d.creditor || 'Não informado',
  color: d.color || 'from-gray-500 to-gray-700',
  status: d.status ?? 'active',
  paid_at: d.paidAt ?? null,
});

const toDebtPayment = (r: any): DebtPayment => ({
  id: r.id,
  profile_id: r.profile_id,
  debtId: r.debt_id,
  date: r.date,
  amount: num(r.amount),
  installments: r.installments,
  kind: r.kind,
  installmentNumber: r.installment_number ?? undefined,
});

const toDebtShare = (r: any): DebtShare => ({
  id: r.id,
  debtId: r.debt_id,
  profile_id: r.profile_id,
  shareAmount: num(r.share_amount),
  installmentsPaid: r.installments_paid ?? 0,
});

const toCard = (r: any) => ({
  id: r.id,
  profile_id: r.profile_id,
  name: r.name,
  brand: r.brand,
  limit: num(r.credit_limit),
  closingDay: r.closing_day,
  dueDay: r.due_day,
  lastFourDigits: r.last_four_digits ?? '****',
  color: r.color ?? 'from-blue-600 to-blue-800',
});

const fromCard = (userId: string, c: any) => ({
  id: c.id,
  user_id: userId,
  profile_id: c.profile_id,
  name: c.name,
  brand: c.brand ?? 'visa',
  credit_limit: c.limit ?? 0,
  closing_day: c.closingDay ?? 5,
  due_day: c.dueDay ?? 15,
  last_four_digits: c.lastFourDigits ?? null,
  color: c.color ?? null,
});

const toSubscription = (r: any): Subscription => ({
  id: r.id,
  profile_id: r.profile_id,
  name: r.name,
  category: r.category,
  amount: num(r.amount),
  frequency: r.frequency,
  billingDay: r.billing_day,
  billingMonth: r.billing_month ?? undefined,
  paymentMethod: r.payment_method,
  cardId: r.card_id ?? undefined,
  icon: r.icon,
  status: r.status,
  periods: (r.periods ?? []).map((p: any) => ({ start: p.start, ...(p.end ? { end: p.end } : {}) })),
  splits: (r.splits ?? []).map((s: any) => ({ profile_id: s.profile_id, amount: num(s.amount) })),
});

const fromSubscription = (userId: string, s: Subscription) => ({
  id: s.id,
  user_id: userId,
  profile_id: s.profile_id,
  name: s.name,
  category: s.category,
  amount: s.amount,
  frequency: s.frequency,
  billing_day: s.billingDay,
  billing_month: s.frequency === 'yearly' ? s.billingMonth ?? 1 : null,
  payment_method: s.paymentMethod,
  card_id: s.paymentMethod === 'credit_card' && isUuid(s.cardId) ? s.cardId : null,
  icon: s.icon,
  status: s.status,
  periods: s.periods.map(p => ({ start: p.start, end: p.end ?? null })),
  splits: s.splits ?? [],
});

const toGoal = (r: any, contributions: GoalContribution[]): Goal => ({
  id: r.id,
  profile_id: r.profile_id,
  name: r.name,
  icon: r.icon,
  type: r.type,
  targetAmount: num(r.target_amount),
  initialAmount: num(r.initial_amount),
  deadline: r.deadline,
  monthlyContribution: num(r.monthly_contribution),
  autoContribute: r.auto_contribute,
  status: r.status,
  createdAt: (r.created_at ?? '').slice(0, 10),
  contributions,
});

const fromGoal = (userId: string, g: Goal) => ({
  id: g.id,
  user_id: userId,
  profile_id: g.profile_id,
  name: g.name,
  icon: g.icon,
  type: g.type,
  target_amount: g.targetAmount,
  initial_amount: g.initialAmount,
  deadline: g.deadline,
  monthly_contribution: g.monthlyContribution,
  auto_contribute: g.autoContribute,
  status: g.status,
});

const toInvoice = (r: any): InvoiceRecord => ({
  profile_id: r.profile_id,
  cardId: r.card_id,
  month: r.month,
  checked: r.checked ?? [],
  statementAmount: optNum(r.statement_amount),
  paidAt: r.paid_at ?? undefined,
});

const toCategory = (r: any): CategoryRecord => ({
  id: r.id,
  name: r.name,
  icon: r.icon,
  budgetLimit: optNum(r.budget_limit),
  type: r.type,
});

const toAchievement = (r: any): DebtAchievement => ({
  id: r.id,
  profile_id: r.profile_id,
  debtId: r.debt_id,
  debtName: r.debt_name,
  amount: num(r.amount),
  paidAt: r.paid_at,
  monthlyPaymentFreed: num(r.monthly_payment_freed),
  interestRate: num(r.interest_rate),
});

// ============================================
// Carga inicial
// ============================================

export interface RemoteData {
  transactions: TransactionRecord[];
  debts: any[];
  debtPayments: DebtPayment[];
  debtShares: DebtShare[];
  cards: any[];
  subscriptions: Subscription[];
  goals: Goal[];
  invoices: InvoiceRecord[];
  categories: CategoryRecord[];
  achievements: DebtAchievement[];
}

export async function loadAll(): Promise<RemoteData> {
  const [transactions, splits, debts, debtPayments, debtShares, cards, subscriptions, goals, contributions, invoices, categories, achievements] =
    await Promise.all([
      run('transações', supabase.from('transactions').select('*').order('date', { ascending: false })),
      run('divisões', supabase.from('transaction_splits').select('*')),
      run('dívidas', supabase.from('debts').select('*').order('next_due_date')),
      run('pagamentos de dívidas', supabase.from('debt_payments').select('*').order('date')),
      run('divisão de dívidas', supabase.from('debt_shares').select('*')),
      run('cartões', supabase.from('cards').select('*').order('created_at')),
      run('assinaturas', supabase.from('subscriptions').select('*').order('created_at')),
      run('metas', supabase.from('goals').select('*').order('created_at')),
      run('aportes', supabase.from('goal_contributions').select('*').order('date')),
      run('faturas', supabase.from('card_invoices').select('*')),
      run('categorias', supabase.from('categories').select('*').order('created_at')),
      run('conquistas', supabase.from('achievements').select('*').order('paid_at')),
    ]);

  const contributionsByGoal = new Map<string, GoalContribution[]>();
  (contributions as any[]).forEach(c => {
    const list = contributionsByGoal.get(c.goal_id) ?? [];
    list.push({ id: c.id, date: c.date, amount: num(c.amount) });
    contributionsByGoal.set(c.goal_id, list);
  });

  const splitsByTransaction = new Map<string, Split[]>();
  (splits as any[]).forEach(s => {
    const list = splitsByTransaction.get(s.transaction_id) ?? [];
    list.push({ profile_id: s.profile_id, amount: num(s.amount) });
    splitsByTransaction.set(s.transaction_id, list);
  });

  return {
    transactions: (transactions as any[]).map(r => ({ ...toTransaction(r), splits: splitsByTransaction.get(r.id) ?? [] })),
    debts: (debts as any[]).map(toDebt),
    debtPayments: (debtPayments as any[]).map(toDebtPayment),
    debtShares: (debtShares as any[]).map(toDebtShare),
    cards: (cards as any[]).map(toCard),
    subscriptions: (subscriptions as any[]).map(toSubscription),
    goals: (goals as any[]).map(g => toGoal(g, contributionsByGoal.get(g.id) ?? [])),
    invoices: (invoices as any[]).map(toInvoice),
    categories: (categories as any[]).map(toCategory),
    achievements: (achievements as any[]).map(toAchievement),
  };
}

// ============================================
// Gravação
// ============================================

export const repo = {
  upsertTransaction: (userId: string, t: TransactionRecord) =>
    run('salvar transação', supabase.from('transactions').upsert(fromTransaction(userId, t))),
  /**
   * Salva a transação e a divisão dela em sequência.
   * As partes referenciam a transação, então a linha precisa existir antes.
   */
  upsertTransactionWithSplits: async (userId: string, t: TransactionRecord) => {
    await run('salvar transação', supabase.from('transactions').upsert(fromTransaction(userId, t)));
    return repo.saveTransactionSplits(userId, t.id, t.profile_id, t.splits ?? []);
  },
  updateTransactionsCategory: (from: string, to: string) =>
    run('renomear categoria nas transações', supabase.from('transactions').update({ category: to }).eq('category', from)),
  deleteTransaction: (id: string) => run('excluir transação', supabase.from('transactions').delete().eq('id', id)),
  /** Regrava a divisão da transação (apaga a anterior e insere a nova) */
  saveTransactionSplits: async (userId: string, transactionId: string, profileId: string | undefined, splits: Split[]) => {
    await run('limpar divisão', supabase.from('transaction_splits').delete().eq('transaction_id', transactionId));
    if (splits.length === 0) return null;
    return run(
      'salvar divisão',
      supabase.from('transaction_splits').insert(
        splits.map(s => ({ user_id: userId, transaction_id: transactionId, profile_id: s.profile_id, amount: s.amount }))
      )
    );
  },

  upsertDebt: (userId: string, d: any) => run('salvar dívida', supabase.from('debts').upsert(fromDebt(userId, d))),
  /**
   * Salva a dívida e a divisão dela em sequência.
   * As partes referenciam a dívida, então a linha precisa existir antes.
   */
  upsertDebtWithShares: async (userId: string, d: any, shares: DebtShare[]) => {
    await run('salvar dívida', supabase.from('debts').upsert(fromDebt(userId, d)));
    for (const share of shares) await repo.upsertDebtShare(userId, share);
    return null;
  },
  deleteDebt: (id: string) => run('excluir dívida', supabase.from('debts').delete().eq('id', id)),
  insertDebtPayment: (userId: string, payment: DebtPayment) =>
    run(
      'registrar pagamento de dívida',
      supabase.from('debt_payments').upsert({
        id: payment.id,
        user_id: userId,
        profile_id: payment.profile_id,
        debt_id: payment.debtId,
        date: payment.date,
        amount: payment.amount,
        installments: payment.installments,
        kind: payment.kind,
        installment_number: payment.installmentNumber ?? null,
      })
    ),
  deleteDebtShare: (id: string) =>
    run('excluir parte da dívida', supabase.from('debt_shares').delete().eq('id', id)),
  upsertDebtShare: (userId: string, share: DebtShare) =>
    run(
      'salvar divisão da dívida',
      supabase.from('debt_shares').upsert(
        {
          id: share.id,
          user_id: userId,
          debt_id: share.debtId,
          profile_id: share.profile_id,
          share_amount: share.shareAmount,
          installments_paid: share.installmentsPaid,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'debt_id,profile_id' }
      )
    ),

  upsertCard: (userId: string, c: any) => run('salvar cartão', supabase.from('cards').upsert(fromCard(userId, c))),
  deleteCard: (id: string) => run('excluir cartão', supabase.from('cards').delete().eq('id', id)),

  upsertSubscription: (userId: string, s: Subscription) =>
    run('salvar assinatura', supabase.from('subscriptions').upsert(fromSubscription(userId, s))),
  updateSubscriptionsCategory: (from: string, to: string) =>
    run('renomear categoria nas assinaturas', supabase.from('subscriptions').update({ category: to }).eq('category', from)),
  deleteSubscription: (id: string) => run('excluir assinatura', supabase.from('subscriptions').delete().eq('id', id)),

  upsertGoal: (userId: string, g: Goal) => run('salvar meta', supabase.from('goals').upsert(fromGoal(userId, g))),
  deleteGoal: (id: string) => run('excluir meta', supabase.from('goals').delete().eq('id', id)),
  insertContribution: (userId: string, goal: Goal, c: GoalContribution) =>
    run(
      'salvar aporte',
      supabase.from('goal_contributions').upsert({
        id: c.id,
        user_id: userId,
        profile_id: goal.profile_id,
        goal_id: goal.id,
        date: c.date,
        amount: c.amount,
      })
    ),

  upsertInvoice: (userId: string, inv: InvoiceRecord) =>
    run(
      'salvar fatura',
      supabase.from('card_invoices').upsert(
        {
          user_id: userId,
          profile_id: inv.profile_id,
          card_id: inv.cardId,
          month: inv.month,
          checked: inv.checked,
          statement_amount: inv.statementAmount ?? null,
          paid_at: inv.paidAt ?? null,
        },
        { onConflict: 'profile_id,card_id,month' }
      )
    ),

  insertCategories: (userId: string, categories: CategoryRecord[]) =>
    run(
      'criar categorias',
      supabase.from('categories').upsert(
        categories.map(c => ({ id: c.id, user_id: userId, name: c.name, icon: c.icon, type: c.type, budget_limit: c.budgetLimit ?? null }))
      )
    ),
  upsertCategory: (userId: string, c: CategoryRecord) =>
    run(
      'salvar categoria',
      supabase.from('categories').upsert({ id: c.id, user_id: userId, name: c.name, icon: c.icon, type: c.type, budget_limit: c.budgetLimit ?? null })
    ),
  deleteCategory: (id: string) => run('excluir categoria', supabase.from('categories').delete().eq('id', id)),

  insertAchievement: (userId: string, a: DebtAchievement) =>
    run(
      'salvar conquista',
      supabase.from('achievements').upsert({
        id: a.id,
        user_id: userId,
        profile_id: a.profile_id,
        debt_id: a.debtId,
        debt_name: a.debtName,
        amount: a.amount,
        monthly_payment_freed: a.monthlyPaymentFreed,
        interest_rate: a.interestRate,
        paid_at: a.paidAt,
      })
    ),
  deleteAchievements: (ids: string[]) =>
    run('excluir conquistas', supabase.from('achievements').delete().in('id', ids)),
};

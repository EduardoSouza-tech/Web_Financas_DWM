/**
 * Regras financeiras que não dependem de React: assinaturas recorrentes, metas,
 * score de saúde financeira e projeção dos próximos meses.
 */
import {
  DEFAULT_CLOSING_DAY,
  addMonths,
  currentMonthKey,
  invoiceMonthOf,
  monthOfDate,
  type Installment,
  type MonthKey,
  type Split,
} from './credit-card';

// ============================================
// Datas
// ============================================

export function todayISO(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function lastDayOfMonth(month: MonthKey): number {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export function dateInMonth(month: MonthKey, day: number): string {
  return `${month}-${String(Math.min(Math.max(1, day), lastDayOfMonth(month))).padStart(2, '0')}`;
}

export function monthsBetween(from: MonthKey, to: MonthKey): number {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

export function monthRange(from: MonthKey, to: MonthKey): MonthKey[] {
  const n = monthsBetween(from, to);
  return n < 0 ? [] : Array.from({ length: n + 1 }, (_, i) => addMonths(from, i));
}

/** Próxima data (>= hoje) com o dia do mês informado */
export function nextDateForDay(day: number, today = todayISO()): string {
  const month = monthOfDate(today);
  const candidate = dateInMonth(month, day);
  return candidate >= today ? candidate : dateInMonth(addMonths(month, 1), day);
}

// ============================================
// Assinaturas
// ============================================

export interface SubscriptionPeriod {
  start: string; // YYYY-MM-DD (inclusive)
  end?: string; // YYYY-MM-DD (exclusivo): sem cobranças a partir desta data
}

export interface Subscription {
  id: string;
  profile_id?: string;
  name: string;
  category: string;
  amount: number;
  frequency: 'monthly' | 'yearly';
  billingDay: number;
  billingMonth?: number; // 1-12, só para anual
  paymentMethod: 'cash' | 'credit_card';
  cardId?: string;
  icon: string;
  status: 'active' | 'paused' | 'cancelled';
  periods: SubscriptionPeriod[];
  /** Divisão entre perfis; vazio = assinatura inteira de quem cadastrou */
  splits?: Split[];
}

export interface CashCharge {
  key: string;
  profile_id?: string;
  subscriptionId: string;
  description: string;
  category: string;
  date: string;
  amount: number;
  /** Divisão desta cobrança entre perfis */
  splits?: Split[];
}

/** Datas de cobrança entre dois meses (inclusive), respeitando os períodos ativos */
export function subscriptionChargeDates(sub: Subscription, from: MonthKey, to: MonthKey): string[] {
  return monthRange(from, to)
    .filter(m => sub.frequency === 'monthly' || Number(m.slice(5, 7)) === (sub.billingMonth ?? 1))
    .map(m => dateInMonth(m, sub.billingDay))
    .filter(date => sub.periods.some(p => p.start <= date && (!p.end || date < p.end)));
}

export function subscriptionStartMonth(sub: Subscription): MonthKey | null {
  if (sub.periods.length === 0) return null;
  return sub.periods.map(p => monthOfDate(p.start)).sort()[0];
}

/** Cobranças no cartão viram "parcelas" 1/1 da fatura; à vista viram despesas na data */
export function expandSubscription(
  sub: Subscription,
  until: MonthKey,
  closingDay = DEFAULT_CLOSING_DAY
): { card: Installment[]; cash: CashCharge[] } {
  const start = subscriptionStartMonth(sub);
  if (!start) return { card: [], cash: [] };
  const dates = subscriptionChargeDates(sub, start, until);

  if (sub.paymentMethod === 'credit_card' && sub.cardId) {
    return {
      cash: [],
      card: dates.map(date => ({
        key: `sub:${sub.id}:${date}`,
        purchaseId: `sub:${sub.id}`,
        profile_id: sub.profile_id,
        cardId: sub.cardId!,
        description: `${sub.name} (assinatura)`,
        category: sub.category,
        purchaseDate: date,
        number: 1,
        total: 1,
        amount: sub.amount,
        shares: sub.splits?.length ? sub.splits : undefined,
        invoiceMonth: invoiceMonthOf(date, closingDay),
        source: 'subscription' as const,
      })),
    };
  }
  return {
    card: [],
    cash: dates.map(date => ({
      key: `sub:${sub.id}:${date}`,
      profile_id: sub.profile_id,
      subscriptionId: sub.id,
      description: `${sub.name} (assinatura)`,
      category: sub.category,
      date,
      amount: sub.amount,
      splits: sub.splits?.length ? sub.splits : undefined,
    })),
  };
}

export function subscriptionMonthlyCost(sub: Subscription): number {
  return sub.frequency === 'yearly' ? sub.amount / 12 : sub.amount;
}

/** Próxima cobrança a partir de hoje (null se não está ativa) */
export function nextSubscriptionCharge(sub: Subscription, today = todayISO()): string | null {
  if (sub.status !== 'active') return null;
  const month = monthOfDate(today);
  return subscriptionChargeDates(sub, month, addMonths(month, 12)).find(d => d >= today) ?? null;
}

/** Muda o status fechando ou abrindo um período, sem apagar cobranças passadas */
export function withSubscriptionStatus(sub: Subscription, status: Subscription['status'], today = todayISO()): Subscription {
  if (status === sub.status) return sub;
  const periods = sub.periods.map(p => ({ ...p }));
  const open = periods.find(p => !p.end);
  if (status === 'active') {
    if (!open) periods.push({ start: today });
  } else if (open) {
    open.end = today;
  }
  return { ...sub, status, periods };
}

// ============================================
// Metas
// ============================================

export interface GoalContribution {
  id: string;
  date: string;
  amount: number;
}

export interface Goal {
  id: string;
  profile_id?: string;
  name: string;
  icon: string;
  type: 'emergency' | 'purchase' | 'vacation' | 'investment' | 'other';
  targetAmount: number;
  initialAmount: number; // valor que já existia ao criar a meta
  deadline: string;
  monthlyContribution: number; // aporte planejado por mês
  autoContribute: boolean;
  status: 'active' | 'paused';
  createdAt: string;
  contributions: GoalContribution[];
}

export function goalCurrentAmount(goal: Goal): number {
  return goal.initialAmount + goal.contributions.reduce((sum, c) => sum + c.amount, 0);
}

export function goalPercentage(goal: Goal): number {
  return goal.targetAmount > 0 ? Math.min(100, (goalCurrentAmount(goal) / goal.targetAmount) * 100) : 0;
}

export function goalContributionsInMonth(goal: Goal, month: MonthKey): number {
  return goal.contributions.filter(c => monthOfDate(c.date) === month).reduce((sum, c) => sum + c.amount, 0);
}

/** Quanto falta guardar por mês para chegar no prazo (inclui o mês atual) */
export function goalMonthlyNeeded(goal: Goal, today = todayISO()): number {
  const remaining = goal.targetAmount - goalCurrentAmount(goal);
  if (remaining <= 0) return 0;
  const months = monthsBetween(monthOfDate(today), monthOfDate(goal.deadline)) + 1;
  return months <= 0 ? remaining : remaining / months;
}

// ============================================
// Score de saúde financeira (0-100)
// ============================================

export interface ScoreInput {
  income: number;
  realSavingsRate: number; // % que sobra depois de despesas e dívidas
  debtCommitmentPercentage: number;
  budgets: Array<{ limit: number; spent: number }>; // só categorias com limite
  goals: Goal[];
  cards: Array<{ limit: number; used: number }>;
}

export interface ScoreCriterion {
  key: 'savings' | 'control' | 'goals' | 'credit' | 'debt';
  label: string;
  weight: number;
  score: number | null; // 0-100; null = sem dados, não entra na nota
  detail: string;
}

export function computeScore(input: ScoreInput): { total: number | null; criteria: ScoreCriterion[] } {
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  const hasIncome = input.income > 0;

  const activeGoals = input.goals.filter(g => g.status === 'active');
  const limitTotal = input.cards.reduce((s, c) => s + c.limit, 0);
  const usedTotal = input.cards.reduce((s, c) => s + c.used, 0);
  const creditUsage = limitTotal > 0 ? (usedTotal / limitTotal) * 100 : null;
  const withinBudget = input.budgets.filter(b => b.spent <= b.limit).length;

  const criteria: ScoreCriterion[] = [
    {
      key: 'savings',
      label: 'Poupança',
      weight: 25,
      // 20% ou mais do que sobra = nota máxima; déficit = 0
      score: hasIncome ? clamp((input.realSavingsRate / 20) * 100) : null,
      detail: hasIncome ? `Sobram ${input.realSavingsRate.toFixed(1)}% da renda` : 'Sem receita no mês',
    },
    {
      key: 'control',
      label: 'Controle',
      weight: 25,
      score: input.budgets.length > 0 ? (withinBudget / input.budgets.length) * 100 : null,
      detail:
        input.budgets.length > 0
          ? `${withinBudget} de ${input.budgets.length} orçamentos dentro do limite`
          : 'Nenhuma categoria com limite',
    },
    {
      key: 'goals',
      label: 'Metas',
      weight: 20,
      score: activeGoals.length > 0 ? activeGoals.reduce((s, g) => s + goalPercentage(g), 0) / activeGoals.length : null,
      detail: activeGoals.length > 0 ? `Progresso médio das ${activeGoals.length} metas ativas` : 'Nenhuma meta ativa',
    },
    {
      key: 'credit',
      label: 'Crédito',
      weight: 15,
      // até 30% do limite = ótimo; 100% = 0
      score: creditUsage === null ? null : clamp(100 - Math.max(0, creditUsage - 30) * (100 / 70)),
      detail: creditUsage === null ? 'Nenhum cartão' : `${creditUsage.toFixed(1)}% do limite usado`,
    },
    {
      key: 'debt',
      label: 'Dívidas',
      weight: 15,
      // até 20% da renda = ótimo; 50% ou mais = 0
      score: hasIncome ? clamp(100 - Math.max(0, input.debtCommitmentPercentage - 20) * (100 / 30)) : null,
      detail: hasIncome ? `${input.debtCommitmentPercentage.toFixed(1)}% da renda em parcelas` : 'Sem receita no mês',
    },
  ];

  // Sem receita no mês a nota não tem base (ex.: gastar R$ 0 "cumpre" todos os orçamentos)
  if (!hasIncome) return { total: null, criteria };

  const scored = criteria.filter(c => c.score !== null);
  const weight = scored.reduce((s, c) => s + c.weight, 0);
  const total = weight > 0 ? Math.round(scored.reduce((s, c) => s + (c.score as number) * c.weight, 0) / weight) : null;
  return { total, criteria };
}

// ============================================
// Dívidas
// ============================================

export interface DebtPayment {
  id: string;
  profile_id?: string;
  debtId: string;
  date: string;
  amount: number;
  installments: number; // parcelas cobertas por este pagamento
  kind: 'installment' | 'advance' | 'payoff';
  /** Parcela que este pagamento cobriu (dívidas divididas fecham a parcela quando todos pagam) */
  installmentNumber?: number;
}

/** Parte de um perfil numa dívida dividida */
export interface DebtShare {
  id: string;
  debtId: string;
  profile_id: string;
  /** Quanto deste perfil em CADA parcela */
  shareAmount: number;
  /** Quantas parcelas este perfil já pagou */
  installmentsPaid: number;
}

/**
 * Situação da parcela atual de uma dívida dividida.
 * A parcela só é quitada quando todas as partes forem pagas.
 */
export function installmentStatus(debt: DebtSchedule, shares: DebtShare[]) {
  const current = (debt.installmentsPaid ?? 0) + 1;
  const pending = shares.filter(s => s.installmentsPaid < current);
  const paid = shares.filter(s => s.installmentsPaid >= current);
  return {
    installment: current,
    pending,
    paid,
    settled: shares.length > 0 && pending.length === 0,
    pendingAmount: Math.round(pending.reduce((s, x) => s + x.shareAmount, 0) * 100) / 100,
  };
}

/** Esse perfil ainda deve a parcela atual? */
export function profileOwesInstallment(debt: DebtSchedule, shares: DebtShare[], profileId: string): boolean {
  const share = shares.find(s => s.profile_id === profileId);
  if (!share) return false;
  return share.installmentsPaid < (debt.installmentsPaid ?? 0) + 1;
}

export interface DebtSchedule {
  id: string;
  status?: 'active' | 'paid';
  monthlyPayment: number;
  nextDueDate: string;
  installmentsPaid: number;
  totalInstallments: number;
}

export function remainingInstallments(debt: DebtSchedule): number {
  return Math.max(0, (debt.totalInstallments ?? 0) - (debt.installmentsPaid ?? 0));
}

/** Parcelas ainda não pagas que vencem no mês (só para o mês atual e futuros; atrasadas contam no mês atual) */
export function pendingDebtPayment(debt: DebtSchedule, month: MonthKey, today = todayISO()): number {
  if (debt.status === 'paid') return 0;
  const current = monthOfDate(today);
  if (month < current) return 0;
  const offset = monthsBetween(monthOfDate(debt.nextDueDate), month);
  if (month === current && offset > 0) return debt.monthlyPayment; // atrasada
  return offset >= 0 && offset < remainingInstallments(debt) ? debt.monthlyPayment : 0;
}

/** Pagamentos de dívidas no mês = o que foi pago de fato + o que ainda vai vencer no mês */
export function debtPaymentsForMonth(
  month: MonthKey,
  debts: DebtSchedule[],
  payments: DebtPayment[],
  today = todayISO()
): { paid: number; pending: number; total: number } {
  const paid = payments.filter(p => monthOfDate(p.date) === month).reduce((s, p) => s + p.amount, 0);
  const pending = debts.reduce((s, d) => s + pendingDebtPayment(d, month, today), 0);
  return { paid, pending, total: paid + pending };
}

/** Mesmo dia do mês, N meses depois (dia 31 vira o último dia de meses curtos) */
export function addMonthsToDate(date: string, months: number): string {
  return dateInMonth(addMonths(monthOfDate(date), months), Number(date.slice(8, 10)));
}

// ============================================
// Projeção
// ============================================

export interface ForecastMonth {
  month: MonthKey;
  income: number;
  expenses: number;
  debtPayments: number;
  plannedContributions: number;
  balance: number; // sobra do mês
  accumulated: number; // soma das sobras a partir do primeiro mês projetado
}

export interface ForecastInput {
  fromMonth: MonthKey; // mês de referência (base dos hábitos)
  months: number;
  income: number; // renda esperada por mês
  /** Despesas que se repetem: à vista e compras de cartão à vista do mês base (sem assinaturas) */
  habitualExpenses: number;
  /** Parcelas já compradas e assinaturas, por mês (já conhecidas) */
  committedExpenses: (month: MonthKey) => number;
  /** Parcelas de dívidas previstas para o mês */
  debtPayments: (month: MonthKey) => number;
  plannedContributions: number;
}

export function buildForecast(input: ForecastInput): ForecastMonth[] {
  let accumulated = 0;
  return Array.from({ length: input.months }, (_, i) => {
    const month = addMonths(input.fromMonth, i + 1);
    const debtPayments = input.debtPayments(month);
    const expenses = input.habitualExpenses + input.committedExpenses(month);
    const balance = input.income - expenses - debtPayments - input.plannedContributions;
    accumulated += balance;
    return {
      month,
      income: input.income,
      expenses,
      debtPayments,
      plannedContributions: input.plannedContributions,
      balance,
      accumulated,
    };
  });
}

export { currentMonthKey };

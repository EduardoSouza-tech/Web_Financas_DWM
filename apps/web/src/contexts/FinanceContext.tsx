'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useDebts, type Debt as DbDebt } from '@/hooks/useDebts';
import { useAuth } from '@/providers/auth-provider';
import { useProfiles } from '@/providers/profile-provider';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  DEFAULT_CLOSING_DAY,
  addMonths,
  currentMonthKey,
  expandInstallments,
  invoiceMonthOf,
  monthOfDate,
  type Installment,
  type MonthKey,
} from '@/lib/finance/credit-card';
import {
  buildForecast,
  computeScore,
  expandSubscription,
  goalContributionsInMonth,
  todayISO,
  withSubscriptionStatus,
  type CashCharge,
  type ForecastMonth,
  type Goal,
  type ScoreCriterion,
  type Subscription,
} from '@/lib/finance/engine';
import { computeHealth, type FinancialHealth } from '@/lib/finance/health';
import { seedCards, seedDebts, seedGoals, seedSubscriptions, seedTransactions } from '@/lib/finance/seed';

export interface Category {
  id: string;
  name: string;
  icon: string;
  budgetLimit?: number;
  type: 'income' | 'expense';
}

export type PaymentMethod = 'cash' | 'credit_card';

export interface Transaction {
  id: string;
  profile_id?: string;
  date: string; // YYYY-MM-DD
  description: string;
  category: string;
  type: 'income' | 'expense';
  amount: number; // no cartão: valor TOTAL da compra
  paymentMethod?: PaymentMethod;
  cardId?: string;
  installments?: number;
  firstInstallment?: number;
  firstInvoiceMonth?: MonthKey;
  tags?: string[];
}

export interface InvoiceState {
  checked: string[]; // chaves das parcelas conferidas
  statementAmount?: number; // valor informado pelo banco
  paidAt?: string;
}

/** Tudo o que aconteceu num mês, já separado por origem */
export interface MonthSummary {
  month: MonthKey;
  income: number;
  cashExpenses: number; // à vista (transações + assinaturas à vista)
  cardExpenses: number; // parcelas e assinaturas na fatura do mês
  subscriptionExpenses: number; // parte das despesas que veio de assinaturas
  expenses: number;
  byCategory: Record<string, number>;
  goalContributions: number;
  cashCharges: CashCharge[]; // cobranças à vista de assinaturas no mês
}

export const invoiceKey = (profileId: string | undefined, cardId: string, month: MonthKey) =>
  `${profileId ?? ''}|${cardId}|${month}`;

export const isCardTransaction = (tx: Pick<Transaction, 'type' | 'paymentMethod' | 'cardId'>) =>
  tx.type === 'expense' && (tx.paymentMethod === 'credit_card' || (!tx.paymentMethod && !!tx.cardId));

interface FinanceContextType {
  /** Mês usado em todas as análises (receitas, despesas, saldo) */
  referenceMonth: MonthKey;
  setReferenceMonth: (month: MonthKey) => void;

  transactions: any[];
  setTransactions: (transactions: any[]) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'profile_id'>) => void;
  deleteTransaction: (id: string) => void;

  cards: any[];
  setCards: (cards: any[]) => void;
  /** Parcelas e assinaturas no cartão (todas as faturas) */
  installments: Installment[];
  getInstallmentsForInvoice: (month: MonthKey, cardId?: string) => Installment[];
  getInvoice: (profileId: string | undefined, cardId: string, month: MonthKey) => InvoiceState;
  toggleInstallmentChecked: (inst: Installment) => void;
  setInvoiceStatementAmount: (profileId: string | undefined, cardId: string, month: MonthKey, amount?: number) => void;
  setInvoicePaid: (profileId: string | undefined, cardId: string, month: MonthKey, paid: boolean) => void;

  debts: any[];
  setDebts: (debts: any[]) => void;

  subscriptions: Subscription[];
  saveSubscription: (sub: Omit<Subscription, 'id' | 'profile_id' | 'periods' | 'status'> & { id?: string }) => void;
  setSubscriptionStatus: (id: string, status: Subscription['status']) => void;
  deleteSubscription: (id: string) => void;

  goals: Goal[];
  saveGoal: (goal: Omit<Goal, 'id' | 'profile_id' | 'contributions' | 'createdAt' | 'status'> & { id?: string }) => void;
  setGoalStatus: (id: string, status: Goal['status']) => void;
  deleteGoal: (id: string) => void;
  addGoalContribution: (goalId: string, amount: number, date?: string) => void;

  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  countTransactionsInCategory: (name: string) => number;

  /** Renda mensal esperada (perfil ativo, ou soma dos perfis na visão Família) */
  expectedIncome: number;
  getMonthSummary: (month: MonthKey) => MonthSummary;
  getHealth: (month?: MonthKey) => FinancialHealth;
  getBudgets: (month?: MonthKey) => Array<{ category: Category; limit: number; spent: number }>;
  getScore: (month?: MonthKey) => { total: number | null; criteria: ScoreCriterion[] };
  getForecast: (months?: number) => ForecastMonth[];

  // Atalhos do mês de referência (compatibilidade)
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getExpensesByCategory: () => Record<string, number>;
  getTotalCardUsage: () => number;
  getBalance: () => number;
  getSavingsRate: () => number;
  getTotalDebtPayments: () => number;
  getRealBalance: () => number;
  getRealSavingsRate: () => number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// As páginas usam camelCase; o banco usa snake_case
function fromDbDebt(debt: DbDebt) {
  return {
    id: debt.id,
    profile_id: debt.profile_id,
    name: debt.name,
    type: debt.type,
    totalAmount: Number(debt.total_amount),
    remainingAmount: Number(debt.remaining_amount),
    monthlyPayment: Number(debt.monthly_payment),
    interestRate: Number(debt.interest_rate),
    installmentsPaid: debt.installments_paid,
    totalInstallments: debt.total_installments,
    nextDueDate: debt.next_due_date,
    creditor: debt.creditor,
    color: debt.color,
  };
}

const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { profiles, activeProfileId, activeProfile, isFamilyView } = useProfiles();
  const { transactions: supabaseTransactions } = useTransactions();
  const { debts: supabaseDebts } = useDebts();

  const remote = isSupabaseConfigured && !!user && user.id !== 'offline-user';
  const firstProfileId = profiles[0]?.id;
  /** Perfil que recebe itens novos (na visão Família, o primeiro perfil) */
  const targetProfileId = isFamilyView ? firstProfileId : activeProfileId ?? undefined;

  // Dados de TODOS os perfis da conta; cada item carrega profile_id
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [allDebts, setAllDebts] = useState<any[]>([]);
  const [allCards, setAllCards] = useState<any[]>([]);
  const [allSubscriptions, setAllSubscriptions] = useState<Subscription[]>([]);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);

  // Exemplo no primeiro perfil. Cartões, assinaturas e metas ainda não têm tabela no banco.
  useEffect(() => {
    if (!firstProfileId) return;
    setAllCards(seedCards(firstProfileId));
    if (!remote) {
      setAllTransactions(seedTransactions(firstProfileId));
      setAllDebts(seedDebts(firstProfileId));
      setAllSubscriptions(seedSubscriptions(firstProfileId));
      setAllGoals(seedGoals(firstProfileId));
    }
  }, [firstProfileId, remote]);

  useEffect(() => {
    if (remote) setAllTransactions(supabaseTransactions.map(tx => ({ ...tx, amount: Number(tx.amount) })));
  }, [remote, supabaseTransactions]);

  useEffect(() => {
    if (remote) setAllDebts(supabaseDebts.map(fromDbDebt));
  }, [remote, supabaseDebts]);

  const inView = useCallback(
    (item: { profile_id?: string }) => isFamilyView || item.profile_id === activeProfileId,
    [isFamilyView, activeProfileId]
  );

  // Setter que só substitui os itens visíveis no perfil atual, preservando os dos outros perfis.
  const scopedSetter = useCallback(
    (setAll: React.Dispatch<React.SetStateAction<any[]>>) => (next: any[]) => {
      const tagged = next.map(item => (item.profile_id ? item : { ...item, profile_id: targetProfileId }));
      setAll(prev => [...prev.filter(item => !inView(item)), ...tagged]);
    },
    [inView, targetProfileId]
  );

  const [referenceMonth, setReferenceMonth] = useState<MonthKey>(() => currentMonthKey());
  const [invoices, setInvoices] = useState<Record<string, InvoiceState>>({});

  const transactions = useMemo(() => allTransactions.filter(inView), [allTransactions, inView]);
  const debts = useMemo(() => allDebts.filter(inView), [allDebts, inView]);
  const subscriptions = useMemo(() => allSubscriptions.filter(inView), [allSubscriptions, inView]);
  const goals = useMemo(() => allGoals.filter(inView), [allGoals, inView]);

  const closingDayOf = useCallback(
    (profileId: string | undefined, cardId: string) =>
      allCards.find(c => c.id === cardId && c.profile_id === profileId)?.closingDay ?? DEFAULT_CLOSING_DAY,
    [allCards]
  );

  // Assinaturas geradas até o mês seguinte ao mais distante que está sendo visto
  const horizon = useMemo(() => {
    const now = currentMonthKey();
    return addMonths(referenceMonth > now ? referenceMonth : now, 1);
  }, [referenceMonth]);

  const subscriptionCharges = useMemo(() => {
    const card: Installment[] = [];
    const cash: CashCharge[] = [];
    subscriptions.forEach(sub => {
      const expanded = expandSubscription(sub, horizon, sub.cardId ? closingDayOf(sub.profile_id, sub.cardId) : DEFAULT_CLOSING_DAY);
      card.push(...expanded.card);
      cash.push(...expanded.cash);
    });
    return { card, cash };
  }, [subscriptions, horizon, closingDayOf]);

  const installments = useMemo(
    () => [
      ...(transactions as Transaction[])
        .filter(tx => isCardTransaction(tx) && tx.cardId)
        .flatMap(tx => expandInstallments({ ...tx, cardId: tx.cardId! }, closingDayOf(tx.profile_id, tx.cardId!))),
      ...subscriptionCharges.card,
    ],
    [transactions, subscriptionCharges, closingDayOf]
  );

  // ============================================
  // Faturas
  // ============================================
  const getInvoice = useCallback(
    (profileId: string | undefined, cardId: string, month: MonthKey): InvoiceState =>
      invoices[invoiceKey(profileId, cardId, month)] ?? { checked: [] },
    [invoices]
  );

  const updateInvoice = (profileId: string | undefined, cardId: string, month: MonthKey, patch: (inv: InvoiceState) => InvoiceState) => {
    const key = invoiceKey(profileId, cardId, month);
    setInvoices(prev => ({ ...prev, [key]: patch(prev[key] ?? { checked: [] }) }));
  };

  const toggleInstallmentChecked = (inst: Installment) =>
    updateInvoice(inst.profile_id, inst.cardId, inst.invoiceMonth, inv => ({
      ...inv,
      checked: inv.checked.includes(inst.key) ? inv.checked.filter(k => k !== inst.key) : [...inv.checked, inst.key],
    }));

  const setInvoiceStatementAmount = (profileId: string | undefined, cardId: string, month: MonthKey, amount?: number) =>
    updateInvoice(profileId, cardId, month, inv => ({ ...inv, statementAmount: amount }));

  // Pagar a fatura libera o limite. A despesa já conta no mês da fatura, então não é lançada de novo.
  const setInvoicePaid = (profileId: string | undefined, cardId: string, month: MonthKey, paid: boolean) =>
    updateInvoice(profileId, cardId, month, inv => ({ ...inv, paidAt: paid ? new Date().toISOString() : undefined }));

  const getInstallmentsForInvoice = (month: MonthKey, cardId?: string) =>
    installments.filter(i => i.invoiceMonth === month && (!cardId || i.cardId === cardId));

  // Limite usado = parcelas de faturas não pagas (inclusive futuras) + assinaturas já cobradas
  const cards = useMemo(() => {
    const today = todayISO();
    return allCards.filter(inView).map(card => {
      const closingDay = card.closingDay ?? DEFAULT_CLOSING_DAY;
      const own = installments.filter(i => i.cardId === card.id && i.profile_id === card.profile_id);
      const unpaid = own.filter(
        i =>
          !invoices[invoiceKey(i.profile_id, i.cardId, i.invoiceMonth)]?.paidAt &&
          (i.source !== 'subscription' || i.purchaseDate <= today)
      );
      const used = unpaid.reduce((sum, i) => sum + i.amount, 0);
      const openMonth = invoiceMonthOf(today, closingDay);
      const nextInvoice = own.filter(i => i.invoiceMonth === openMonth).reduce((sum, i) => sum + i.amount, 0);
      const dueDay = card.dueDay ?? 15;
      const dueMonth = dueDay > closingDay ? openMonth : addMonths(openMonth, 1);
      return {
        ...card,
        used,
        availableLimit: card.limit - used,
        nextInvoice,
        openInvoiceMonth: openMonth,
        nextDueDate: `${dueMonth}-${String(dueDay).padStart(2, '0')}`,
        installments: new Set(unpaid.filter(i => i.total > 1).map(i => i.purchaseId)).size,
      };
    });
  }, [allCards, installments, invoices, inView]);

  // ============================================
  // Transações, dívidas, cartões
  // ============================================
  const addTransaction = (tx: Omit<Transaction, 'id' | 'profile_id'>) => {
    setAllTransactions(prev => [{ ...tx, id: newId('tx'), profile_id: targetProfileId }, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setAllTransactions(prev => prev.filter(tx => tx.id !== id));
  };

  const setTransactions = useMemo(() => scopedSetter(setAllTransactions), [scopedSetter]);
  const setDebts = useMemo(() => scopedSetter(setAllDebts), [scopedSetter]);
  const setCards = useMemo(() => scopedSetter(setAllCards), [scopedSetter]);

  // ============================================
  // Assinaturas
  // ============================================
  const saveSubscription: FinanceContextType['saveSubscription'] = input => {
    if (input.id) {
      setAllSubscriptions(prev => prev.map(s => (s.id === input.id ? { ...s, ...input, id: s.id } : s)));
      return;
    }
    const { id: _ignored, ...data } = input;
    setAllSubscriptions(prev => [
      ...prev,
      { ...data, id: newId('sub'), profile_id: targetProfileId, status: 'active', periods: [{ start: todayISO() }] },
    ]);
  };

  const setSubscriptionStatus = (id: string, status: Subscription['status']) =>
    setAllSubscriptions(prev => prev.map(s => (s.id === id ? withSubscriptionStatus(s, status) : s)));

  const deleteSubscription = (id: string) => setAllSubscriptions(prev => prev.filter(s => s.id !== id));

  // ============================================
  // Metas
  // ============================================
  const saveGoal: FinanceContextType['saveGoal'] = input => {
    if (input.id) {
      setAllGoals(prev => prev.map(g => (g.id === input.id ? { ...g, ...input, id: g.id } : g)));
      return;
    }
    const { id: _ignored, ...data } = input;
    setAllGoals(prev => [
      ...prev,
      { ...data, id: newId('goal'), profile_id: targetProfileId, status: 'active', createdAt: todayISO(), contributions: [] },
    ]);
  };

  const setGoalStatus = (id: string, status: Goal['status']) =>
    setAllGoals(prev => prev.map(g => (g.id === id ? { ...g, status } : g)));

  const deleteGoal = (id: string) => setAllGoals(prev => prev.filter(g => g.id !== id));

  const addGoalContribution = (goalId: string, amount: number, date = todayISO()) =>
    setAllGoals(prev =>
      prev.map(g => (g.id === goalId ? { ...g, contributions: [...g.contributions, { id: newId('c'), date, amount }] } : g))
    );

  // ============================================
  // Categorias (compartilhadas entre os perfis; o limite é o orçamento mensal)
  // ============================================
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Alimentação', icon: '🍔', type: 'expense', budgetLimit: 1500 },
    { id: '2', name: 'Moradia', icon: '🏠', type: 'expense', budgetLimit: 2500 },
    { id: '3', name: 'Transporte', icon: '🚗', type: 'expense', budgetLimit: 800 },
    { id: '4', name: 'Saúde', icon: '🏥', type: 'expense', budgetLimit: 500 },
    { id: '5', name: 'Lazer', icon: '🎬', type: 'expense', budgetLimit: 600 },
    { id: '6', name: 'Educação', icon: '📚', type: 'expense', budgetLimit: 300 },
    { id: '7', name: 'Trabalho', icon: '💼', type: 'expense', budgetLimit: 150 },
    { id: '8', name: 'Outros', icon: '📁', type: 'expense' },
    { id: '9', name: 'Salário', icon: '💰', type: 'income' },
    { id: '10', name: 'Renda Extra', icon: '💵', type: 'income' },
    { id: '11', name: 'Freelance', icon: '💻', type: 'income' },
    { id: '12', name: 'Investimentos', icon: '📈', type: 'income' },
  ]);

  const addCategory = (category: Omit<Category, 'id'>) => {
    setCategories(prev => [...prev, { ...category, id: Date.now().toString() }]);
  };

  // Transações e assinaturas guardam o NOME da categoria: renomear/excluir precisa refletir nelas
  const renameCategoryUsages = (from: string, to: string) => {
    setAllTransactions(prev => prev.map(tx => (tx.category === from ? { ...tx, category: to } : tx)));
    setAllSubscriptions(prev => prev.map(s => (s.category === from ? { ...s, category: to } : s)));
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    const current = categories.find(cat => cat.id === id);
    const newName = updates.name?.trim();
    if (current && newName && newName !== current.name) renameCategoryUsages(current.name, newName);
    setCategories(prev =>
      prev.map(cat => (cat.id === id ? { ...cat, ...updates, ...(newName ? { name: newName } : {}) } : cat))
    );
  };

  // O que estava na categoria excluída passa para "Outros"
  const deleteCategory = (id: string) => {
    const current = categories.find(cat => cat.id === id);
    if (current) renameCategoryUsages(current.name, 'Outros');
    setCategories(prev => {
      const next = prev.filter(cat => cat.id !== id);
      const needsOthers = current?.type === 'expense' && !next.some(c => c.name === 'Outros' && c.type === 'expense');
      return needsOthers ? [...next, { id: Date.now().toString(), name: 'Outros', icon: '📁', type: 'expense' }] : next;
    });
  };

  const countTransactionsInCategory = (name: string) =>
    allTransactions.filter(tx => tx.category === name).length + allSubscriptions.filter(s => s.category === name).length;

  // ============================================
  // Análises
  // ============================================
  const expectedIncome = isFamilyView
    ? profiles.reduce((sum, p) => sum + (Number(p.expected_income) || 0), 0)
    : Number(activeProfile?.expected_income) || 0;

  const getMonthSummary = useCallback(
    (month: MonthKey): MonthSummary => {
      const byCategory: Record<string, number> = {};
      const add = (category: string, amount: number) => {
        byCategory[category] = (byCategory[category] ?? 0) + amount;
      };

      let income = 0;
      let cashExpenses = 0;
      (transactions as Transaction[]).forEach(tx => {
        if (monthOfDate(tx.date) !== month) return;
        if (tx.type === 'income') income += tx.amount;
        else if (!isCardTransaction(tx)) {
          cashExpenses += tx.amount;
          add(tx.category, tx.amount);
        }
      });

      const cashCharges = subscriptionCharges.cash.filter(c => monthOfDate(c.date) === month);
      cashCharges.forEach(c => add(c.category, c.amount));
      const cashSubscriptions = cashCharges.reduce((s, c) => s + c.amount, 0);

      const monthInstallments = installments.filter(i => i.invoiceMonth === month);
      monthInstallments.forEach(i => add(i.category, i.amount));
      const cardExpenses = monthInstallments.reduce((s, i) => s + i.amount, 0);
      const cardSubscriptions = monthInstallments.filter(i => i.source === 'subscription').reduce((s, i) => s + i.amount, 0);

      return {
        month,
        income,
        cashExpenses: cashExpenses + cashSubscriptions,
        cardExpenses,
        subscriptionExpenses: cashSubscriptions + cardSubscriptions,
        expenses: cashExpenses + cashSubscriptions + cardExpenses,
        byCategory,
        goalContributions: goals.reduce((s, g) => s + goalContributionsInMonth(g, month), 0),
        cashCharges,
      };
    },
    [transactions, subscriptionCharges, installments, goals]
  );

  const getTotalDebtPayments = () => debts.reduce((sum, debt) => sum + debt.monthlyPayment, 0);

  const getHealth = (month = referenceMonth) => {
    const summary = getMonthSummary(month);
    return computeHealth(summary.income, summary.expenses, getTotalDebtPayments());
  };

  const getBudgets = (month = referenceMonth) => {
    const { byCategory } = getMonthSummary(month);
    return categories
      .filter(c => c.type === 'expense' && (c.budgetLimit ?? 0) > 0)
      .map(c => ({ category: c, limit: c.budgetLimit as number, spent: byCategory[c.name] ?? 0 }));
  };

  const getScore = (month = referenceMonth) => {
    const health = getHealth(month);
    return computeScore({
      income: health.income,
      realSavingsRate: health.realSavingsRate,
      debtCommitmentPercentage: health.debtCommitmentPercentage,
      budgets: getBudgets(month),
      goals,
      cards,
    });
  };

  // Projeção a partir do mês de referência:
  // renda esperada (ou a do mês), gastos habituais (à vista e compras à vista no cartão feitas no mês base),
  // parcelas e assinaturas já conhecidas,
  // parcelas de dívidas enquanto durarem e aportes planejados das metas ativas.
  const getForecast = (months = 6) => {
    const base = getMonthSummary(referenceMonth);
    const txs = transactions as Transaction[];
    const habitualCash = txs
      .filter(tx => tx.type === 'expense' && !isCardTransaction(tx) && monthOfDate(tx.date) === referenceMonth)
      .reduce((s, tx) => s + tx.amount, 0);
    const oneOffCardIds = new Set(txs.filter(tx => isCardTransaction(tx) && (tx.installments ?? 1) <= 1).map(tx => tx.id));
    // Hábito no cartão = compras à vista FEITAS no mês base (a fatura do mês base só pega parte delas)
    const habitualCard = txs
      .filter(tx => oneOffCardIds.has(tx.id) && monthOfDate(tx.date) === referenceMonth)
      .reduce((s, tx) => s + tx.amount, 0);

    // parcelas (>1x) e assinaturas conhecidas para meses futuros
    const futureHorizon = addMonths(referenceMonth, months + 1);
    const futureSubs = subscriptions.map(sub =>
      expandSubscription(sub, futureHorizon, sub.cardId ? closingDayOf(sub.profile_id, sub.cardId) : DEFAULT_CLOSING_DAY)
    );
    const committedExpenses = (month: MonthKey) =>
      installments
        .filter(i => i.invoiceMonth === month && i.source !== 'subscription' && !oneOffCardIds.has(i.purchaseId))
        .reduce((s, i) => s + i.amount, 0) +
      futureSubs.reduce(
        (s, e) =>
          s +
          e.card.filter(i => i.invoiceMonth === month).reduce((a, i) => a + i.amount, 0) +
          e.cash.filter(c => monthOfDate(c.date) === month).reduce((a, c) => a + c.amount, 0),
        0
      );

    return buildForecast({
      fromMonth: referenceMonth,
      months,
      income: expectedIncome > 0 ? expectedIncome : base.income,
      habitualExpenses: habitualCash + habitualCard,
      committedExpenses,
      debts: debts.map(d => ({
        monthlyPayment: d.monthlyPayment,
        remainingInstallments: Math.max(0, (d.totalInstallments ?? 0) - (d.installmentsPaid ?? 0)),
      })),
      plannedContributions: goals.filter(g => g.status === 'active').reduce((s, g) => s + (g.monthlyContribution || 0), 0),
    });
  };

  // Atalhos do mês de referência
  const getTotalIncome = () => getMonthSummary(referenceMonth).income;
  const getTotalExpenses = () => getMonthSummary(referenceMonth).expenses;
  const getExpensesByCategory = () => getMonthSummary(referenceMonth).byCategory;
  const getTotalCardUsage = () => cards.reduce((sum, card) => sum + card.used, 0);
  const getBalance = () => getTotalIncome() - getTotalExpenses();
  const getSavingsRate = () => getHealth().savingsRate;
  const getRealBalance = () => getHealth().availableAfterDebts;
  const getRealSavingsRate = () => getHealth().realSavingsRate;

  const value: FinanceContextType = {
    referenceMonth,
    setReferenceMonth,
    transactions,
    setTransactions,
    addTransaction,
    deleteTransaction,
    cards,
    setCards,
    installments,
    getInstallmentsForInvoice,
    getInvoice,
    toggleInstallmentChecked,
    setInvoiceStatementAmount,
    setInvoicePaid,
    debts,
    setDebts,
    subscriptions,
    saveSubscription,
    setSubscriptionStatus,
    deleteSubscription,
    goals,
    saveGoal,
    setGoalStatus,
    deleteGoal,
    addGoalContribution,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    countTransactionsInCategory,
    expectedIncome,
    getMonthSummary,
    getHealth,
    getBudgets,
    getScore,
    getForecast,
    getTotalIncome,
    getTotalExpenses,
    getExpensesByCategory,
    getTotalCardUsage,
    getBalance,
    getSavingsRate,
    getTotalDebtPayments,
    getRealBalance,
    getRealSavingsRate,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}

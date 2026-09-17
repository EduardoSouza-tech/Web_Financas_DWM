'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { isUuid, loadAll, newUuid, repo } from '@/lib/finance/repository';
import {
  addAchievement as addLocalAchievement,
  clearAchievements as clearLocalAchievements,
  loadAchievements as loadLocalAchievements,
  type DebtAchievement,
} from '@/lib/finance/achievements';

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

export type SyncState = 'offline' | 'loading' | 'ready' | 'error';

const DEFAULT_CATEGORIES: Array<Omit<Category, 'id'>> = [
  { name: 'Alimentação', icon: '🍔', type: 'expense', budgetLimit: 1500 },
  { name: 'Moradia', icon: '🏠', type: 'expense', budgetLimit: 2500 },
  { name: 'Transporte', icon: '🚗', type: 'expense', budgetLimit: 800 },
  { name: 'Saúde', icon: '🏥', type: 'expense', budgetLimit: 500 },
  { name: 'Lazer', icon: '🎬', type: 'expense', budgetLimit: 600 },
  { name: 'Educação', icon: '📚', type: 'expense', budgetLimit: 300 },
  { name: 'Trabalho', icon: '💼', type: 'expense', budgetLimit: 150 },
  { name: 'Outros', icon: '📁', type: 'expense' },
  { name: 'Salário', icon: '💰', type: 'income' },
  { name: 'Renda Extra', icon: '💵', type: 'income' },
  { name: 'Freelance', icon: '💻', type: 'income' },
  { name: 'Investimentos', icon: '📈', type: 'income' },
];

interface FinanceContextType {
  /** 'offline' = só no navegador; 'loading'/'ready'/'error' = dados no Supabase */
  syncState: SyncState;
  /** Última falha ao ler ou gravar no banco (null se está tudo salvo) */
  syncError: string | null;
  dismissSyncError: () => void;
  reload: () => void;

  achievements: DebtAchievement[];
  addAchievement: (debt: any, amountPaid?: number) => void;
  clearAchievements: () => void;

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

// IDs no formato do banco (UUID) também no modo offline
const newId = (_prefix?: string) => newUuid();

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { profiles, activeProfileId, activeProfile, isFamilyView } = useProfiles();

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

  const [categories, setCategories] = useState<Category[]>(() => DEFAULT_CATEGORIES.map(c => ({ ...c, id: newId() })));
  const [invoices, setInvoices] = useState<Record<string, InvoiceState>>({});
  const [achievements, setAchievements] = useState<DebtAchievement[]>([]);
  const [syncState, setSyncState] = useState<SyncState>(remote ? 'loading' : 'offline');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Grava no banco em segundo plano; a tela já foi atualizada. Falha vira aviso para o usuário.
  const persist = useCallback(
    (action: () => Promise<unknown>) => {
      if (!remote || !user) return;
      action().catch((err: Error) => {
        console.error('Erro ao salvar no Supabase:', err);
        setSyncError(err.message);
      });
    },
    [remote, user]
  );

  // Modo offline: dados de exemplo no primeiro perfil (somem ao recarregar)
  useEffect(() => {
    if (remote || !firstProfileId) return;
    setAllCards(seedCards(firstProfileId));
    setAllTransactions(seedTransactions(firstProfileId));
    setAllDebts(seedDebts(firstProfileId));
    setAllSubscriptions(seedSubscriptions(firstProfileId));
    setAllGoals(seedGoals(firstProfileId));
    setAchievements(loadLocalAchievements());
    setSyncState('offline');
  }, [firstProfileId, remote]);

  // Supabase: carrega tudo da conta (todos os perfis) ao entrar
  useEffect(() => {
    if (!remote || !user) return;
    let cancelled = false;
    setSyncState('loading');
    loadAll()
      .then(async data => {
        if (cancelled) return;
        setAllTransactions(data.transactions);
        setAllDebts(data.debts);
        setAllCards(data.cards);
        setAllSubscriptions(data.subscriptions);
        setAllGoals(data.goals);
        setAchievements(data.achievements);
        setInvoices(
          Object.fromEntries(
            data.invoices.map(inv => [
              invoiceKey(inv.profile_id, inv.cardId, inv.month),
              { checked: inv.checked, statementAmount: inv.statementAmount, paidAt: inv.paidAt },
            ])
          )
        );
        if (data.categories.length > 0) {
          setCategories(data.categories);
        } else {
          // Primeira vez da conta: cria as categorias padrão no banco
          const defaults = DEFAULT_CATEGORIES.map(c => ({ ...c, id: newId() }));
          setCategories(defaults);
          await repo.insertCategories(user.id, defaults);
        }
        if (!cancelled) setSyncState('ready');
      })
      .catch((err: Error) => {
        if (cancelled) return;
        console.error('Erro ao carregar do Supabase:', err);
        setSyncError(err.message);
        setSyncState('error');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote, user?.id, reloadToken]);

  const inView = useCallback(
    (item: { profile_id?: string }) => isFamilyView || item.profile_id === activeProfileId,
    [isFamilyView, activeProfileId]
  );

  // Setter que só substitui os itens visíveis no perfil atual, preservando os dos outros perfis,
  // e grava no banco o que foi incluído, alterado ou removido.
  const scopedSetter = useCallback(
    (
      all: any[],
      setAll: React.Dispatch<React.SetStateAction<any[]>>,
      save: (userId: string, item: any) => Promise<unknown>,
      remove: (id: string) => Promise<unknown>
    ) =>
      (next: any[]) => {
        const tagged = next.map(item => ({
          ...item,
          // No banco o id é UUID; itens novos das telas chegam com ids como "card-123".
          // No modo offline os ids de exemplo ('1', '2'...) são mantidos porque as compras apontam para eles.
          id: item.id && (!remote || isUuid(item.id)) ? item.id : newId(),
          profile_id: item.profile_id ?? targetProfileId,
        }));
        const before = new Map(all.filter(inView).map(item => [item.id, item]));
        setAll(prev => [...prev.filter(item => !inView(item)), ...tagged]);

        if (!user) return;
        const nextIds = new Set(tagged.map(item => item.id));
        tagged
          .filter(item => JSON.stringify(item) !== JSON.stringify(before.get(item.id)))
          .forEach(item => persist(() => save(user.id, item)));
        before.forEach((_item, id) => {
          if (!nextIds.has(id)) persist(() => remove(id));
        });
      },
    [inView, targetProfileId, persist, user, remote]
  );

  const [referenceMonth, setReferenceMonth] = useState<MonthKey>(() => currentMonthKey());

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

  // Faturas alteradas ficam marcadas e são gravadas depois que o estado é atualizado
  const dirtyInvoices = useRef(new Set<string>());
  const updateInvoice = (profileId: string | undefined, cardId: string, month: MonthKey, patch: (inv: InvoiceState) => InvoiceState) => {
    const key = invoiceKey(profileId, cardId, month);
    dirtyInvoices.current.add(key);
    setInvoices(prev => ({ ...prev, [key]: patch(prev[key] ?? { checked: [] }) }));
  };

  useEffect(() => {
    if (!remote || !user || dirtyInvoices.current.size === 0) return;
    const keys = Array.from(dirtyInvoices.current);
    dirtyInvoices.current.clear();
    keys.forEach(key => {
      const inv = invoices[key];
      const [profileId, cardId, month] = key.split('|');
      if (!inv || !isUuid(cardId)) return;
      persist(() =>
        repo.upsertInvoice(user.id, {
          profile_id: profileId,
          cardId,
          month,
          checked: inv.checked,
          statementAmount: inv.statementAmount,
          paidAt: inv.paidAt,
        })
      );
    });
  }, [invoices, remote, user, persist]);

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
    const record = { ...tx, id: newId('tx'), profile_id: targetProfileId };
    setAllTransactions(prev => [record, ...prev]);
    persist(() => repo.upsertTransaction(user!.id, record));
  };

  const deleteTransaction = (id: string) => {
    setAllTransactions(prev => prev.filter(tx => tx.id !== id));
    persist(() => repo.deleteTransaction(id));
  };

  const setTransactions = scopedSetter(allTransactions, setAllTransactions, repo.upsertTransaction, repo.deleteTransaction);
  const setDebts = scopedSetter(allDebts, setAllDebts, repo.upsertDebt, repo.deleteDebt);
  const setCards = scopedSetter(allCards, setAllCards, repo.upsertCard, repo.deleteCard);

  // ============================================
  // Assinaturas
  // ============================================
  const replaceSubscription = (next: Subscription) => {
    setAllSubscriptions(prev => prev.map(s => (s.id === next.id ? next : s)));
    persist(() => repo.upsertSubscription(user!.id, next));
  };

  const saveSubscription: FinanceContextType['saveSubscription'] = input => {
    if (input.id) {
      const current = allSubscriptions.find(s => s.id === input.id);
      if (current) replaceSubscription({ ...current, ...input, id: current.id });
      return;
    }
    const { id: _ignored, ...data } = input;
    const created: Subscription = {
      ...data,
      id: newId('sub'),
      profile_id: targetProfileId,
      status: 'active',
      periods: [{ start: todayISO() }],
    };
    setAllSubscriptions(prev => [...prev, created]);
    persist(() => repo.upsertSubscription(user!.id, created));
  };

  const setSubscriptionStatus = (id: string, status: Subscription['status']) => {
    const current = allSubscriptions.find(s => s.id === id);
    if (current) replaceSubscription(withSubscriptionStatus(current, status));
  };

  const deleteSubscription = (id: string) => {
    setAllSubscriptions(prev => prev.filter(s => s.id !== id));
    persist(() => repo.deleteSubscription(id));
  };

  // ============================================
  // Metas
  // ============================================
  const replaceGoal = (next: Goal) => {
    setAllGoals(prev => prev.map(g => (g.id === next.id ? next : g)));
    persist(() => repo.upsertGoal(user!.id, next));
  };

  const saveGoal: FinanceContextType['saveGoal'] = input => {
    if (input.id) {
      const current = allGoals.find(g => g.id === input.id);
      if (current) replaceGoal({ ...current, ...input, id: current.id });
      return;
    }
    const { id: _ignored, ...data } = input;
    const created: Goal = {
      ...data,
      id: newId('goal'),
      profile_id: targetProfileId,
      status: 'active',
      createdAt: todayISO(),
      contributions: [],
    };
    setAllGoals(prev => [...prev, created]);
    persist(() => repo.upsertGoal(user!.id, created));
  };

  const setGoalStatus = (id: string, status: Goal['status']) => {
    const current = allGoals.find(g => g.id === id);
    if (current) replaceGoal({ ...current, status });
  };

  const deleteGoal = (id: string) => {
    setAllGoals(prev => prev.filter(g => g.id !== id));
    persist(() => repo.deleteGoal(id));
  };

  const addGoalContribution = (goalId: string, amount: number, date = todayISO()) => {
    const goal = allGoals.find(g => g.id === goalId);
    if (!goal) return;
    const contribution = { id: newId('c'), date, amount };
    setAllGoals(prev => prev.map(g => (g.id === goalId ? { ...g, contributions: [...g.contributions, contribution] } : g)));
    persist(() => repo.insertContribution(user!.id, goal, contribution));
  };

  // ============================================
  // Conquistas (dívidas quitadas)
  // ============================================
  const addAchievement = (debt: any, amountPaid = debt.remainingAmount) => {
    if (!remote) {
      setAchievements(addLocalAchievement(debt, amountPaid));
      return;
    }
    if (achievements.some(a => a.debtId === debt.id && a.profile_id === debt.profile_id) || !isUuid(debt.id)) return;
    const achievement: DebtAchievement = {
      id: newId(),
      profile_id: debt.profile_id,
      debtId: debt.id,
      debtName: debt.name,
      amount: amountPaid,
      paidAt: new Date().toISOString(),
      monthlyPaymentFreed: debt.monthlyPayment,
      interestRate: debt.interestRate,
    };
    setAchievements(prev => [...prev, achievement]);
    persist(() => repo.insertAchievement(user!.id, achievement));
  };

  const clearAchievements = () => {
    if (!remote) {
      setAchievements(clearLocalAchievements(inView));
      return;
    }
    const ids = achievements.filter(inView).map(a => a.id);
    setAchievements(prev => prev.filter(a => !inView(a)));
    if (ids.length) persist(() => repo.deleteAchievements(ids));
  };

  // ============================================
  // Categorias (compartilhadas entre os perfis; o limite é o orçamento mensal)
  // ============================================
  const addCategory = (category: Omit<Category, 'id'>) => {
    const created = { ...category, id: newId() };
    setCategories(prev => [...prev, created]);
    persist(() => repo.upsertCategory(user!.id, created));
  };

  // Transações e assinaturas guardam o NOME da categoria: renomear/excluir precisa refletir nelas
  const renameCategoryUsages = (from: string, to: string) => {
    setAllTransactions(prev => prev.map(tx => (tx.category === from ? { ...tx, category: to } : tx)));
    setAllSubscriptions(prev => prev.map(s => (s.category === from ? { ...s, category: to } : s)));
    persist(() => repo.updateTransactionsCategory(from, to));
    persist(() => repo.updateSubscriptionsCategory(from, to));
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    const current = categories.find(cat => cat.id === id);
    if (!current) return;
    const newName = updates.name?.trim();
    if (newName && newName !== current.name) renameCategoryUsages(current.name, newName);
    const next = { ...current, ...updates, ...(newName ? { name: newName } : {}) };
    setCategories(prev => prev.map(cat => (cat.id === id ? next : cat)));
    persist(() => repo.upsertCategory(user!.id, next));
  };

  // O que estava na categoria excluída passa para "Outros"
  const deleteCategory = (id: string) => {
    const current = categories.find(cat => cat.id === id);
    if (!current) return;
    renameCategoryUsages(current.name, 'Outros');
    const remaining = categories.filter(cat => cat.id !== id);
    const needsOthers = current.type === 'expense' && !remaining.some(c => c.name === 'Outros' && c.type === 'expense');
    const others: Category = { id: newId(), name: 'Outros', icon: '📁', type: 'expense' };
    setCategories(needsOthers ? [...remaining, others] : remaining);
    persist(() => repo.deleteCategory(id));
    if (needsOthers) persist(() => repo.upsertCategory(user!.id, others));
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
    syncState,
    syncError,
    dismissSyncError: () => setSyncError(null),
    reload: () => {
      setSyncError(null);
      setReloadToken(t => t + 1);
    },
    achievements: achievements.filter(inView),
    addAchievement,
    clearAchievements,
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

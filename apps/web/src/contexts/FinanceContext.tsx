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
  amountForProfile,
  involvesProfile,
  type Installment,
  type MonthKey,
  type Split,
} from '@/lib/finance/credit-card';
import {
  addMonthsToDate,
  buildForecast,
  computeScore,
  debtPaymentsForMonth,
  remainingInstallments,
  expandSubscription,
  goalContributionsInMonth,
  todayISO,
  withSubscriptionStatus,
  type CashCharge,
  type DebtPayment,
  type DebtShare,
  type ForecastMonth,
  type Goal,
  type ScoreCriterion,
  type Subscription,
} from '@/lib/finance/engine';
import { computeHealth, type FinancialHealth } from '@/lib/finance/health';
import { seedCards, seedDebts, seedGoals, seedSubscriptions, seedTransactions } from '@/lib/finance/seed';
import { computeBalances, settleBalances, type Balance, type SharedItem, type Transfer } from '@/lib/finance/settlement';
import { isUuid, loadAll, newUuid, repo } from '@/lib/finance/repository';
import { enqueue, flushQueue, isNetworkError, readQueue, type RepoMethod } from '@/lib/finance/sync-queue';
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
  /** Divisão entre perfis; vazio = tudo de quem lançou */
  splits?: Split[];
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
  /** Alterações guardadas no navegador esperando a conexão voltar */
  pendingSync: number;
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
  /** Cartões de todos os perfis da conta (para lançar compra no cartão de outra pessoa) */
  allCards: any[];
  /** Parcelas e assinaturas no cartão (todas as faturas) */
  installments: Installment[];
  getInstallmentsForInvoice: (month: MonthKey, cardId?: string) => Installment[];
  getInvoice: (profileId: string | undefined, cardId: string, month: MonthKey) => InvoiceState;
  toggleInstallmentChecked: (inst: Installment) => void;
  setInvoiceStatementAmount: (profileId: string | undefined, cardId: string, month: MonthKey, amount?: number) => void;
  setInvoicePaid: (profileId: string | undefined, cardId: string, month: MonthKey, paid: boolean) => void;

  /** Dívidas ativas do perfil */
  debts: any[];
  /** Partes de cada perfil nas dívidas divididas */
  debtShares: DebtShare[];
  /** Um perfil paga a parte dele na parcela atual */
  payDebtShare: (debtId: string, profileId: string, date?: string) => void;
  /** Quem deve a quem: saldos e transferências que zeram a conta */
  getSettlement: (month?: MonthKey) => { items: SharedItem[]; balances: Balance[]; transfers: Transfer[] };
  /** Dívidas quitadas (histórico) */
  paidDebts: any[];
  debtPayments: DebtPayment[];
  addDebt: (debt: any) => void;
  /** Edita uma dívida já cadastrada, mantendo o que já foi pago */
  updateDebt: (
    id: string,
    patch: {
      name: string;
      type: string;
      creditor: string;
      interestRate: number;
      monthlyPayment: number;
      totalInstallments: number;
      installmentsPaid: number;
      nextDueDate: string;
    },
    splits: { profile_id: string; amount: number }[]
  ) => void;
  deleteDebt: (id: string) => void;
  /** Paga a parcela do mês: avança o vencimento */
  payDebtInstallment: (id: string, date?: string) => void;
  /** Adianta parcelas (abate as últimas; o vencimento do mês continua) */
  advanceDebtInstallments: (id: string, count: number, date?: string) => void;
  payOffDebt: (id: string, date?: string) => void;
  /** Soma das parcelas mensais das dívidas ativas (compromisso, não o que foi pago) */
  getMonthlyDebtCommitment: () => number;
  getDebtPaymentsForMonth: (month: MonthKey) => { paid: number; pending: number; total: number };

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
  const [allDebtPayments, setAllDebtPayments] = useState<DebtPayment[]>([]);
  const [debtShares, setDebtShares] = useState<DebtShare[]>([]);

  const [categories, setCategories] = useState<Category[]>(() => DEFAULT_CATEGORIES.map(c => ({ ...c, id: newId() })));
  const [invoices, setInvoices] = useState<Record<string, InvoiceState>>({});
  const [achievements, setAchievements] = useState<DebtAchievement[]>([]);
  const [syncState, setSyncState] = useState<SyncState>(remote ? 'loading' : 'offline');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [pendingSync, setPendingSync] = useState(0);

  const reportSyncError = useCallback((message: string) => {
    console.error('Erro ao salvar no Supabase:', message);
    setSyncError(message);
  }, []);

  const flush = useCallback(async () => {
    if (!remote || !user) return 0;
    const left = await flushQueue(user.id, reportSyncError);
    setPendingSync(left);
    return left;
  }, [remote, user, reportSyncError]);

  // Grava no banco em segundo plano; a tela já foi atualizada.
  // Sem internet: guarda na fila do navegador e reenvia depois. Outros erros viram aviso.
  const persist = useCallback(
    <M extends RepoMethod>(method: M, ...args: Parameters<(typeof repo)[M]>) => {
      if (!remote || !user) return;
      // Se já há algo na fila, entra atrás para manter a ordem das alterações
      if (readQueue(user.id).length > 0) {
        setPendingSync(enqueue(user.id, method, args));
        flush();
        return;
      }
      (repo[method] as (...a: unknown[]) => Promise<unknown>)(...args).catch((err: Error) => {
        if (isNetworkError(err)) setPendingSync(enqueue(user.id, method, args));
        else reportSyncError(err.message);
      });
    },
    [remote, user, flush, reportSyncError]
  );

  // Reenvia a fila quando a conexão volta e, enquanto houver pendências, a cada 30 segundos
  useEffect(() => {
    if (!remote || !user) return;
    setPendingSync(readQueue(user.id).length);
    const onOnline = () => flush();
    window.addEventListener('online', onOnline);
    const timer = window.setInterval(() => {
      if (readQueue(user.id).length > 0) flush();
    }, 30000);
    return () => {
      window.removeEventListener('online', onOnline);
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote, user?.id, flush]);

  // Modo offline: dados de exemplo no primeiro perfil (somem ao recarregar)
  useEffect(() => {
    if (remote || !firstProfileId) return;
    setAllCards(seedCards(firstProfileId));
    setAllTransactions(seedTransactions(firstProfileId));
    const seeded = seedDebts(firstProfileId);
    setAllDebts(seeded.debts);
    setAllDebtPayments(seeded.payments);
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
    // Envia o que ficou pendente antes de ler, para a tela não voltar a um estado antigo
    flushQueue(user.id, reportSyncError)
      .then(left => {
        setPendingSync(left);
        return loadAll();
      })
      .then(async data => {
        if (cancelled) return;
        setAllTransactions(data.transactions);
        setAllDebts(data.debts);
        setAllDebtPayments(data.debtPayments);
        setDebtShares(data.debtShares ?? []);
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

  /** Perfil das análises: null na visão Família (valores cheios) */
  const viewProfileId = isFamilyView ? null : activeProfileId;

  const inView = useCallback(
    (item: { profile_id?: string }) => isFamilyView || item.profile_id === activeProfileId,
    [isFamilyView, activeProfileId]
  );

  /** Transações do perfil: lançadas por ele, divididas com ele, ou feitas no cartão dele */
  const transactionInView = useCallback(
    (tx: Transaction) => {
      if (isFamilyView) return true;
      if (involvesProfile(tx, activeProfileId)) return true;
      if (!tx.cardId) return false;
      return allCards.some(card => card.id === tx.cardId && card.profile_id === activeProfileId);
    },
    [isFamilyView, activeProfileId, allCards]
  );

  /** Quanto deste item entra nas análises do perfil ativo */
  const shareOf = useCallback(
    (item: { amount: number; profile_id?: string; splits?: Split[]; shares?: Split[] }) =>
      amountForProfile(item, viewProfileId),
    [viewProfileId]
  );

  // Setter que só substitui os itens visíveis no perfil atual, preservando os dos outros perfis,
  // e grava no banco o que foi incluído, alterado ou removido.
  const scopedSetter = useCallback(
    (
      all: any[],
      setAll: React.Dispatch<React.SetStateAction<any[]>>,
      save: 'upsertTransaction' | 'upsertCard',
      remove: 'deleteTransaction' | 'deleteCard'
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
          .forEach(item => persist(save, user.id, item));
        before.forEach((_item, id) => {
          if (!nextIds.has(id)) persist(remove, id);
        });
      },
    [inView, targetProfileId, persist, user, remote]
  );

  const [referenceMonth, setReferenceMonth] = useState<MonthKey>(() => currentMonthKey());

  const transactions = useMemo(() => allTransactions.filter(transactionInView), [allTransactions, transactionInView]);
  /** Dívida dividida também é do perfil que tem parte nela */
  const debtInView = useCallback(
    (debt: any) => inView(debt) || debtShares.some(s => s.debtId === debt.id && s.profile_id === activeProfileId),
    [inView, debtShares, activeProfileId]
  );
  const debts = useMemo(() => allDebts.filter(d => debtInView(d) && d.status !== 'paid'), [allDebts, debtInView]);
  const paidDebts = useMemo(() => allDebts.filter(d => debtInView(d) && d.status === 'paid'), [allDebts, debtInView]);
  const subscriptions = useMemo(
    () => allSubscriptions.filter(s => involvesProfile({ ...s, splits: s.splits }, viewProfileId)),
    [allSubscriptions, viewProfileId]
  );
  const goals = useMemo(() => allGoals.filter(inView), [allGoals, inView]);

  const closingDayOf = useCallback(
    (_profileId: string | undefined, cardId: string) =>
      allCards.find(c => c.id === cardId)?.closingDay ?? DEFAULT_CLOSING_DAY,
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
        .flatMap(tx => expandInstallments({ ...tx, cardId: tx.cardId!, splits: tx.splits }, closingDayOf(tx.profile_id, tx.cardId!))),
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
      persist('upsertInvoice', user.id, {
        profile_id: profileId,
        cardId,
        month,
        checked: inv.checked,
        statementAmount: inv.statementAmount,
        paidAt: inv.paidAt,
      });
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
      const own = installments.filter(i => i.cardId === card.id);
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
    // Com divisão, a transação e as partes vão numa operação só: as partes dependem da linha existir
    if (record.splits && record.splits.length > 0) persist('upsertTransactionWithSplits', user!.id, record);
    else persist('upsertTransaction', user!.id, record);
  };

  const deleteTransaction = (id: string) => {
    setAllTransactions(prev => prev.filter(tx => tx.id !== id));
    persist('deleteTransaction', id);
  };

  const setTransactions = scopedSetter(allTransactions, setAllTransactions, 'upsertTransaction', 'deleteTransaction');
  const setCards = scopedSetter(allCards, setAllCards, 'upsertCard', 'deleteCard');

  // ============================================
  // Dívidas: cada pagamento é registrado; quitar mantém o histórico
  // ============================================
  const debtPayments = useMemo(() => allDebtPayments.filter(inView), [allDebtPayments, inView]);

  const saveDebt = (next: any) => {
    setAllDebts(prev => (prev.some(d => d.id === next.id) ? prev.map(d => (d.id === next.id ? next : d)) : [...prev, next]));
    persist('upsertDebt', user!.id, next);
  };

  const recordDebtPayment = (debt: any, amount: number, installments: number, kind: DebtPayment['kind'], date: string) => {
    const payment: DebtPayment = { id: newId(), profile_id: debt.profile_id, debtId: debt.id, date, amount, installments, kind };
    setAllDebtPayments(prev => [...prev, payment]);
    persist('insertDebtPayment', user!.id, payment);
  };

  const finishIfDone = (debt: any) => {
    const done = debt.installmentsPaid >= debt.totalInstallments || debt.remainingAmount <= 0.005;
    if (!done) return debt;
    return { ...debt, status: 'paid', paidAt: new Date().toISOString(), remainingAmount: 0, installmentsPaid: debt.totalInstallments };
  };

  /** A parcela atual da dívida já foi paga por todos? */
  const debtSharesOf = (debtId: string) => debtShares.filter(s => s.debtId === debtId);

  /** Um perfil paga a parte dele na parcela atual; a parcela fecha quando todos pagarem */
  const payDebtShare = (debtId: string, profileId: string, date = todayISO()) => {
    const debt = allDebts.find(d => d.id === debtId);
    if (!debt || debt.status === 'paid') return;
    const shares = debtSharesOf(debtId);
    const share = shares.find(s => s.profile_id === profileId);
    const installment = debt.installmentsPaid + 1;
    if (!share || share.installmentsPaid >= installment) return;

    const updated = { ...share, installmentsPaid: share.installmentsPaid + 1 };
    const nextShares = shares.map(s => (s.profile_id === profileId ? updated : s));
    setDebtShares(prev => prev.map(s => (s.id === share.id ? updated : s)));
    persist('upsertDebtShare', user!.id, updated);

    const payment: DebtPayment = {
      id: newId(),
      profile_id: profileId,
      debtId,
      date,
      amount: share.shareAmount,
      installments: 1,
      kind: 'installment',
      installmentNumber: installment,
    };
    setAllDebtPayments(prev => [...prev, payment]);
    persist('insertDebtPayment', user!.id, payment);

    // Parcela só é quitada quando todas as partes forem pagas
    if (nextShares.some(s => s.installmentsPaid < installment)) return;
    const paidNow = nextShares.reduce((sum, s) => sum + s.shareAmount, 0);
    const next = finishIfDone({
      ...debt,
      installmentsPaid: installment,
      remainingAmount: Math.max(0, debt.remainingAmount - paidNow),
      nextDueDate: addMonthsToDate(debt.nextDueDate, 1),
    });
    saveDebt(next);
    if (next.status === 'paid') addAchievement(debt, paidNow);
  };

  const addDebt = (debt: any) => {
    const { splits, ...rest } = debt ?? {};
    const id = newId();
    const record = { ...rest, id, profile_id: targetProfileId, status: 'active' };
    setAllDebts(prev => [...prev, record]);

    if (!splits?.length) {
      persist('upsertDebt', user!.id, record);
      return;
    }
    // A dívida e as partes vão juntas: as partes dependem da linha da dívida existir
    // As parcelas pagas antes do cadastro já foram quitadas por todos
    const shares: DebtShare[] = splits.map((split: { profile_id: string; amount: number }) => ({
      id: newId('share'),
      debtId: id,
      profile_id: split.profile_id,
      shareAmount: split.amount,
      installmentsPaid: record.installmentsPaid ?? 0,
    }));
    setDebtShares(prev => [...prev, ...shares]);
    persist('upsertDebtWithShares', user!.id, record, shares);
  };

  /**
   * Edita uma dívida já cadastrada (o valor da parcela mudou, o prazo mudou, etc.).
   * O progresso é mantido; total e saldo são recalculados pela mesma regra do cadastro.
   */
  const updateDebt = (
    id: string,
    patch: {
      name: string;
      type: string;
      creditor: string;
      interestRate: number;
      monthlyPayment: number;
      totalInstallments: number;
      installmentsPaid: number;
      nextDueDate: string;
    },
    splits: { profile_id: string; amount: number }[]
  ) => {
    const debt = allDebts.find(d => d.id === id);
    if (!debt) return;

    const round2 = (n: number) => Math.round(n * 100) / 100;
    const installmentsPaid = Math.min(Math.max(0, patch.installmentsPaid), patch.totalInstallments);
    const totalAmount = round2(patch.monthlyPayment * patch.totalInstallments);
    const remainingAmount = Math.max(0, round2(totalAmount - patch.monthlyPayment * installmentsPaid));
    const next = finishIfDone({ ...debt, ...patch, installmentsPaid, totalAmount, remainingAmount });
    saveDebt(next);

    // Divisão: quem continua mantém o que já pagou, quem saiu perde a parte
    const current = debtShares.filter(share => share.debtId === id);
    const removed = current.filter(share => !splits.some(split => split.profile_id === share.profile_id));
    const updated: DebtShare[] = splits.map(split => {
      const existing = current.find(share => share.profile_id === split.profile_id);
      // Cada parte fica em dia com a dívida ou uma parcela à frente (pagou e espera os outros)
      const paid = existing?.installmentsPaid ?? installmentsPaid;
      return {
        id: existing?.id ?? newId('share'),
        debtId: id,
        profile_id: split.profile_id,
        shareAmount: split.amount,
        installmentsPaid: Math.min(Math.max(paid, installmentsPaid), installmentsPaid + 1),
      };
    });

    setDebtShares(prev => [...prev.filter(share => share.debtId !== id), ...updated]);
    removed.forEach(share => persist('deleteDebtShare', share.id));
    updated.forEach(share => persist('upsertDebtShare', user!.id, share));
  };

  // Excluir = lançamento errado: some a dívida, os pagamentos (cascata no banco) e a conquista dela.
  // Para manter o histórico, use quitar.
  const deleteDebt = (id: string) => {
    setAllDebts(prev => prev.filter(d => d.id !== id));
    setDebtShares(prev => prev.filter(s => s.debtId !== id));
    setAllDebtPayments(prev => prev.filter(p => p.debtId !== id));
    persist('deleteDebt', id);
    const achievementIds = achievements.filter(a => a.debtId === id).map(a => a.id);
    if (achievementIds.length > 0) {
      if (remote) {
        setAchievements(prev => prev.filter(a => a.debtId !== id));
        persist('deleteAchievements', achievementIds);
      } else {
        setAchievements(clearLocalAchievements(a => a.debtId === id));
      }
    }
  };

  const payDebtInstallment = (id: string, date = todayISO()) => {
    const debt = allDebts.find(d => d.id === id);
    if (!debt || debt.status === 'paid') return;
    const amount = Math.min(debt.monthlyPayment, debt.remainingAmount);
    recordDebtPayment(debt, amount, 1, 'installment', date);
    const next = finishIfDone({
      ...debt,
      installmentsPaid: debt.installmentsPaid + 1,
      remainingAmount: debt.remainingAmount - amount,
      nextDueDate: addMonthsToDate(debt.nextDueDate, 1),
    });
    saveDebt(next);
    if (next.status === 'paid') addAchievement(debt, amount);
  };

  const advanceDebtInstallments = (id: string, count: number, date = todayISO()) => {
    const debt = allDebts.find(d => d.id === id);
    if (!debt || debt.status === 'paid' || count < 1) return;
    const n = Math.min(count, remainingInstallments(debt));
    const amount = Math.min(n * debt.monthlyPayment, debt.remainingAmount);
    recordDebtPayment(debt, amount, n, 'advance', date);
    const next = finishIfDone({ ...debt, installmentsPaid: debt.installmentsPaid + n, remainingAmount: debt.remainingAmount - amount });
    saveDebt(next);
    if (next.status === 'paid') addAchievement(debt, amount);
  };

  const payOffDebt = (id: string, date = todayISO()) => {
    const debt = allDebts.find(d => d.id === id);
    if (!debt || debt.status === 'paid') return;
    const amount = debt.remainingAmount;
    if (amount > 0) recordDebtPayment(debt, amount, remainingInstallments(debt), 'payoff', date);
    saveDebt({ ...debt, status: 'paid', paidAt: new Date().toISOString(), remainingAmount: 0, installmentsPaid: debt.totalInstallments });
    addAchievement(debt, amount);
  };

  /**
   * Dívida dividida: nas análises do perfil entra só a parte dele.
   * Na visão Família continua valendo a parcela cheia.
   */
  const debtsForAnalysis = useMemo(
    () =>
      debts.map(debt => {
        const shares = debtShares.filter(s => s.debtId === debt.id);
        if (shares.length === 0 || viewProfileId == null) return debt;
        const mine = shares.find(s => s.profile_id === viewProfileId);
        return { ...debt, monthlyPayment: mine?.shareAmount ?? 0 };
      }),
    [debts, debtShares, viewProfileId]
  );

  const getDebtPaymentsForMonth = (month: MonthKey) => debtPaymentsForMonth(month, debtsForAnalysis, debtPayments);

  // ============================================
  // Acerto de contas da família (quem deve a quem)
  // ============================================
  /** Quem desembolsa: no crédito é o dono do cartão, à vista é quem lançou */
  const payerOf = useCallback(
    (item: { profile_id?: string; cardId?: string }) =>
      (item.cardId ? allCards.find(c => c.id === item.cardId)?.profile_id : undefined) ?? item.profile_id ?? '',
    [allCards]
  );

  /** Todas as movimentações divididas da família, mês a mês */
  const sharedItems = useMemo<(SharedItem & { month: MonthKey })[]>(() => {
    const items: (SharedItem & { month: MonthKey })[] = [];

    (allTransactions as Transaction[]).forEach(tx => {
      if ((tx.splits?.length ?? 0) < 2) return;
      // Compra no cartão entra no mês da fatura (é quando o dono do cartão desembolsa)
      if (isCardTransaction(tx) && tx.cardId) {
        expandInstallments({ ...tx, cardId: tx.cardId, splits: tx.splits }, closingDayOf(tx.profile_id, tx.cardId)).forEach(inst => {
          if (!inst.shares?.length) return;
          items.push({
            month: inst.invoiceMonth,
            date: inst.purchaseDate,
            payerProfileId: payerOf(tx),
            direction: tx.type,
            splits: inst.shares,
            description: inst.total > 1 ? `${tx.description} (${inst.number}/${inst.total})` : tx.description,
          });
        });
        return;
      }
      items.push({
        month: monthOfDate(tx.date),
        date: tx.date,
        payerProfileId: payerOf(tx),
        direction: tx.type,
        splits: tx.splits!,
        description: tx.description,
      });
    });

    allSubscriptions.forEach(sub => {
      if ((sub.splits?.length ?? 0) < 2) return;
      const closingDay = sub.cardId ? closingDayOf(sub.profile_id, sub.cardId) : DEFAULT_CLOSING_DAY;
      const expanded = expandSubscription(sub, horizon, closingDay);
      expanded.card.forEach(charge => {
        items.push({
          month: charge.invoiceMonth,
          date: charge.purchaseDate,
          payerProfileId: payerOf({ profile_id: sub.profile_id, cardId: sub.cardId }),
          direction: 'expense',
          splits: charge.shares ?? [],
          description: charge.description,
        });
      });
      expanded.cash.forEach(charge => {
        items.push({
          month: monthOfDate(charge.date),
          date: charge.date,
          payerProfileId: sub.profile_id ?? '',
          direction: 'expense',
          splits: charge.splits ?? [],
          description: charge.description,
        });
      });
    });

    return items;
  }, [allTransactions, allSubscriptions, horizon, closingDayOf, payerOf]);

  /**
   * Saldo entre perfis. Sem `month`, é o acumulado de tudo que já foi lançado.
   * Dívidas divididas não entram: cada um paga a sua parte direto.
   */
  const getSettlement = useCallback(
    (month?: MonthKey) => {
      const items = month ? sharedItems.filter(i => i.month === month) : sharedItems;
      const balances = computeBalances(items);
      return { items, balances, transfers: settleBalances(balances) };
    },
    [sharedItems]
  );

  // ============================================
  // Assinaturas
  // ============================================
  const replaceSubscription = (next: Subscription) => {
    setAllSubscriptions(prev => prev.map(s => (s.id === next.id ? next : s)));
    persist('upsertSubscription', user!.id, next);
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
    persist('upsertSubscription', user!.id, created);
  };

  const setSubscriptionStatus = (id: string, status: Subscription['status']) => {
    const current = allSubscriptions.find(s => s.id === id);
    if (current) replaceSubscription(withSubscriptionStatus(current, status));
  };

  const deleteSubscription = (id: string) => {
    setAllSubscriptions(prev => prev.filter(s => s.id !== id));
    persist('deleteSubscription', id);
  };

  // ============================================
  // Metas
  // ============================================
  const replaceGoal = (next: Goal) => {
    setAllGoals(prev => prev.map(g => (g.id === next.id ? next : g)));
    persist('upsertGoal', user!.id, next);
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
    persist('upsertGoal', user!.id, created);
  };

  const setGoalStatus = (id: string, status: Goal['status']) => {
    const current = allGoals.find(g => g.id === id);
    if (current) replaceGoal({ ...current, status });
  };

  const deleteGoal = (id: string) => {
    setAllGoals(prev => prev.filter(g => g.id !== id));
    persist('deleteGoal', id);
  };

  const addGoalContribution = (goalId: string, amount: number, date = todayISO()) => {
    const goal = allGoals.find(g => g.id === goalId);
    if (!goal) return;
    const contribution = { id: newId('c'), date, amount };
    setAllGoals(prev => prev.map(g => (g.id === goalId ? { ...g, contributions: [...g.contributions, contribution] } : g)));
    persist('insertContribution', user!.id, goal, contribution);
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
    persist('insertAchievement', user!.id, achievement);
  };

  const clearAchievements = () => {
    if (!remote) {
      setAchievements(clearLocalAchievements(inView));
      return;
    }
    const ids = achievements.filter(inView).map(a => a.id);
    setAchievements(prev => prev.filter(a => !inView(a)));
    if (ids.length) persist('deleteAchievements', ids);
  };

  // ============================================
  // Categorias (compartilhadas entre os perfis; o limite é o orçamento mensal)
  // ============================================
  const addCategory = (category: Omit<Category, 'id'>) => {
    const created = { ...category, id: newId() };
    setCategories(prev => [...prev, created]);
    persist('upsertCategory', user!.id, created);
  };

  // Transações e assinaturas guardam o NOME da categoria: renomear/excluir precisa refletir nelas
  const renameCategoryUsages = (from: string, to: string) => {
    setAllTransactions(prev => prev.map(tx => (tx.category === from ? { ...tx, category: to } : tx)));
    setAllSubscriptions(prev => prev.map(s => (s.category === from ? { ...s, category: to } : s)));
    persist('updateTransactionsCategory', from, to);
    persist('updateSubscriptionsCategory', from, to);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    const current = categories.find(cat => cat.id === id);
    if (!current) return;
    const newName = updates.name?.trim();
    if (newName && newName !== current.name) renameCategoryUsages(current.name, newName);
    const next = { ...current, ...updates, ...(newName ? { name: newName } : {}) };
    setCategories(prev => prev.map(cat => (cat.id === id ? next : cat)));
    persist('upsertCategory', user!.id, next);
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
    persist('deleteCategory', id);
    if (needsOthers) persist('upsertCategory', user!.id, others);
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
        const amount = shareOf(tx); // divisão entre perfis; visão Família usa o valor cheio
        if (amount === 0) return;
        if (tx.type === 'income') income += amount;
        else if (!isCardTransaction(tx)) {
          cashExpenses += amount;
          add(tx.category, amount);
        }
      });

      const cashCharges = subscriptionCharges.cash.filter(c => monthOfDate(c.date) === month);
      cashCharges.forEach(c => add(c.category, shareOf(c)));
      const cashSubscriptions = cashCharges.reduce((s, c) => s + shareOf(c), 0);

      const monthInstallments = installments.filter(i => i.invoiceMonth === month);
      monthInstallments.forEach(i => add(i.category, shareOf(i)));
      const cardExpenses = monthInstallments.reduce((s, i) => s + shareOf(i), 0);
      const cardSubscriptions = monthInstallments
        .filter(i => i.source === 'subscription')
        .reduce((s, i) => s + shareOf(i), 0);

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
    [transactions, subscriptionCharges, installments, goals, shareOf]
  );

  const getMonthlyDebtCommitment = () => debtsForAnalysis.reduce((sum, debt) => sum + debt.monthlyPayment, 0);
  /** Pagamentos de dívidas do mês de referência: pagos + ainda a vencer */
  const getTotalDebtPayments = () => getDebtPaymentsForMonth(referenceMonth).total;

  const getHealth = (month = referenceMonth) => {
    const summary = getMonthSummary(month);
    return computeHealth(summary.income, summary.expenses, getDebtPaymentsForMonth(month).total);
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
      .reduce((s, tx) => s + shareOf(tx), 0);
    const oneOffCardIds = new Set(txs.filter(tx => isCardTransaction(tx) && (tx.installments ?? 1) <= 1).map(tx => tx.id));
    // Hábito no cartão = compras à vista FEITAS no mês base (a fatura do mês base só pega parte delas)
    const habitualCard = txs
      .filter(tx => oneOffCardIds.has(tx.id) && monthOfDate(tx.date) === referenceMonth)
      .reduce((s, tx) => s + shareOf(tx), 0);

    // parcelas (>1x) e assinaturas conhecidas para meses futuros
    const futureHorizon = addMonths(referenceMonth, months + 1);
    const futureSubs = subscriptions.map(sub =>
      expandSubscription(sub, futureHorizon, sub.cardId ? closingDayOf(sub.profile_id, sub.cardId) : DEFAULT_CLOSING_DAY)
    );
    const committedExpenses = (month: MonthKey) =>
      installments
        .filter(i => i.invoiceMonth === month && i.source !== 'subscription' && !oneOffCardIds.has(i.purchaseId))
        .reduce((s, i) => s + shareOf(i), 0) +
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
      debtPayments: month => getDebtPaymentsForMonth(month).total,
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
    pendingSync,
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
    allCards,
    installments,
    getInstallmentsForInvoice,
    getInvoice,
    toggleInstallmentChecked,
    setInvoiceStatementAmount,
    setInvoicePaid,
    debts,
    debtShares,
    payDebtShare,
    getSettlement,
    paidDebts,
    debtPayments,
    addDebt,
    updateDebt,
    deleteDebt,
    payDebtInstallment,
    advanceDebtInstallments,
    payOffDebt,
    getMonthlyDebtCommitment,
    getDebtPaymentsForMonth,
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

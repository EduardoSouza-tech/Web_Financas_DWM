'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { CREDIT_CARDS, CURRENT_MONTH_TRANSACTIONS, DEBTS } from '@/lib/mock-data';
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

interface Category {
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

export const invoiceKey = (profileId: string | undefined, cardId: string, month: MonthKey) =>
  `${profileId ?? ''}|${cardId}|${month}`;

export const isCardTransaction = (tx: Pick<Transaction, 'type' | 'paymentMethod' | 'cardId'>) =>
  tx.type === 'expense' && (tx.paymentMethod === 'credit_card' || (!tx.paymentMethod && !!tx.cardId));

interface FinanceContextType {
  /** Mês usado em todas as análises (receitas, despesas, saldo) */
  referenceMonth: MonthKey;
  setReferenceMonth: (month: MonthKey) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'profile_id'>) => void;
  deleteTransaction: (id: string) => void;
  /** Todas as parcelas de cartão visíveis no perfil ativo (todas as faturas) */
  installments: Installment[];
  getInstallmentsForInvoice: (month: MonthKey, cardId?: string) => Installment[];
  getInvoice: (profileId: string | undefined, cardId: string, month: MonthKey) => InvoiceState;
  toggleInstallmentChecked: (inst: Installment) => void;
  setInvoiceStatementAmount: (profileId: string | undefined, cardId: string, month: MonthKey, amount?: number) => void;
  setInvoicePaid: (profileId: string | undefined, cardId: string, month: MonthKey, paid: boolean) => void;
  getTotalIncome: () => number;
  /** Despesas do mês de referência por categoria (cartão pela parcela da fatura) */
  getExpensesByCategory: () => Record<string, number>;
  /** Quantas transações (de todos os perfis) usam a categoria */
  countTransactionsInCategory: (name: string) => number;
  cards: any[];
  setCards: (cards: any[]) => void;
  transactions: any[];
  setTransactions: (transactions: any[]) => void;
  debts: any[];
  setDebts: (debts: any[]) => void;
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  getTotalCardUsage: () => number;
  getTotalExpenses: () => number;
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

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { profiles, activeProfileId, isFamilyView } = useProfiles();
  const { transactions: supabaseTransactions } = useTransactions();
  const { debts: supabaseDebts } = useDebts();

  const remote = isSupabaseConfigured && !!user && user.id !== 'offline-user';
  const firstProfileId = profiles[0]?.id;

  // Dados de TODOS os perfis da conta; cada item carrega profile_id
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [allDebts, setAllDebts] = useState<any[]>([]);
  const [allCards, setAllCards] = useState<any[]>([]);

  // Dados de exemplo pertencem ao primeiro perfil; os demais começam vazios.
  // Cartões ainda não têm tabela no banco, então usam o exemplo também no modo online.
  useEffect(() => {
    if (!firstProfileId) return;
    const tag = (items: any[]) => items.map(item => ({ ...item, profile_id: firstProfileId }));
    setAllCards(tag(CREDIT_CARDS));
    if (!remote) {
      // Dados de exemplo trazidos para o mês atual, mantendo o dia original
      const month = currentMonthKey();
      const closingOf = new Map<string, number>(CREDIT_CARDS.map(c => [c.id, c.closingDay]));
      setAllTransactions(
        tag(CURRENT_MONTH_TRANSACTIONS).map((tx: any) => {
          const date = `${month}-${tx.date.slice(8, 10)}`;
          if (!tx.cardId) return { ...tx, date, paymentMethod: 'cash' };
          return {
            ...tx,
            date,
            paymentMethod: 'credit_card',
            installments: 1,
            firstInstallment: 1,
            firstInvoiceMonth: invoiceMonthOf(date, closingOf.get(tx.cardId) ?? DEFAULT_CLOSING_DAY),
          };
        })
      );
      setAllDebts(tag(DEBTS));
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
  // Itens novos (sem profile_id) vão para o perfil ativo; na visão Família, para o primeiro perfil.
  const scopedSetter = useCallback(
    (setAll: React.Dispatch<React.SetStateAction<any[]>>) => (next: any[]) => {
      const target = isFamilyView ? firstProfileId : activeProfileId;
      const tagged = next.map(item => (item.profile_id ? item : { ...item, profile_id: target }));
      setAll(prev => [...prev.filter(item => !inView(item)), ...tagged]);
    },
    [inView, isFamilyView, firstProfileId, activeProfileId]
  );

  const [referenceMonth, setReferenceMonth] = useState<MonthKey>(() => currentMonthKey());
  const [invoices, setInvoices] = useState<Record<string, InvoiceState>>({});

  const transactions = useMemo(() => allTransactions.filter(inView), [allTransactions, inView]);
  const debts = useMemo(() => allDebts.filter(inView), [allDebts, inView]);

  const closingDays = useMemo(
    () => new Map<string, number>(allCards.map(c => [`${c.profile_id}|${c.id}`, c.closingDay ?? DEFAULT_CLOSING_DAY])),
    [allCards]
  );

  const installments = useMemo(
    () =>
      (transactions as Transaction[])
        .filter(tx => isCardTransaction(tx) && tx.cardId)
        .flatMap(tx =>
          expandInstallments(
            { ...tx, cardId: tx.cardId! },
            closingDays.get(`${tx.profile_id}|${tx.cardId}`) ?? DEFAULT_CLOSING_DAY
          )
        ),
    [transactions, closingDays]
  );

  const getInvoice = useCallback(
    (profileId: string | undefined, cardId: string, month: MonthKey): InvoiceState =>
      invoices[invoiceKey(profileId, cardId, month)] ?? { checked: [] },
    [invoices]
  );

  const updateInvoice = (
    profileId: string | undefined,
    cardId: string,
    month: MonthKey,
    patch: (inv: InvoiceState) => InvoiceState
  ) => {
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

  // Pagar a fatura libera o limite. A despesa já conta no mês da fatura (parcela a parcela),
  // por isso o pagamento não gera uma nova despesa.
  const setInvoicePaid = (profileId: string | undefined, cardId: string, month: MonthKey, paid: boolean) =>
    updateInvoice(profileId, cardId, month, inv => ({ ...inv, paidAt: paid ? new Date().toISOString() : undefined }));

  const getInstallmentsForInvoice = (month: MonthKey, cardId?: string) =>
    installments.filter(i => i.invoiceMonth === month && (!cardId || i.cardId === cardId));

  // Cartão: limite usado = parcelas de faturas não pagas (inclui futuras); próxima fatura = fatura aberta hoje
  const cards = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return allCards.filter(inView).map(card => {
      const closingDay = card.closingDay ?? DEFAULT_CLOSING_DAY;
      const own = installments.filter(i => i.cardId === card.id && i.profile_id === card.profile_id);
      const unpaid = own.filter(i => !invoices[invoiceKey(i.profile_id, i.cardId, i.invoiceMonth)]?.paidAt);
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

  const addTransaction = (tx: Omit<Transaction, 'id' | 'profile_id'>) => {
    const profileId = isFamilyView ? firstProfileId : activeProfileId;
    setAllTransactions(prev => [{ ...tx, id: `tx-${Date.now()}`, profile_id: profileId }, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setAllTransactions(prev => prev.filter(tx => tx.id !== id));
  };

  const setTransactions = useMemo(() => scopedSetter(setAllTransactions), [scopedSetter]);
  const setDebts = useMemo(() => scopedSetter(setAllDebts), [scopedSetter]);
  const setCards = useMemo(() => scopedSetter(setAllCards), [scopedSetter]);

  // Categorias padrão (compartilhadas entre os perfis)
  const [categories, setCategories] = useState<Category[]>([
    // Categorias de despesas
    { id: '1', name: 'Alimentação', icon: '🍔', type: 'expense', budgetLimit: 1500 },
    { id: '2', name: 'Moradia', icon: '🏠', type: 'expense', budgetLimit: 2500 },
    { id: '3', name: 'Transporte', icon: '🚗', type: 'expense', budgetLimit: 800 },
    { id: '4', name: 'Saúde', icon: '🏥', type: 'expense', budgetLimit: 500 },
    { id: '5', name: 'Lazer', icon: '🎬', type: 'expense', budgetLimit: 600 },
    { id: '6', name: 'Educação', icon: '📚', type: 'expense', budgetLimit: 300 },
    { id: '7', name: 'Trabalho', icon: '💼', type: 'expense', budgetLimit: 150 },
    { id: '8', name: 'Outros', icon: '📁', type: 'expense' },
    // Categorias de receita
    { id: '9', name: 'Salário', icon: '💰', type: 'income' },
    { id: '10', name: 'Renda Extra', icon: '💵', type: 'income' },
    { id: '11', name: 'Freelance', icon: '💻', type: 'income' },
    { id: '12', name: 'Investimentos', icon: '📈', type: 'income' },
  ]);

  // Funções de gerenciamento de categorias
  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory = {
      ...category,
      id: Date.now().toString(),
    };
    setCategories(prev => [...prev, newCategory]);
  };

  // Transações guardam o NOME da categoria: renomear ou excluir precisa refletir nelas,
  // senão os gastos somem das análises por categoria.
  const renameTransactionsCategory = (from: string, to: string) =>
    setAllTransactions(prev => prev.map(tx => (tx.category === from ? { ...tx, category: to } : tx)));

  const updateCategory = (id: string, updates: Partial<Category>) => {
    const current = categories.find(cat => cat.id === id);
    const newName = updates.name?.trim();
    if (current && newName && newName !== current.name) {
      renameTransactionsCategory(current.name, newName);
    }
    setCategories(prev =>
      prev.map(cat => (cat.id === id ? { ...cat, ...updates, ...(newName ? { name: newName } : {}) } : cat))
    );
  };

  // Transações da categoria excluída passam para "Outros"
  const deleteCategory = (id: string) => {
    const current = categories.find(cat => cat.id === id);
    if (current) renameTransactionsCategory(current.name, 'Outros');
    setCategories(prev => {
      const next = prev.filter(cat => cat.id !== id);
      const needsOthers = current?.type === 'expense' && !next.some(c => c.name === 'Outros' && c.type === 'expense');
      return needsOthers ? [...next, { id: Date.now().toString(), name: 'Outros', icon: '📁', type: 'expense' }] : next;
    });
  };

  const countTransactionsInCategory = (name: string) =>
    allTransactions.filter(tx => tx.category === name).length;

  const getExpensesByCategory = () => {
    const totals: Record<string, number> = {};
    const add = (category: string, amount: number) => {
      totals[category] = (totals[category] ?? 0) + amount;
    };
    transactions
      .filter(tx => tx.type === 'expense' && !isCardTransaction(tx) && monthOfDate(tx.date) === referenceMonth)
      .forEach(tx => add(tx.category, tx.amount));
    installments.filter(i => i.invoiceMonth === referenceMonth).forEach(i => add(i.category, i.amount));
    return totals;
  };

  const getTotalCardUsage = () => {
    return cards.reduce((sum, card) => sum + card.used, 0);
  };

  // Despesas do mês de referência: à vista pela data; cartão pela parcela da fatura do mês.
  // Não depende do cartão existir: excluir um cartão não tira despesas das análises.
  const getTotalExpenses = () => {
    const cashExpenses = transactions
      .filter(tx => tx.type === 'expense' && !isCardTransaction(tx) && monthOfDate(tx.date) === referenceMonth)
      .reduce((sum, tx) => sum + tx.amount, 0);
    const cardExpenses = installments
      .filter(i => i.invoiceMonth === referenceMonth)
      .reduce((sum, i) => sum + i.amount, 0);
    return cashExpenses + cardExpenses;
  };

  const getTotalIncome = () => {
    return transactions
      .filter(tx => tx.type === 'income' && monthOfDate(tx.date) === referenceMonth)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const getBalance = () => {
    return getTotalIncome() - getTotalExpenses();
  };

  const getSavingsRate = () => {
    const totalIncome = getTotalIncome();
    return totalIncome > 0 ? (getBalance() / totalIncome) * 100 : 0;
  };

  // Debt-related calculations
  const getTotalDebtPayments = () => {
    return debts.reduce((sum, debt) => sum + debt.monthlyPayment, 0);
  };

  const getRealBalance = () => {
    return getBalance() - getTotalDebtPayments();
  };

  const getRealSavingsRate = () => {
    const totalIncome = getTotalIncome();
    return totalIncome > 0 ? (getRealBalance() / totalIncome) * 100 : 0;
  };

  const value = {
    referenceMonth,
    setReferenceMonth,
    addTransaction,
    deleteTransaction,
    installments,
    getInstallmentsForInvoice,
    getInvoice,
    toggleInstallmentChecked,
    setInvoiceStatementAmount,
    setInvoicePaid,
    getTotalIncome,
    getExpensesByCategory,
    countTransactionsInCategory,
    cards,
    setCards,
    transactions,
    setTransactions,
    debts,
    setDebts,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    getTotalCardUsage,
    getTotalExpenses,
    getBalance,
    getSavingsRate,
    getTotalDebtPayments,
    getRealBalance,
    getRealSavingsRate
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}

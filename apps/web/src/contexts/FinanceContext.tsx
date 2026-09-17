'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { CREDIT_CARDS, CURRENT_MONTH_TRANSACTIONS, DEBTS } from '@/lib/mock-data';
import { useTransactions } from '@/hooks/useTransactions';
import { useDebts, type Debt as DbDebt } from '@/hooks/useDebts';
import { useAuth } from '@/providers/auth-provider';
import { useProfiles } from '@/providers/profile-provider';
import { isSupabaseConfigured } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
  icon: string;
  budgetLimit?: number;
  type: 'income' | 'expense';
}

interface FinanceContextType {
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
      setAllTransactions(tag(CURRENT_MONTH_TRANSACTIONS));
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

  const transactions = useMemo(() => allTransactions.filter(inView), [allTransactions, inView]);
  const debts = useMemo(() => allDebts.filter(inView), [allDebts, inView]);

  // Uso do cartão calculado a partir das transações do mesmo perfil
  const cards = useMemo(
    () =>
      allCards.filter(inView).map(card => {
        const used = allTransactions
          .filter(tx => tx.cardId === card.id && tx.profile_id === card.profile_id)
          .reduce((sum, tx) => sum + tx.amount, 0);
        return { ...card, used, nextInvoice: used, availableLimit: card.limit - used };
      }),
    [allCards, allTransactions, inView]
  );

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

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(prev =>
      prev.map(cat => (cat.id === id ? { ...cat, ...updates } : cat))
    );
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const getTotalCardUsage = () => {
    return cards.reduce((sum, card) => sum + card.used, 0);
  };

  const getTotalExpenses = () => {
    const cardExpenses = getTotalCardUsage();
    const cashExpenses = transactions
      .filter(tx => tx.type === 'expense' && !tx.cardId)
      .reduce((sum, tx) => sum + tx.amount, 0);
    return cardExpenses + cashExpenses;
  };

  const getTotalIncome = () => {
    return transactions
      .filter(tx => tx.type === 'income')
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

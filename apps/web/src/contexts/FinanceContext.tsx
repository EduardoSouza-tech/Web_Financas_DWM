'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CREDIT_CARDS, CURRENT_MONTH_TRANSACTIONS, MONTHLY_SUMMARY } from '@/lib/mock-data';

interface FinanceContextType {
  cards: any[];
  setCards: (cards: any[]) => void;
  transactions: any[];
  setTransactions: (transactions: any[]) => void;
  getTotalCardUsage: () => number;
  getTotalExpenses: () => number;
  getBalance: () => number;
  getSavingsRate: () => number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState(CREDIT_CARDS);
  const [transactions, setTransactions] = useState(CURRENT_MONTH_TRANSACTIONS);

  // Recalculate totals whenever cards or transactions change
  const getTotalCardUsage = () => {
    return cards.reduce((sum, card) => sum + card.used, 0);
  };

  const getTotalExpenses = () => {
    const cardExpenses = getTotalCardUsage();
    const cashExpenses = transactions
      .filter(tx => tx.type === 'expense' && !(tx as any).cardId)
      .reduce((sum, tx) => sum + tx.amount, 0);
    return cardExpenses + cashExpenses;
  };

  const getBalance = () => {
    const totalIncome = transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    return totalIncome - getTotalExpenses();
  };

  const getSavingsRate = () => {
    const totalIncome = transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const balance = getBalance();
    return totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
  };

  // Update card usage when transactions change
  useEffect(() => {
    const updatedCards = cards.map(card => {
      const cardTransactions = transactions.filter(tx => (tx as any).cardId === card.id);
      const used = cardTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      return {
        ...card,
        used,
        nextInvoice: used,
        availableLimit: card.limit - used
      };
    });
    
    // Only update if values actually changed
    const hasChanged = updatedCards.some((card, index) => 
      card.used !== cards[index].used
    );
    
    if (hasChanged) {
      setCards(updatedCards);
    }
  }, [transactions]);

  const value = {
    cards,
    setCards,
    transactions,
    setTransactions,
    getTotalCardUsage,
    getTotalExpenses,
    getBalance,
    getSavingsRate
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

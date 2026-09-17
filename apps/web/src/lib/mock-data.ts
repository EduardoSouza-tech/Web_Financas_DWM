/**
 * Dados brutos de exemplo (modo offline).
 * Não use estes valores direto nas telas: eles passam por lib/finance/seed.ts,
 * que traz as datas para o mês atual e liga tudo ao perfil.
 * Os cálculos (saúde financeira, score, previsão, orçamento) ficam em lib/finance.
 */

// Transações de exemplo (as datas são ajustadas para o mês atual no seed)
export const CURRENT_MONTH_TRANSACTIONS = [
  // RECEITAS (Total: R$ 8.000)
  { id: '1', date: '2025-11-01', description: 'Salário', category: 'Salário', type: 'income', amount: 6500 },
  { id: '1b', date: '2025-11-15', description: 'Bônus/Freelance', category: 'Renda Extra', type: 'income', amount: 1500 },
  
  // DESPESAS FIXAS (Total: R$ 2.025 - em dinheiro/débito)
  { id: '2', date: '2025-11-05', description: 'Aluguel', category: 'Moradia', type: 'expense', amount: 1200 },
  { id: '3', date: '2025-11-05', description: 'Condomínio', category: 'Moradia', type: 'expense', amount: 350 },
  { id: '4', date: '2025-11-06', description: 'Energia Elétrica', category: 'Moradia', type: 'expense', amount: 180, cardId: '1' },
  { id: '5', date: '2025-11-06', description: 'Água', category: 'Moradia', type: 'expense', amount: 85, cardId: '1' },
  { id: '6', date: '2025-11-06', description: 'Internet', category: 'Moradia', type: 'expense', amount: 120, cardId: '1' },
  { id: '7', date: '2025-11-07', description: 'Celular', category: 'Moradia', type: 'expense', amount: 90, cardId: '1' },
  
  // ASSINATURAS (Total: R$ 195,70 - Cartão Nubank)
  { id: '8', date: '2025-11-10', description: 'Netflix', category: 'Lazer', type: 'expense', amount: 55.90, cardId: '1' },
  { id: '9', date: '2025-11-15', description: 'Spotify Premium', category: 'Lazer', type: 'expense', amount: 21.90, cardId: '1' },
  { id: '10', date: '2025-11-20', description: 'Amazon Prime', category: 'Lazer', type: 'expense', amount: 14.90, cardId: '1' },
  { id: '11', date: '2025-11-25', description: 'GitHub Pro', category: 'Educação', type: 'expense', amount: 4.00, cardId: '1' },
  { id: '12', date: '2025-11-28', description: 'Adobe Creative Cloud', category: 'Trabalho', type: 'expense', amount: 99.00, cardId: '1' },
  
  // ALIMENTAÇÃO (Total: R$ 1.320 - Cartão Inter principalmente)
  { id: '13', date: '2025-11-03', description: 'Supermercado', category: 'Alimentação', type: 'expense', amount: 450, cardId: '2' },
  { id: '14', date: '2025-11-08', description: 'Restaurante', category: 'Alimentação', type: 'expense', amount: 180, cardId: '2' },
  { id: '15', date: '2025-11-10', description: 'Supermercado', category: 'Alimentação', type: 'expense', amount: 320, cardId: '2' },
  { id: '16', date: '2025-11-15', description: 'Delivery iFood', category: 'Alimentação', type: 'expense', amount: 145, cardId: '2' },
  { id: '17', date: '2025-11-20', description: 'Padaria', category: 'Alimentação', type: 'expense', amount: 85, cardId: '2' },
  { id: '18', date: '2025-11-22', description: 'Restaurante', category: 'Alimentação', type: 'expense', amount: 140, cardId: '2' },
  
  // TRANSPORTE (Total: R$ 580 - Cartão Inter)
  { id: '19', date: '2025-11-02', description: 'Gasolina', category: 'Transporte', type: 'expense', amount: 280, cardId: '2' },
  { id: '20', date: '2025-11-12', description: 'Uber', category: 'Transporte', type: 'expense', amount: 65, cardId: '3' },
  { id: '21', date: '2025-11-18', description: 'Gasolina', category: 'Transporte', type: 'expense', amount: 235, cardId: '2' },
  
  // SAÚDE (Total: R$ 380 - Cartão Nubank)
  { id: '22', date: '2025-11-05', description: 'Plano de Saúde', category: 'Saúde', type: 'expense', amount: 320, cardId: '1' },
  { id: '23', date: '2025-11-12', description: 'Farmácia', category: 'Saúde', type: 'expense', amount: 60, cardId: '3' },
  
  // LAZER (Total: R$ 340 - Cartões variados)
  { id: '24', date: '2025-11-09', description: 'Cinema', category: 'Lazer', type: 'expense', amount: 85, cardId: '1' },
  { id: '25', date: '2025-11-16', description: 'Bar', category: 'Lazer', type: 'expense', amount: 120, cardId: '3' },
  { id: '26', date: '2025-11-23', description: 'Shopping', category: 'Lazer', type: 'expense', amount: 135, cardId: '1' },
  
  // EDUCAÇÃO (Total: R$ 180 - Cartão Nubank)
  { id: '27', date: '2025-11-01', description: 'Curso Online Udemy', category: 'Educação', type: 'expense', amount: 180, cardId: '1' },
];

// Cartões de crédito de exemplo (limite usado e fatura são calculados pelas parcelas)
export const CREDIT_CARDS = [
  {
    id: '1',
    name: 'Nubank Ultravioleta',
    limit: 15000,
    used: 1390.70, // Contas fixas + assinaturas + saúde + lazer + educação
    availableLimit: 13609.30,
    closingDay: 5,
    dueDay: 25,
    lastFourDigits: '4829',
    brand: 'mastercard' as const,
    color: 'from-purple-600 to-purple-800',
    nextInvoice: 1390.70,
    nextDueDate: '2025-11-25',
    installments: 8,
  },
  {
    id: '2',
    name: 'Inter Gold',
    limit: 10000,
    used: 1835,
    availableLimit: 8165,
    closingDay: 5,
    dueDay: 20,
    lastFourDigits: '8173',
    brand: 'visa' as const,
    color: 'from-orange-500 to-orange-700',
    nextInvoice: 1835,
    nextDueDate: '2025-11-20',
    installments: 4,
  },
  {
    id: '3',
    name: 'C6 Carbon',
    limit: 8000,
    used: 245,
    availableLimit: 7755,
    closingDay: 5,
    dueDay: 15,
    lastFourDigits: '2947',
    brand: 'mastercard' as const,
    color: 'from-gray-700 to-gray-900',
    nextInvoice: 245,
    nextDueDate: '2025-11-15',
    installments: 2,
  },
];

// Dívidas de exemplo
export const DEBTS = [
  {
    id: '1',
    name: 'Financiamento do Carro',
    type: 'financing' as const,
    totalAmount: 45000,
    remainingAmount: 28500,
    monthlyPayment: 1250,
    interestRate: 1.2, // % ao mês
    installmentsPaid: 18,
    totalInstallments: 48,
    nextDueDate: '2025-11-15',
    creditor: 'Banco Inter',
    color: 'from-blue-500 to-blue-700',
    get paidAmount() { return this.totalAmount - this.remainingAmount; },
    get percentage() { return (this.paidAmount / this.totalAmount) * 100; },
  },
  {
    id: '2',
    name: 'Empréstimo Pessoal',
    type: 'loan' as const,
    totalAmount: 15000,
    remainingAmount: 8500,
    monthlyPayment: 650,
    interestRate: 2.5,
    installmentsPaid: 10,
    totalInstallments: 24,
    nextDueDate: '2025-11-20',
    creditor: 'Nubank',
    color: 'from-purple-500 to-purple-700',
    get paidAmount() { return this.totalAmount - this.remainingAmount; },
    get percentage() { return (this.paidAmount / this.totalAmount) * 100; },
  },
  {
    id: '3',
    name: 'Cartão de Crédito Parcelado',
    type: 'credit' as const,
    totalAmount: 3200,
    remainingAmount: 1600,
    monthlyPayment: 400,
    interestRate: 3.8,
    installmentsPaid: 4,
    totalInstallments: 8,
    nextDueDate: '2025-11-10',
    creditor: 'C6 Bank',
    color: 'from-orange-500 to-orange-700',
    get paidAmount() { return this.totalAmount - this.remainingAmount; },
    get percentage() { return (this.paidAmount / this.totalAmount) * 100; },
  },
];

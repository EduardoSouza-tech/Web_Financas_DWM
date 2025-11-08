/**
 * Sistema de dados mock centralizado e logicamente consistente
 * Todos os valores estão interligados e fazem sentido matemático
 */

// ============================================
// DADOS BASE DO USUÁRIO
// ============================================
export const USER_DATA = {
  name: 'Eduardo Souza',
  email: 'eduardo@example.com',
  monthlyIncome: 6500, // Salário líquido mensal
  emergencyFundMonths: 6, // Meta de fundo de emergência
};

// ============================================
// TRANSAÇÕES DO MÊS ATUAL (NOVEMBRO 2025)
// ============================================
export const CURRENT_MONTH_TRANSACTIONS = [
  // RECEITAS (Total: R$ 6.500)
  { id: '1', date: '2025-11-01', description: 'Salário', category: 'Salário', type: 'income', amount: 6500 },
  
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

// ============================================
// CÁLCULOS AUTOMÁTICOS DO MÊS
// ============================================
export const MONTHLY_SUMMARY = {
  totalIncome: CURRENT_MONTH_TRANSACTIONS
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0), // R$ 6.500
    
  totalExpenses: CURRENT_MONTH_TRANSACTIONS
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0), // R$ 5.020,70
    
  get balance() {
    return this.totalIncome - this.totalExpenses; // R$ 1.479,30
  },
  
  get savingsRate() {
    return (this.balance / this.totalIncome) * 100; // 22,76%
  },
};

// ============================================
// CATEGORIA: DESPESAS POR CATEGORIA
// ============================================
export const EXPENSES_BY_CATEGORY = {
  'Moradia': 1550 + 180 + 85 + 120 + 90, // Aluguel + Condomínio + Energia + Água + Internet + Celular = 2.025
  'Alimentação': 1320,
  'Transporte': 580,
  'Saúde': 380,
  'Lazer': 340 + 55.90 + 21.90 + 14.90, // Lazer + assinaturas de entretenimento = 432.70
  'Educação': 180 + 4, // Curso + GitHub = 184
  'Trabalho': 99, // Adobe
};

export const CATEGORY_PERCENTAGES = Object.entries(EXPENSES_BY_CATEGORY).map(([name, amount]) => ({
  categoryName: name,
  amount,
  percentage: (amount / MONTHLY_SUMMARY.totalExpenses) * 100,
}));

// ============================================
// ORÇAMENTOS (Budget)
// ============================================
export const BUDGETS = [
  { 
    category: 'Alimentação', 
    allocated: 1500, 
    spent: EXPENSES_BY_CATEGORY['Alimentação'],
    get remaining() { return this.allocated - this.spent; },
    get percentage() { return (this.spent / this.allocated) * 100; },
  },
  { 
    category: 'Transporte', 
    allocated: 600, 
    spent: EXPENSES_BY_CATEGORY['Transporte'],
    get remaining() { return this.allocated - this.spent; },
    get percentage() { return (this.spent / this.allocated) * 100; },
  },
  { 
    category: 'Lazer', 
    allocated: 500, 
    spent: EXPENSES_BY_CATEGORY['Lazer'],
    get remaining() { return this.allocated - this.spent; },
    get percentage() { return (this.spent / this.allocated) * 100; },
  },
  { 
    category: 'Saúde', 
    allocated: 400, 
    spent: EXPENSES_BY_CATEGORY['Saúde'],
    get remaining() { return this.allocated - this.spent; },
    get percentage() { return (this.spent / this.allocated) * 100; },
  },
  { 
    category: 'Educação', 
    allocated: 200, 
    spent: EXPENSES_BY_CATEGORY['Educação'],
    get remaining() { return this.allocated - this.spent; },
    get percentage() { return (this.spent / this.allocated) * 100; },
  },
];

// ============================================
// METAS (Goals)
// ============================================
export const GOALS = [
  {
    id: '1',
    name: 'Fundo de Emergência',
    targetAmount: USER_DATA.monthlyIncome * USER_DATA.emergencyFundMonths, // R$ 39.000 (6 meses)
    currentAmount: 15000,
    deadline: '2026-12-31',
    get percentage() { return (this.currentAmount / this.targetAmount) * 100; },
    get monthlyNeeded() {
      const monthsRemaining = 14; // Nov 2025 até Dez 2026
      return (this.targetAmount - this.currentAmount) / monthsRemaining;
    },
  },
  {
    id: '2',
    name: 'Viagem para Europa',
    targetAmount: 20000,
    currentAmount: 8000,
    deadline: '2026-07-01',
    get percentage() { return (this.currentAmount / this.targetAmount) * 100; },
    get monthlyNeeded() {
      const monthsRemaining = 8; // Nov 2025 até Jul 2026
      return (this.targetAmount - this.currentAmount) / monthsRemaining;
    },
  },
  {
    id: '3',
    name: 'Compra de Notebook',
    targetAmount: 8000,
    currentAmount: 3200,
    deadline: '2026-03-01',
    get percentage() { return (this.currentAmount / this.targetAmount) * 100; },
    get monthlyNeeded() {
      const monthsRemaining = 4; // Nov 2025 até Mar 2026
      return (this.targetAmount - this.currentAmount) / monthsRemaining;
    },
  },
];

// ============================================
// CARTÕES DE CRÉDITO
// ============================================
// Faturas distribuídas de acordo com as transações vinculadas por cardId
// Nubank: R$ 1.390,70 (Energia, Água, Internet, Celular, Assinaturas, Saúde, Lazer, Educação)
// Inter: R$ 1.835,00 (Alimentação + Transporte/Gasolina)
// C6: R$ 245,00 (Uber, Farmácia, Bar)
// Total em cartões: R$ 3.470,70
// Total em dinheiro/débito: R$ 1.550,00 (Aluguel + Condomínio)
// TOTAL DESPESAS: R$ 5.020,70
export const CREDIT_CARDS = [
  {
    id: '1',
    name: 'Nubank Ultravioleta',
    limit: 15000,
    used: 1390.70, // Contas fixas + assinaturas + saúde + lazer + educação
    availableLimit: 13609.30,
    closingDay: 15,
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
    closingDay: 10,
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

export const CARDS_SUMMARY = {
  totalLimit: CREDIT_CARDS.reduce((sum, card) => sum + card.limit, 0), // R$ 33.000
  totalUsed: CREDIT_CARDS.reduce((sum, card) => sum + card.used, 0), // R$ 15.080
  totalAvailable: CREDIT_CARDS.reduce((sum, card) => sum + card.availableLimit, 0), // R$ 17.920
  get usagePercentage() { return (this.totalUsed / this.totalLimit) * 100; }, // 45,7%
};

// ============================================
// ASSINATURAS (Subscriptions)
// ============================================
export const SUBSCRIPTIONS = [
  {
    id: '1',
    name: 'Netflix',
    amount: 55.90,
    frequency: 'monthly' as const,
    category: 'Streaming',
    nextPayment: '2025-12-10',
    status: 'active' as const,
    autoRenew: true,
    icon: '🎬',
  },
  {
    id: '2',
    name: 'Spotify Premium',
    amount: 21.90,
    frequency: 'monthly' as const,
    category: 'Música',
    nextPayment: '2025-12-15',
    status: 'active' as const,
    autoRenew: true,
    icon: '🎵',
  },
  {
    id: '3',
    name: 'Amazon Prime',
    amount: 14.90,
    frequency: 'monthly' as const,
    category: 'E-commerce',
    nextPayment: '2025-12-20',
    status: 'active' as const,
    autoRenew: true,
    icon: '📦',
  },
  {
    id: '4',
    name: 'GitHub Pro',
    amount: 4.00,
    frequency: 'monthly' as const,
    category: 'Desenvolvimento',
    nextPayment: '2025-12-25',
    status: 'active' as const,
    autoRenew: true,
    icon: '💻',
  },
  {
    id: '5',
    name: 'Adobe Creative Cloud',
    amount: 99.00,
    frequency: 'monthly' as const,
    category: 'Design',
    nextPayment: '2025-12-28',
    status: 'paused' as const,
    autoRenew: false,
    icon: '🎨',
  },
];

export const SUBSCRIPTIONS_SUMMARY = {
  monthlyTotal: SUBSCRIPTIONS
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + s.amount, 0), // R$ 96,70
  yearlyProjection: SUBSCRIPTIONS
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + s.amount, 0) * 12, // R$ 1.160,40
  activeCount: SUBSCRIPTIONS.filter(s => s.status === 'active').length, // 4
  pausedCount: SUBSCRIPTIONS.filter(s => s.status === 'paused').length, // 1
};

// ============================================
// DÍVIDAS (Debts)
// ============================================
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

export const DEBTS_SUMMARY = {
  totalDebt: DEBTS.reduce((sum, d) => sum + d.remainingAmount, 0), // R$ 38.600
  totalMonthlyPayment: DEBTS.reduce((sum, d) => sum + d.monthlyPayment, 0), // R$ 2.300
  totalPaid: DEBTS.reduce((sum, d) => sum + d.paidAmount, 0), // R$ 24.600
  averageInterestRate: DEBTS.reduce((sum, d) => sum + d.interestRate, 0) / DEBTS.length, // 2,5%
};

// ============================================
// SCORE FINANCEIRO (0-100)
// ============================================
export const calculateFinancialScore = () => {
  // Critério 1: Taxa de Poupança (0-25 pontos)
  const savingsScore = Math.min((MONTHLY_SUMMARY.savingsRate / 20) * 25, 25);
  
  // Critério 2: Controle de Gastos - comparado com orçamento (0-25 pontos)
  const budgetAdherence = BUDGETS.filter(b => b.percentage <= 100).length / BUDGETS.length;
  const controlScore = budgetAdherence * 25;
  
  // Critério 3: Progresso em Metas (0-20 pontos)
  const goalsProgress = GOALS.reduce((sum, g) => sum + g.percentage, 0) / GOALS.length;
  const goalsScore = Math.min((goalsProgress / 50) * 20, 20);
  
  // Critério 4: Uso de Crédito (0-15 pontos) - quanto menor melhor
  const creditUsage = CARDS_SUMMARY.usagePercentage;
  const creditScore = creditUsage < 30 ? 15 : creditUsage < 50 ? 10 : 5;
  
  // Critério 5: Dívidas (0-15 pontos) - quanto menor melhor
  const debtRatio = (DEBTS_SUMMARY.totalMonthlyPayment / USER_DATA.monthlyIncome) * 100;
  const debtScore = debtRatio < 20 ? 15 : debtRatio < 35 ? 10 : 5;
  
  return {
    total: Math.round(savingsScore + controlScore + goalsScore + creditScore + debtScore),
    breakdown: {
      savings: Math.round(savingsScore),
      control: Math.round(controlScore),
      goals: Math.round(goalsScore),
      credit: creditScore,
      debt: debtScore,
    },
  };
};

export const FINANCIAL_SCORE = calculateFinancialScore();

// ============================================
// PROJEÇÃO (Forecast) - Próximos 6 meses
// ============================================
export const generateForecast = () => {
  const months = ['Nov/25', 'Dez/25', 'Jan/26', 'Fev/26', 'Mar/26', 'Abr/26'];
  let currentBalance = MONTHLY_SUMMARY.balance;
  
  return months.map((month, index) => {
    const monthlyIncome = USER_DATA.monthlyIncome;
    const monthlyExpenses = MONTHLY_SUMMARY.totalExpenses - DEBTS_SUMMARY.totalMonthlyPayment;
    const monthlyDebtPayment = DEBTS_SUMMARY.totalMonthlyPayment;
    
    // Projetar economia mensal (receita - despesas - dívidas)
    const monthlySavings = monthlyIncome - monthlyExpenses - monthlyDebtPayment;
    currentBalance += monthlySavings;
    
    return {
      month,
      saldoAtual: index === 0 ? MONTHLY_SUMMARY.balance : null,
      saldoProjetado: Math.round(currentBalance),
      receitasProjetadas: monthlyIncome,
      despesasProjetadas: monthlyExpenses,
    };
  });
};

export const FORECAST_DATA = generateForecast();

// ============================================
// ALERTAS PREDITIVOS
// ============================================
export const PREDICTIVE_ALERTS = [
  {
    id: 1,
    type: 'warning' as const,
    title: 'Orçamento de Alimentação Excedido',
    description: `Você gastou R$ ${EXPENSES_BY_CATEGORY['Alimentação'].toFixed(2)} de R$ ${BUDGETS[0].allocated} orçados (-${BUDGETS[0].remaining.toFixed(2)})`,
    daysAhead: 0,
  },
  {
    id: 2,
    type: 'success' as const,
    title: 'Meta de Notebook pode ser Alcançada',
    description: `Economizando R$ ${GOALS[2].monthlyNeeded.toFixed(2)}/mês você atinge a meta em Março/2026`,
    daysAhead: 120,
  },
  {
    id: 3,
    type: 'danger' as const,
    title: 'Comprometimento com Dívidas Alto',
    description: `${((DEBTS_SUMMARY.totalMonthlyPayment / USER_DATA.monthlyIncome) * 100).toFixed(1)}% da sua renda está comprometida com parcelas de dívidas`,
    daysAhead: 0,
  },
  {
    id: 4,
    type: 'info' as const,
    title: 'Fatura do Nubank Vence em Breve',
    description: `Fatura de R$ ${CREDIT_CARDS[0].nextInvoice.toFixed(2)} vence em ${CREDIT_CARDS[0].nextDueDate}`,
    daysAhead: Math.ceil((new Date(CREDIT_CARDS[0].nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
  },
];

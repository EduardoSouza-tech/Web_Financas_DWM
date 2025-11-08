'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PiggyBank, 
  Target,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  XCircle,
  CheckCircle2,
  Sparkles,
  Clock,
  CreditCard,
  Calendar,
  Trophy
} from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils';
import CashflowChart from '@/components/charts/cashflow-chart';
import CategoryChart from '@/components/charts/category-chart';
import BudgetChart from '@/components/charts/budget-chart';
import { useFinance } from '@/contexts/FinanceContext';
import { 
  MONTHLY_SUMMARY, 
  CATEGORY_PERCENTAGES, 
  GOALS, 
  PREDICTIVE_ALERTS,
  FINANCIAL_SCORE,
  FORECAST_DATA,
  FINANCIAL_HEALTH,
  DEBTS,
  CREDIT_CARDS,
  SUBSCRIPTIONS
} from '@/lib/mock-data';

export default function DashboardPage() {
  const { getTotalExpenses, getBalance, getSavingsRate, getTotalCardUsage } = useFinance();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [incomeBoost, setIncomeBoost] = useState(0);
  const [expenseReduction, setExpenseReduction] = useState(0);
  
  const [data] = useState({
    totalIncome: MONTHLY_SUMMARY.totalIncome,
    get totalExpenses() { return getTotalExpenses(); },
    get balance() { return getBalance(); },
    projectedBalance: FORECAST_DATA[5].saldoProjetado, // 6 meses à frente
    get savingsRate() { return getSavingsRate(); },
    score: FINANCIAL_SCORE.total,
    mainCategories: CATEGORY_PERCENTAGES,
    goals: GOALS.slice(0, 2).map(g => ({
      name: g.name,
      currentAmount: g.currentAmount,
      targetAmount: g.targetAmount,
      percentage: g.percentage,
    })),
    alerts: PREDICTIVE_ALERTS.slice(0, 2).map(a => ({
      type: a.type,
      title: a.title,
      message: a.description,
    })),
  });

  // Carregar conquistas
  useEffect(() => {
    const saved = localStorage.getItem('debtAchievements');
    if (saved) {
      setAchievements(JSON.parse(saved));
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-2">
            Visão geral das suas finanças em tempo real
          </p>
        </div>
        <Badge variant="success" className="text-sm px-4 py-2">
          Score: {data.score}/100
        </Badge>
      </div>

      {/* Alertas Críticos */}
      {FINANCIAL_HEALTH.criticalAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {FINANCIAL_HEALTH.criticalAlerts.map((alert) => (
            <Alert 
              key={alert.id} 
              variant={alert.type === 'danger' ? 'destructive' : 'default'}
              className={alert.type === 'warning' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/10' : ''}
            >
              {alert.type === 'danger' ? (
                <XCircle className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              )}
              <AlertTitle className="text-lg font-bold">{alert.title}</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="font-semibold">{alert.message}</p>
                <p className="mt-2 text-sm">💡 <strong>Ação recomendada:</strong> {alert.action}</p>
              </AlertDescription>
            </Alert>
          ))}
        </motion.div>
      )}

      {/* KPI Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={itemVariants}>
          <Card className="glass border-green-500/20 hover:border-green-500/40 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receitas</CardTitle>
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(data.totalIncome)}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+12%</span> vs mês anterior
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass border-red-500/20 hover:border-red-500/40 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas</CardTitle>
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{formatCurrency(data.totalExpenses)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {((data.totalExpenses / data.totalIncome) * 100).toFixed(1)}% da receita
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass border-orange-500/20 hover:border-orange-500/40 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagamento de Dívidas</CardTitle>
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {formatCurrency(FINANCIAL_HEALTH.monthlyDebtPayments)}
              </div>
              <p className="text-xs text-orange-600 font-semibold mt-1">
                {FINANCIAL_HEALTH.debtCommitmentPercentage.toFixed(1)}% da renda comprometida
              </p>
              {FINANCIAL_HEALTH.debtCommitmentPercentage > 30 && (
                <Badge variant="danger" className="mt-2 text-xs">Acima do recomendado (30%)</Badge>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className={`glass transition-all ${FINANCIAL_HEALTH.isInDeficit ? 'border-red-500/40' : 'border-primary/20 hover:border-primary/40'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Real Mensal</CardTitle>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${FINANCIAL_HEALTH.isInDeficit ? 'bg-red-500/10' : 'bg-primary/10'}`}>
                {FINANCIAL_HEALTH.isInDeficit ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${FINANCIAL_HEALTH.isInDeficit ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(FINANCIAL_HEALTH.availableAfterDebts)}
              </div>
              <p className={`text-xs font-semibold mt-1 flex items-center gap-1 ${FINANCIAL_HEALTH.isInDeficit ? 'text-red-600' : 'text-muted-foreground'}`}>
                {FINANCIAL_HEALTH.isInDeficit ? (
                  <>
                    <ArrowDownRight className="h-3 w-3" />
                    Déficit de {FINANCIAL_HEALTH.realSavingsRate.toFixed(2)}%
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="h-3 w-3" />
                    Taxa: {FINANCIAL_HEALTH.realSavingsRate.toFixed(2)}%
                  </>
                )}
              </p>
              {FINANCIAL_HEALTH.isInDeficit && (
                <Badge variant="danger" className="mt-2 text-xs">
                  Gastando mais que ganha!
                </Badge>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Card de Análise de Fluxo de Caixa */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Análise de Fluxo de Caixa</CardTitle>
            <CardDescription>Entenda para onde seu dinheiro está indo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Sem Dívidas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Cenário Sem Dívidas (Ideal)</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Positivo
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Receita</span>
                    <span className="font-semibold text-green-600">
                      + {formatCurrency(FINANCIAL_HEALTH.monthlyIncome)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Despesas</span>
                    <span className="font-semibold text-red-600">
                      - {formatCurrency(FINANCIAL_HEALTH.monthlyExpenses)}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="font-bold">Saldo Disponível</span>
                      <span className="font-bold text-green-600">
                        = {formatCurrency(FINANCIAL_HEALTH.availableAfterExpenses)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Taxa de poupança: {FINANCIAL_HEALTH.savingsRate.toFixed(2)}% ✅ Excelente!
                    </p>
                  </div>
                </div>
              </div>

              {/* Com Dívidas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Cenário Atual (Com Dívidas)</span>
                  <Badge variant={FINANCIAL_HEALTH.isInDeficit ? 'danger' : 'default'}>
                    {FINANCIAL_HEALTH.isInDeficit ? 'Negativo' : 'Positivo'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Receita</span>
                    <span className="font-semibold text-green-600">
                      + {formatCurrency(FINANCIAL_HEALTH.monthlyIncome)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Despesas</span>
                    <span className="font-semibold text-red-600">
                      - {formatCurrency(FINANCIAL_HEALTH.monthlyExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Parcelas de Dívidas</span>
                    <span className="font-semibold text-orange-600">
                      - {formatCurrency(FINANCIAL_HEALTH.monthlyDebtPayments)}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="font-bold">Saldo Real</span>
                      <span className={`font-bold ${FINANCIAL_HEALTH.isInDeficit ? 'text-red-600' : 'text-green-600'}`}>
                        = {formatCurrency(FINANCIAL_HEALTH.availableAfterDebts)}
                      </span>
                    </div>
                    {FINANCIAL_HEALTH.isInDeficit && (
                      <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Você está no vermelho! Déficit de {formatCurrency(Math.abs(FINANCIAL_HEALTH.availableAfterDebts))} por mês
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recomendação */}
              {FINANCIAL_HEALTH.isInDeficit && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    💡 Recomendação Urgente
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Priorize quitar o <strong>Cartão Parcelado C6</strong> (3,8% a.m. de juros) para liberar R$ 400/mês.
                    Depois, foque no <strong>Empréstimo Pessoal</strong> (2,5% a.m.) para liberar mais R$ 650/mês.
                    Ao quitar essas duas dívidas, você terá {formatCurrency(FINANCIAL_HEALTH.availableAfterDebts + 1050)}/mês positivos!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-5 w-5" />
                Alertas e Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.alerts.map((alert, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{alert.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Charts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-6"
      >
        <h2 className="text-xl font-semibold">Análise Financeira</h2>
        
        {/* Cashflow Chart - Full Width */}
        <CashflowChart />

        {/* Category and Budget Charts - Side by Side */}
        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryChart />
          <BudgetChart />
        </div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Categories */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Gastos por Categoria</CardTitle>
            <CardDescription>Top 5 categorias do mês</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.mainCategories.map((category, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{category.categoryName}</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(category.amount)} ({category.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${category.percentage}%` }}
                    transition={{ duration: 1, delay: 0.1 * i }}
                    className="h-full bg-gradient-to-r from-primary to-purple-600"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Goals */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Metas em Progresso
            </CardTitle>
            <CardDescription>Acompanhe seus objetivos financeiros</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {data.goals.map((goal, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{goal.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
                    </p>
                  </div>
                  <Badge variant="info">{goal.percentage}%</Badge>
                </div>
                <div className="h-3 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.percentage}%` }}
                    transition={{ duration: 1, delay: 0.2 * i }}
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Seção de Vencimentos Próximos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          Vencimentos Próximos
          <Badge variant="warning" className="ml-2">
            {(() => {
              const today = new Date();
              const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
              
              const upcomingDebts = DEBTS.filter(d => {
                const dueDate = new Date(d.nextDueDate);
                return dueDate >= today && dueDate <= next7Days;
              });
              
              const upcomingCards = CREDIT_CARDS.filter(c => {
                const dueDate = new Date(c.nextDueDate);
                return dueDate >= today && dueDate <= next7Days;
              });
              
              const upcomingSubscriptions = SUBSCRIPTIONS.filter(s => {
                if (!s.nextPayment) return false;
                const renewDate = new Date(s.nextPayment);
                return renewDate >= today && renewDate <= next7Days;
              });
              
              return upcomingDebts.length + upcomingCards.length + upcomingSubscriptions.length;
            })()} próximos
          </Badge>
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Dívidas */}
          <Card className="glass border-red-500/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Dívidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(() => {
                const today = new Date();
                const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                
                const upcoming = DEBTS
                  .filter(d => {
                    const dueDate = new Date(d.nextDueDate);
                    return dueDate >= today && dueDate <= next7Days;
                  })
                  .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
                
                if (upcoming.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum vencimento nos próximos 7 dias
                    </p>
                  );
                }
                
                return upcoming.map(debt => {
                  const dueDate = new Date(debt.nextDueDate);
                  const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={debt.id} className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{debt.name}</p>
                        <Badge variant={daysUntil <= 2 ? 'danger' : 'warning'} className="text-xs">
                          {daysUntil === 0 ? 'Hoje' : daysUntil === 1 ? 'Amanhã' : `${daysUntil} dias`}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {dueDate.toLocaleDateString('pt-BR')}
                      </p>
                      <p className="font-bold text-red-600">
                        {debt.monthlyPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  );
                });
              })()}
            </CardContent>
          </Card>

          {/* Cartões */}
          <Card className="glass border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-purple-500" />
                Faturas de Cartão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(() => {
                const today = new Date();
                const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                
                const upcoming = CREDIT_CARDS
                  .filter(c => {
                    const dueDate = new Date(c.nextDueDate);
                    return dueDate >= today && dueDate <= next7Days;
                  })
                  .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
                
                if (upcoming.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum vencimento nos próximos 7 dias
                    </p>
                  );
                }
                
                return upcoming.map(card => {
                  const dueDate = new Date(card.nextDueDate);
                  const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={card.id} className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{card.name}</p>
                        <Badge variant={daysUntil <= 2 ? 'danger' : 'warning'} className="text-xs">
                          {daysUntil === 0 ? 'Hoje' : daysUntil === 1 ? 'Amanhã' : `${daysUntil} dias`}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {dueDate.toLocaleDateString('pt-BR')}
                      </p>
                      <p className="font-bold text-purple-600">
                        {card.nextInvoice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  );
                });
              })()}
            </CardContent>
          </Card>

          {/* Assinaturas */}
          <Card className="glass border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                Renovações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(() => {
                const today = new Date();
                const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                
                const upcoming = SUBSCRIPTIONS
                  .filter(s => {
                    if (!s.nextPayment) return false;
                    const renewDate = new Date(s.nextPayment);
                    return renewDate >= today && renewDate <= next7Days;
                  })
                  .sort((a, b) => {
                    const dateA = a.nextPayment ? new Date(a.nextPayment).getTime() : 0;
                    const dateB = b.nextPayment ? new Date(b.nextPayment).getTime() : 0;
                    return dateA - dateB;
                  });
                
                if (upcoming.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma renovação nos próximos 7 dias
                    </p>
                  );
                }
                
                return upcoming.map(sub => {
                  const renewDate = new Date(sub.nextPayment!);
                  const daysUntil = Math.ceil((renewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={sub.id} className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{sub.name}</p>
                        <Badge variant="info" className="text-xs">
                          {daysUntil === 0 ? 'Hoje' : daysUntil === 1 ? 'Amanhã' : `${daysUntil} dias`}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {renewDate.toLocaleDateString('pt-BR')}
                      </p>
                      <p className="font-bold text-blue-600">
                        {sub.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/{sub.frequency === 'monthly' ? 'mês' : 'ano'}
                      </p>
                    </div>
                  );
                });
              })()}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Seção de Conquistas */}
      {achievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Conquistas Financeiras
            <Badge variant="success" className="ml-2">
              {achievements.length} dívida{achievements.length > 1 ? 's' : ''} quitada{achievements.length > 1 ? 's' : ''}
            </Badge>
          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {achievements.slice().reverse().map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass border-yellow-500/30 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/20 dark:to-orange-950/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{achievement.debtName}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {new Date(achievement.paidAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                        <p className="text-xs text-muted-foreground">Valor quitado</p>
                        <p className="text-sm font-bold text-green-600">
                          {achievement.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                        <p className="text-xs text-muted-foreground">Liberd por mês</p>
                        <p className="text-sm font-bold text-blue-600">
                          +{achievement.monthlyPaymentFreed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                    </div>
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-300 dark:border-yellow-700">
                      <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Economizou {achievement.interestRate}% a.m. de juros!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {achievements.length >= 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-4 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-lg border border-yellow-300 dark:border-yellow-700"
            >
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-yellow-600" />
                <div>
                  <h3 className="font-bold text-lg">Matador de Dívidas! 🏆</h3>
                  <p className="text-sm text-muted-foreground">
                    Você já quitou {achievements.length} dívidas e liberou{' '}
                    <span className="font-bold text-green-600">
                      {achievements.reduce((sum, a) => sum + a.monthlyPaymentFreed, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    /mês!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Seção de Insights Inteligentes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Insights Inteligentes
        </h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          {FINANCIAL_HEALTH.intelligentInsights.map((insight) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={`
                glass border-l-4
                ${insight.type === 'success' ? 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20' : ''}
                ${insight.type === 'warning' ? 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20' : ''}
                ${insight.type === 'info' ? 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : ''}
                ${insight.type === 'tip' ? 'border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20' : ''}
              `}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{insight.icon}</span>
                    <div className="flex-1">
                      <CardTitle className="text-base">{insight.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {insight.message}
                  </p>
                  {insight.impact && (
                    <div className={`
                      p-2 rounded-lg text-xs font-medium
                      ${insight.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : ''}
                      ${insight.type === 'warning' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : ''}
                      ${insight.type === 'info' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : ''}
                      ${insight.type === 'tip' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : ''}
                    `}>
                      💡 {insight.impact}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Simulador What-If */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-6"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Simulador "E se...?"
        </h2>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Simule mudanças na sua situação financeira</CardTitle>
            <CardDescription>
              Veja o impacto de mudanças em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {(() => {
              const newIncome = FINANCIAL_HEALTH.monthlyIncome + incomeBoost;
              const newExpenses = FINANCIAL_HEALTH.monthlyExpenses - expenseReduction;
              const newAvailable = newIncome - newExpenses - FINANCIAL_HEALTH.monthlyDebtPayments;
              const newSavingsRate = ((newAvailable / newIncome) * 100);
              const improvement = newAvailable - FINANCIAL_HEALTH.availableAfterDebts;
              
              return (
                <>
                  {/* Sliders */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Aumento de renda</label>
                        <Badge variant={incomeBoost > 0 ? 'success' : 'secondary'}>
                          +{incomeBoost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </Badge>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="3000"
                        step="100"
                        value={incomeBoost}
                        onChange={(e) => setIncomeBoost(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>R$ 0</span>
                        <span>R$ 3.000</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Redução de despesas</label>
                        <Badge variant={expenseReduction > 0 ? 'success' : 'secondary'}>
                          -{expenseReduction.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </Badge>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2000"
                        step="50"
                        value={expenseReduction}
                        onChange={(e) => setExpenseReduction(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>R$ 0</span>
                        <span>R$ 2.000</span>
                      </div>
                    </div>
                  </div>

                  {/* Resultados */}
                  {(incomeBoost > 0 || expenseReduction > 0) && (
                    <div className="p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg border-2 border-primary/30">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Nova Renda</p>
                          <p className="text-lg font-bold text-green-600">
                            {newIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                          <p className="text-xs text-green-600">
                            +{incomeBoost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Novas Despesas</p>
                          <p className="text-lg font-bold text-blue-600">
                            {newExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                          <p className="text-xs text-blue-600">
                            -{expenseReduction.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Novo Saldo</p>
                          <p className={`text-lg font-bold ${newAvailable > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {newAvailable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                          <p className={`text-xs ${improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {improvement > 0 ? '+' : ''}{improvement.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Taxa Poupança</p>
                          <p className={`text-lg font-bold ${newSavingsRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {newSavingsRate.toFixed(1)}%
                          </p>
                          <p className={`text-xs ${newSavingsRate > FINANCIAL_HEALTH.realSavingsRate ? 'text-green-600' : 'text-red-600'}`}>
                            {newSavingsRate > FINANCIAL_HEALTH.realSavingsRate ? '↑' : '↓'}
                            {Math.abs(newSavingsRate - FINANCIAL_HEALTH.realSavingsRate).toFixed(1)}pp
                          </p>
                        </div>
                      </div>

                      {newAvailable > 0 && FINANCIAL_HEALTH.isInDeficit && (
                        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-300 dark:border-green-700">
                          <p className="text-sm font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            🎉 Com essas mudanças, você sairá do vermelho!
                          </p>
                        </div>
                      )}

                      {newSavingsRate >= 20 && (
                        <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-300 dark:border-blue-700">
                          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                            <Trophy className="w-4 h-4" />
                            Excelente! Taxa de poupança acima de 20%
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

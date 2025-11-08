'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PiggyBank, 
  Target,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
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
  FORECAST_DATA
} from '@/lib/mock-data';

export default function DashboardPage() {
  const { getTotalExpenses, getBalance, getSavingsRate, getTotalCardUsage } = useFinance();
  
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
              <div className="text-3xl font-bold">{formatCurrency(data.totalExpenses)}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <ArrowDownRight className="h-3 w-3 text-red-500" />
                <span className="text-red-500">-3%</span> vs mês anterior
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass border-primary/20 hover:border-primary/40 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo</CardTitle>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(data.balance)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Projetado: {formatCurrency(data.projectedBalance)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass border-purple-500/20 hover:border-purple-500/40 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Poupança</CardTitle>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <PiggyBank className="h-5 w-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.savingsRate.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(data.balance)} economizado
              </p>
            </CardContent>
          </Card>
        </motion.div>
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
    </div>
  );
}

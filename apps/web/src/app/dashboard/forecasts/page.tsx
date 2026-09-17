'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  Target,
  Zap,
  Calendar,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { 
  FORECAST_DATA, 
  FINANCIAL_SCORE, 
  PREDICTIVE_ALERTS,
  MONTHLY_SUMMARY 
} from '@/lib/mock-data';
import { useFinance } from '@/contexts/FinanceContext';

interface ForecastData {
  month: string;
  saldoAtual: number | null;
  saldoProjetado: number;
  receitasProjetadas: number;
  despesasProjetadas: number;
}

interface ScoreData {
  category: string;
  score: number;
  fullMark: number;
}

// Score data baseado nos cálculos reais
const scoreData: ScoreData[] = [
  { category: 'Poupança', score: FINANCIAL_SCORE.breakdown.savings * 4, fullMark: 100 }, // 0-25 -> 0-100
  { category: 'Controle', score: FINANCIAL_SCORE.breakdown.control * 4, fullMark: 100 },
  { category: 'Metas', score: FINANCIAL_SCORE.breakdown.goals * 5, fullMark: 100 }, // 0-20 -> 0-100
  { category: 'Crédito', score: FINANCIAL_SCORE.breakdown.credit * 6.67, fullMark: 100 }, // 0-15 -> 0-100
  { category: 'Dívidas', score: FINANCIAL_SCORE.breakdown.debt * 6.67, fullMark: 100 },
];

export default function ForecastsPage() {
  const { getTotalIncome, getTotalExpenses, getBalance, getTotalDebtPayments } = useFinance();
  const [forecastData] = useState<ForecastData[]>(FORECAST_DATA as ForecastData[]);
  
  // Calcular valores reais do contexto
  const monthlyIncome = getTotalIncome();
  const monthlyExpenses = getTotalExpenses();
  const monthlyDebtPayments = getTotalDebtPayments();
  const currentBalance = getBalance();
  
  // Simulador What-If
  const [incomeAdjustment, setIncomeAdjustment] = useState(0);
  const [expenseReduction, setExpenseReduction] = useState(0);
  const [debtReduction, setDebtReduction] = useState(0);

  // KPIs baseados em dados REAIS do contexto
  const projectedBalance6Months = FORECAST_DATA[5].saldoProjetado;
  const projectedGrowth = currentBalance > 0 ? ((projectedBalance6Months - currentBalance) / currentBalance) * 100 : 0;
  const potentialSavings = projectedBalance6Months - currentBalance;
  const financialScore = FINANCIAL_SCORE.total;

  // Simulação What-If - Usando valores reais
  const whatIfIncome = monthlyIncome + incomeAdjustment;
  const whatIfExpenses = monthlyExpenses - expenseReduction;
  const whatIfDebts = monthlyDebtPayments - debtReduction;
  const whatIfMonthlyBalance = whatIfIncome - whatIfExpenses - whatIfDebts;
  const simulatedBalance = currentBalance + (whatIfMonthlyBalance * 6);
  const simulationImpact = simulatedBalance - projectedBalance6Months;

  // Alertas vindos dos dados centralizados
  const alerts = PREDICTIVE_ALERTS;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Previsões Financeiras</h1>
          <p className="text-muted-foreground">Projeções inteligentes e simulações para seu futuro</p>
        </div>
        <Button className="gap-2">
          <Zap className="w-4 h-4" />
          Atualizar Projeções
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Projetado (6m)</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {projectedBalance6Months.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Baseado em histórico
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                +{projectedGrowth.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Nos próximos 6 meses
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Economia Potencial</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {potentialSavings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Acumulado em 6 meses
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score Financeiro</CardTitle>
              <Target className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {financialScore}/100
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {financialScore >= 70 ? 'Boa saúde' : 'Precisa melhorar'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Gráfico de Projeção */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle>Projeção de Saldo - Próximos 6 Meses</CardTitle>
            <CardDescription>Evolução esperada do seu saldo baseada em padrões históricos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="colorAtual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProjetado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                  formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="saldoAtual" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorAtual)" 
                  name="Saldo Atual"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="saldoProjetado" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorProjetado)" 
                  name="Projeção"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Simulador What-If e Score */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Simulador What-If */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Simulador "E se...?"
              </CardTitle>
              <CardDescription>Simule cenários e veja o impacto no seu futuro financeiro</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Receita */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Aumento de Receita Mensal</label>
                  <span className="text-sm font-bold text-green-600">
                    +{incomeAdjustment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="100"
                  value={incomeAdjustment}
                  onChange={(e) => setIncomeAdjustment(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-green-600"
                />
              </div>

              {/* Despesas */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Redução de Despesas Mensais</label>
                  <span className="text-sm font-bold text-blue-600">
                    -{expenseReduction.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1500"
                  step="50"
                  value={expenseReduction}
                  onChange={(e) => setExpenseReduction(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Redução de Dívidas */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Redução de Pagamento de Dívidas</label>
                  <span className="text-sm font-bold text-green-600">
                    -{debtReduction.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3000"
                  step="100"
                  value={debtReduction}
                  onChange={(e) => setDebtReduction(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-green-600"
                />
              </div>

              {/* Resultado da Simulação */}
              <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Saldo Projetado (6 meses)</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {simulatedBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className={`text-xs font-semibold ${simulationImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {simulationImpact >= 0 ? '+' : ''}{simulationImpact.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} vs original
                    </div>
                  </div>
                </div>
              </div>

              <Button className="w-full" variant="outline">
                Salvar Simulação
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Score Financeiro */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-500" />
                Score de Saúde Financeira
              </CardTitle>
              <CardDescription>Avaliação em 5 dimensões-chave</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-orange-600">{financialScore}</div>
                    <div className="text-sm text-muted-foreground">de 100</div>
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={scoreData}>
                  <PolarGrid className="stroke-muted" />
                  <PolarAngleAxis 
                    dataKey="category" 
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fill: 'currentColor' }}
                  />
                  <Radar 
                    name="Seu Score" 
                    dataKey="score" 
                    stroke="#f97316" 
                    fill="#f97316" 
                    fillOpacity={0.6} 
                    strokeWidth={2}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>

              <div className="space-y-2 mt-4">
                {scoreData.map((item) => (
                  <div key={item.category} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.category}</span>
                    <span className="font-semibold">{item.score}/100</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Alertas Preditivos */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Alertas Preditivos
            </CardTitle>
            <CardDescription>Avisos inteligentes baseados em análise de tendências</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="mt-1">
                    {alert.type === 'success' && <TrendingUp className="w-5 h-5 text-green-500" />}
                    {alert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                    {alert.type === 'danger' && <TrendingDown className="w-5 h-5 text-red-500" />}
                    {alert.type === 'info' && <Calendar className="w-5 h-5 text-blue-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{alert.title}</h4>
                      <Badge variant={alert.type}>
                        {alert.daysAhead === 0 ? 'Agora' : `${alert.daysAhead} dias`}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

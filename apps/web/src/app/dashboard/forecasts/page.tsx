'use client';

import { useState } from 'react';
import { AlertTriangle, Activity, Info, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
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
} from 'recharts';
import { useFinance } from '@/contexts/FinanceContext';
import { MonthPicker } from '@/components/month-picker';
import { formatCurrency, cn } from '@/lib/utils';
import { currentMonthKey, formatMonth } from '@/lib/finance/credit-card';
import { generateAlerts } from '@/lib/finance/alerts';

const MONTHS_AHEAD = 6;

export default function ForecastsPage() {
  const {
    referenceMonth,
    setReferenceMonth,
    expectedIncome,
    getHealth,
    getForecast,
    getScore,
    getBudgets,
    goals,
    cards,
  } = useFinance();

  const [incomeAdjustment, setIncomeAdjustment] = useState(0);
  const [expenseReduction, setExpenseReduction] = useState(0);
  const [debtReduction, setDebtReduction] = useState(0);

  const health = getHealth();
  const forecast = getForecast(MONTHS_AHEAD);
  const score = getScore();
  const alerts = generateAlerts({
    health,
    expectedIncome,
    budgets: getBudgets(),
    goals,
    cards,
    isCurrentMonth: referenceMonth === currentMonthKey(),
  });

  const accumulated = forecast[forecast.length - 1]?.accumulated ?? 0;
  const averageBalance = forecast.length ? accumulated / forecast.length : 0;
  const worstMonth = forecast.reduce((worst, m) => (m.balance < worst.balance ? m : worst), forecast[0]);

  // Simulador: aplica os ajustes em todos os meses projetados
  const simulatedAccumulated = accumulated + (incomeAdjustment + expenseReduction + debtReduction) * MONTHS_AHEAD;

  const chartData = forecast.map(m => ({
    month: formatMonth(m.month, true),
    acumulado: Math.round(m.accumulated),
    simulado: Math.round(m.accumulated + (incomeAdjustment + expenseReduction + debtReduction) * (forecast.indexOf(m) + 1)),
    sobra: Math.round(m.balance),
  }));

  const radarData = score.criteria.map(c => ({ category: c.label, score: Math.round(c.score ?? 0) }));

  const slider = (label: string, value: number, set: (v: number) => void, max: number, step: number, sign: string) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm font-bold text-green-600">
          {sign}
          {formatCurrency(value)}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max={max}
        step={step}
        value={value}
        onChange={e => set(Number(e.target.value))}
        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-green-600"
      />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Previsões Financeiras</h1>
          <p className="text-muted-foreground">
            Próximos {MONTHS_AHEAD} meses a partir de {formatMonth(referenceMonth)}
          </p>
        </div>
        <MonthPicker value={referenceMonth} onChange={setReferenceMonth} />
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acumulado em {MONTHS_AHEAD} meses</CardTitle>
            {accumulated >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold', accumulated >= 0 ? 'text-green-600' : 'text-red-600')}>
              {formatCurrency(accumulated)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">soma do que sobra, já descontando aportes planejados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sobra média por mês</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              pior mês: {worstMonth ? `${formatMonth(worstMonth.month, true)} (${formatCurrency(worstMonth.balance)})` : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renda considerada</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(forecast[0]?.income ?? 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {expectedIncome > 0 ? 'renda esperada do perfil (Configurações)' : 'receita do mês; defina a renda esperada nas Configurações'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score financeiro</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{score.total === null ? '—' : `${score.total}/100`}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {score.total === null ? 'sem dados suficientes' : score.total >= 70 ? 'Boa saúde' : score.total >= 50 ? 'Atenção' : 'Precisa melhorar'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projeção do acumulado</CardTitle>
          <CardDescription>
            Renda − gastos habituais do mês base − parcelas e assinaturas já conhecidas − parcelas de dívidas (enquanto durarem) − aportes planejados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={v => `R$ ${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number, name: string) => [formatCurrency(v), name === 'acumulado' ? 'Acumulado' : name === 'simulado' ? 'Com simulação' : 'Sobra do mês']} />
              <Area type="monotone" dataKey="acumulado" stroke="hsl(var(--primary))" fill="url(#colorAcumulado)" strokeWidth={2} />
              {(incomeAdjustment + expenseReduction + debtReduction) > 0 && (
                <Area type="monotone" dataKey="simulado" stroke="#10b981" fillOpacity={0} strokeDasharray="5 5" strokeWidth={2} />
              )}
            </AreaChart>
          </ResponsiveContainer>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="text-left py-2">Mês</th>
                  <th className="text-right py-2">Renda</th>
                  <th className="text-right py-2">Despesas</th>
                  <th className="text-right py-2">Dívidas</th>
                  <th className="text-right py-2">Aportes</th>
                  <th className="text-right py-2">Sobra</th>
                </tr>
              </thead>
              <tbody>
                {forecast.map(m => (
                  <tr key={m.month} className="border-b last:border-0">
                    <td className="py-2">{formatMonth(m.month, true)}</td>
                    <td className="text-right">{formatCurrency(m.income)}</td>
                    <td className="text-right">{formatCurrency(m.expenses)}</td>
                    <td className="text-right">{formatCurrency(m.debtPayments)}</td>
                    <td className="text-right">{formatCurrency(m.plannedContributions)}</td>
                    <td className={cn('text-right font-semibold', m.balance >= 0 ? 'text-green-600' : 'text-red-600')}>
                      {formatCurrency(m.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Simulador "E se...?"</CardTitle>
            <CardDescription>Ajustes aplicados em cada um dos {MONTHS_AHEAD} meses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {slider('Aumento de receita mensal', incomeAdjustment, setIncomeAdjustment, 5000, 100, '+')}
            {slider('Redução de despesas mensais', expenseReduction, setExpenseReduction, 3000, 100, '-')}
            {slider('Redução de pagamento de dívidas', debtReduction, setDebtReduction, Math.max(100, Math.ceil(health.debtPayments / 100) * 100), 100, '-')}
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Acumulado em {MONTHS_AHEAD} meses</p>
              <p className={cn('text-2xl font-bold', simulatedAccumulated >= 0 ? 'text-green-600' : 'text-red-600')}>
                {formatCurrency(simulatedAccumulated)}
              </p>
              <p className="text-sm text-green-600">
                {simulatedAccumulated - accumulated > 0 ? `+${formatCurrency(simulatedAccumulated - accumulated)} vs projeção` : 'sem ajustes'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Score de saúde financeira</CardTitle>
            <CardDescription>Critérios sem dados ficam fora da nota</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid className="stroke-muted" />
                <PolarAngleAxis dataKey="category" className="text-xs" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {score.criteria.map(c => (
                <div key={c.key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium w-20">{c.label}</span>
                  <span className="flex-1 text-xs text-muted-foreground truncate">{c.detail}</span>
                  <span className="font-semibold">{c.score === null ? '—' : `${Math.round(c.score)}/100`}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Alertas
          </CardTitle>
          <CardDescription>Gerados a partir dos dados de {formatMonth(referenceMonth)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.length === 0 && <p className="text-sm text-muted-foreground">Nenhum alerta no momento.</p>}
          {alerts.map(alert => (
            <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border">
              {alert.type === 'info' ? (
                <Info className="w-5 h-5 text-blue-500 shrink-0" />
              ) : (
                <AlertTriangle className={cn('w-5 h-5 shrink-0', alert.type === 'danger' ? 'text-red-500' : 'text-amber-500')} />
              )}
              <div className="flex-1">
                <p className="font-medium text-sm">{alert.title}</p>
                <p className="text-sm text-muted-foreground">{alert.message}</p>
              </div>
              <Badge variant={alert.type === 'danger' ? 'danger' : alert.type === 'warning' ? 'warning' : 'info'}>
                {alert.type === 'danger' ? 'Crítico' : alert.type === 'warning' ? 'Atenção' : 'Info'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

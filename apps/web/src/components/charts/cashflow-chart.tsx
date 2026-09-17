'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface CashflowChartProps {
  data?: Array<{
    month: string;
    income: number;
    expenses: number;
    balance: number;
  }>;
}

const defaultData = [
  { month: 'Jan', income: 5000, expenses: 3200, balance: 1800 },
  { month: 'Fev', income: 5200, expenses: 3500, balance: 1700 },
  { month: 'Mar', income: 4800, expenses: 3100, balance: 1700 },
  { month: 'Abr', income: 5500, expenses: 3800, balance: 1700 },
  { month: 'Mai', income: 5300, expenses: 3400, balance: 1900 },
  { month: 'Jun', income: 5400, expenses: 3600, balance: 1800 },
  { month: 'Jul', income: 5600, expenses: 3700, balance: 1900 },
  { month: 'Ago', income: 5100, expenses: 3300, balance: 1800 },
  { month: 'Set', income: 5700, expenses: 3900, balance: 1800 },
  { month: 'Out', income: 5500, expenses: 3500, balance: 2000 },
  { month: 'Nov', income: 5800, expenses: 3800, balance: 2000 },
  { month: 'Dez', income: 6200, expenses: 4200, balance: 2000 },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-xl"
    >
      <p className="font-semibold text-sm mb-3 text-foreground">{payload[0].payload.month}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-6 text-sm mb-1.5 last:mb-0">
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
          </span>
          <span className="font-bold" style={{ color: entry.color }}>
            R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      ))}
    </motion.div>
  );
};

export default function CashflowChart({ data = defaultData }: CashflowChartProps) {
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);

  // Calculate stats
  const count = Math.max(1, data.length);
  const avgIncome = data.reduce((sum, item) => sum + item.income, 0) / count;
  const avgExpenses = data.reduce((sum, item) => sum + item.expenses, 0) / count;
  const avgBalance = avgIncome - avgExpenses;
  const trend = data.length > 1 ? data[data.length - 1].balance - data[0].balance : 0;

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">Fluxo de Caixa</h3>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {trend >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={trend >= 0 ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>
              {trend >= 0 ? '+' : ''}
              R$ {Math.abs(trend).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Receitas, despesas e saldo (despesas sem as parcelas de dívidas)</p>
        
        {/* Stats mini cards */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-green-500/10 rounded-lg p-3 border border-green-500/20"
          >
            <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Receita Média</p>
            <p className="text-sm font-bold text-green-700 dark:text-green-300">
              R$ {avgIncome.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </p>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-red-500/10 rounded-lg p-3 border border-red-500/20"
          >
            <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Despesa Média</p>
            <p className="text-sm font-bold text-red-700 dark:text-red-300">
              R$ {avgExpenses.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </p>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20"
          >
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Saldo Médio</p>
            <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
              R$ {avgBalance.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </p>
          </motion.div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
          <XAxis 
            dataKey="month" 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }}
            iconType="circle"
            onMouseEnter={(e) => setHoveredLine(e.dataKey != null ? String(e.dataKey) : null)}
            onMouseLeave={() => setHoveredLine(null)}
          />
          <Line 
            type="monotone" 
            dataKey="income" 
            stroke="hsl(var(--chart-1))" 
            strokeWidth={hoveredLine === 'income' || !hoveredLine ? 3 : 2}
            name="Receitas"
            dot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
            activeDot={{ r: 7, strokeWidth: 3 }}
            animationDuration={1000}
            opacity={hoveredLine === 'income' || !hoveredLine ? 1 : 0.3}
          />
          <Line 
            type="monotone" 
            dataKey="expenses" 
            stroke="hsl(var(--chart-2))" 
            strokeWidth={hoveredLine === 'expenses' || !hoveredLine ? 3 : 2}
            name="Despesas"
            dot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
            activeDot={{ r: 7, strokeWidth: 3 }}
            animationDuration={1000}
            opacity={hoveredLine === 'expenses' || !hoveredLine ? 1 : 0.3}
          />
          <Line 
            type="monotone" 
            dataKey="balance" 
            stroke="hsl(var(--chart-3))" 
            strokeWidth={hoveredLine === 'balance' || !hoveredLine ? 3 : 2}
            name="Saldo"
            dot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
            activeDot={{ r: 7, strokeWidth: 3 }}
            strokeDasharray="5 5"
            animationDuration={1000}
            opacity={hoveredLine === 'balance' || !hoveredLine ? 1 : 0.3}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}


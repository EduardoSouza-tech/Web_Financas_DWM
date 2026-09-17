'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Target, AlertTriangle, CheckCircle } from 'lucide-react';

interface BudgetChartProps {
  data?: Array<{
    category: string;
    spent: number;
    budget: number;
    percentage: number;
  }>;
}

const defaultData = [
  { category: 'Alimentação', spent: 850, budget: 800, percentage: 106 },
  { category: 'Transporte', spent: 450, budget: 500, percentage: 90 },
  { category: 'Moradia', spent: 1200, budget: 1200, percentage: 100 },
  { category: 'Saúde', spent: 320, budget: 400, percentage: 80 },
  { category: 'Lazer', spent: 280, budget: 300, percentage: 93 },
  { category: 'Educação', spent: 400, budget: 400, percentage: 100 },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  const isOverBudget = data.spent > data.budget;
  const difference = Math.abs(data.spent - data.budget);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-xl min-w-[200px]"
    >
      <div className="flex items-center gap-2 mb-3">
        {isOverBudget ? (
          <AlertTriangle className="h-4 w-4 text-destructive" />
        ) : (
          <CheckCircle className="h-4 w-4 text-green-500" />
        )}
        <p className="font-bold text-sm">{data.category}</p>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Gasto:</span>
          <span className="font-bold">
            R$ {data.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Orçamento:</span>
          <span className="font-bold">
            R$ {data.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="h-px bg-border my-2" />
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Diferença:</span>
          <span className={`font-bold ${isOverBudget ? 'text-destructive' : 'text-green-500'}`}>
            {isOverBudget ? '+' : '-'} R$ {difference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between gap-6 pt-1">
          <span className="text-muted-foreground">Utilização:</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isOverBudget ? 'bg-destructive' : data.percentage > 80 ? 'bg-warning' : 'bg-green-500'
            }`} />
            <span className={`font-bold ${
              isOverBudget ? 'text-destructive' : data.percentage > 80 ? 'text-warning' : 'text-green-500'
            }`}>
              {data.percentage}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function BudgetChart({ data = defaultData }: BudgetChartProps) {
  const [activeBar, setActiveBar] = useState<number | null>(null);
  
  // Calculate stats
  const totalBudget = data.reduce((sum, item) => sum + item.budget, 0);
  const totalSpent = data.reduce((sum, item) => sum + item.spent, 0);
  const overBudgetCount = data.filter(item => item.percentage > 100).length;
  const avgUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Aderência ao Orçamento</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Comparação entre gastos e orçamento</p>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-primary/10 rounded-lg p-3 border border-primary/20"
          >
            <p className="text-xs text-primary font-medium mb-1">Utilização</p>
            <p className="text-lg font-bold text-primary">
              {avgUtilization.toFixed(0)}%
            </p>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-green-500/10 rounded-lg p-3 border border-green-500/20"
          >
            <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Economizado</p>
            <p className="text-sm font-bold text-green-700 dark:text-green-300">
              R$ {Math.max(0, totalBudget - totalSpent).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </p>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`rounded-lg p-3 border ${
              overBudgetCount > 0 
                ? 'bg-destructive/10 border-destructive/20' 
                : 'bg-green-500/10 border-green-500/20'
            }`}
          >
            <p className={`text-xs font-medium mb-1 ${
              overBudgetCount > 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400'
            }`}>
              {overBudgetCount > 0 ? 'Estourados' : 'Status'}
            </p>
            <p className={`text-lg font-bold ${
              overBudgetCount > 0 
                ? 'text-destructive' 
                : 'text-green-700 dark:text-green-300'
            }`}>
              {overBudgetCount > 0 ? overBudgetCount : '✓'}
            </p>
          </motion.div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart 
          data={data} 
          margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
          onMouseMove={(state) => {
            if (state.isTooltipActive) {
              setActiveBar(state.activeTooltipIndex ?? null);
            } else {
              setActiveBar(null);
            }
          }}
          onMouseLeave={() => setActiveBar(null)}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
          <XAxis
            dataKey="category"
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
            tickLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(1)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.2)' }} />
          <Legend
            wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
            iconType="square"
          />
          <Bar
            dataKey="budget"
            fill="hsl(var(--muted))"
            name="Orçamento"
            radius={[6, 6, 0, 0]}
            opacity={0.4}
            animationDuration={800}
          />
          <Bar
            dataKey="spent"
            name="Gasto"
            radius={[6, 6, 0, 0]}
            animationDuration={1000}
            animationBegin={200}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.percentage > 100
                    ? '#ef4444'
                    : entry.percentage > 80
                    ? '#f59e0b'
                    : '#10b981'
                }
                opacity={activeBar === null || activeBar === index ? 1 : 0.4}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex gap-4 mt-4 pt-4 border-t border-border text-xs justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-muted-foreground">Saudável {'(< 80%)'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-warning" />
          <span className="text-muted-foreground">Atenção (80-100%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-destructive" />
          <span className="text-muted-foreground">Estourado {('> 100%')}</span>
        </div>
      </div>
    </Card>
  );
}

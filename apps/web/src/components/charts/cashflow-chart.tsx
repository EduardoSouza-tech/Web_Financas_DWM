'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';

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
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
      <p className="font-semibold text-sm mb-2">{payload[0].payload.month}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}:
          </span>
          <span className="font-semibold">
            R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function CashflowChart({ data = defaultData }: CashflowChartProps) {
  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Fluxo de Caixa</h3>
        <p className="text-sm text-muted-foreground">Receitas, despesas e saldo dos últimos 12 meses</p>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="month" 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Line 
            type="monotone" 
            dataKey="income" 
            stroke="hsl(var(--chart-1))" 
            strokeWidth={2}
            name="Receitas"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="expenses" 
            stroke="hsl(var(--chart-2))" 
            strokeWidth={2}
            name="Despesas"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="balance" 
            stroke="hsl(var(--chart-3))" 
            strokeWidth={2}
            name="Saldo"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

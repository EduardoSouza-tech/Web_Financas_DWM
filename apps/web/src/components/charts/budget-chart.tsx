'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Card } from '@/components/ui/card';

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

  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
      <p className="font-semibold text-sm mb-2">{data.category}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Gasto:</span>
          <span className="font-semibold">
            R$ {data.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Orçamento:</span>
          <span className="font-semibold">
            R$ {data.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-border">
          <span className="text-muted-foreground">Utilização:</span>
          <span className={`font-semibold ${isOverBudget ? 'text-destructive' : 'text-primary'}`}>
            {data.percentage}%
          </span>
        </div>
      </div>
    </div>
  );
};

const CustomBarLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  const percentage = props.payload?.percentage || 0;
  
  if (percentage < 10) return null; // Don't show if too small

  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      fill="white"
      textAnchor="middle"
      dominantBaseline="middle"
      className="text-xs font-semibold"
    >
      {percentage}%
    </text>
  );
};

export default function BudgetChart({ data = defaultData }: BudgetChartProps) {
  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Aderência ao Orçamento</h3>
        <p className="text-sm text-muted-foreground">Comparação entre gastos e orçamento por categoria</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="category"
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(1)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="square"
          />
          <Bar
            dataKey="budget"
            fill="hsl(var(--muted))"
            name="Orçamento"
            radius={[4, 4, 0, 0]}
            opacity={0.5}
          />
          <Bar
            dataKey="spent"
            name="Gasto"
            radius={[4, 4, 0, 0]}
            label={<CustomBarLabel />}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.percentage > 100
                    ? 'hsl(var(--destructive))'
                    : entry.percentage > 80
                    ? 'hsl(var(--warning))'
                    : 'hsl(var(--chart-1))'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex gap-4 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-chart-1" />
          <span className="text-muted-foreground">{'< 80%'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning" />
          <span className="text-muted-foreground">80-100%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <span className="text-muted-foreground">{"> 100%"}</span>
        </div>
      </div>
    </Card>
  );
}

'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card } from '@/components/ui/card';

interface CategoryChartProps {
  data?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const defaultData = [
  { name: 'Alimentação', value: 850, color: 'hsl(var(--chart-1))' },
  { name: 'Transporte', value: 450, color: 'hsl(var(--chart-2))' },
  { name: 'Moradia', value: 1200, color: 'hsl(var(--chart-3))' },
  { name: 'Saúde', value: 320, color: 'hsl(var(--chart-4))' },
  { name: 'Lazer', value: 280, color: 'hsl(var(--chart-5))' },
  { name: 'Educação', value: 400, color: 'hsl(var(--chart-6))' },
  { name: 'Outros', value: 300, color: 'hsl(var(--muted-foreground))' },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const data = payload[0];
  const total = defaultData.reduce((sum, item) => sum + item.value, 0);
  const percentage = ((data.value / total) * 100).toFixed(1);

  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
      <p className="font-semibold text-sm mb-1">{data.name}</p>
      <p className="text-xs text-muted-foreground">
        R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </p>
      <p className="text-xs font-semibold text-primary mt-1">
        {percentage}% do total
      </p>
    </div>
  );
};

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show label if less than 5%

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function CategoryChart({ data = defaultData }: CategoryChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Despesas por Categoria</h3>
        <p className="text-sm text-muted-foreground">
          Total: R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value, entry: any) => {
              const percentage = ((entry.payload.value / total) * 100).toFixed(1);
              return `${value} (${percentage}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

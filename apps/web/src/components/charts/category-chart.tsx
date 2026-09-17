'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { PieChartIcon, TrendingUp } from 'lucide-react';

interface CategoryChartProps {
  data?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const defaultData = [
  { name: 'Alimentação', value: 850, color: '#3b82f6' },
  { name: 'Transporte', value: 450, color: '#8b5cf6' },
  { name: 'Moradia', value: 1200, color: '#ec4899' },
  { name: 'Saúde', value: 320, color: '#10b981' },
  { name: 'Lazer', value: 280, color: '#f59e0b' },
  { name: 'Educação', value: 400, color: '#06b6d4' },
  { name: 'Outros', value: 300, color: '#6b7280' },
];

const CustomTooltip = ({ active, payload, total }: any) => {
  if (!active || !payload?.length) return null;

  const data = payload[0];
  const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0.0';

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-xl"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: data.payload.color }} />
        <p className="font-bold text-sm">{data.name}</p>
      </div>
      <div className="space-y-1">
        <p className="text-base font-bold text-primary">
          R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-muted-foreground">
          {percentage}% do total de despesas
        </p>
      </div>
    </motion.div>
  );
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 15}
        fill={fill}
        opacity={0.5}
      />
    </g>
  );
};

export default function CategoryChart({ data = defaultData }: CategoryChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const topCategory = data.reduce((prev, current) => (prev.value > current.value ? prev : current), { name: '-', value: 0, color: '#6b7280' });

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <PieChartIcon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Despesas por Categoria</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Distribuição dos gastos mensais
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-primary/10 rounded-lg p-3 border border-primary/20"
          >
            <p className="text-xs text-primary font-medium mb-1">Total Gasto</p>
            <p className="text-lg font-bold text-primary">
              R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20"
          >
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3 text-orange-600" />
              <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Maior Gasto</p>
            </div>
            <p className="text-sm font-bold text-orange-700 dark:text-orange-300 truncate">
              {topCategory.name}
            </p>
            <p className="text-xs text-orange-600/70">
              R$ {topCategory.value.toLocaleString('pt-BR')}
            </p>
          </motion.div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={90}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={1000}
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip total={total} />} />
          <Legend
            verticalAlign="bottom"
            height={40}
            iconType="circle"
            wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }}
            formatter={(value, entry: any) => {
              const percentage = ((entry.payload.value / total) * 100).toFixed(0);
              return (
                <span className="text-xs">
                  {value} <span className="text-muted-foreground">({percentage}%)</span>
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Categorias</span>
          <span>Valor</span>
        </div>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {data
            .sort((a, b) => b.value - a.value)
            .slice(0, 4)
            .map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <span className="font-semibold">
                  R$ {item.value.toLocaleString('pt-BR')}
                </span>
              </motion.div>
            ))}
        </div>
      </div>
    </Card>
  );
}

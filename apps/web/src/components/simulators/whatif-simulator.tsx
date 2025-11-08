'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Calendar, DollarSign } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

interface Goal {
  targetAmount: number
  currentAmount: number
  monthlyContribution: number
  deadline: string
}

interface WhatIfSimulatorProps {
  goal: Goal
}

export default function WhatIfSimulator({ goal }: WhatIfSimulatorProps) {
  const [newContribution, setNewContribution] = useState(goal.monthlyContribution.toString())
  const [newDeadline, setNewDeadline] = useState(goal.deadline)

  const calculateScenario = (contribution: number, deadline?: string) => {
    const remaining = goal.targetAmount - goal.currentAmount
    
    if (contribution === 0) {
      return {
        months: Infinity,
        feasible: false,
        completion: 'Nunca',
        total: 0
      }
    }

    const monthsNeeded = Math.ceil(remaining / contribution)
    const completionDate = new Date()
    completionDate.setMonth(completionDate.getMonth() + monthsNeeded)

    let feasible = true
    if (deadline) {
      const deadlineDate = new Date(deadline)
      feasible = completionDate <= deadlineDate
    }

    return {
      months: monthsNeeded,
      feasible,
      completion: completionDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      total: contribution * monthsNeeded
    }
  }

  const currentScenario = calculateScenario(goal.monthlyContribution, goal.deadline)
  const newScenario = calculateScenario(parseFloat(newContribution) || 0, newDeadline)

  const scenarios = [
    {
      name: 'Conservador',
      contribution: goal.monthlyContribution * 0.7,
      color: 'blue'
    },
    {
      name: 'Atual',
      contribution: goal.monthlyContribution,
      color: 'purple'
    },
    {
      name: 'Agressivo',
      contribution: goal.monthlyContribution * 1.5,
      color: 'green'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Simulator */}
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Simulador What-If
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Novo Aporte Mensal (R$)
              </label>
              <Input
                type="number"
                step="0.01"
                value={newContribution}
                onChange={(e) => setNewContribution(e.target.value)}
                className="text-lg"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Novo Prazo
              </label>
              <Input
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* Current */}
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">Cenário Atual</h4>
                <Badge variant="info">Base</Badge>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Aporte mensal</p>
                  <p className="text-lg font-bold">{formatCurrency(goal.monthlyContribution)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tempo necessário</p>
                  <p className="text-lg font-bold">
                    {currentScenario.months} {currentScenario.months === 1 ? 'mês' : 'meses'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Conclusão</p>
                  <p className="text-sm font-medium">{currentScenario.completion}</p>
                </div>
              </div>
            </div>

            {/* New */}
            <div className={`p-4 rounded-lg border ${
              newScenario.feasible 
                ? 'bg-green-500/10 border-green-500/20' 
                : 'bg-red-500/10 border-red-500/20'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">Novo Cenário</h4>
                <Badge variant={newScenario.feasible ? 'success' : 'danger'}>
                  {newScenario.feasible ? 'Viável' : 'Inviável'}
                </Badge>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Aporte mensal</p>
                  <p className="text-lg font-bold">{formatCurrency(parseFloat(newContribution) || 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tempo necessário</p>
                  <p className="text-lg font-bold">
                    {newScenario.months === Infinity ? '∞' : newScenario.months} {newScenario.months === 1 ? 'mês' : 'meses'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Conclusão</p>
                  <p className="text-sm font-medium">{newScenario.completion}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Difference */}
          {parseFloat(newContribution) !== goal.monthlyContribution && parseFloat(newContribution) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg border bg-primary/5 border-primary/20"
            >
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Diferença no tempo</p>
                  <p className={`font-bold ${
                    newScenario.months < currentScenario.months ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {newScenario.months < currentScenario.months ? '-' : '+'} 
                    {Math.abs(newScenario.months - currentScenario.months)} meses
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Diferença mensal</p>
                  <p className={`font-bold ${
                    parseFloat(newContribution) > goal.monthlyContribution ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {parseFloat(newContribution) > goal.monthlyContribution ? '+' : ''}
                    {formatCurrency(parseFloat(newContribution) - goal.monthlyContribution)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Quick Scenarios */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg">Cenários Rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scenarios.map((scenario) => {
              const result = calculateScenario(scenario.contribution, goal.deadline)
              return (
                <motion.div
                  key={scenario.name}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 rounded-lg border cursor-pointer transition-all hover:border-primary/50"
                  onClick={() => setNewContribution(scenario.contribution.toString())}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">{scenario.name}</h4>
                    <Badge variant={
                      result.feasible ? 'success' : 'danger'
                    }>
                      {result.feasible ? '✓' : '✗'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Aporte</p>
                      <p className="font-bold">{formatCurrency(scenario.contribution)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Conclusão em</p>
                      <p className="text-sm font-medium">{result.months} meses</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

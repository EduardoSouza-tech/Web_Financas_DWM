'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Calendar as CalendarIcon, DollarSign, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface GoalFormProps {
  goal?: any
  onClose: () => void
  onSubmit: (goal: any) => void
}

const goalTypes = [
  { id: 'emergency', name: 'Fundo de Emergência', icon: '🛡️', color: 'red' },
  { id: 'purchase', name: 'Compra', icon: '🛍️', color: 'purple' },
  { id: 'vacation', name: 'Viagem', icon: '✈️', color: 'blue' },
  { id: 'investment', name: 'Investimento', icon: '📈', color: 'green' },
  { id: 'other', name: 'Outro', icon: '🎯', color: 'gray' },
]

const icons = ['🛡️', '✈️', '💻', '🚗', '🏠', '📚', '💰', '🎮', '🏋️', '🎸', '📷', '🎨']

export default function GoalForm({ goal, onClose, onSubmit }: GoalFormProps) {
  const [formData, setFormData] = useState({
    name: goal?.name || '',
    icon: goal?.icon || '🎯',
    type: goal?.type || 'other',
    targetAmount: goal?.targetAmount?.toString() || '',
    currentAmount: goal?.currentAmount?.toString() || '0',
    deadline: goal?.deadline || '',
    monthlyContribution: goal?.monthlyContribution?.toString() || '',
    autoContribute: goal?.autoContribute !== undefined ? goal.autoContribute : true,
  })

  const [showIconPicker, setShowIconPicker] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const targetAmount = parseFloat(formData.targetAmount)
    const currentAmount = parseFloat(formData.currentAmount)
    const monthlyContribution = parseFloat(formData.monthlyContribution)

    // Calcular projeção de conclusão
    const monthsToComplete = monthlyContribution > 0
      ? Math.ceil((targetAmount - currentAmount) / monthlyContribution)
      : 0

    const projectedDate = new Date()
    projectedDate.setMonth(projectedDate.getMonth() + monthsToComplete)

    const goal = {
      ...formData,
      targetAmount,
      currentAmount,
      monthlyContribution,
      percentage: (currentAmount / targetAmount) * 100,
      status: 'active',
      createdAt: new Date().toISOString(),
      projectedCompletion: monthsToComplete > 0 ? projectedDate.toISOString().split('T')[0] : formData.deadline,
    }

    onSubmit(goal)
    onClose()
  }

  const calculateProjection = () => {
    const targetAmount = parseFloat(formData.targetAmount || '0')
    const currentAmount = parseFloat(formData.currentAmount || '0')
    const monthlyContribution = parseFloat(formData.monthlyContribution || '0')
    const remaining = targetAmount - currentAmount

    if (monthlyContribution === 0) return { months: 0, completion: 'Indeterminado' }

    const months = Math.ceil(remaining / monthlyContribution)
    const date = new Date()
    date.setMonth(date.getMonth() + months)

    return {
      months,
      completion: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    }
  }

  const projection = calculateProjection()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-background rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto glass border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">{goal ? 'Editar Meta' : 'Nova Meta'}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {goal ? 'Atualize os detalhes da sua meta' : 'Defina um objetivo financeiro para alcançar'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name & Icon */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Nome da Meta</label>
              <Input
                type="text"
                placeholder="Ex: Viagem para a Europa"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="relative">
              <label className="text-sm font-medium mb-2 block">Ícone</label>
              <button
                type="button"
                className="w-full h-10 rounded-lg border bg-background hover:bg-accent transition-colors flex items-center justify-center text-2xl"
                onClick={() => setShowIconPicker(!showIconPicker)}
              >
                {formData.icon}
              </button>
              {showIconPicker && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-background border rounded-lg shadow-lg z-10 grid grid-cols-6 gap-2">
                  {icons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className="w-10 h-10 rounded-lg hover:bg-accent transition-colors text-xl"
                      onClick={() => {
                        setFormData({ ...formData, icon })
                        setShowIconPicker(false)
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="text-sm font-medium mb-3 block">Tipo de Meta</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {goalTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.type === type.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setFormData({ ...formData, type: type.id as any })}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="font-medium text-xs">{type.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Valor da Meta (R$)
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="10000.00"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                required
                className="text-lg"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                <Target className="w-4 h-4 inline mr-1" />
                Já possui quanto? (R$)
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.currentAmount}
                onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                className="text-lg"
              />
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              Prazo para Conclusão
            </label>
            <Input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Monthly Contribution */}
          <div className="p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="autoContribute"
                checked={formData.autoContribute}
                onChange={(e) => setFormData({ ...formData, autoContribute: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="autoContribute" className="font-medium text-sm">
                Configurar aporte mensal automático
              </label>
            </div>
            {formData.autoContribute && (
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">
                  Valor do Aporte Mensal (R$)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="500.00"
                  value={formData.monthlyContribution}
                  onChange={(e) => setFormData({ ...formData, monthlyContribution: e.target.value })}
                  required={formData.autoContribute}
                />
              </div>
            )}
          </div>

          {/* Projection */}
          {formData.targetAmount && formData.monthlyContribution && (
            <div className="p-4 rounded-lg border bg-primary/5 border-primary/20">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Projeção de Conclusão
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Tempo estimado</p>
                  <p className="text-lg font-bold text-primary">
                    {projection.months} {projection.months === 1 ? 'mês' : 'meses'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Conclusão prevista</p>
                  <p className="text-lg font-bold text-primary">
                    {projection.completion}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-primary/20">
                <p className="text-xs text-muted-foreground">Falta economizar</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {(parseFloat(formData.targetAmount) - parseFloat(formData.currentAmount || '0')).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!formData.name || !formData.targetAmount || !formData.deadline || (formData.autoContribute && !formData.monthlyContribution)}
            >
              Criar Meta
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

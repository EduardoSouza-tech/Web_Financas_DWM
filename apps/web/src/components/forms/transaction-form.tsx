'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Upload, Tag as TagIcon, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface TransactionFormProps {
  onClose: () => void
  onSubmit: (transaction: any) => void
  type?: 'income' | 'expense' | 'transfer'
}

const categories = [
  { id: 'salary', name: 'Salário', icon: '💼', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: '💻', type: 'income' },
  { id: 'investment', name: 'Investimentos', icon: '📈', type: 'income' },
  { id: 'food', name: 'Alimentação', icon: '🍔', type: 'expense' },
  { id: 'transport', name: 'Transporte', icon: '🚗', type: 'expense' },
  { id: 'shopping', name: 'Compras', icon: '🛍️', type: 'expense' },
  { id: 'entertainment', name: 'Lazer', icon: '🎮', type: 'expense' },
  { id: 'health', name: 'Saúde', icon: '💊', type: 'expense' },
  { id: 'education', name: 'Educação', icon: '📚', type: 'expense' },
  { id: 'bills', name: 'Contas', icon: '📄', type: 'expense' },
]

const accounts = [
  { id: 'acc1', name: 'Conta Corrente', icon: '🏦' },
  { id: 'acc2', name: 'Cartão Crédito', icon: '💳' },
  { id: 'acc3', name: 'Poupança', icon: '💰' },
]

export default function TransactionForm({ onClose, onSubmit, type = 'expense' }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    type: type,
    amount: '',
    description: '',
    categoryId: '',
    accountId: accounts[0].id,
    date: new Date().toISOString().split('T')[0],
    tags: [] as string[],
    isInstallment: false,
    installmentTotal: '',
    status: 'completed'
  })

  const [currentTag, setCurrentTag] = useState('')

  const filteredCategories = categories.filter(c => c.type === formData.type)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const transaction = {
      ...formData,
      amount: parseFloat(formData.amount),
      installmentTotal: formData.isInstallment ? parseInt(formData.installmentTotal) : undefined,
      categoryName: categories.find(c => c.id === formData.categoryId)?.name || '',
      categoryIcon: categories.find(c => c.id === formData.categoryId)?.icon || '',
      accountName: accounts.find(a => a.id === formData.accountId)?.name || '',
    }

    onSubmit(transaction)
    onClose()
  }

  const addTag = () => {
    if (currentTag && !formData.tags.includes(currentTag)) {
      setFormData({ ...formData, tags: [...formData.tags, currentTag] })
      setCurrentTag('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })
  }

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
            <h2 className="text-2xl font-bold">Nova Transação</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Adicione uma nova movimentação financeira
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
          {/* Type Selector */}
          <div>
            <label className="text-sm font-medium mb-3 block">Tipo de Transação</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === 'income'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-border hover:border-green-500/50'
                }`}
                onClick={() => setFormData({ ...formData, type: 'income', categoryId: '' })}
              >
                <div className="text-2xl mb-2">📈</div>
                <div className="font-medium text-sm">Receita</div>
              </button>
              <button
                type="button"
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === 'expense'
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-border hover:border-red-500/50'
                }`}
                onClick={() => setFormData({ ...formData, type: 'expense', categoryId: '' })}
              >
                <div className="text-2xl mb-2">📉</div>
                <div className="font-medium text-sm">Despesa</div>
              </button>
              <button
                type="button"
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === 'transfer'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-border hover:border-blue-500/50'
                }`}
                onClick={() => setFormData({ ...formData, type: 'transfer', categoryId: '' })}
              >
                <div className="text-2xl mb-2">🔄</div>
                <div className="font-medium text-sm">Transferência</div>
              </button>
            </div>
          </div>

          {/* Amount & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Valor (R$)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="text-lg"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Data</label>
              <div className="relative">
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Descrição</label>
            <Input
              type="text"
              placeholder="Ex: Compra no supermercado"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium mb-3 block">Categoria</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {filteredCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    formData.categoryId === category.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setFormData({ ...formData, categoryId: category.id })}
                >
                  <div className="text-xl mb-1">{category.icon}</div>
                  <div className="font-medium text-xs">{category.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Account */}
          <div>
            <label className="text-sm font-medium mb-3 block">Conta</label>
            <div className="grid grid-cols-3 gap-2">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.accountId === account.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setFormData({ ...formData, accountId: account.id })}
                >
                  <div className="text-xl mb-1">{account.icon}</div>
                  <div className="font-medium text-xs">{account.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium mb-2 block">Tags (opcional)</label>
            <div className="flex gap-2 mb-2">
              <Input
                type="text"
                placeholder="Adicionar tag..."
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline">
                <TagIcon className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Installments */}
          {formData.type === 'expense' && (
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="installment"
                  checked={formData.isInstallment}
                  onChange={(e) => setFormData({ ...formData, isInstallment: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="installment" className="font-medium text-sm">
                  Parcelar esta despesa
                </label>
              </div>
              {formData.isInstallment && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Número de Parcelas
                    </label>
                    <Input
                      type="number"
                      min="2"
                      max="48"
                      placeholder="12"
                      value={formData.installmentTotal}
                      onChange={(e) => setFormData({ ...formData, installmentTotal: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Valor por Parcela
                    </label>
                    <Input
                      type="text"
                      disabled
                      value={formData.amount && formData.installmentTotal
                        ? `R$ ${(parseFloat(formData.amount) / parseInt(formData.installmentTotal)).toFixed(2)}`
                        : 'R$ 0.00'
                      }
                      className="bg-muted"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File Upload Placeholder */}
          <div className="p-4 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer">
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Upload className="w-5 h-5" />
              <div>
                <p className="font-medium text-sm">Anexar comprovante (opcional)</p>
                <p className="text-xs">PDF, PNG, JPG - Máx 5MB</p>
              </div>
            </div>
          </div>

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
              disabled={!formData.amount || !formData.description || !formData.categoryId}
            >
              Adicionar Transação
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

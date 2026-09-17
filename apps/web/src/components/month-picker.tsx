'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addMonths, formatMonth, type MonthKey } from '@/lib/finance/credit-card'
import { cn } from '@/lib/utils'

interface MonthPickerProps {
  value: MonthKey
  onChange: (month: MonthKey) => void
  prefix?: string
  className?: string
}

export function MonthPicker({ value, onChange, prefix, className }: MonthPickerProps) {
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1', className)}>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onChange(addMonths(value, -1))} aria-label="Mês anterior">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[150px] text-center text-sm font-medium">
        {prefix ? `${prefix} ` : ''}
        {formatMonth(value)}
      </span>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onChange(addMonths(value, 1))} aria-label="Próximo mês">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

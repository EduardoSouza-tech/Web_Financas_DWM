'use client'

/**
 * Editor de divisão entre perfis da família.
 * Usado em transações, dívidas e assinaturas: escolhe quem participa e quanto cabe a cada um,
 * por igual ou com valores manuais. Avisa o formulário quando a soma não fecha com o total.
 */

import { useEffect, useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProfileAvatar } from '@/components/profiles/profile-avatar'
import { useProfiles } from '@/providers/profile-provider'
import { equalSplit, splitsTotal, type Split } from '@/lib/finance/credit-card'
import { formatCurrency } from '@/lib/utils'

interface SplitEditorProps {
  /** Valor a dividir */
  total: number
  /** Recebe as partes (vazio = sem divisão) e se a soma fecha com o total */
  onChange: (splits: Split[], valid: boolean) => void
  title?: string
  hint?: string
  /** Divisão já existente (edição); vazio começa desmarcado */
  initialSplits?: Split[]
}

const optionClass = (active: boolean) =>
  `p-3 rounded-lg border-2 transition-all text-left ${
    active ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
  }`

export function SplitEditor({ total, onChange, title = 'Dividir entre perfis', hint, initialSplits }: SplitEditorProps) {
  const { profiles, activeProfileId, isFamilyView } = useProfiles()
  const initial = (isFamilyView ? profiles[0]?.id : activeProfileId) ?? ''
  const hasInitial = (initialSplits?.length ?? 0) > 0

  const [enabled, setEnabled] = useState(hasInitial)
  // Divisão salva volta em modo manual: os valores podem não ser iguais
  const [mode, setMode] = useState<'equal' | 'manual'>(hasInitial ? 'manual' : 'equal')
  const [selected, setSelected] = useState<string[]>(
    hasInitial ? initialSplits!.map(s => s.profile_id) : initial ? [initial] : []
  )
  const [manual, setManual] = useState<Record<string, string>>(
    Object.fromEntries((initialSplits ?? []).map(s => [s.profile_id, String(s.amount)]))
  )

  const nameOf = (id: string) => profiles.find(p => p.id === id)?.name ?? ''

  const splits = useMemo<Split[]>(() => {
    if (!enabled || selected.length === 0) return []
    if (mode === 'equal') return equalSplit(total, selected)
    return selected.map(id => ({ profile_id: id, amount: Math.round((parseFloat(manual[id]) || 0) * 100) / 100 }))
  }, [enabled, selected, mode, manual, total])

  const sum = splitsTotal(splits)
  const difference = Math.round((total - sum) * 100) / 100
  const valid = !enabled || (selected.length > 0 && difference === 0)

  useEffect(() => {
    onChange(splits, valid)
    // onChange costuma ser recriada a cada render do formulário
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splits, valid])

  const toggle = (id: string) => setSelected(prev => (prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]))

  if (profiles.length < 2) return null

  return (
    <div className="p-4 rounded-lg border bg-muted/50 space-y-4">
      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
        <input type="checkbox" className="w-4 h-4" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
        <Users className="w-4 h-4" />
        {title}
      </label>

      {enabled && (
        <>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Quem participa</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {profiles.map(profile => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => toggle(profile.id)}
                  className={`flex items-center gap-2 ${optionClass(selected.includes(profile.id))}`}
                >
                  <ProfileAvatar profile={profile} size="sm" />
                  <span className="font-medium text-sm truncate">{profile.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={mode === 'equal' ? 'default' : 'outline'} size="sm" onClick={() => setMode('equal')}>
              Dividir igual
            </Button>
            <Button type="button" variant={mode === 'manual' ? 'default' : 'outline'} size="sm" onClick={() => setMode('manual')}>
              Valores manuais
            </Button>
          </div>

          {selected.length === 0 ? (
            <p className="text-sm text-red-500">Escolha ao menos um perfil.</p>
          ) : mode === 'equal' ? (
            <div className="space-y-1 text-sm">
              {splits.map(s => (
                <div key={s.profile_id} className="flex justify-between">
                  <span>{nameOf(s.profile_id)}</span>
                  <span className="font-medium">{formatCurrency(s.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {selected.map(id => (
                <div key={id} className="flex items-center gap-2">
                  <span className="flex-1 text-sm truncate">{nameOf(id)}</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-32"
                    placeholder="0,00"
                    value={manual[id] ?? ''}
                    onChange={e => setManual(prev => ({ ...prev, [id]: e.target.value }))}
                  />
                </div>
              ))}
              <div className={`flex justify-between text-sm ${difference === 0 ? 'text-green-600' : 'text-red-500'}`}>
                <span>
                  Soma {formatCurrency(sum)} de {formatCurrency(total)}
                </span>
                <span>
                  {difference === 0
                    ? 'confere'
                    : difference > 0
                      ? `faltam ${formatCurrency(difference)}`
                      : `passou ${formatCurrency(-difference)}`}
                </span>
              </div>
            </div>
          )}

          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </>
      )}
    </div>
  )
}

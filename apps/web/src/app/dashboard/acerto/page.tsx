'use client'

/**
 * Acerto de contas da família: quem deve a quem.
 *
 * Quem paga uma despesa dividida fica com valor a receber dos outros; numa receita dividida
 * é o contrário. O saldo de cada perfil vira a menor lista possível de transferências.
 * Dívidas divididas não entram: cada um paga a própria parte direto no boleto.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Users, HandCoins, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MonthPicker } from '@/components/month-picker'
import { ProfileAvatar } from '@/components/profiles/profile-avatar'
import { useFinance } from '@/contexts/FinanceContext'
import { useProfiles } from '@/providers/profile-provider'
import { formatCurrency } from '@/lib/utils'
import { formatDateBR, formatMonth } from '@/lib/finance/credit-card'

type Period = 'month' | 'all'

export default function AcertoPage() {
  const { referenceMonth, setReferenceMonth, getSettlement } = useFinance()
  const { profiles, activeProfileId, isFamilyView } = useProfiles()
  const [period, setPeriod] = useState<Period>('month')

  const settlement = useMemo(
    () => getSettlement(period === 'month' ? referenceMonth : undefined),
    [getSettlement, period, referenceMonth]
  )

  const profileOf = (id: string) => profiles.find(p => p.id === id)
  const nameOf = (id: string) => profileOf(id)?.name ?? 'Perfil removido'

  const myBalance = isFamilyView ? null : settlement.balances.find(b => b.profile_id === activeProfileId)?.amount ?? 0
  const items = [...settlement.items].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <HandCoins className="w-7 h-7 text-primary" />
            Acerto de contas
          </h1>
          <p className="text-muted-foreground mt-1">
            Quem deve a quem nas despesas e receitas divididas da família
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-1">
            <Button size="sm" variant={period === 'month' ? 'default' : 'ghost'} onClick={() => setPeriod('month')}>
              {formatMonth(referenceMonth, true)}
            </Button>
            <Button size="sm" variant={period === 'all' ? 'default' : 'ghost'} onClick={() => setPeriod('all')}>
              Tudo
            </Button>
          </div>
          {period === 'month' && <MonthPicker value={referenceMonth} onChange={setReferenceMonth} />}
        </div>
      </div>

      {myBalance !== null && (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">Seu saldo</p>
            <p className={`text-3xl font-bold ${myBalance > 0 ? 'text-green-500' : myBalance < 0 ? 'text-red-500' : ''}`}>
              {myBalance > 0 ? 'a receber ' : myBalance < 0 ? 'a pagar ' : ''}
              {formatCurrency(Math.abs(myBalance))}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Como zerar
          </CardTitle>
          <CardDescription>
            {period === 'month' ? `Considerando ${formatMonth(referenceMonth)}` : 'Considerando tudo que já foi lançado'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settlement.transfers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-70" />
              <p>Ninguém deve nada a ninguém.</p>
              <p className="text-sm mt-1">Divida uma despesa entre perfis para o saldo aparecer aqui.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {settlement.transfers.map((t, i) => (
                <motion.div
                  key={`${t.from}-${t.to}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between gap-3 p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {profileOf(t.from) && <ProfileAvatar profile={profileOf(t.from)!} size="sm" />}
                    <span className="font-medium truncate">{nameOf(t.from)}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    {profileOf(t.to) && <ProfileAvatar profile={profileOf(t.to)!} size="sm" />}
                    <span className="font-medium truncate">{nameOf(t.to)}</span>
                  </div>
                  <span className="text-lg font-bold whitespace-nowrap">{formatCurrency(t.amount)}</span>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {settlement.balances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saldo de cada perfil</CardTitle>
            <CardDescription>Positivo = pagou mais do que a parte dele</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {settlement.balances.map(b => (
              <div key={b.profile_id} className="flex items-center justify-between gap-3 p-3 rounded-lg border">
                <div className="flex items-center gap-2 min-w-0">
                  {profileOf(b.profile_id) && <ProfileAvatar profile={profileOf(b.profile_id)!} size="sm" />}
                  <span className="truncate">{nameOf(b.profile_id)}</span>
                </div>
                <span className={`font-semibold whitespace-nowrap ${b.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {b.amount > 0 ? '+' : '−'} {formatCurrency(Math.abs(b.amount))}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lançamentos divididos</CardTitle>
          <CardDescription>O que entrou nesta conta</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum lançamento dividido no período.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.date ? formatDateBR(item.date) : ''} · pago por {nameOf(item.payerProfileId)}
                      </p>
                    </div>
                    <Badge variant={item.direction === 'income' ? 'success' : 'secondary'}>
                      {item.direction === 'income' ? 'receita' : 'despesa'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                    {item.splits.map(s => (
                      <span key={s.profile_id}>
                        {nameOf(s.profile_id)} {formatCurrency(s.amount)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

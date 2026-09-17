'use client'

import { AlertTriangle, CloudOff, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFinance } from '@/contexts/FinanceContext'

/** Mostra carregamento dos dados do banco e avisa quando algo não foi salvo */
export function SyncGate({ children }: { children: React.ReactNode }) {
  const { syncState, syncError, pendingSync, dismissSyncError, reload } = useFinance()

  if (syncState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        Carregando seus dados...
      </div>
    )
  }

  if (syncState === 'error') {
    return (
      <div className="max-w-lg mx-auto mt-16 rounded-xl border border-red-500/40 bg-red-500/10 p-6 space-y-3">
        <p className="font-semibold flex items-center gap-2 text-red-500">
          <AlertTriangle className="w-5 h-5" /> Não foi possível carregar seus dados
        </p>
        <p className="text-sm text-muted-foreground break-words">{syncError}</p>
        <p className="text-sm text-muted-foreground">
          Se a mensagem citar uma tabela que não existe, rode as migrações que faltam no Supabase (a mais recente é <code>005_debt_payments.sql</code>).
        </p>
        <Button onClick={reload} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Tentar de novo
        </Button>
      </div>
    )
  }

  return (
    <>
      {pendingSync > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <CloudOff className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="flex-1">
            <span className="font-semibold">
              {pendingSync} {pendingSync === 1 ? 'alteração aguardando' : 'alterações aguardando'} conexão.
            </span>{' '}
            <span className="text-muted-foreground">Estão guardadas neste navegador e serão enviadas quando a internet voltar.</span>
          </p>
        </div>
      )}
      {syncError && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-red-500">Uma alteração não foi salva no banco</p>
            <p className="text-muted-foreground break-words">{syncError}</p>
            <p className="text-muted-foreground">Recarregue os dados para ver o que está salvo de fato.</p>
          </div>
          <Button size="sm" variant="outline" onClick={reload} className="gap-1">
            <RefreshCw className="w-3 h-3" /> Recarregar
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={dismissSyncError} aria-label="Fechar">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
      {children}
    </>
  )
}

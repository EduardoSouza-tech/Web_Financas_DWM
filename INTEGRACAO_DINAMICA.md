# Sistema de Integração Dinâmica - Cartões e Despesas

## 📋 Visão Geral

O sistema agora possui **integração dinâmica e em tempo real** entre cartões, transações e o overview financeiro. Quando você adiciona, edita ou exclui cartões, todos os valores são recalculados automaticamente.

## 🔄 Como Funciona

### 1. **Contexto Global de Finanças** (`FinanceContext.tsx`)

Criamos um contexto React que:
- Armazena o estado global de **cartões** e **transações**
- Recalcula automaticamente os totais quando há mudanças
- Compartilha dados entre todas as páginas do dashboard

```typescript
// Funções disponíveis no contexto:
- getTotalCardUsage()    // Soma de todas as faturas dos cartões
- getTotalExpenses()     // Total de despesas (cartões + dinheiro)
- getBalance()           // Saldo (receita - despesas)
- getSavingsRate()       // Taxa de poupança em %
```

### 2. **Atualização Automática de Cartões**

Quando transações mudam, o sistema **automaticamente recalcula** os valores dos cartões:

```typescript
// useEffect no FinanceContext
useEffect(() => {
  const updatedCards = cards.map(card => {
    // Filtra transações do cartão
    const cardTransactions = transactions.filter(
      tx => tx.cardId === card.id
    );
    
    // Recalcula valor usado
    const used = cardTransactions.reduce(
      (sum, tx) => sum + tx.amount, 0
    );
    
    return {
      ...card,
      used,                      // Valor atual usado
      nextInvoice: used,         // Próxima fatura
      availableLimit: card.limit - used  // Limite disponível
    };
  });
  
  setCards(updatedCards);
}, [transactions]);
```

## 💳 Operações com Cartões

### **Adicionar Cartão**
1. Clique em "Adicionar Cartão"
2. Preencha os dados (nome, bandeira, limite, datas)
3. O cartão é criado com `used: 0`
4. Totais recalculados automaticamente

### **Editar Cartão**
1. Clique em "Editar" no cartão desejado
2. Modifique os campos (limite, nome, etc.)
3. O limite disponível é recalculado: `availableLimit = limit - used`
4. Totais atualizados

### **Excluir Cartão**
1. Clique no botão 🗑️ (Trash)
2. Confirme a exclusão
3. O cartão é removido
4. **Transações vinculadas NÃO são excluídas** (mantém histórico)
5. Totais recalculados sem o cartão

## 📊 Integração com Overview

O **Overview Dashboard** agora usa o contexto para exibir valores em tempo real:

```typescript
// dashboard/page.tsx
const { getTotalExpenses, getBalance, getSavingsRate } = useFinance();

const [data] = useState({
  totalIncome: MONTHLY_SUMMARY.totalIncome,
  get totalExpenses() { return getTotalExpenses(); },  // DINÂMICO
  get balance() { return getBalance(); },              // DINÂMICO
  get savingsRate() { return getSavingsRate(); }       // DINÂMICO
});
```

### Valores Atualizados Automaticamente:
- ✅ **Total de Despesas**: Soma das faturas dos cartões + despesas em dinheiro
- ✅ **Saldo**: Receita - Despesas (recalculado)
- ✅ **Taxa de Poupança**: (Saldo / Receita) × 100

## 🎯 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────┐
│                   FinanceContext                         │
│  (Estado Global - cards, transactions)                  │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
    ┌───▼────┐         ┌───▼────┐
    │ Cards  │         │Overview│
    │  Page  │         │  Page  │
    └───┬────┘         └───┬────┘
        │                   │
        │ Add/Edit/Delete   │ Display Totals
        │ Card              │ (auto-updated)
        │                   │
        └─────────┬─────────┘
                  │
          Triggers Recalculation
                  │
        ┌─────────▼─────────┐
        │ All pages update  │
        │ automatically     │
        └───────────────────┘
```

## 📝 Exemplo Prático

### Cenário: Adicionar Novo Cartão

**Antes:**
- 3 cartões: R$ 3.470,70 total
- Despesas totais: R$ 5.020,70
- Saldo: R$ 1.479,30

**Ação:**
```
Adicionar cartão:
- Nome: "BTG Black"
- Limite: R$ 20.000
- Usado: R$ 0 (inicialmente)
```

**Depois:**
- 4 cartões: R$ 3.470,70 total (mantido)
- Limite total: R$ 53.000 (era R$ 33.000)
- Limite disponível: R$ 49.529,30
- Overview mantém os mesmos valores (nenhuma despesa no novo cartão ainda)

### Cenário: Excluir Cartão com Fatura

**Antes:**
- C6 Carbon: R$ 245,00
- Total cartões: R$ 3.470,70

**Ação:**
```
Excluir "C6 Carbon"
```

**Depois:**
- Total cartões: R$ 3.225,70 (R$ 3.470,70 - R$ 245)
- Despesas totais: R$ 5.020,70 → R$ 4.775,70
- Saldo: R$ 1.479,30 → R$ 1.724,30
- Taxa de poupança: 22,76% → 26,53%

**✅ Todos os valores são recalculados automaticamente em todas as páginas!**

## 🔧 Manutenção

### Adicionar Nova Transação Vinculada a Cartão

```typescript
const newTransaction = {
  id: 'tx-new',
  date: '2025-11-07',
  description: 'Compra Amazon',
  category: 'Compras',
  type: 'expense',
  amount: 150,
  cardId: '1'  // Vincula ao Nubank
};

transactions.push(newTransaction);
setTransactions([...transactions]);

// O contexto automaticamente:
// 1. Detecta a mudança em transactions
// 2. Recalcula o 'used' do Nubank
// 3. Atualiza availableLimit
// 4. Recalcula totais do overview
```

## ⚠️ Observações Importantes

1. **Transações não são excluídas** quando um cartão é removido
2. **Limite disponível** sempre reflete o uso real
3. **Percentuais** são recalculados em tempo real
4. **Performance**: useEffect otimizado para evitar loops infinitos
5. **Sincronização**: Todas as páginas compartilham o mesmo estado

## 🎨 Interface

### Botões de Ação nos Cartões:
- 👁️ **Ver Fatura**: Mostra transações do cartão
- ✏️ **Editar**: Modifica dados do cartão
- 🗑️ **Excluir**: Remove o cartão (com confirmação)

### Recálculo Visível:
- Overview atualiza valores em tempo real
- Cards page mostra totais corretos
- KPIs refletem mudanças imediatamente

## 📈 Benefícios

✅ **Consistência**: Um único ponto de verdade (FinanceContext)
✅ **Reatividade**: Mudanças refletidas instantaneamente
✅ **Escalabilidade**: Fácil adicionar novos cálculos
✅ **Manutenibilidade**: Código centralizado e reutilizável
✅ **UX**: Usuário vê resultados imediatos de suas ações

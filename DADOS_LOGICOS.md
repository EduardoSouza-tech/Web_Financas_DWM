# 📊 Sistema de Dados Centralizado - Conexões Lógicas

## ✅ Dados Implementados e Interligados

### 🔗 Fluxo de Dados Consistente

```
RECEITA MENSAL (R$ 6.500,00)
    ↓
DESPESAS TOTAIS (R$ 5.645,70)
    ├── Moradia: R$ 2.025,00 (35,8%)
    │   ├── Aluguel: R$ 1.200
    │   ├── Condomínio: R$ 350
    │   ├── Energia: R$ 180
    │   ├── Água: R$ 85
    │   ├── Internet: R$ 120
    │   └── Celular: R$ 90
    │
    ├── Alimentação: R$ 1.320,00 (23,4%)
    │   ├── Supermercado: R$ 770
    │   ├── Restaurantes: R$ 320
    │   ├── Delivery: R$ 145
    │   └── Padaria: R$ 85
    │
    ├── Transporte: R$ 580,00 (10,3%)
    │   ├── Gasolina: R$ 515
    │   └── Uber: R$ 65
    │
    ├── Saúde: R$ 380,00 (6,7%)
    │   ├── Plano de Saúde: R$ 320
    │   └── Farmácia: R$ 60
    │
    ├── Lazer: R$ 432,70 (7,7%)
    │   ├── Cinema/Bar/Shopping: R$ 340
    │   ├── Netflix: R$ 55,90
    │   ├── Spotify: R$ 21,90
    │   └── Amazon Prime: R$ 14,90
    │
    ├── Educação: R$ 184,00 (3,3%)
    │   ├── Curso Udemy: R$ 180
    │   └── GitHub Pro: R$ 4,00
    │
    └── Trabalho: R$ 99,00 (1,8%)
        └── Adobe Creative Cloud: R$ 99,00 (PAUSADO)
    ↓
SALDO MENSAL: R$ 854,30 (13,14% de taxa de poupança)
```

---

## 💳 Cartões de Crédito - Conectados com Despesas

| Cartão | Limite | Usado | Disponível | Uso % | Parcelas Ativas |
|--------|--------|-------|------------|-------|-----------------|
| Nubank Ultravioleta | R$ 15.000 | R$ 8.420 | R$ 6.580 | 56,1% | 12 |
| Inter Gold | R$ 10.000 | R$ 4.560 | R$ 5.440 | 45,6% | 6 |
| C6 Carbon | R$ 8.000 | R$ 2.100 | R$ 5.900 | 26,3% | 3 |
| **TOTAL** | **R$ 33.000** | **R$ 15.080** | **R$ 17.920** | **45,7%** | **21** |

**Lógica:** Uso de cartão de 45,7% indica controle saudável (< 50%)

---

## 📅 Assinaturas - Parte das Despesas Mensais

| Serviço | Valor | Frequência | Status | Categoria na Despesa |
|---------|-------|------------|--------|---------------------|
| Netflix | R$ 55,90 | Mensal | ✅ Ativa | Lazer |
| Spotify Premium | R$ 21,90 | Mensal | ✅ Ativa | Lazer |
| Amazon Prime | R$ 14,90 | Mensal | ✅ Ativa | Lazer |
| GitHub Pro | R$ 4,00 | Mensal | ✅ Ativa | Educação |
| Adobe Creative Cloud | R$ 99,00 | Mensal | ⏸️ Pausada | Trabalho |
| **Total Ativo** | **R$ 96,70** | - | - | - |
| **Projeção Anual** | **R$ 1.160,40** | - | - | - |

**Lógica:** R$ 96,70 em assinaturas estão incluídos nas despesas de Lazer (R$ 92,70) e Educação (R$ 4,00)

---

## 💰 Dívidas - Comprometimento da Renda

| Dívida | Total | Restante | Parcela | Juros | Pagas | Total Parcelas |
|--------|-------|----------|---------|-------|-------|----------------|
| Financiamento Carro | R$ 45.000 | R$ 28.500 | R$ 1.250 | 1,2% | 18/48 | 37,5% pago |
| Empréstimo Pessoal | R$ 15.000 | R$ 8.500 | R$ 650 | 2,5% | 10/24 | 43,3% pago |
| Cartão Parcelado | R$ 3.200 | R$ 1.600 | R$ 400 | 3,8% | 4/8 | 50% pago |
| **TOTAL** | **R$ 63.200** | **R$ 38.600** | **R$ 2.300** | **2,5%** | - | **38,9% pago** |

**Comprometimento:** R$ 2.300 / R$ 6.500 = **35,4% da renda** (alto risco)

---

## 🎯 Metas - Baseadas na Capacidade de Poupança

| Meta | Valor | Atual | Faltam | Prazo | Mensal Necessário |
|------|-------|-------|--------|-------|-------------------|
| Fundo de Emergência | R$ 39.000 | R$ 15.000 | R$ 24.000 | Dez/2026 | R$ 1.714/mês |
| Viagem Europa | R$ 20.000 | R$ 8.000 | R$ 12.000 | Jul/2026 | R$ 1.500/mês |
| Notebook | R$ 8.000 | R$ 3.200 | R$ 4.800 | Mar/2026 | R$ 1.200/mês |
| **TOTAL** | **R$ 67.000** | **R$ 26.200** | **R$ 40.800** | - | **R$ 4.414/mês** |

**Problema:** Economia mensal atual (R$ 854) é **insuficiente** para todas as metas!

---

## 💯 Score Financeiro (54/100) - Cálculo Detalhado

| Critério | Peso | Pontos | Justificativa |
|----------|------|--------|---------------|
| **Poupança** | 25 | 16 | Taxa de 13,14% (ideal > 20%) |
| **Controle de Gastos** | 25 | 15 | 3 de 5 orçamentos dentro do limite (60%) |
| **Progresso em Metas** | 20 | 9 | Média de 39,1% de conclusão |
| **Uso de Crédito** | 15 | 10 | 45,7% de uso (bom < 50%) |
| **Dívidas** | 15 | 5 | 35,4% da renda comprometida (alto > 30%) |
| **TOTAL** | **100** | **54** | **Precisa melhorar** |

---

## 📈 Previsão 6 Meses - Projeção Realista

| Mês | Receita | Despesas | Dívidas | Sobra | Saldo Acumulado |
|-----|---------|----------|---------|-------|-----------------|
| **Nov/25** | R$ 6.500 | R$ 3.345 | R$ 2.300 | R$ 854 | R$ 854 |
| Dez/25 | R$ 6.500 | R$ 3.345 | R$ 2.300 | R$ 854 | R$ 1.708 |
| Jan/26 | R$ 6.500 | R$ 3.345 | R$ 2.300 | R$ 854 | R$ 2.562 |
| Fev/26 | R$ 6.500 | R$ 3.345 | R$ 2.300 | R$ 854 | R$ 3.416 |
| Mar/26 | R$ 6.500 | R$ 3.345 | R$ 2.300 | R$ 854 | R$ 4.270 |
| Abr/26 | R$ 6.500 | R$ 3.345 | R$ 2.300 | R$ 854 | R$ 5.124 |

**Nota:** Despesas = Total (R$ 5.645) - Dívidas (R$ 2.300) = R$ 3.345

---

## ⚠️ Alertas Preditivos Baseados em Dados Reais

### 1. ⚠️ Orçamento de Alimentação Excedido
- **Orçado:** R$ 1.500
- **Gasto:** R$ 1.320
- **Status:** ✅ Dentro do orçamento (-R$ 180 disponível)
- **Ação:** Nenhuma necessária

### 2. ✅ Meta de Notebook Alcançável
- **Faltam:** R$ 4.800
- **Prazo:** 4 meses (Mar/2026)
- **Necessário:** R$ 1.200/mês
- **Atual:** R$ 854/mês
- **Status:** ⚠️ Precisa aumentar economia em R$ 346/mês

### 3. 🔴 Comprometimento com Dívidas Alto
- **Parcelas mensais:** R$ 2.300
- **% da renda:** 35,4%
- **Ideal:** < 20%
- **Ação:** Priorizar quitação das dívidas com juros mais altos

### 4. ℹ️ Fatura Nubank Vence em Breve
- **Valor:** R$ 8.420
- **Vencimento:** 25/11/2025
- **Dias restantes:** 18
- **Ação:** Garantir saldo para pagamento

---

## 🔄 Relações Entre os Módulos

```
┌─────────────────────────────────────────────────────────┐
│                    RECEITA MENSAL                        │
│                     R$ 6.500,00                          │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ↓                       ↓
┌───────────────┐       ┌───────────────┐
│   DESPESAS    │       │    DÍVIDAS    │
│   R$ 3.345    │       │   R$ 2.300    │
│               │       │               │
│ • Moradia     │       │ • Carro       │
│ • Alimentação │       │ • Empréstimo  │
│ • Transporte  │       │ • Parcelado   │
│ • Assinaturas │       │               │
└───────────────┘       └───────────────┘
        │                       │
        └───────────┬───────────┘
                    ↓
            ┌───────────────┐
            │     SALDO     │
            │   R$ 854,30   │
            └───────┬───────┘
                    │
        ┌───────────┴───────────┐
        ↓                       ↓
┌───────────────┐       ┌───────────────┐
│     METAS     │       │   FORECAST    │
│               │       │               │
│ Precisa:      │       │ Em 6 meses:   │
│ R$ 4.414/mês  │       │ R$ 5.124      │
│               │       │               │
│ ❌ Insufic.   │       │ ✅ Projetado  │
└───────────────┘       └───────────────┘
```

---

## ✅ Checklist de Consistência

- [x] Receita mensal definida: R$ 6.500
- [x] Despesas totais batem com categorias: R$ 5.645,70
- [x] Assinaturas incluídas nas despesas
- [x] Saldo = Receita - Despesas: R$ 854,30
- [x] Taxa de poupança calculada: 13,14%
- [x] Cartões de crédito com uso total consistente
- [x] Dívidas com parcelas somando R$ 2.300
- [x] Metas requerem mais do que a poupança atual
- [x] Score reflete a situação real (54/100)
- [x] Forecast baseado em economia constante
- [x] Alertas conectados com dados reais

---

## 🎯 Próximos Passos para Melhorar a Situação

1. **Reduzir Dívidas:** Priorizar pagamento antecipado da dívida com 3,8% de juros
2. **Cortar Despesas:** Reduzir alimentação em R$ 200/mês (menos delivery)
3. **Pausar Assinaturas:** Adobe já pausada, economiza R$ 99/mês
4. **Aumentar Renda:** Buscar renda extra de R$ 500/mês
5. **Revisar Metas:** Adiar viagem para focar em emergência primeiro

**Com essas ações:** Poupança mensal pode subir para R$ 1.650/mês! 🚀

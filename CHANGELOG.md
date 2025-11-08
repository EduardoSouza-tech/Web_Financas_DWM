# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2025-11-07

### ✨ Adicionado

#### Frontend
- Estrutura completa Next.js 14 com App Router
- Sistema de autenticação Firebase Auth
- ThemeProvider com Dark/Light mode
- Componentes UI premium (ShadCN)
  - Card com glassmorphism
  - Button com variantes
  - Input estilizado
  - Badge com cores temáticas
- Página de login com animações Framer Motion
- Dashboard com sidebar responsiva
- Overview page com KPIs animados
- Sistema de alertas visuais
- Visualização de metas com progress bars
- API client com JWT authentication
- Utilidades de formatação (moeda, data, porcentagem)

#### Backend
- API REST com FastAPI
- Middleware de autenticação JWT
- Firebase Admin SDK integrado
- CORS configurado
- Documentação Swagger automática
- Modelos Pydantic completos
- Routers para:
  - Overview (KPIs e agregações)
  - Transactions (CRUD completo)
  - Budgets (gestão de orçamentos)
  - Goals (metas financeiras)
  - Forecasts (previsões futuras)
- FirestoreService (CRUD genérico)
- CalculationService (lógica de negócio)
  - Score financeiro (0-100)
  - Forecast de cashflow
  - Cálculo de aderência ao orçamento
- Exception handlers globais

#### Documentação
- README.md completo
- INSTALL.md com guia passo a passo
- SUMMARY.md com visão geral do sistema
- ROADMAP.md com planejamento futuro
- CHANGELOG.md (este arquivo)
- Comentários inline no código

#### DevOps
- Monorepo com Turbo
- Scripts de limpeza (clean.sh/ps1)
- .gitignore configurado
- .editorconfig para consistência
- Estrutura de pastas organizada

### 🎨 Design
- Paleta de cores premium
- Glassmorphism effects
- Animações suaves com Framer Motion
- Ícones Lucide React
- Tipografia Inter
- Responsivo mobile-first

### 🔐 Segurança
- Autenticação JWT
- Firebase Security Rules ready
- Validação Pydantic
- CORS configurado
- Environment variables

### 📊 Features Financeiras
- Score financeiro (0-100)
- Previsões de cashflow (6-24 meses)
- 3 cenários (pessimista/base/otimista)
- Alertas inteligentes
- Top 5 categorias
- Progress de metas
- KPIs principais:
  - Total de receitas
  - Total de despesas
  - Saldo atual
  - Taxa de poupança

---

## [Unreleased]

### 🚧 Em Desenvolvimento
- Página de transações completa
- Página de orçamentos
- Página de metas
- Página de configurações
- Sistema de categorias customizadas

### 💡 Planejado para v1.1
- Gráficos interativos (Tremor/Recharts)
- Relatórios em PDF
- Exportação CSV/Excel
- Insights avançados
- Machine Learning para previsões

### 🔮 Futuro (v1.2+)
- Modo casal completo
- Builder de regras (automação)
- Gestão de dívidas
- Sistema de assinaturas
- App mobile
- Integração Open Finance
- IA preditiva

---

## Tipos de Mudanças

- `✨ Adicionado` - Novas funcionalidades
- `🔄 Modificado` - Mudanças em funcionalidades existentes
- `🗑️ Removido` - Funcionalidades removidas
- `🐛 Corrigido` - Correções de bugs
- `🔐 Segurança` - Correções de vulnerabilidades
- `📚 Documentação` - Mudanças na documentação
- `🎨 Design` - Mudanças visuais e UX
- `⚡ Performance` - Melhorias de performance
- `♻️ Refatoração` - Mudanças de código sem alterar funcionalidade

---

**Versão Atual**: v1.0.0  
**Última Atualização**: 07 de Novembro de 2025

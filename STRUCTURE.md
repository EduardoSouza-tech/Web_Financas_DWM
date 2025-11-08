# 📁 Estrutura do Projeto

Visualização completa da arquitetura de arquivos e pastas do Sistema de Finanças.

```
web_de_finanças/                           # 🏠 Raiz do Monorepo
│
├── 📄 README.md                           # Documentação principal
├── 📄 INSTALL.md                          # Guia de instalação detalhado
├── 📄 QUICKSTART.md                       # Início rápido (5 min)
├── 📄 SUMMARY.md                          # Sumário completo do sistema
├── 📄 ROADMAP.md                          # Planejamento futuro
├── 📄 CHANGELOG.md                        # Histórico de versões
├── 📄 package.json                        # Config monorepo
├── 📄 turbo.json                          # Config Turbo
├── 📄 .gitignore                          # Arquivos ignorados
├── 📄 .editorconfig                       # Config editor
│
├── 📂 scripts/                            # 🛠️ Scripts utilitários
│   ├── clean.sh                           # Limpeza (Linux/Mac)
│   └── clean.ps1                          # Limpeza (Windows)
│
├── 📂 apps/                               # 📦 Aplicações
│   │
│   ├── 📂 web/                            # 🎨 Frontend Next.js
│   │   │
│   │   ├── 📂 src/
│   │   │   │
│   │   │   ├── 📂 app/                    # App Router
│   │   │   │   ├── layout.tsx             # Root layout
│   │   │   │   ├── page.tsx               # Home (redirect)
│   │   │   │   │
│   │   │   │   ├── 📂 auth/               # Autenticação
│   │   │   │   │   └── 📂 login/
│   │   │   │   │       └── page.tsx       # Tela de login
│   │   │   │   │
│   │   │   │   └── 📂 dashboard/          # Dashboard principal
│   │   │   │       ├── layout.tsx         # Layout com sidebar
│   │   │   │       ├── page.tsx           # Overview (KPIs)
│   │   │   │       ├── 📂 transactions/   # (Futuro)
│   │   │   │       ├── 📂 budgets/        # (Futuro)
│   │   │   │       ├── 📂 goals/          # (Futuro)
│   │   │   │       ├── 📂 forecasts/      # (Futuro)
│   │   │   │       └── 📂 settings/       # (Futuro)
│   │   │   │
│   │   │   ├── 📂 components/             # Componentes React
│   │   │   │   └── 📂 ui/                 # UI Components (ShadCN)
│   │   │   │       ├── card.tsx           # Card component
│   │   │   │       ├── button.tsx         # Button component
│   │   │   │       ├── input.tsx          # Input component
│   │   │   │       └── badge.tsx          # Badge component
│   │   │   │
│   │   │   ├── 📂 lib/                    # Bibliotecas e utils
│   │   │   │   ├── firebase.ts            # Config Firebase
│   │   │   │   ├── api.ts                 # API client
│   │   │   │   └── utils.ts               # Utilidades
│   │   │   │
│   │   │   ├── 📂 providers/              # Context Providers
│   │   │   │   ├── auth-provider.tsx      # Auth context
│   │   │   │   └── theme-provider.tsx     # Theme context
│   │   │   │
│   │   │   ├── 📂 hooks/                  # Custom hooks (Futuro)
│   │   │   │
│   │   │   └── 📂 styles/                 # Estilos
│   │   │       └── globals.css            # CSS global + Tailwind
│   │   │
│   │   ├── 📂 public/                     # Assets estáticos
│   │   │   ├── favicon.ico                # (Adicionar)
│   │   │   └── images/                    # (Adicionar)
│   │   │
│   │   ├── 📄 package.json                # Dependências web
│   │   ├── 📄 next.config.js              # Config Next.js
│   │   ├── 📄 tsconfig.json               # Config TypeScript
│   │   ├── 📄 tailwind.config.js          # Config Tailwind
│   │   ├── 📄 postcss.config.js           # Config PostCSS
│   │   └── 📄 .env.example                # Exemplo de env
│   │
│   └── 📂 api/                            # 🐍 Backend FastAPI
│       │
│       ├── 📄 main.py                     # App principal FastAPI
│       │
│       ├── 📂 routers/                    # API Routers
│       │   ├── __init__.py                # Package init
│       │   ├── overview.py                # GET /api/overview
│       │   ├── transactions.py            # CRUD transactions
│       │   ├── budgets.py                 # CRUD budgets
│       │   ├── goals.py                   # CRUD goals
│       │   └── forecasts.py               # GET forecasts
│       │
│       ├── 📂 models/                     # Modelos de dados
│       │   ├── __init__.py                # Package init
│       │   └── schemas.py                 # Pydantic models
│       │
│       ├── 📂 services/                   # Lógica de negócio
│       │   ├── __init__.py                # Package init
│       │   ├── firestore_service.py       # CRUD Firestore
│       │   └── calculation_service.py     # Cálculos financeiros
│       │
│       ├── 📂 utils/                      # Utilidades (Futuro)
│       │
│       ├── 📄 requirements.txt            # Dependências Python
│       └── 📄 .env.example                # Exemplo de env
│
└── 📂 packages/                           # 📦 Pacotes compartilhados (Futuro)
    ├── 📂 ui/                             # Design system
    │   └── package.json
    │
    ├── 📂 schemas/                        # Schemas compartilhados
    │   └── package.json
    │
    └── 📂 config/                         # Configs compartilhadas
        └── package.json
```

---

## 📊 Estatísticas do Projeto

### Arquivos Criados
- **TypeScript/TSX**: 15+ arquivos
- **Python**: 10+ arquivos
- **Config**: 10+ arquivos
- **Documentação**: 7 arquivos
- **Total**: ~45 arquivos

### Linhas de Código (aprox)
- **Frontend**: ~2000 linhas
- **Backend**: ~1000 linhas
- **Documentação**: ~2000 linhas
- **Total**: ~5000 linhas

### Tecnologias
- **Languages**: TypeScript, Python, CSS
- **Frameworks**: Next.js, FastAPI
- **Libraries**: 30+ packages
- **Tools**: Turbo, Firebase, Tailwind

---

## 🎯 Arquivos Principais

### Frontend (Top 10)

1. **`apps/web/src/app/layout.tsx`**
   - Root layout com providers
   - Configuração de fontes e metadata

2. **`apps/web/src/app/dashboard/layout.tsx`**
   - Layout do dashboard com sidebar
   - Navegação principal

3. **`apps/web/src/app/dashboard/page.tsx`**
   - Overview page com KPIs
   - Gráficos e alertas

4. **`apps/web/src/providers/auth-provider.tsx`**
   - Context de autenticação
   - Firebase Auth integration

5. **`apps/web/src/lib/api.ts`**
   - Cliente HTTP para API
   - Gerenciamento de JWT

6. **`apps/web/src/components/ui/card.tsx`**
   - Componente Card base
   - Variações (Header, Content, Footer)

7. **`apps/web/src/lib/firebase.ts`**
   - Configuração Firebase
   - Inicialização de serviços

8. **`apps/web/src/styles/globals.css`**
   - Estilos globais
   - Variáveis CSS (tema)

9. **`apps/web/tailwind.config.js`**
   - Configuração Tailwind
   - Tema customizado

10. **`apps/web/next.config.js`**
    - Configuração Next.js
    - Environment variables

### Backend (Top 10)

1. **`apps/api/main.py`**
   - App FastAPI principal
   - Middleware e routers

2. **`apps/api/models/schemas.py`**
   - Todos os modelos Pydantic
   - Validações

3. **`apps/api/routers/overview.py`**
   - Endpoint de overview
   - Agregações e KPIs

4. **`apps/api/routers/transactions.py`**
   - CRUD de transações
   - Filtros e queries

5. **`apps/api/services/firestore_service.py`**
   - CRUD genérico Firestore
   - Queries flexíveis

6. **`apps/api/services/calculation_service.py`**
   - Score financeiro
   - Forecast de cashflow

7. **`apps/api/routers/forecasts.py`**
   - Previsões futuras
   - Cenários

8. **`apps/api/routers/budgets.py`**
   - Gestão de orçamentos
   - Categorias

9. **`apps/api/routers/goals.py`**
   - Gestão de metas
   - Contribuições

10. **`apps/api/requirements.txt`**
    - Todas as dependências
    - Versões fixas

---

## 🗂️ Convenções de Nomenclatura

### Frontend
- **Components**: PascalCase (`Card.tsx`)
- **Pages**: PascalCase (`page.tsx`)
- **Utils**: camelCase (`formatCurrency`)
- **Hooks**: camelCase + `use` prefix (`useAuth`)
- **Contexts**: PascalCase + `Provider` suffix (`AuthProvider`)

### Backend
- **Files**: snake_case (`firestore_service.py`)
- **Classes**: PascalCase (`Transaction`)
- **Functions**: snake_case (`calculate_score`)
- **Constants**: UPPER_SNAKE_CASE (`API_URL`)
- **Routes**: kebab-case (`/api/transactions`)

---

## 📦 Dependências por Categoria

### Frontend Core
- next (14.2.0)
- react (18.3.0)
- typescript (5.4.0)

### Frontend UI
- tailwindcss (3.4.0)
- framer-motion (11.0.0)
- lucide-react (0.344.0)
- @radix-ui/* (2.0+)

### Frontend Data
- firebase (10.12.0)
- zod (3.22.4)
- react-hook-form (7.51.0)

### Backend Core
- fastapi (0.110.0)
- uvicorn (0.27.0)
- pydantic (2.6.0)

### Backend Services
- firebase-admin (6.4.0)
- python-jose (3.3.0)
- pandas (2.2.0)

---

## 🎨 Padrões de Design

### Atomic Design
```
Atoms       → Button, Input, Badge
Molecules   → Card (Header + Content + Footer)
Organisms   → Sidebar, KPI Grid
Templates   → Dashboard Layout
Pages       → Overview, Transactions
```

### Clean Architecture
```
Presentation → Components, Pages
Business     → Providers, Hooks
Data         → API Client, Firebase
```

---

## 🔄 Fluxo de Dados

```
User Action
    ↓
Component
    ↓
Hook/Provider
    ↓
API Client (lib/api.ts)
    ↓
[HTTP Request + JWT]
    ↓
Backend (main.py)
    ↓
Middleware (auth)
    ↓
Router (overview.py, etc)
    ↓
Service (calculation, firestore)
    ↓
Firebase Firestore
    ↓
[Response]
    ↓
Component Update
    ↓
UI Render
```

---

## 🚀 Futuras Adições

### Estrutura Futura
```
apps/
  mobile/         # React Native app
  admin/          # Admin dashboard
  landing/        # Landing page

packages/
  ui/             # Shared UI components
  schemas/        # Shared validation
  utils/          # Shared utilities
  config/         # Shared configs

docs/
  api/            # API documentation
  components/     # Component docs
  guides/         # User guides
```

---

**Última atualização**: Novembro 2025  
**Versão**: 1.0.0

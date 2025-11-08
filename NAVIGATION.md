# 🗺️ Navegação Rápida - Sistema de Finanças

Encontre rapidamente o que você procura.

---

## 📖 Documentação

| Documento | Descrição | Tempo de Leitura |
|-----------|-----------|------------------|
| [**QUICKSTART.md**](QUICKSTART.md) | ⚡ Setup em 5 minutos | 5 min |
| [**README.md**](README.md) | 📄 Visão geral do projeto | 3 min |
| [**INSTALL.md**](INSTALL.md) | 📦 Guia de instalação completo | 10 min |
| [**SUMMARY.md**](SUMMARY.md) | 📊 Sumário completo do sistema | 8 min |
| [**STRUCTURE.md**](STRUCTURE.md) | 📁 Arquitetura de arquivos | 5 min |
| [**ROADMAP.md**](ROADMAP.md) | 🗺️ Planejamento futuro | 7 min |
| [**CHANGELOG.md**](CHANGELOG.md) | 📝 Histórico de versões | 2 min |
| [**COMMANDS.md**](COMMANDS.md) | 🛠️ Cheat sheet de comandos | Referência |

---

## 🎯 Por Objetivo

### 🚀 Quero começar agora
→ [QUICKSTART.md](QUICKSTART.md)

### 📖 Quero entender o projeto
→ [README.md](README.md) → [SUMMARY.md](SUMMARY.md)

### 💻 Quero instalar com calma
→ [INSTALL.md](INSTALL.md)

### 🏗️ Quero entender a arquitetura
→ [STRUCTURE.md](STRUCTURE.md)

### 🔮 Quero ver o futuro
→ [ROADMAP.md](ROADMAP.md)

### 🛠️ Preciso de comandos
→ [COMMANDS.md](COMMANDS.md)

### 🐛 Tenho um problema
→ [COMMANDS.md](COMMANDS.md) (Seção "Solução de Problemas")

### 🎨 Quero personalizar
→ Ver código em `apps/web/src/`

### 🔌 Quero integrar API
→ Ver `apps/api/routers/` + `http://localhost:8000/docs`

---

## 📂 Arquivos Principais

### Frontend (Next.js)

```
apps/web/src/
├── app/
│   ├── layout.tsx              # ⭐ Root layout
│   ├── page.tsx                # Home (redirect)
│   ├── auth/login/page.tsx     # ⭐ Login page
│   └── dashboard/
│       ├── layout.tsx          # ⭐ Dashboard layout
│       └── page.tsx            # ⭐ Overview (KPIs)
│
├── components/ui/
│   ├── card.tsx                # ⭐ Card component
│   ├── button.tsx              # ⭐ Button component
│   ├── input.tsx               # Input component
│   └── badge.tsx               # Badge component
│
├── lib/
│   ├── firebase.ts             # ⭐ Firebase config
│   ├── api.ts                  # ⭐ API client
│   └── utils.ts                # Utilities
│
├── providers/
│   ├── auth-provider.tsx       # ⭐ Auth context
│   └── theme-provider.tsx      # ⭐ Theme context
│
└── styles/
    └── globals.css             # ⭐ Global styles
```

⭐ = Arquivo mais importante

### Backend (FastAPI)

```
apps/api/
├── main.py                     # ⭐ App principal
│
├── routers/
│   ├── overview.py             # ⭐ GET /api/overview
│   ├── transactions.py         # ⭐ CRUD transactions
│   ├── budgets.py              # CRUD budgets
│   ├── goals.py                # CRUD goals
│   └── forecasts.py            # GET /api/forecasts
│
├── models/
│   └── schemas.py              # ⭐ Pydantic models
│
└── services/
    ├── firestore_service.py    # ⭐ Firestore CRUD
    └── calculation_service.py  # ⭐ Business logic
```

⭐ = Arquivo mais importante

---

## 🎓 Tutoriais por Nível

### 🌱 Iniciante

1. **Primeira execução**
   - Leia: [QUICKSTART.md](QUICKSTART.md)
   - Siga o passo a passo
   - Abra http://localhost:3000

2. **Explorar o sistema**
   - Crie uma conta
   - Navegue pelas páginas
   - Veja os KPIs

3. **Entender o código**
   - Abra `apps/web/src/app/dashboard/page.tsx`
   - Veja como os KPIs são renderizados
   - Modifique valores de teste

### 🌿 Intermediário

1. **Criar componente**
   - Copie `apps/web/src/components/ui/card.tsx`
   - Crie seu próprio componente
   - Use no dashboard

2. **Adicionar endpoint API**
   - Copie `apps/api/routers/goals.py`
   - Crie seu próprio router
   - Registre em `main.py`

3. **Estilizar com Tailwind**
   - Veja `tailwind.config.js`
   - Adicione cores customizadas
   - Use no componente

### 🌳 Avançado

1. **Implementar feature completa**
   - Nova página de transações
   - Componentes customizados
   - Integração API completa

2. **Sistema de automação**
   - Builder de regras visual
   - Engine de execução
   - Logs e auditoria

3. **Deploy em produção**
   - Vercel (frontend)
   - Render/Cloud Run (backend)
   - Configurar domínio

---

## 🔍 Busca Rápida

### Preciso encontrar...

| O que? | Onde está? |
|--------|-----------|
| **Autenticação** | `apps/web/src/providers/auth-provider.tsx` |
| **Tema Dark/Light** | `apps/web/src/providers/theme-provider.tsx` |
| **Componentes UI** | `apps/web/src/components/ui/` |
| **API Client** | `apps/web/src/lib/api.ts` |
| **Firebase Config** | `apps/web/src/lib/firebase.ts` |
| **Estilos Globais** | `apps/web/src/styles/globals.css` |
| **Tailwind Config** | `apps/web/tailwind.config.js` |
| **API Principal** | `apps/api/main.py` |
| **Endpoints** | `apps/api/routers/` |
| **Models** | `apps/api/models/schemas.py` |
| **Business Logic** | `apps/api/services/calculation_service.py` |
| **Firestore** | `apps/api/services/firestore_service.py` |

---

## 🛠️ Comandos Mais Usados

```powershell
# Executar tudo
npm run dev

# Limpar cache
.\scripts\clean.ps1

# Frontend apenas
cd apps\web && npm run dev

# Backend apenas
cd apps\api && .\venv\Scripts\activate && python main.py

# Ver API docs
# http://localhost:8000/docs

# Ver erros
# Terminal do frontend/backend
```

---

## 📊 Fluxos Comuns

### Adicionar Nova Feature

```
1. Criar branch
   git checkout -b feature/minha-feature

2. Desenvolver frontend
   apps/web/src/app/dashboard/minha-feature/page.tsx

3. Desenvolver backend
   apps/api/routers/minha_feature.py

4. Testar localmente
   npm run dev

5. Commit e push
   git commit -m "feat: Minha feature"
   git push origin feature/minha-feature
```

### Adicionar Componente UI

```
1. Criar arquivo
   apps/web/src/components/ui/meu-componente.tsx

2. Definir props e estilos
   Usar Tailwind + cn()

3. Exportar
   export { MeuComponente }

4. Usar em página
   import { MeuComponente } from '@/components/ui/meu-componente'
```

### Adicionar Endpoint API

```
1. Definir model (se novo)
   apps/api/models/schemas.py

2. Criar router
   apps/api/routers/meu_router.py

3. Implementar lógica
   apps/api/services/

4. Registrar em main.py
   app.include_router(meu_router.router)

5. Testar
   http://localhost:8000/docs
```

---

## 🎯 Atalhos VS Code

| Atalho | Ação |
|--------|------|
| `Ctrl + P` | Abrir arquivo rápido |
| `Ctrl + Shift + P` | Command palette |
| `Ctrl + `` | Toggle terminal |
| `Ctrl + B` | Toggle sidebar |
| `Ctrl + /` | Comentar linha |
| `Alt + Shift + F` | Formatar documento |
| `F5` | Debug |
| `Ctrl + Shift + F` | Buscar em arquivos |

---

## 🌐 URLs Úteis

### Desenvolvimento
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **API Redoc**: http://localhost:8000/redoc

### Produção (Futuro)
- **App**: https://seu-dominio.vercel.app
- **API**: https://api.seu-dominio.com
- **Docs**: https://api.seu-dominio.com/docs

### External
- **Firebase Console**: https://console.firebase.google.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Render Dashboard**: https://dashboard.render.com

---

## 💡 Dicas de Produtividade

### Snippets Úteis

**tsrfce** (TypeScript React Function Component Export)
```tsx
export default function ComponentName() {
  return <div>ComponentName</div>
}
```

**usf** (useState)
```tsx
const [state, setState] = useState(initialValue)
```

**uef** (useEffect)
```tsx
useEffect(() => {
  
}, [])
```

### Multi-cursor
- `Alt + Click` - Adicionar cursor
- `Ctrl + Alt + ↑/↓` - Cursor acima/abaixo
- `Ctrl + D` - Selecionar próxima ocorrência

---

## 🆘 Ajuda Rápida

### Erro comum?
→ [COMMANDS.md](COMMANDS.md) seção "Solução de Problemas"

### Não sei por onde começar?
→ [QUICKSTART.md](QUICKSTART.md)

### Quero contribuir?
→ [README.md](README.md) seção "Contribuindo"

### Preciso de mais detalhes?
→ [SUMMARY.md](SUMMARY.md)

---

## 📚 Recursos Externos

### Aprendizado
- **Next.js**: https://nextjs.org/learn
- **FastAPI**: https://fastapi.tiangolo.com/tutorial
- **Tailwind**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

### Comunidade
- **Next.js Discord**: https://discord.gg/nextjs
- **FastAPI Discord**: https://discord.gg/fastapi
- **Stack Overflow**: Tag `nextjs`, `fastapi`

---

**Última atualização**: Novembro 2025  
**Versão**: 1.0.0

**Não encontrou o que procurava?** Abra uma issue no repositório!

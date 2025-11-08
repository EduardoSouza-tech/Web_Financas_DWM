# 🚀 Instruções de Instalação e Execução

## Pré-requisitos

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.11+ ([Download](https://www.python.org/downloads/))
- **Git** ([Download](https://git-scm.com/))
- **Conta Firebase** (para autenticação e banco de dados)

## 📦 Configuração Inicial

### 1. Clonar/Navegar para o diretório

```powershell
cd "C:\Users\Eduardo\Desktop\web_de_finanças"
```

### 2. Instalar dependências do Frontend

```powershell
# Na raiz do projeto
npm install

# Instalar dependências do app web
cd apps\web
npm install
```

### 3. Configurar Backend Python

```powershell
# Voltar para raiz
cd ..\..

# Navegar para API
cd apps\api

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual (Windows)
.\venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt
```

### 4. Configurar Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Habilite **Authentication** (Email/Password)
4. Crie um banco **Firestore** (modo teste ou produção)
5. Baixe as credenciais:
   - **Web**: Configurações do projeto → Apps → Configurações do app web
   - **Admin SDK**: Configurações do projeto → Contas de serviço → Gerar nova chave privada

### 5. Variáveis de Ambiente

#### Frontend (.env.local)

```powershell
# Criar arquivo na raiz de apps/web
cd apps\web
cp .env.example .env.local

# Editar com suas credenciais Firebase
notepad .env.local
```

Preencha com os valores do Firebase Console:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Backend (.env)

```powershell
# Criar arquivo na raiz de apps/api
cd ..\api
cp .env.example .env

# Editar com credenciais do Service Account
notepad .env
```

Preencha com os valores do Service Account JSON:

```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:3000
ENVIRONMENT=development
```

## ▶️ Executar o Projeto

### Opção 1: Executar tudo com Turbo (Recomendado)

```powershell
# Na raiz do projeto
npm run dev
```

### Opção 2: Executar separadamente

#### Terminal 1 - Frontend

```powershell
cd apps\web
npm run dev
```

Acesse: http://localhost:3000

#### Terminal 2 - Backend

```powershell
cd apps\api
.\venv\Scripts\activate
python main.py
```

Acesse API: http://localhost:8000
Docs: http://localhost:8000/docs

## 🧪 Testando o Sistema

### 1. Criar uma conta

1. Abra http://localhost:3000
2. Clique em "Criar Conta"
3. Insira email e senha
4. Você será redirecionado para o dashboard

### 2. Testar a API diretamente

```powershell
# Verificar saúde da API
curl http://localhost:8000/health

# Acessar documentação interativa
# Abra http://localhost:8000/docs no navegador
```

### 3. Verificar Firebase

- Verifique se o usuário foi criado em **Authentication**
- Collections serão criadas automaticamente ao adicionar dados

## 📊 Estrutura das Collections Firestore

O sistema criará automaticamente as seguintes collections:

- `users` - Perfis de usuários
- `households` - Grupos familiares/casal
- `transactions` - Todas as transações
- `accounts` - Contas bancárias e cartões
- `budgets` - Orçamentos mensais
- `goals` - Metas financeiras
- `subscriptions` - Assinaturas recorrentes
- `debts` - Dívidas e parcelas
- `insights` - Dados agregados e cache
- `rules` - Regras de automação

## 🛠️ Comandos Úteis

```powershell
# Limpar dependências
npm run clean

# Rebuild completo
npm run build

# Lint
npm run lint

# Frontend apenas
npm run web:dev

# Backend apenas
npm run api:dev
```

## ❗ Solução de Problemas

### Erro: "Module not found"

```powershell
# Reinstalar dependências
rm -r node_modules
npm install
```

### Erro no Python

```powershell
# Reinstalar venv
cd apps\api
rm -r venv
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Erro Firebase Auth

- Verifique se as credenciais estão corretas em `.env.local`
- Confirme que Authentication está habilitado no Firebase
- Verifique se o domínio está autorizado (localhost:3000)

### Erro CORS na API

- Verifique `CORS_ORIGINS` no `.env` do backend
- Deve incluir `http://localhost:3000`

## 📚 Próximos Passos

1. **Adicionar dados de exemplo**: Crie transações, metas e orçamentos
2. **Explorar funcionalidades**: Navegue por todas as páginas
3. **Testar modo casal**: Adicione um household compartilhado
4. **Configurar automações**: Crie regras personalizadas
5. **Visualizar previsões**: Acesse a página de Forecast

## 🚀 Deploy (Futuro)

### Frontend → Vercel

```powershell
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Backend → Render/Cloud Run

```powershell
# Criar Dockerfile e configurar no Render.com
# ou Google Cloud Run
```

## 📖 Documentação Completa

- **API Docs**: http://localhost:8000/docs (quando rodando)
- **README**: `README.md` na raiz
- **Manual**: Veja o documento original no início

## 💡 Dicas de Desenvolvimento

1. Use **Dark Mode** para melhor experiência
2. Ícones **Lucide React** para UI consistente
3. **Tailwind** para estilização rápida
4. **Framer Motion** para animações premium
5. Sempre teste autenticação antes de chamar API

---

**Criado com ❤️ para gestão financeira premium**

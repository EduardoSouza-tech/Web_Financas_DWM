# ⚡ Início Rápido - 5 Minutos

Coloque seu sistema de finanças funcionando em **5 minutos**!

---

## 📋 Pré-requisitos (Instale se não tiver)

- ✅ [Node.js 18+](https://nodejs.org/)
- ✅ [Python 3.11+](https://www.python.org/)
- ✅ [Git](https://git-scm.com/)

---

## 🚀 Setup Rápido

### Passo 1: Instalar Dependências (2 min)

```powershell
# Na raiz do projeto
npm install

# Web
cd apps\web
npm install
cd ..\..

# API
cd apps\api
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
cd ..\..
```

---

### Passo 2: Configurar Firebase (2 min)

1. **Criar projeto Firebase**: https://console.firebase.google.com/
   - Clique em "Adicionar projeto"
   - Nome: "Sistema Finanças"
   - Desabilite Analytics (opcional)

2. **Habilitar Authentication**:
   - Menu lateral → Authentication → Get Started
   - Aba "Sign-in method"
   - Habilite "Email/Password"

3. **Criar Firestore**:
   - Menu lateral → Firestore Database → Create database
   - Modo: "Teste" (por enquanto)
   - Região: "southamerica-east1" (São Paulo)

4. **Copiar credenciais Web**:
   - Configurações do projeto (ícone engrenagem)
   - Apps → Web (ícone `</>`)
   - Copie as chaves

5. **Gerar chave Service Account**:
   - Configurações do projeto → Service accounts
   - "Generate new private key" → Download JSON

---

### Passo 3: Configurar Variáveis (1 min)

#### Frontend (.env.local)

```powershell
cd apps\web
copy .env.example .env.local
notepad .env.local
```

Cole suas credenciais:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Backend (.env)

```powershell
cd ..\api
copy .env.example .env
notepad .env
```

Abra o JSON baixado do Service Account e copie os valores:

```env
FIREBASE_PROJECT_ID=seu-projeto-id
FIREBASE_PRIVATE_KEY_ID=abc123...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@seu-projeto.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:3000
ENVIRONMENT=development
```

> ⚠️ **Importante**: Mantenha as aspas duplas na PRIVATE_KEY

---

## ▶️ Executar (30 segundos)

### Terminal 1 - Frontend

```powershell
cd apps\web
npm run dev
```

Aguarde mensagem: `✓ Ready in 2s`

### Terminal 2 - Backend

```powershell
cd apps\api
.\venv\Scripts\activate
python main.py
```

Aguarde mensagem: `INFO: Uvicorn running on http://0.0.0.0:8000`

---

## 🎉 Pronto! Acesse

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs

---

## 🧪 Primeiro Teste (30 segundos)

### 1. Criar Conta

1. Abra http://localhost:3000
2. Clique em "Não tem conta? Criar agora"
3. Email: `teste@exemplo.com`
4. Senha: `123456` (mínimo 6 caracteres)
5. Clique em "Criar Conta"

### 2. Ver Dashboard

Você será redirecionado para o dashboard com:
- ✅ 4 KPI cards animados
- ✅ Score financeiro
- ✅ Alertas
- ✅ Categorias
- ✅ Metas

### 3. Testar API

Abra http://localhost:8000/docs

- Clique em qualquer endpoint
- "Try it out"
- Execute!

---

## ❓ Problemas Comuns

### ❌ Erro: "Module not found"

```powershell
# Limpar e reinstalar
npm run clean  # ou scripts\clean.ps1
npm install
```

### ❌ Erro: Python não encontrado

```powershell
# Verificar instalação
python --version

# Se não funcionar, use:
python3 --version
py --version
```

### ❌ Erro: Firebase auth failed

- Verifique se as credenciais estão corretas no `.env.local`
- Confirme que Authentication está **habilitado** no Firebase Console
- Tente fazer logout e login novamente

### ❌ Erro: CORS

- Verifique se `CORS_ORIGINS` no backend `.env` inclui `http://localhost:3000`
- Reinicie o backend

### ❌ Porta já em uso

```powershell
# Frontend (3000)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Backend (8000)
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

---

## 📚 Próximos Passos

Agora que está funcionando:

1. ✅ **Explore o Dashboard** - Navegue pelas páginas
2. ✅ **Adicione Dados** - Crie transações de teste
3. ✅ **Configure Metas** - Defina objetivos financeiros
4. ✅ **Veja Previsões** - Acesse a página de Forecast
5. ✅ **Personalize** - Ajuste tema e categorias

---

## 🆘 Precisa de Ajuda?

- 📖 Documentação completa: `INSTALL.md`
- 📊 Visão geral: `SUMMARY.md`
- 🗺️ Roadmap: `ROADMAP.md`
- 📝 Changelog: `CHANGELOG.md`

---

## 💡 Dicas

### Desenvolvimento

```powershell
# Rodar ambos juntos (na raiz)
npm run dev

# Só frontend
npm run web:dev

# Só backend
npm run api:dev
```

### Atalhos VS Code

- `Ctrl + Shift + P` → Procurar comandos
- `Ctrl + P` → Abrir arquivo rápido
- `Ctrl + `` → Terminal
- `F5` → Debug

### Hot Reload

- Frontend: Salvou? Já atualizou! ⚡
- Backend: Salvou? Já reiniciou! 🔄

---

## 🎯 Checklist de Sucesso

Seu sistema está pronto quando você vê:

- ✅ Frontend rodando em http://localhost:3000
- ✅ Backend rodando em http://localhost:8000
- ✅ Consegue criar conta
- ✅ Dashboard carrega com dados
- ✅ API Docs funcionando
- ✅ Sem erros no console

---

**🎉 Parabéns! Você tem um sistema de finanças premium rodando!**

Aproveite! 🚀💰

---

**Tempo total**: ~5 minutos  
**Dificuldade**: Fácil  
**Suporte**: Documentação completa em `INSTALL.md`

# ✅ Checklist de Verificação

Use este checklist para garantir que seu sistema está 100% configurado e funcional.

---

## 📋 Checklist de Instalação

### Pré-requisitos
- [ ] Node.js 18+ instalado
  ```powershell
  node --version  # Deve mostrar v18.x ou superior
  ```
- [ ] Python 3.11+ instalado
  ```powershell
  python --version  # Deve mostrar 3.11.x ou superior
  ```
- [ ] Git instalado
  ```powershell
  git --version
  ```
- [ ] Editor de código (VS Code recomendado)

---

## 🔧 Setup Inicial

### Dependências Frontend
- [ ] `npm install` executado na raiz
- [ ] `cd apps\web && npm install` executado
- [ ] Pasta `node_modules` criada
- [ ] Sem erros no console

### Dependências Backend
- [ ] `cd apps\api` navegado
- [ ] `python -m venv venv` executado
- [ ] `.\venv\Scripts\activate` funcionou
- [ ] `pip install -r requirements.txt` completado
- [ ] Pasta `venv` criada
- [ ] Sem erros de instalação

---

## 🔥 Firebase

### Projeto Firebase
- [ ] Projeto criado em https://console.firebase.google.com
- [ ] Nome do projeto anotado
- [ ] Região configurada (São Paulo)

### Authentication
- [ ] Menu "Authentication" acessado
- [ ] "Get Started" clicado
- [ ] Sign-in method "Email/Password" habilitado
- [ ] Status mostra "Enabled"

### Firestore Database
- [ ] Menu "Firestore Database" acessado
- [ ] "Create database" clicado
- [ ] Modo "Test" ou "Production" escolhido
- [ ] Região "southamerica-east1" selecionada
- [ ] Database criado com sucesso

### Credenciais Web
- [ ] Configurações do projeto → Apps → Web
- [ ] Nome do app definido
- [ ] Credenciais copiadas (apiKey, authDomain, etc)

### Service Account
- [ ] Configurações → Service accounts
- [ ] "Generate new private key" clicado
- [ ] Arquivo JSON baixado
- [ ] JSON salvo em local seguro

---

## 🔐 Variáveis de Ambiente

### Frontend (.env.local)
- [ ] Arquivo `.env.example` copiado para `.env.local`
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY` preenchido
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` preenchido
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` preenchido
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` preenchido
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` preenchido
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID` preenchido
- [ ] `NEXT_PUBLIC_API_URL` definido como `http://localhost:8000`
- [ ] Sem espaços extras ou caracteres inválidos

### Backend (.env)
- [ ] Arquivo `.env.example` copiado para `.env`
- [ ] `FIREBASE_PROJECT_ID` preenchido
- [ ] `FIREBASE_PRIVATE_KEY_ID` preenchido
- [ ] `FIREBASE_PRIVATE_KEY` preenchido (com aspas duplas e \n)
- [ ] `FIREBASE_CLIENT_EMAIL` preenchido
- [ ] `FIREBASE_CLIENT_ID` preenchido
- [ ] `CORS_ORIGINS` inclui `http://localhost:3000`
- [ ] Sem erros de formatação

---

## ▶️ Execução

### Primeira Execução
- [ ] Terminal 1 aberto
- [ ] `npm run web:dev` executado (ou `npm run dev` na raiz)
- [ ] Mensagem "✓ Ready in..." apareceu
- [ ] URL http://localhost:3000 mostrada
- [ ] Terminal 2 aberto
- [ ] `cd apps\api` navegado
- [ ] `.\venv\Scripts\activate` executado
- [ ] `python main.py` executado
- [ ] Mensagem "Uvicorn running on..." apareceu
- [ ] Sem erros nos terminais

### Acesso
- [ ] http://localhost:3000 abre sem erros
- [ ] http://localhost:8000 abre sem erros
- [ ] http://localhost:8000/docs abre a documentação Swagger
- [ ] Console do navegador sem erros críticos

---

## 🧪 Testes Funcionais

### Autenticação
- [ ] Página de login carrega
- [ ] Formulário de criar conta visível
- [ ] Email de teste inserido
- [ ] Senha de teste inserida (mínimo 6 caracteres)
- [ ] Botão "Criar Conta" clicado
- [ ] Conta criada com sucesso
- [ ] Redirecionamento para dashboard

### Dashboard
- [ ] Dashboard carrega completamente
- [ ] Sidebar visível
- [ ] 4 KPIs carregam (Receitas, Despesas, Saldo, Poupança)
- [ ] Score financeiro aparece
- [ ] Gráfico de categorias renderiza
- [ ] Seção de metas visível
- [ ] Animações funcionam suavemente

### Navegação
- [ ] Menu lateral responsivo funciona
- [ ] Links da sidebar clicáveis
- [ ] Botão de tema (Dark/Light) funciona
- [ ] Troca de tema persiste após reload
- [ ] Botão de logout funciona
- [ ] Após logout, redireciona para login

### API
- [ ] http://localhost:8000/docs acessível
- [ ] Lista de endpoints visível
- [ ] Endpoint `/health` testável
- [ ] "Try it out" funciona
- [ ] Resposta JSON retornada
- [ ] Status code 200

---

## 🎨 Verificação Visual

### Design
- [ ] Cores carregam corretamente
- [ ] Fontes renderizam bem
- [ ] Ícones aparecem
- [ ] Glassmorphism aplicado nos cards
- [ ] Sombras e bordas visíveis
- [ ] Gradientes funcionam

### Responsividade
- [ ] Desktop (1920x1080) - OK
- [ ] Laptop (1366x768) - OK
- [ ] Tablet (768px) - OK
- [ ] Mobile (375px) - OK
- [ ] Sidebar colapsa em mobile
- [ ] Menu hamburguer funciona

### Animações
- [ ] Fade in dos KPIs
- [ ] Hover effects nos botões
- [ ] Progress bars animam
- [ ] Transições suaves
- [ ] Sem travamentos

---

## 🔍 Verificação Técnica

### Frontend
- [ ] Sem erros no console do navegador
- [ ] Sem warnings críticos
- [ ] Hot reload funcionando
- [ ] TypeScript sem erros
- [ ] Build de produção funciona (`npm run build`)

### Backend
- [ ] Sem erros no terminal
- [ ] Sem warnings críticos
- [ ] Auto-reload funcionando
- [ ] Logs aparecem corretamente
- [ ] Conexão Firebase estabelecida

### Firebase
- [ ] Authentication dashboard mostra usuários
- [ ] Firestore criado (vazio ou com collections)
- [ ] Regras de segurança configuradas
- [ ] Sem erros no console Firebase

---

## 📊 Checklist de Performance

### Carregamento
- [ ] Primeira carga < 3 segundos
- [ ] Hot reload < 1 segundo
- [ ] API response < 500ms
- [ ] Sem lags perceptíveis

### Memória
- [ ] Uso de memória estável
- [ ] Sem memory leaks visíveis
- [ ] Console limpo após navegação

---

## 🐛 Problemas Comuns (Se algo falhar)

### ❌ Erro: Port already in use
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```
- [ ] Porta liberada
- [ ] Aplicação reiniciada

### ❌ Erro: Module not found
```powershell
.\scripts\clean.ps1
npm install
```
- [ ] Limpeza executada
- [ ] Dependências reinstaladas

### ❌ Erro: Firebase auth failed
- [ ] Credenciais verificadas em `.env.local`
- [ ] Authentication habilitado no console
- [ ] Cache do navegador limpo

### ❌ Erro: Python venv
```powershell
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```
- [ ] Venv recriado
- [ ] Dependências reinstaladas

---

## ✅ Status Final

### Básico (Obrigatório)
- [ ] Dependências instaladas
- [ ] Firebase configurado
- [ ] Variáveis de ambiente definidas
- [ ] Aplicação executa sem erros
- [ ] Login funciona
- [ ] Dashboard carrega

### Intermediário (Recomendado)
- [ ] Temas funcionam
- [ ] Navegação completa
- [ ] API testada
- [ ] Responsivo OK
- [ ] Performance aceitável

### Avançado (Opcional)
- [ ] Build de produção OK
- [ ] Testes implementados
- [ ] Deploy configurado
- [ ] Documentação lida
- [ ] Código personalizado

---

## 🎉 Pronto para Usar!

Se você marcou todos os itens "Básico", seu sistema está **100% funcional**!

### Próximos Passos:
1. ✅ Explorar todas as páginas
2. ✅ Adicionar dados de teste
3. ✅ Personalizar design
4. ✅ Implementar novas features
5. ✅ Fazer deploy

---

## 📝 Notas

### Data da Verificação
**Data**: ___/___/______

### Versão
**Versão do Sistema**: v1.0.0

### Status
- [ ] ✅ Tudo funcionando
- [ ] ⚠️ Funcionando com warnings
- [ ] ❌ Precisa de ajustes

### Observações
```
_________________________________________________
_________________________________________________
_________________________________________________
```

---

**Checklist concluído?** 🎉  
**Próximo passo**: [WELCOME.md](WELCOME.md) → [QUICKSTART.md](QUICKSTART.md)

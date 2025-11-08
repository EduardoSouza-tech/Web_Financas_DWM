# 🛠️ Comandos Úteis - Cheat Sheet

Referência rápida de comandos para desenvolvimento.

---

## 🚀 Comandos Principais

### Instalação Inicial

```powershell
# Instalar tudo de uma vez
npm install
cd apps\web && npm install && cd ..\..
cd apps\api && python -m venv venv && .\venv\Scripts\activate && pip install -r requirements.txt && cd ..\..
```

### Executar Projeto

```powershell
# Opção 1: Ambos juntos (Recomendado)
npm run dev

# Opção 2: Frontend apenas
npm run web:dev
# ou
cd apps\web && npm run dev

# Opção 3: Backend apenas
npm run api:dev
# ou
cd apps\api && .\venv\Scripts\activate && python main.py
```

---

## 📦 Gerenciamento de Dependências

### Frontend (Node.js)

```powershell
# Adicionar nova dependência
cd apps\web
npm install <package-name>

# Adicionar dependência de desenvolvimento
npm install -D <package-name>

# Remover dependência
npm uninstall <package-name>

# Atualizar dependências
npm update

# Ver dependências desatualizadas
npm outdated

# Limpar cache
npm cache clean --force
```

### Backend (Python)

```powershell
cd apps\api
.\venv\Scripts\activate

# Instalar nova dependência
pip install <package-name>

# Salvar no requirements.txt
pip freeze > requirements.txt

# Instalar do requirements.txt
pip install -r requirements.txt

# Atualizar dependência
pip install --upgrade <package-name>

# Desinstalar
pip uninstall <package-name>

# Ver dependências instaladas
pip list
```

---

## 🧹 Limpeza

```powershell
# Script de limpeza automática (Windows)
.\scripts\clean.ps1

# Ou manualmente:

# Limpar node_modules
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force apps\web\node_modules

# Limpar cache Next.js
Remove-Item -Recurse -Force apps\web\.next

# Limpar cache Turbo
Remove-Item -Recurse -Force .turbo

# Limpar Python cache
Remove-Item -Recurse -Force apps\api\__pycache__
Remove-Item -Recurse -Force apps\api\venv

# Limpar tudo e reinstalar
.\scripts\clean.ps1
npm install
cd apps\api && python -m venv venv && .\venv\Scripts\activate && pip install -r requirements.txt
```

---

## 🔍 Debug e Logs

### Frontend

```powershell
# Ver logs em tempo real
cd apps\web
npm run dev

# Build de produção
npm run build

# Executar build
npm start

# Lint
npm run lint

# Ver erros de TypeScript
npx tsc --noEmit
```

### Backend

```powershell
cd apps\api
.\venv\Scripts\activate

# Executar com reload automático
uvicorn main:app --reload

# Executar em modo debug
python -m debugpy --listen 5678 --wait-for-client main.py

# Ver logs detalhados
uvicorn main:app --reload --log-level debug

# Testar endpoint específico
python -c "import requests; print(requests.get('http://localhost:8000/health').json())"
```

---

## 🧪 Testes

### Frontend

```powershell
cd apps\web

# Executar testes (quando implementados)
npm test

# Testes com coverage
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

### Backend

```powershell
cd apps\api
.\venv\Scripts\activate

# Executar testes (quando implementados)
pytest

# Com coverage
pytest --cov

# Teste específico
pytest tests/test_overview.py

# Ver relatório de coverage
pytest --cov --cov-report=html
```

---

## 🔧 Ferramentas de Desenvolvimento

### Next.js

```powershell
cd apps\web

# Analisar bundle
npm run build
npx @next/bundle-analyzer

# Verificar tipos TypeScript
npx tsc --noEmit

# Format com Prettier (quando configurado)
npx prettier --write .
```

### FastAPI

```powershell
cd apps\api
.\venv\Scripts\activate

# Gerar documentação
python -c "from main import app; import json; print(json.dumps(app.openapi()))" > openapi.json

# Formatar código com Black (instalar: pip install black)
black .

# Lint com Flake8 (instalar: pip install flake8)
flake8 .

# Type checking com mypy (instalar: pip install mypy)
mypy .
```

---

## 🗄️ Firebase

### Firebase CLI

```powershell
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar projeto
firebase init

# Deploy (quando configurado)
firebase deploy

# Ver logs
firebase functions:log

# Emuladores locais
firebase emulators:start
```

### Firestore

```powershell
# Backup de dados (via Firebase CLI)
firebase firestore:export backup/

# Restaurar dados
firebase firestore:import backup/

# Limpar coleção (cuidado!)
# Use o console Firebase ou script Python
```

---

## 🐛 Solução de Problemas

### Porta em uso

```powershell
# Verificar o que está usando a porta
netstat -ano | findstr :3000  # Frontend
netstat -ano | findstr :8000  # Backend

# Matar processo
taskkill /PID <PID> /F
```

### Erro "Module not found"

```powershell
# Limpar e reinstalar
rm -r node_modules
rm package-lock.json
npm install
```

### Erro no Python venv

```powershell
cd apps\api
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Cache do Turbo corrompido

```powershell
rm -r .turbo
npm run build
```

### Hot reload não funciona

```powershell
# Next.js - Reiniciar com cache limpo
Remove-Item -Recurse -Force .next
npm run dev

# FastAPI - Verificar se --reload está ativo
uvicorn main:app --reload --port 8000
```

---

## 📊 Monitoramento

### Ver uso de memória

```powershell
# Node.js
node --inspect apps/web/node_modules/.bin/next dev

# Python
python -m memory_profiler apps/api/main.py
```

### Ver processos ativos

```powershell
# Ver processos Node
Get-Process node

# Ver processos Python
Get-Process python

# Ver todas as portas ativas
netstat -an | findstr LISTENING
```

---

## 🚀 Deploy

### Vercel (Frontend)

```powershell
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd apps\web
vercel

# Deploy para produção
vercel --prod
```

### Render/Railway (Backend)

```powershell
# Criar Dockerfile
# Configurar no dashboard Render/Railway
# Push para git → Auto deploy
```

---

## 📝 Git Commands

```powershell
# Status
git status

# Add tudo
git add .

# Commit
git commit -m "feat: Nova funcionalidade"

# Push
git push origin main

# Criar branch
git checkout -b feature/nova-feature

# Ver histórico
git log --oneline --graph

# Desfazer último commit (mantém mudanças)
git reset --soft HEAD~1

# Desfazer mudanças não commitadas
git checkout -- .
```

---

## 🎨 Tailwind

```powershell
cd apps\web

# Gerar tipos Tailwind (quando configurado)
npx tailwindcss-language-server --stdio

# Ver classes usadas
npx tailwind-config-viewer

# Build CSS
npx tailwindcss -i ./src/styles/globals.css -o ./dist/output.css
```

---

## 📦 Build de Produção

```powershell
# Build completo
npm run build

# Build apenas frontend
cd apps\web
npm run build

# Build com análise
cd apps\web
ANALYZE=true npm run build
```

---

## 🔐 Variáveis de Ambiente

```powershell
# Listar variáveis (Windows)
Get-ChildItem Env:

# Ver variável específica
$env:NODE_ENV

# Definir variável temporária
$env:NODE_ENV="production"

# Carregar de arquivo .env (Node.js)
# Já configurado com dotenv

# Python
python -c "from dotenv import load_dotenv; load_dotenv(); import os; print(os.getenv('FIREBASE_PROJECT_ID'))"
```

---

## 🎯 Comandos por Cenário

### Primeiro Setup
```powershell
npm install
cd apps\web && npm install && cd ..\..
cd apps\api && python -m venv venv && .\venv\Scripts\activate && pip install -r requirements.txt
# Configurar .env files
npm run dev
```

### Desenvolvimento Diário
```powershell
npm run dev
# Ou em terminais separados:
# Terminal 1: npm run web:dev
# Terminal 2: npm run api:dev
```

### Adicionar Feature
```powershell
git checkout -b feature/minha-feature
# Desenvolver...
git add .
git commit -m "feat: Minha feature"
git push origin feature/minha-feature
# Criar PR
```

### Atualizar Dependências
```powershell
npm outdated
npm update
cd apps\api && pip list --outdated
```

### Preparar para Deploy
```powershell
npm run build
npm run lint
# Testar localmente
npm start
```

---

## 💡 Dicas

### Aliases Úteis (PowerShell Profile)

Adicione ao seu `$PROFILE`:

```powershell
# Editar: notepad $PROFILE

function dev-finance { cd "C:\Users\Eduardo\Desktop\web_de_finanças"; npm run dev }
function web-finance { cd "C:\Users\Eduardo\Desktop\web_de_finanças\apps\web"; npm run dev }
function api-finance { cd "C:\Users\Eduardo\Desktop\web_de_finanças\apps\api"; .\venv\Scripts\activate; python main.py }
function clean-finance { cd "C:\Users\Eduardo\Desktop\web_de_finanças"; .\scripts\clean.ps1 }

Set-Alias finance dev-finance
```

Agora pode usar: `finance` para executar tudo!

---

## 📚 Recursos

- **Next.js**: https://nextjs.org/docs
- **FastAPI**: https://fastapi.tiangolo.com
- **Firebase**: https://firebase.google.com/docs
- **Tailwind**: https://tailwindcss.com/docs
- **Turbo**: https://turbo.build/repo/docs

---

**Última atualização**: Novembro 2025  
**Versão**: 1.0.0

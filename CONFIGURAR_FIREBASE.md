# 🔥 Guia de Configuração do Firebase

## Passo 1: Criar Projeto Firebase

1. Acesse: https://console.firebase.google.com/
2. Clique em **"Adicionar projeto"**
3. Nome do projeto: `financas-pessoais` (ou o nome que preferir)
4. **Desabilite** Google Analytics (não necessário para este projeto)
5. Clique em **"Criar projeto"**

## Passo 2: Configurar Authentication

1. No menu lateral, clique em **"Authentication"**
2. Clique em **"Começar"**
3. Na aba **"Sign-in method"**, habilite:
   - ✅ **E-mail/senha** (clique e ative)
   - Opcional: Google, se quiser login social

## Passo 3: Configurar Firestore Database

1. No menu lateral, clique em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Escolha o modo: **"Começar no modo de teste"** (pode ajustar regras depois)
4. Selecione a localização: **`southamerica-east1` (São Paulo)**
5. Clique em **"Ativar"**

## Passo 4: Configurar Storage

1. No menu lateral, clique em **"Storage"**
2. Clique em **"Começar"**
3. Aceite as regras padrão
4. Escolha a mesma localização: **`southamerica-east1`**
5. Clique em **"Concluído"**

## Passo 5: Obter Credenciais Frontend (Web)

1. No menu lateral, clique no ícone de **engrenagem ⚙️** → **"Configurações do projeto"**
2. Role até **"Seus aplicativos"**
3. Clique no ícone **Web** `</>`
4. Apelido do app: `Web App Finanças`
5. **NÃO** marque Firebase Hosting
6. Clique em **"Registrar app"**
7. Copie o objeto `firebaseConfig`

Vai aparecer algo assim:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "financas-pessoais.firebaseapp.com",
  projectId: "financas-pessoais",
  storageBucket: "financas-pessoais.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

8. **Cole esses valores no arquivo** `apps/web/.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=financas-pessoais.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=financas-pessoais
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=financas-pessoais.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Passo 6: Obter Credenciais Backend (Service Account)

1. Ainda nas **"Configurações do projeto"**
2. Clique na aba **"Contas de serviço"**
3. Clique em **"Gerar nova chave privada"**
4. Clique em **"Gerar chave"**
5. Um arquivo JSON será baixado (ex: `financas-pessoais-firebase-adminsdk-xxxxx.json`)

6. **Salve esse arquivo** em: `apps/api/firebase-credentials.json`

7. **Configure a variável de ambiente** no arquivo `apps/api/.env`:

```env
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
FIREBASE_PROJECT_ID=financas-pessoais
```

## Passo 7: Configurar Regras de Segurança (Importante!)

### Firestore Rules

1. Vá em **Firestore Database** → aba **"Regras"**
2. Cole estas regras:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários só podem acessar seus próprios dados
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Transações do usuário
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Orçamentos do usuário
    match /budgets/{budgetId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Metas do usuário
    match /goals/{goalId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

3. Clique em **"Publicar"**

### Storage Rules

1. Vá em **Storage** → aba **"Regras"**
2. Cole estas regras:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Clique em **"Publicar"**

## ✅ Verificação

Depois de configurar tudo:

1. **Reinicie o servidor Next.js**:
   ```bash
   # Pressione Ctrl+C no terminal
   # Depois rode:
   npm run dev
   ```

2. **Não deve mais aparecer** o aviso: "⚠️ Firebase não configurado"

3. **Teste o cadastro**:
   - Vá em http://localhost:3002
   - Crie uma conta com e-mail/senha
   - Faça login

## 🎯 Estrutura de Collections no Firestore

O Firebase vai criar automaticamente estas collections quando você adicionar dados:

```
users/
  {userId}/
    profile: { name, email, createdAt }
    
transactions/
  {transactionId}: { userId, amount, category, date, ... }
  
budgets/
  {budgetId}: { userId, category, limit, period, ... }
  
goals/
  {goalId}: { userId, name, target, current, deadline, ... }

accounts/
  {accountId}: { userId, name, type, balance, ... }
```

## 🚀 Próximos Passos Depois do Firebase

1. **Testar autenticação** no frontend
2. **Conectar API** ao Firebase Admin SDK
3. **Integrar formulários** com Firestore (salvar dados reais)
4. **Adicionar gráficos** (Tremor/Recharts)
5. **Implementar página de Settings**

---

**Dúvidas?** Consulte a documentação oficial: https://firebase.google.com/docs

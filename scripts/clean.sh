#!/bin/bash

# 🧹 Script de Limpeza
# Remove node_modules, cache, e arquivos temporários

echo "🧹 Limpando projeto..."

# Remover node_modules
echo "📦 Removendo node_modules..."
rm -rf node_modules
rm -rf apps/web/node_modules
rm -rf packages/*/node_modules

# Remover cache Next.js
echo "⚡ Limpando cache Next.js..."
rm -rf apps/web/.next
rm -rf apps/web/out

# Remover cache Turbo
echo "🔄 Limpando cache Turbo..."
rm -rf .turbo

# Remover Python cache
echo "🐍 Limpando cache Python..."
rm -rf apps/api/__pycache__
rm -rf apps/api/**/__pycache__
rm -rf apps/api/*.pyc
rm -rf apps/api/**/*.pyc

# Remover venv
echo "🐍 Removendo venv Python..."
rm -rf apps/api/venv
rm -rf apps/api/env

# Remover logs
echo "📝 Removendo logs..."
rm -rf *.log
rm -rf apps/**/*.log

echo "✅ Limpeza concluída!"
echo ""
echo "Para reinstalar dependências:"
echo "  npm install"
echo "  cd apps/api && python -m venv venv && pip install -r requirements.txt"

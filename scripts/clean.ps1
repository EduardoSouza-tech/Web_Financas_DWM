# 🧹 Script de Limpeza - Windows
# Remove node_modules, cache, e arquivos temporários

Write-Host "🧹 Limpando projeto..." -ForegroundColor Cyan

# Remover node_modules
Write-Host "📦 Removendo node_modules..." -ForegroundColor Yellow
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue node_modules
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue apps\web\node_modules
Get-ChildItem -Path packages -Directory | ForEach-Object {
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "$($_.FullName)\node_modules"
}

# Remover cache Next.js
Write-Host "⚡ Limpando cache Next.js..." -ForegroundColor Yellow
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue apps\web\.next
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue apps\web\out

# Remover cache Turbo
Write-Host "🔄 Limpando cache Turbo..." -ForegroundColor Yellow
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue .turbo

# Remover Python cache
Write-Host "🐍 Limpando cache Python..." -ForegroundColor Yellow
Get-ChildItem -Path apps\api -Filter __pycache__ -Recurse -Directory | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path apps\api -Filter *.pyc -Recurse -File | Remove-Item -Force -ErrorAction SilentlyContinue

# Remover venv
Write-Host "🐍 Removendo venv Python..." -ForegroundColor Yellow
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue apps\api\venv
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue apps\api\env

# Remover logs
Write-Host "📝 Removendo logs..." -ForegroundColor Yellow
Get-ChildItem -Path . -Filter *.log -Recurse -File | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ Limpeza concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "Para reinstalar dependências:" -ForegroundColor Cyan
Write-Host "  npm install" -ForegroundColor White
Write-Host "  cd apps\api; python -m venv venv; .\venv\Scripts\activate; pip install -r requirements.txt" -ForegroundColor White

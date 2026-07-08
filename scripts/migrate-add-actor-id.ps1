# Скрипт для добавления колонки actor_id в таблицу notifications
# Запустить: powershell -ExecutionPolicy Bypass -File scripts/migrate-add-actor-id.ps1
#
# Если скрипт не сработал — открой Supabase Dashboard → SQL Editor и вставь SQL из supabase/migration.sql

$envPath = Join-Path $PSScriptRoot "..\.env.local"
$envContent = Get-Content $envPath -Raw

$url = ""
$serviceKey = ""

foreach ($line in $envContent -split "`n") {
  $line = $line.Trim()
  if ($line.StartsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
    $url = $line.Substring("NEXT_PUBLIC_SUPABASE_URL=".Length)
  }
  if ($line.StartsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
    $serviceKey = $line.Substring("SUPABASE_SERVICE_ROLE_KEY=".Length)
  }
}

if (-not $url -or -not $serviceKey) {
  Write-Host "❌ Не удалось найти URL или SERVICE_KEY в .env.local"
  exit 1
}

$sql = @"
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);
"@

$body = @{ query = $sql } | ConvertTo-Json

# Extract project ref from URL: https://{ref}.supabase.co
$ref = $url -replace 'https://','' -replace '\.supabase\.co.*',''

Write-Host "🔧 Добавляем actor_id в таблицу notifications проекта $ref ..."

try {
  # Try Supabase Management API first
  $headers = @{
    "Authorization" = "Bearer $serviceKey"
    "Content-Type" = "application/json"
  }
  $mgmtUrl = "https://api.supabase.com/v1/projects/$ref/database/query"
  $response = Invoke-RestMethod -Uri $mgmtUrl -Method Post -Headers $headers -Body $body -ErrorAction Stop
  Write-Host "✅ Колонка actor_id добавлена!"
} catch {
  Write-Host "⚠️ Management API недоступен (нужен sbp_ токен)."
  Write-Host "👉 Открой https://supabase.com/dashboard/project/$ref/sql/new"
  Write-Host "👉 Вставь и выполни:"
  Write-Host ""
  Write-Host $sql
}

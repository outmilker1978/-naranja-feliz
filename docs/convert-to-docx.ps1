# Скрипт для конвертации .md документации в .docx
# Требует установленный Microsoft Word
# Запуск: powershell -ExecutionPolicy Bypass -File convert-to-docx.ps1

$docsDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Создаём HTML-версии .md файлов с базовым стилем
$style = @"
<style>
body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #333; margin: 2cm; }
h1 { font-size: 20pt; color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 6px; margin-top: 24px; }
h2 { font-size: 16pt; color: #ea580c; margin-top: 20px; }
h3 { font-size: 13pt; color: #333; margin-top: 16px; }
p { margin: 6px 0; }
table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 10pt; }
th { background-color: #fff7ed; color: #ea580c; padding: 6px 10px; border: 1px solid #fed7aa; text-align: left; }
td { padding: 4px 10px; border: 1px solid #fed7aa; }
code { background-color: #f5f5f5; padding: 1px 4px; border-radius: 3px; font-family: 'Consolas', monospace; font-size: 10pt; }
pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; border: 1px solid #e5e5e5; font-family: 'Consolas', monospace; font-size: 9pt; overflow-x: auto; }
ul, ol { margin: 6px 0; padding-left: 24px; }
li { margin: 3px 0; }
strong { color: #222; }
blockquote { border-left: 4px solid #ea580c; padding-left: 12px; margin: 12px 0; color: #666; }
</style>
"@

function Convert-MarkdownToHtml {
    param([string]$mdPath)
    $md = Get-Content -Path $mdPath -Raw
    # Простейшая конвертация (достаточно для наших целей)
    $html = $md
    
    # Экранирование HTML
    $html = [System.Web.HttpUtility]::HtmlEncode($html)
    
    # Восстанавливаем теги, которые были в Markdown
    # Код в обратных кавычках
    $html = $html -replace '`([^`]+)`', '<code>$1</code>'
    
    # Блоки кода
    $html = $html -replace '(?s)```(\w*)\n(.*?)```', '<pre><code>$2</code></pre>'
    
    # Заголовки
    $html = $html -replace '(?m)^### (.+)', '<h3>$1</h3>'
    $html = $html -replace '(?m)^## (.+)', '<h2>$1</h2>'
    $html = $html -replace '(?m)^# (.+)', '<h1>$1</h1>'
    
    # Жирный и курсив
    $html = $html -replace '\*\*(.+?)\*\*', '<strong>$1</strong>'
    $html = $html -replace '\*(.+?)\*', '<em>$1</em>'
    
    # Ссылки
    $html = $html -replace '\[(.+?)\]\((.+?)\)', '<a href="$2">$1</a>'
    
    # Горизонтальные линии
    $html = $html -replace '(?m)^---+', '<hr/>'
    
    # Списки
    $html = $html -replace '(?m)^- (.+)', '<li>$1</li>'
    $html = $html -replace '(?m)^\d+\. (.+)', '<li>$1</li>'
    
    # Таблицы (простейшая обработка)
    $html = $html -replace '(?m)^\|(.+)\|$', '<tr><td>$1</td></tr>'
    $html = $html -replace '<tr><td>[- :|]+</td></tr>', ''
    $html = $html -replace '\|', '</td><td>'
    
    # Абзацы (двойной перенос строки)
    $html = $html -replace '(?m)^(.+)$', '<p>$1</p>'
    
    # Чистка лишних <p> вокруг <h1>, <h2>, <h3>, <li>, <pre>, <table>, <hr/>
    $html = $html -replace '<p><(/?[^>]+)></p>', '<$1>'
    
    # Объединение последовательных <li>
    $html = $html -replace '(?s)((?:<li>.*?</li>\s*)+)', '<ul>$1</ul>'
    
    return "<html><head><meta charset='utf-8'>$style</head><body>$html</body></html>"
}

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false

    $files = @(
        @{md='USER_GUIDE.md'; docx='Руководство пользователя Naranja Feliz.docx'}
        @{md='ADMIN_GUIDE.md'; docx='Руководство администратора Naranja Feliz.docx'}
    )

    foreach ($f in $files) {
        $mdPath = Join-Path $docsDir $f.md
        $docxPath = Join-Path $docsDir $f.docx
        $html = Convert-MarkdownToHtml $mdPath
        
        $doc = $word.Documents.Add()
        $selection = $word.Selection
        
        # Вставляем HTML
        $selection.InsertFile($mdPath)  # fallback
        # Альтернатива — сохраняем временный HTML и открываем
        $tempHtml = Join-Path $env:TEMP "temp_doc.html"
        Set-Content -Path $tempHtml -Value $html -Encoding UTF8
        
        # Вставка через Range
        $range = $doc.Range()
        $range.InsertFile($tempHtml, [ref]0, [ref]$false, [ref]$false)
        
        # Удаляем первый пустой абзац
        if ($doc.Paragraphs.Count -gt 1) {
            $doc.Paragraphs(1).Range.Delete()
        }
        
        $doc.SaveAs([System.IO.Path]::GetFullPath($docxPath), [Microsoft.Office.Interop.Word.WdSaveFormat]::wdFormatDocumentDefault)
        $doc.Close()
        Remove-Item $tempHtml -ErrorAction SilentlyContinue
        Write-Host "Создан: $docxPath"
    }

    $word.Quit()
    Write-Host "Готово! .docx файлы созданы в папке docs/"
}
catch {
    Write-Host "Ошибка: $_"
    Write-Host "Убедись, что Microsoft Word установлен."
    Write-Host ""
    Write-Host "Ручной способ:"
    Write-Host "1. Открой USER_GUIDE.md в Word (ПКМ → Открыть с помощью → Word)"
    Write-Host "2. Файл → Сохранить как → .docx"
    Write-Host "3. Повтори для ADMIN_GUIDE.md"
}

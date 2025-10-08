$file = "lib\database\SeparatedDatabaseManager.ts"
$content = Get-Content $file -Raw

# Replace prepare().get() with queryOne
$content = $content -replace '(\s+)const (\w+) = db\.prepare\(`\s*([^`]+)`\)\.get\(\) as ([^;]+);', '$1const $2 = this.queryOne(db, `$3`) as $4 || null;'
$content = $content -replace 'db\.prepare\(`([^`]+)`\)\.get\(\)', 'this.queryOne(db, `$1`)'

# Replace prepare().all() with queryAll  
$content = $content -replace 'db\.prepare\(`([^`]+)`\)\.all\(([^)]*)\)', 'this.queryAll(db, `$1`, [$2])'
$content = $content -replace 'db\.prepare\(`([^`]+)`\)\.all\(\)', 'this.queryAll(db, `$1`)'

# Save
$content | Set-Content $file -NoNewline

Write-Host "Batch replacements complete!" -ForegroundColor Green
Write-Host "- Replaced prepare().get() with queryOne" -ForegroundColor Cyan
Write-Host "- Replaced prepare().all() with queryAll" -ForegroundColor Cyan








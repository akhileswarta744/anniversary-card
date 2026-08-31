# PowerShell script to host LOVE-OS and create a public internet link
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  ⚡ LOVE-OS v5.0 // INTER-STATE LIVE P2P LAUNCHER ⚡" -ForegroundColor Yellow
Write-Host "  Connecting Karnataka (KA) <--> Kerala (KL)" -ForegroundColor Magenta
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. Start Python Local Server in background
$serverJob = Start-Job -ScriptBlock {
    Set-Location "C:\Users\akhil\.gemini\antigravity\scratch\anniversary-card"
    python -m http.server 8080
}
Write-Host "`n✔ Local server started on port 8080" -ForegroundColor Green

Write-Host "`n⚡ Creating secure public HTTPS tunnel for your partner in Kerala..." -ForegroundColor Yellow
Write-Host "💡 Please wait a few seconds while the public URL generates..." -ForegroundColor Gray

# 2. Run localtunnel
npx --yes localtunnel --port 8080

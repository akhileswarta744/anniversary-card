@echo off
title LOVE-OS v5.0 // KA to KL Live Connector
color 0b
echo =========================================================
echo   LOVE-OS v5.0 // LIVE INTER-STATE CONNECTION (KA to KL)
echo =========================================================
echo.
cd /d "C:\Users\akhil\.gemini\antigravity\scratch\anniversary-card"

start /b python -m http.server 8080 >nul 2>&1
echo [1/2] Local server started.
echo [2/2] Generating secure public link for her phone in Kerala...
echo.
echo =========================================================
echo  Send the URL displayed below to your partner on WhatsApp!
echo =========================================================
echo.
npx --yes localtunnel --port 8080
pause

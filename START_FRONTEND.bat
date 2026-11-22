@echo off
title NexusChat SKMD · React Frontend (Port 5173)
cd /d "%~dp0frontend"
if not exist node_modules (
  echo Installing React Frontend Dependencies...
  call npm install
)
echo Starting NexusChat React App...
call npm run dev
pause

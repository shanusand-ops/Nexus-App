@echo off
title NexusChat SKMD · Backend Server (Port 4000)
cd /d "%~dp0backend"
if not exist node_modules (
  echo Installing Backend Dependencies...
  call npm install
)
echo Starting NexusChat Backend Server...
call npm start
pause

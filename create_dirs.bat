@echo off
setlocal enabledelayedexpansion

cd /d "C:\JonGitHub\LegoPieceFinder"

mkdir src 2>nul
mkdir src\environments 2>nul
mkdir src\assets 2>nul
mkdir src\app 2>nul
mkdir src\app\services 2>nul
mkdir src\app\components 2>nul
mkdir src\app\components\home 2>nul
mkdir src\app\components\image-capture 2>nul
mkdir src\app\components\result-display 2>nul

echo All directories created successfully!
pause

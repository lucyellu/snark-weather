@echo off
setlocal
set DIR=%~dp0
set API_PORT=8787
set WEB_PORT=5173
cd /d "%DIR%"

rem Load DEEPSEEK_API_KEY etc. from .env if present
if exist "%DIR%.env" (
    for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%DIR%.env") do if not "%%B"=="" set "%%A=%%B"
)

netstat -ano | findstr ":%API_PORT% " | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo Starting API server on %API_PORT%...
    if not exist "%DIR%artifacts\api-server\dist\index.mjs" call pnpm --filter @workspace/api-server run build
    start /min "SNARK API" cmd /c "cd /d %DIR%artifacts\api-server && set PORT=%API_PORT%&& set NODE_ENV=development&& node --enable-source-maps dist\index.mjs"
)

netstat -ano | findstr ":%WEB_PORT% " | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo Starting web app on %WEB_PORT%...
    start /min "SNARK Web" cmd /c "cd /d %DIR%artifacts\weather-app && set PORT=%WEB_PORT%&& set BASE_PATH=/&& pnpm run dev"
    timeout /t 5 /nobreak >nul
)

set CHROME=
for %%P in (
    "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
    "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
    "%LocalAppData%\Google\Chrome\Application\chrome.exe"
) do (
    if exist %%P set CHROME=%%P
)

if defined CHROME (
    start "" %CHROME% --app="http://localhost:%WEB_PORT%/"
) else (
    start "" "http://localhost:%WEB_PORT%/"
)
endlocal

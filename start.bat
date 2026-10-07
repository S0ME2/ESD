@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto missing_node
where npm >nul 2>nul
if errorlevel 1 goto missing_node
node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 22 ? 0 : 1)"
if errorlevel 1 goto old_node

REM Install on first start, or after the dependency manifests change.
node -e "const fs=require('node:fs'); const lock='node_modules/.package-lock.json'; process.exit(!fs.existsSync(lock) || ['package.json','package-lock.json'].some(p => fs.statSync(p).mtimeMs > fs.statSync(lock).mtimeMs) ? 1 : 0)"
if errorlevel 1 (
  call npm ci
  if errorlevel 1 exit /b 1
)

call npm start -- %*
exit /b %errorlevel%

:missing_node
echo Install Node.js 22 or newer with npm, then run this script again. 1>&2
exit /b 1

:old_node
echo Node.js 22 or newer is required. 1>&2
exit /b 1

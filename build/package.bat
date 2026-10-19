@echo off
setlocal

rem Windows wrapper for package.sh, runs the build through Git Bash
rem usage: build\package.bat chrome^|firefox [themes]

set "browser=%~1"
if "%browser%"=="" (
  echo Specify target browser
  echo chrome, firefox
  exit /b 1
)

set "bash="
for %%p in (
  "%ProgramFiles%\Git\bin\bash.exe"
  "%ProgramFiles(x86)%\Git\bin\bash.exe"
  "%LocalAppData%\Programs\Git\bin\bash.exe"
) do if not defined bash if exist %%p set "bash=%%~p"

if not defined bash (
  for /f "delims=" %%p in ('where git 2^>nul') do if not defined bash (
    if exist "%%~dpp..\bin\bash.exe" set "bash=%%~dpp..\bin\bash.exe"
  )
)

if not defined bash (
  echo Git Bash not found, install Git for Windows: https://git-scm.com/download/win
  exit /b 1
)

cd /d "%~dp0"

rem without node, route node/npm/npx to bun through the shims
where node >nul 2>nul || (
  where bun >nul 2>nul || (
    echo node or bun is required
    exit /b 1
  )
  echo node not found, building with bun
  set "PATH=%~dp0bun-shims;%PATH%"
)

rem "themes" only rebuilds the themes folder, skipping vendor and the zip
if /i "%~2"=="themes" (
  "%bash%" themes/build.sh %browser%
  if exist "..\dist\markdown-viewer" (
    xcopy /e /i /y /q "..\themes" "..\dist\markdown-viewer\themes" >nul
  )
) else (
  "%bash%" package.sh %browser%
)

exit /b %errorlevel%

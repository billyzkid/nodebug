@echo off
setlocal

set NODE=node.exe
set NODEINSPECTOR=%~dp0..\node_modules\.bin\node-inspector.cmd
set CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe
set WEB_HOST=localhost
set WEB_PORT=8080

start /min cmd /c "%NODEINSPECTOR% --web-host=%WEB_HOST% --web-port=%WEB_PORT%" ^& pause
start /min cmd /c "%NODE% --debug-brk %*" ^& pause
start "%CHROME%" "http://%WEB_HOST%:%WEB_PORT%/"

endlocal

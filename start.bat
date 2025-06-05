@echo off
REM start.bat - Script to run your chat application with restart capability

echo ================================
echo    Chat Application Starter
echo ================================
echo.
echo Commands:
echo   - Ctrl+C: Stop server
echo   - Type 'restart' in new terminal to restart
echo   - Type 'kill' in new terminal to force kill
echo.

:start
echo Starting chat server...
echo.

REM Run the Node.js server
node server.js

REM If we reach here, the server stopped
echo.
echo Server stopped.
echo.

REM Ask if user wants to restart
set /p restart="Restart server? (y/n): "
if /i "%restart%"=="y" goto start
if /i "%restart%"=="yes" goto start

echo.
echo Goodbye!
pause
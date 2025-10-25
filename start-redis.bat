@echo off
echo Starting Redis for CineHub...
echo.

REM Start Redis in WSL using the Ubuntu distro
echo Starting Redis server in WSL...
wsl -d Ubuntu -- sudo service redis-server start

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Test Redis connection
echo Testing Redis connection...
wsl -d Ubuntu -- redis-cli ping

echo.
echo If you see "PONG" above, Redis is running!
echo You can now start your backend server.
echo.
pause


@REM In Ubuntu terminal run:
@REM sudo service redis-server start
@REM then run:
@REM sudo service redis-server status
@REM then run:
@REM start-redis.bat in cmd
@echo off
title Flight Strips, a mod for Airside
cd /d "%~dp0"
dotnet run --project FlightStrips.csproj -c Release
if errorlevel 1 (
    echo.
    echo Failed to start. Make sure the .NET 10 SDK / Desktop Runtime is installed.
    pause
)

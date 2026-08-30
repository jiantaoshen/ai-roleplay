$root = $PSScriptRoot

Write-Host "Starting AI Roleplay..." -ForegroundColor Cyan

# FastAPI
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$root\ai'; uv run uvicorn main:app --reload --port 8000"
)

# ASP.NET Core
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$root\backend\AiRoleplay.Api'; dotnet watch"
)

# React
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$root\frontend'; npm run dev"
)

Write-Host "All services started." -ForegroundColor Green
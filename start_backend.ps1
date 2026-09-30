Write-Host "Starting Synthetic Data Platform API on http://127.0.0.1:8000 ..." -ForegroundColor Green
& .venv\Scripts\uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

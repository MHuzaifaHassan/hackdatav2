Write-Host "Running Synthetic Data Platform Test Suite..." -ForegroundColor Cyan
& .venv\Scripts\pytest -v
if ($LASTEXITCODE -eq 0) {
    Write-Host "`nAll test gates PASSED successfully!" -ForegroundColor Green
} else {
    Write-Host "`nTest gate FAILURE." -ForegroundColor Red
}

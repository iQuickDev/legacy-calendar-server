$bypassKey = "super-secret-bypass-key"
$user = "test_user_$(Get-Random)"
$pass = "securePassword123"

Write-Host "Creating User..."
$userRes = Invoke-RestMethod -Uri "http://localhost:3000/users" -Method Post -Body (@{ username = $user; password = $pass } | ConvertTo-Json) -Headers @{ "X-Bypass" = $bypassKey } -ContentType "application/json"

Write-Host "Logging in..."
$loginRes = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method Post -Body (@{ username = $user; password = $pass } | ConvertTo-Json) -Headers @{ "X-Bypass" = $bypassKey } -ContentType "application/json"
$token = $loginRes.access_token

Write-Host "Creating Event without endTime..."
$eventPayload = @{
    title     = "Optional EndTime Test"
    startTime = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json
$eventRes = Invoke-RestMethod -Uri "http://localhost:3000/events" -Method Post -Body $eventPayload -Headers @{ Authorization = "Bearer $token"; "X-Bypass" = $bypassKey } -ContentType "application/json"

if ($null -eq $eventRes.endTime) {
    Write-Host "SUCCESS: Event created without endTime (endTime is null)"
}
else {
    Write-Host "FAILURE: endTime is NOT null: $($eventRes.endTime)"
}

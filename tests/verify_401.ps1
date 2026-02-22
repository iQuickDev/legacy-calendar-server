$user = "auth_test_user_$(Get-Random)"
$pass = "securePassword123"

Write-Host "1. Testing UNAUTHORIZED access to /auth/profile (No Token)"
try {
    Invoke-RestMethod -Uri "http://localhost:3000/auth/profile" -Method Post -ErrorAction Stop
    Write-Error "FAILURE: Profile accessed without token!"
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "SUCCESS: Request blocked as expected (401 Unauthorized)."
    }
    else {
        Write-Error "FAILURE: Unexpected status code: $($_.Exception.Response.StatusCode)"
    }
}

Write-Host "`n2. Testing UNAUTHORIZED access to /auth/profile (Invalid Token)"
try {
    Invoke-RestMethod -Uri "http://localhost:3000/auth/profile" -Method Post -Headers @{ Authorization = "Bearer invalid-token-here" } -ErrorAction Stop
    Write-Error "FAILURE: Profile accessed with invalid token!"
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "SUCCESS: Request blocked as expected (401 Unauthorized)."
    }
    else {
        Write-Error "FAILURE: Unexpected status code: $($_.Exception.Response.StatusCode)"
    }
}

Write-Host "`n3. Testing SUCCESSFUL login and profile access"
Write-Host "Creating user: $user"
$createPayload = @{ username = $user; password = $pass } | ConvertTo-Json
$createRes = Invoke-RestMethod -Uri "http://localhost:3000/users" -Method Post -Body $createPayload -ContentType "application/json" -Headers @{ "X-Bypass" = "password" } -ErrorAction Stop

Write-Host "Logging in..."
$loginPayload = @{ username = $user; password = $pass } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method Post -Body $loginPayload -ContentType "application/json" -ErrorAction Stop
$token = $loginRes.access_token

Write-Host "Accessing profile..."
$profileRes = Invoke-RestMethod -Uri "http://localhost:3000/auth/profile" -Method Post -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop

if ($profileRes.username -eq $user) {
    Write-Host "SUCCESS: Profile accessed with valid token."
}
else {
    Write-Error "FAILURE: Username mismatch."
}

Write-Host "`n4. Verification complete!"

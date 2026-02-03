$user = "auth_test_user_$(Get-Random)"
$pass = "securePassword123"

Write-Host "1. Creating user: $user"
$createPayload = @{ username = $user; password = $pass } | ConvertTo-Json
$createRes = Invoke-RestMethod -Uri "http://localhost:3000/users" -Method Post -Body $createPayload -ContentType "application/json" -ErrorAction Stop
Write-Host "User created. ID: $($createRes.id)"

Write-Host "`n2. Logging in..."
$loginPayload = @{ username = $user; password = $pass } | ConvertTo-Json
try {
    $loginRes = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method Post -Body $loginPayload -ContentType "application/json" -ErrorAction Stop
    $token = $loginRes.access_token
    Write-Host "Login successful. Token acquired."
} catch {
    Write-Error "Login failed: $($_.Exception.Message)"
    exit 1
}

Write-Host "`n3. Accessing protected profile..."
try {
    $profileRes = Invoke-RestMethod -Uri "http://localhost:3000/auth/profile" -Method Post -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop
    Write-Host "Profile accessed. User from token: $($profileRes.username)"
} catch {
    Write-Error "Profile access failed: $($_.Exception.Message)"
    exit 1
}

if ($profileRes.username -eq $user) {
    Write-Host "`nSUCCESS: Authentication flow verified!"
} else {
    Write-Error "`nFAILURE: Username mismatch."
}

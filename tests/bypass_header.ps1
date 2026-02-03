$user = "bypass_test_user_$(Get-Random)"
$pass = "securePassword123"
$bypassKey = "super-secret-bypass-key"

Write-Host "1. Testing user creation WITHOUT X-Bypass header (Expect Failure)"
$createPayload = @{ username = $user; password = $pass } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "http://localhost:3000/users" -Method Post -Body $createPayload -ContentType "application/json" -ErrorAction Stop
    Write-Error "FAILURE: User creation succeeded without header!"
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "SUCCESS: Request blocked as expected (401 Unauthorized)."
    } else {
        Write-Error "FAILURE: Unexpected status code: $($_.Exception.Response.StatusCode)"
    }
}

Write-Host "`n2. Testing user creation WITH WRONG X-Bypass header (Expect Failure)"
try {
    Invoke-RestMethod -Uri "http://localhost:3000/users" -Method Post -Body $createPayload -ContentType "application/json" -Headers @{ "X-Bypass" = "wrong-key" } -ErrorAction Stop
    Write-Error "FAILURE: User creation succeeded with wrong header!"
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "SUCCESS: Request blocked as expected (401 Unauthorized)."
    } else {
        Write-Error "FAILURE: Unexpected status code: $($_.Exception.Response.StatusCode)"
    }
}

Write-Host "`n3. Testing user creation WITH CORRECT X-Bypass header (Expect Success)"
try {
    $createRes = Invoke-RestMethod -Uri "http://localhost:3000/users" -Method Post -Body $createPayload -ContentType "application/json" -Headers @{ "X-Bypass" = $bypassKey } -ErrorAction Stop
    $userId = $createRes.id
    Write-Host "SUCCESS: User created. ID: $userId"
} catch {
    Write-Error "FAILURE: User creation failed with correct header: $($_.Exception.Message)"
    exit 1
}

Write-Host "`n4. Testing user update WITH CORRECT X-Bypass header (Expect Success)"
$updatePayload = @{ username = "${user}_updated" } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "http://localhost:3000/users/$userId" -Method Patch -Body $updatePayload -ContentType "application/json" -Headers @{ "X-Bypass" = $bypassKey } -ErrorAction Stop
    Write-Host "SUCCESS: User updated."
} catch {
    Write-Error "FAILURE: User update failed: $($_.Exception.Message)"
}

Write-Host "`n5. Testing user deletion WITH CORRECT X-Bypass header (Expect Success)"
try {
    Invoke-RestMethod -Uri "http://localhost:3000/users/$userId" -Method Delete -Headers @{ "X-Bypass" = $bypassKey } -ErrorAction Stop
    Write-Host "SUCCESS: User deleted."
} catch {
    Write-Error "FAILURE: User deletion failed: $($_.Exception.Message)"
}

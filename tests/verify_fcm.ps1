
$baseUrl = "http://localhost:3000"

function Get-AuthToken($user, $pass) {
    $loginPayload = @{ username = $user; password = $pass } | ConvertTo-Json
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginPayload -ContentType "application/json"
    return $loginRes.access_token
}

function Subscribe-Token($token, $jwt) {
    $payload = @{ token = $token } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/notifications/subscribe" -Method Post -Headers @{ Authorization = "Bearer $jwt" } -Body $payload -ContentType "application/json"
}

# 1. Create two test users
$user1 = "fcm_test_1_$(Get-Random)"
$user2 = "fcm_test_2_$(Get-Random)"
$pass = "password123"

Write-Host "Creating users..."
Invoke-RestMethod -Uri "$baseUrl/users" -Method Post -Body (@{ username = $user1; password = $pass } | ConvertTo-Json) -ContentType "application/json"
Invoke-RestMethod -Uri "$baseUrl/users" -Method Post -Body (@{ username = $user2; password = $pass } | ConvertTo-Json) -ContentType "application/json"

$jwt1 = Get-AuthToken $user1 $pass
$jwt2 = Get-AuthToken $user2 $pass

# 2. Subscribe multiple tokens for User 1
Write-Host "Subscribing Token_A and Token_B for User 1..."
Subscribe-Token "Token_A" $jwt1
Subscribe-Token "Token_B" $jwt1

# 3. Transfer Token_A to User 2
Write-Host "Subscribing Token_A for User 2 (should transfer)..."
Subscribe-Token "Token_A" $jwt2

Write-Host "`nVerification calls completed. Check logs/DB to confirm state:"
Write-Host "User 1 should have: [Token_B]"
Write-Host "User 2 should have: [Token_A]"

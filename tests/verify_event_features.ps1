$hostUser = "host_$(Get-Random)"
$guestUser = "guest_$(Get-Random)"
$pass = "securePassword123"

# 1. Create Host
Write-Host "1. Creating Host: $hostUser"
$hostPayload = @{ username = $hostUser; password = $pass } | ConvertTo-Json
$hostRes = Invoke-RestMethod -Uri "http://localhost:3000/users" -Method Post -Body $hostPayload -Headers @{ "X-Bypass" = "password" } -ContentType "application/json" -ErrorAction Stop
$hostId = $hostRes.id
$hostToken = (Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method Post -Body $hostPayload -ContentType "application/json" -ErrorAction Stop).access_token

# 2. Create Event with Features
Write-Host "`n2. Creating Event with Features..."
$eventDate = (Get-Date).AddDays(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
$eventPayload = @{
    title = "Feature Party";
    description = "A party with features";
    location = "Party Location";
    startTime = $eventDate;
    endTime = $eventDate;
    hasFood = $true;
    hasAlcohol = $true;
    hasWeed = $false;
    hasSleep = $true
} | ConvertTo-Json
$eventRes = Invoke-RestMethod -Uri "http://localhost:3000/events" -Method Post -Body $eventPayload -Headers @{ Authorization = "Bearer $hostToken" } -ContentType "application/json" -ErrorAction Stop
$eventId = $eventRes.id

Write-Host "Event Created: $eventId"
Write-Host "Features: Food=$($eventRes.hasFood), Alcohol=$($eventRes.hasAlcohol), Weed=$($eventRes.hasWeed), Sleep=$($eventRes.hasSleep)"

if ($eventRes.hasFood -ne $true -or $eventRes.hasAlcohol -ne $true -or $eventRes.hasWeed -ne $false) {
    Write-Error "Event features do not match!"
    exit 1
}

# 3. Create Guest
Write-Host "`n3. Creating Guest: $guestUser"
$guestPayload = @{ username = $guestUser; password = $pass } | ConvertTo-Json
$guestRes = Invoke-RestMethod -Uri "http://localhost:3000/users" -Method Post -Body $guestPayload -Headers @{ "X-Bypass" = "password" } -ContentType "application/json" -ErrorAction Stop
$guestToken = (Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method Post -Body $guestPayload -ContentType "application/json" -ErrorAction Stop).access_token

# 4. Join Event with Features
Write-Host "`n4. Guest joining event with preferences..."
$participatePayload = @{
    wantsFood = $true;
    wantsAlcohol = $false;
    wantsWeed = $true;
    wantsSleep = $false
} | ConvertTo-Json

$joinRes = Invoke-RestMethod -Uri "http://localhost:3000/events/$eventId/join" -Method Post -Body $participatePayload -Headers @{ Authorization = "Bearer $guestToken" } -ContentType "application/json" -ErrorAction Stop
Write-Host "Joined event."

# 5. Verify Participation
Write-Host "`n5. Verifying Participation Details..."
$eventDetails = Invoke-RestMethod -Uri "http://localhost:3000/events/$eventId" -Method Get -Headers @{ Authorization = "Bearer $hostToken" } -ErrorAction Stop
$participant = $eventDetails.participants | Where-Object { $_.username -eq $guestUser }

if ($null -eq $participant) {
    Write-Error "Participant not found!"
    exit 1
}

Write-Host "Participant Preferences: Food=$($participant.wantsFood), Alcohol=$($participant.wantsAlcohol), Weed=$($participant.wantsWeed)"

if ($participant.wantsFood -ne $true -or $participant.wantsAlcohol -ne $false -or $participant.wantsWeed -ne $true) {
    Write-Error "Participant preferences do not match!"
    exit 1
}

Write-Host "`n--- Feature Verification Complete ---"

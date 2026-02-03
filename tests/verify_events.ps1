$hostUser = "host_$(Get-Random)"
$guestUser = "guest_$(Get-Random)"
$pass = "securePassword123"

# 1. Create Host
Write-Host "1. Creating Host: $hostUser"
$hostPayload = @{ username = $hostUser; password = $pass } | ConvertTo-Json
$hostRes = Invoke-RestMethod -Uri "http://localhost:3000/users" -Method Post -Body $hostPayload -ContentType "application/json" -ErrorAction Stop
$hostId = $hostRes.id

# 2. Login Host
Write-Host "`n2. Logging in Host..."
$loginPayload = @{ username = $hostUser; password = $pass } | ConvertTo-Json
$hostLogin = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method Post -Body $loginPayload -ContentType "application/json" -ErrorAction Stop
$hostToken = $hostLogin.access_token

# 3. Create Event
Write-Host "`n3. Creating Event..."
$eventDate = (Get-Date).AddDays(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
$eventPayload = @{
    title = "Test Event";
    description = "A test event";
    location = "Test Location";
    startTime = $eventDate;
    endTime = $eventDate
} | ConvertTo-Json
$eventRes = Invoke-RestMethod -Uri "http://localhost:3000/events" -Method Post -Body $eventPayload -Headers @{ Authorization = "Bearer $hostToken" } -ContentType "application/json" -ErrorAction Stop
$eventId = $eventRes.id
Write-Host "Event created. ID: $eventId. Location: $($eventRes.location)"

# 4. Create Guest
Write-Host "`n4. Creating Guest: $guestUser"
$guestPayload = @{ username = $guestUser; password = $pass } | ConvertTo-Json
$guestRes = Invoke-RestMethod -Uri "http://localhost:3000/users" -Method Post -Body $guestPayload -ContentType "application/json" -ErrorAction Stop

# 5. Login Guest
Write-Host "`n5. Logging in Guest..."
$guestLoginPayload = @{ username = $guestUser; password = $pass } | ConvertTo-Json
$guestLogin = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method Post -Body $guestLoginPayload -ContentType "application/json" -ErrorAction Stop
$guestToken = $guestLogin.access_token

# 6. Join Event
Write-Host "`n6. Guest joining event..."
$joinRes = Invoke-RestMethod -Uri "http://localhost:3000/events/$eventId/join" -Method Post -Headers @{ Authorization = "Bearer $guestToken" } -ContentType "application/json" -ErrorAction Stop
Write-Host "Joined event. Status: $($joinRes.status)"

# 7. Guest try delete (expect fail)
Write-Host "`n7. Guest trying to delete event (should fail)..."
try {
    Invoke-RestMethod -Uri "http://localhost:3000/events/$eventId" -Method Delete -Headers @{ Authorization = "Bearer $guestToken" } -ErrorAction Stop
    Write-Error "FAILURE: Guest was able to delete event!"
    exit 1
} catch {
    Write-Host "Success: Guest could not delete event (Expected)."
}

# 8. Host delete (expect success)
Write-Host "`n8. Host deleting event..."
try {
    Invoke-RestMethod -Uri "http://localhost:3000/events/$eventId" -Method Delete -Headers @{ Authorization = "Bearer $hostToken" } -ErrorAction Stop
    Write-Host "Success: Host deleted event."
} catch {
    Write-Error "FAILURE: Host could not delete event: $($_.Exception.Message)"
    exit 1
}

Write-Host "`n--- Event Verification Complete ---"

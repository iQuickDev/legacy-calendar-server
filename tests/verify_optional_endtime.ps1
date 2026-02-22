$hostUser = "optional_end_host_$(Get-Random)"
$pass = "securePassword123"
$bypassKey = "super-secret-bypass-key"

# 1. Create Host
Write-Host "1. Creating Host: $hostUser"
$hostPayload = @{ username = $hostUser; password = $pass } | ConvertTo-Json
$hostRes = Invoke-RestMethod -Uri "http://localhost:3000/users" -Method Post -Body $hostPayload -Headers @{ "X-Bypass" = $bypassKey } -ContentType "application/json" -ErrorAction Stop
$hostId = $hostRes.id

# 2. Login Host
Write-Host "`n2. Logging in Host..."
$loginPayload = @{ username = $hostUser; password = $pass } | ConvertTo-Json
$hostLogin = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method Post -Body $loginPayload -ContentType "application/json" -ErrorAction Stop
$hostToken = $hostLogin.access_token

# 3. Create Event WITHOUT endTime
Write-Host "`n3. Creating Event WITHOUT endTime..."
$eventDate = (Get-Date).AddDays(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
$eventPayload = @{
    title       = "Event without EndTime";
    description = "A test event without end time";
    startTime   = $eventDate;
} | ConvertTo-Json
$eventRes = Invoke-RestMethod -Uri "http://localhost:3000/events" -Method Post -Body $eventPayload -Headers @{ Authorization = "Bearer $hostToken" } -ContentType "application/json" -ErrorAction Stop
$eventId = $eventRes.id

Write-Host "Event created. ID: $eventId"
if ($null -eq $eventRes.endTime) {
    Write-Host "SUCCESS: endTime is null in the response."
}
else {
    Write-Error "FAILURE: endTime is NOT null. Value: $($eventRes.endTime)"
    exit 1
}

# 4. Create Event WITH endTime
Write-Host "`n4. Creating Event WITH endTime..."
$endTime = (Get-Date).AddDays(1).AddHours(2).ToString("yyyy-MM-ddTHH:mm:ssZ")
$eventPayloadWithEnd = @{
    title       = "Event with EndTime";
    description = "A test event with end time";
    startTime   = $eventDate;
    endTime     = $endTime;
} | ConvertTo-Json
$eventResWithEnd = Invoke-RestMethod -Uri "http://localhost:3000/events" -Method Post -Body $eventPayloadWithEnd -Headers @{ Authorization = "Bearer $hostToken" } -ContentType "application/json" -ErrorAction Stop

Write-Host "Event created. ID: $($eventResWithEnd.id)"
if ($null -ne $eventResWithEnd.endTime) {
    Write-Host "SUCCESS: endTime is NOT null in the response. Value: $($eventResWithEnd.endTime)"
}
else {
    Write-Error "FAILURE: endTime is null."
    exit 1
}

Write-Host "`n--- Optional EndTime Verification Complete ---"

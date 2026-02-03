$ErrorActionPreference = 'Stop'
$url = 'http://localhost:3000'

# 1. Generate a unique username using a timestamp
$timestamp = Get-Date -UFormat %s
$username = "testuser_$timestamp"

Write-Host "--- Starting CRUD Test ---" -ForegroundColor Cyan

# 2. CREATE
Write-Host "Creating user: $username"
$userBody = @{ username = $username } | ConvertTo-Json
$create = Invoke-RestMethod -Method Post -Uri "$url/users" -Body $userBody -ContentType 'application/json'
Write-Host "Created successfully. ID: $($create.id)"
$create | ConvertTo-Json -Depth 5

$id = $create.id
Start-Sleep -Milliseconds 500

# 3. READ (List All)
Write-Host "`nListing all users:" -ForegroundColor Yellow
$allUsers = Invoke-RestMethod -Method Get -Uri "$url/users"
$allUsers | ConvertTo-Json -Depth 5

# 4. READ (Single User)
Write-Host "`nFetching user by id: $id" -ForegroundColor Yellow
$singleUser = Invoke-RestMethod -Method Get -Uri "$url/users/$id"
$singleUser | ConvertTo-Json -Depth 5

# 5. UPDATE
$updatedUsername = "updated_$timestamp"
Write-Host "`nUpdating user $id to: $updatedUsername" -ForegroundColor Yellow
$updateBody = @{ username = $updatedUsername } | ConvertTo-Json
$update = Invoke-RestMethod -Method Patch -Uri "$url/users/$id" -Body $updateBody -ContentType 'application/json'
$update | ConvertTo-Json -Depth 5

# 6. DELETE
Write-Host "`nDeleting user $id..." -ForegroundColor Red
$delete = Invoke-RestMethod -Method Delete -Uri "$url/users/$id"
Write-Host "Delete response:"
$delete | ConvertTo-Json -Depth 5

Write-Host "`n--- CRUD Test Complete ---" -ForegroundColor Green
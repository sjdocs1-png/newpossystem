# Test create-owner Edge Function
$url = "https://pdjroppybrndaldgcdzk.supabase.co/functions/v1/create-owner"

# Test data
$body = @{
    business_name = "Test Restaurant"
    owner_name = "Test Owner"
    owner_email = "testowner$(Get-Random)@example.com"
    owner_password = "TestPassword123"
    phone = "9876543210"
    subscription_plan = "monthly"
    subscription_days = 30
    max_stores = 2
    business_type = "restaurant"
    subscription_tier = "basic"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "Request URL: $url"
Write-Host "Request Body: $body"
Write-Host "---"

try {
    $response = Invoke-WebRequest -Uri $url -Method POST -Body $body -Headers $headers -SkipHttpErrorCheck
    Write-Host "Status Code: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "Error: $($_)"
}

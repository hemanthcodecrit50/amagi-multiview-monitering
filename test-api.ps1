# Multiview Monitoring API Test Script
# Quick PowerShell script to test all API endpoints

Write-Host "========================================" -ForegroundColor Green
Write-Host "Multiview Monitoring API Test Suite" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$baseUrl = "http://localhost:3000/api/monitor"
$testsPassed = 0
$testsFailed = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET"
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Cyan
    Write-Host "URL: $Url" -NoNewline
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $Url -Method Get -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method Post -ErrorAction Stop
        }
        
        Write-Host " [PASS]" -ForegroundColor Green
        $script:testsPassed++
        
        # Show summary of response
        if ($response -is [PSCustomObject]) {
            Write-Host "  Response keys: $($response.PSObject.Properties.Name -join ', ')" -ForegroundColor Gray
        }
        
        return $response
    }
    catch {
        Write-Host " [FAIL]" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:testsFailed++
        return $null
    }
    Write-Host ""
}

Write-Host "1. Testing Health Endpoint" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
$health = Test-Endpoint -Name "Health Check" -Url "$baseUrl/health"
if ($health) {
    Write-Host "  Status: $($health.status)" -ForegroundColor $(if($health.status -eq "healthy"){"Green"}else{"Red"})
    Write-Host "  Database: $($health.database)" -ForegroundColor Gray
}
Write-Host ""

Write-Host "2. Testing Dashboard" -ForegroundColor Yellow
Write-Host "--------------------" -ForegroundColor Yellow
$dashboard = Test-Endpoint -Name "Dashboard" -Url "$baseUrl/dashboard"
if ($dashboard) {
    Write-Host "  Total Streams: $($dashboard.summary.totalStreams)" -ForegroundColor Gray
    Write-Host "  Healthy Streams: $($dashboard.summary.healthyStreams)" -ForegroundColor Green
    Write-Host "  Degraded Streams: $($dashboard.summary.degradedStreams)" -ForegroundColor Yellow
    Write-Host "  Error Streams: $($dashboard.summary.errorStreams)" -ForegroundColor Red
    Write-Host "  Overall Status: $($dashboard.summary.overallStatus)" -ForegroundColor $(if($dashboard.summary.overallStatus -eq "healthy"){"Green"}elseif($dashboard.summary.overallStatus -eq "degraded"){"Yellow"}else{"Red"})
    Write-Host "  Active Alerts: $($dashboard.activeAlerts.Count)" -ForegroundColor Gray
}
Write-Host ""

Write-Host "3. Testing Metrics Endpoints" -ForegroundColor Yellow
Write-Host "-----------------------------" -ForegroundColor Yellow
$metrics = Test-Endpoint -Name "Current Metrics" -Url "$baseUrl/metrics"
$summary = Test-Endpoint -Name "Metrics Summary" -Url "$baseUrl/metrics/summary"
$history = Test-Endpoint -Name "Metrics History" -Url "$baseUrl/metrics/history?hours=1"
$stats = Test-Endpoint -Name "Metrics Statistics" -Url "$baseUrl/metrics/statistics"
Write-Host ""

Write-Host "4. Testing Stream Endpoints" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow
$streams = Test-Endpoint -Name "All Streams" -Url "$baseUrl/streams"
if ($streams -and $streams.Count -gt 0) {
    $firstStreamId = $streams[0].streamId
    Write-Host "  Found $($streams.Count) streams" -ForegroundColor Gray
    Write-Host "  Testing first stream: $firstStreamId" -ForegroundColor Gray
    
    $streamDetail = Test-Endpoint -Name "Stream Detail" -Url "$baseUrl/streams/$firstStreamId"
    $streamHistory = Test-Endpoint -Name "Stream History" -Url "$baseUrl/streams/$firstStreamId/history?metric=bitrate&limit=10"
} else {
    Write-Host "  No streams found (this is normal if no streams are active)" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "5. Testing Alert Endpoints" -ForegroundColor Yellow
Write-Host "---------------------------" -ForegroundColor Yellow
$alerts = Test-Endpoint -Name "Active Alerts" -Url "$baseUrl/alerts"
if ($alerts) {
    Write-Host "  Active alerts: $($alerts.Count)" -ForegroundColor $(if($alerts.Count -eq 0){"Green"}else{"Yellow"})
}

$alertHistory = Test-Endpoint -Name "Alert History" -Url "$baseUrl/alerts/history?limit=20"
if ($alertHistory) {
    Write-Host "  Historical alerts: $($alertHistory.Count)" -ForegroundColor Gray
}

$alertStats = Test-Endpoint -Name "Alert Statistics" -Url "$baseUrl/alerts/stats"
if ($alertStats) {
    Write-Host "  Total alerts: $($alertStats.totalAlerts)" -ForegroundColor Gray
    Write-Host "  Resolved: $($alertStats.resolvedAlerts)" -ForegroundColor Green
    Write-Host "  Active: $($alertStats.activeAlerts)" -ForegroundColor Yellow
}
Write-Host ""

# Test resolve alert endpoint if there are active alerts
if ($alerts -and $alerts.Count -gt 0) {
    Write-Host "6. Testing Alert Resolution" -ForegroundColor Yellow
    Write-Host "---------------------------" -ForegroundColor Yellow
    $firstAlertId = $alerts[0].alertId
    Write-Host "  Testing resolution of alert: $firstAlertId" -ForegroundColor Gray
    $resolved = Test-Endpoint -Name "Resolve Alert" -Url "$baseUrl/alerts/$firstAlertId/resolve" -Method "POST"
    Write-Host ""
}

# Summary
Write-Host "========================================" -ForegroundColor Green
Write-Host "Test Summary" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor $(if($testsFailed -eq 0){"Green"}else{"Red"})
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "All tests passed! ✅" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some tests failed! ❌" -ForegroundColor Red
    Write-Host "Make sure the server is running: npm start" -ForegroundColor Yellow
    exit 1
}

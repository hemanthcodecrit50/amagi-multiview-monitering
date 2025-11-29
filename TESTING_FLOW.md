# 🧪 Multiview Stream Monitoring System - Testing Flow

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Structure Overview](#project-structure-overview)
3. [Testing Flow - Step by Step](#testing-flow---step-by-step)
4. [API Testing](#api-testing)
5. [WebSocket Testing](#websocket-testing)
6. [Monitoring System Testing](#monitoring-system-testing)
7. [Alert Testing](#alert-testing)
8. [Database Testing](#database-testing)
9. [Performance Testing](#performance-testing)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- ✅ Node.js (v14 or higher)
- ✅ npm or yarn
- ✅ Web browser (Chrome/Firefox recommended)
- ✅ Terminal/PowerShell
- ✅ cURL or Postman (for API testing)

### Check Installation
```powershell
# Check Node.js version
node --version

# Check npm version
npm --version
```

---

## Project Structure Overview

```
multi/
├── server.js                       # Main server entry point
├── package.json                    # Dependencies
├── modules/                        # Backend modules
│   ├── monitoringService.js       # Main monitoring orchestrator
│   ├── monitoringConfig.js        # Configuration & thresholds
│   ├── streamMonitor.js           # Individual stream monitoring
│   ├── metricsCollector.js        # Metrics aggregation
│   ├── alertManager.js            # Alert processing
│   ├── monitoringDatabase.js      # Database operations
│   ├── monitoringSchema.js        # Database schema
│   ├── monitoringRoutes.js        # REST API endpoints
│   └── monitoringWebSocket.js     # WebSocket handlers
├── public/                         # Frontend files
│   ├── composer.html              # Multiview composer
│   └── viewer.html                # Viewer interface
└── data/                          # Database storage (auto-created)
    └── monitoring.db              # SQLite database
```

---

## Testing Flow - Step by Step

### ✅ Phase 1: Setup & Installation

#### Step 1.1: Navigate to Project Directory
```powershell
cd C:\Users\hemanth\Desktop\AMAGI\multi
```

#### Step 1.2: Install Dependencies
```powershell
npm install
```

**Expected Output:**
```
added XX packages, and audited XX packages in XXs
found 0 vulnerabilities
```

**Verify Dependencies:**
```powershell
# Check if node_modules exists
Test-Path .\node_modules

# Should return: True
```

#### Step 1.3: Verify Project Files
```powershell
# List all modules
Get-ChildItem .\modules\*.js

# Expected files:
# - monitoringService.js
# - monitoringConfig.js
# - streamMonitor.js
# - metricsCollector.js
# - alertManager.js
# - monitoringDatabase.js
# - monitoringSchema.js
# - monitoringRoutes.js
# - monitoringWebSocket.js
```

---

### ✅ Phase 2: Server Startup

#### Step 2.1: Start the Server
```powershell
npm start
```

**Expected Console Output:**
```
Server running on http://localhost:3000
Monitoring API: http://localhost:3000/api/monitor
Monitoring service initialized
Database initialized: C:\Users\hemanth\Desktop\AMAGI\multi\data\monitoring.db
StreamMonitor starting health checks every 5000ms
MetricsCollector starting collection every 10000ms
```

**✅ Success Indicators:**
- No error messages
- Server listening on port 3000
- Monitoring service initialized
- Database created in `data/` folder

**❌ Common Errors:**
- `EADDRINUSE`: Port 3000 already in use → Change port or kill existing process
- `Cannot find module`: Dependencies not installed → Run `npm install`
- Database errors: Permission issues → Check write permissions in `data/` folder

---

### ✅ Phase 3: Basic Connectivity Test

#### Step 3.1: Test HTTP Server
Open a **new PowerShell window** (keep server running):

```powershell
# Test basic server connectivity
curl http://localhost:3000
```

**Expected:** HTML content from composer.html

#### Step 3.2: Test Health Endpoint
```powershell
curl http://localhost:3000/api/monitor/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": 1732876800000,
  "uptime": 12345,
  "database": "connected",
  "services": {
    "streamMonitor": "running",
    "metricsCollector": "running",
    "alertManager": "running"
  }
}
```

**✅ Test Passes If:**
- Status is "healthy"
- Database is "connected"
- All services are "running"

---

### ✅ Phase 4: Web Interface Testing

#### Step 4.1: Open Composer Interface
1. Open browser: http://localhost:3000/composer.html
2. Verify page loads without errors
3. Open browser DevTools Console (F12)

**Expected UI Elements:**
- Input field for stream URLs
- "Add stream" button
- "Clear all" button
- "Start publish" button
- Room ID input (default: "room1")
- **"📊 Dashboard" button** (NEW! - opens monitoring dashboard)
- Empty grid area
- Canvas preview
- Log section
- Viewer URL display

#### Step 4.2: Open Monitoring Dashboard
1. Click the **"📊 Dashboard"** button in composer (or)
2. Open directly: http://localhost:3000/dashboard.html

**Expected Dashboard UI:**
- Overall status badge (Healthy/Degraded/Error/Warning)
- 8 metric cards showing:
  - Total Streams
  - Healthy Streams
  - Degraded Streams
  - Active Alerts
  - Avg Health Score
  - Active Rooms
  - Total Viewers
  - Compositor FPS
- Stream Details section with individual stream cards
- Active Alerts section
- Auto-refresh every 5 seconds
- Refresh and control buttons

**✅ Test Passes If:**
- Dashboard loads with beautiful gradient UI
- All metric cards display correctly
- Shows "No active streams" initially
- Auto-refresh is enabled
- Navigation buttons work

#### Step 4.3: Check Console for Errors
**Expected Console Output:**
```
socket connected <socket-id>
```

**✅ Test Passes If:**
- No JavaScript errors
- Socket.io connected successfully
- Page is fully functional

---

### ✅ Phase 5: Stream Addition & Monitoring

#### Step 5.1: Add First Test Stream

**Test Stream URLs (use these):**
```
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4
```

**Steps:**
1. Paste first URL into input field
2. Click "Add stream"
3. Wait for video to load (5-10 seconds)

**Expected:**
- Grid shows 1 tile with video playing
- Canvas preview shows composite output
- Log shows: "📊 Stream registered for monitoring: stream-<id>"
- Log shows: "✅ Stream loaded: <URL>"
- Server console shows: Stream registration and metrics

**Server Console Output:**
```
[MonitoringWS] Registering stream stream-<timestamp>-<id> from <URL>
StreamMonitor created for stream: stream-<timestamp>-<id>
```

**Important Notes:**
- ✅ **Monitoring starts automatically** when you add streams
- ✅ **No need to press "Start publish"** for monitoring to work
- ✅ Metrics are reported every 5 seconds automatically
- ⚠️ Wait 10-15 seconds after adding streams before checking API endpoints
- ⚠️ Streams must be playing (not paused/error) for metrics to report

#### Step 5.2: Add Multiple Streams
1. Add 2-3 more streams using different URLs
2. Observe grid layout changes:
   - 1 stream: 1x1 grid
   - 2-4 streams: 2x2 grid
   - 5-9 streams: 3x3 grid
   - 10-16 streams: 4x4 grid

**Expected:**
- All videos play simultaneously
- Compositor combines them into canvas
- Each stream gets monitored independently

---

### ✅ Phase 6: API Testing

#### Step 6.1: Get Dashboard Overview
```powershell
curl http://localhost:3000/api/monitor/dashboard | ConvertFrom-Json
```

**Expected Response Structure:**
```json
{
  "timestamp": 1732876800000,
  "summary": {
    "totalStreams": 3,
    "healthyStreams": 3,
    "degradedStreams": 0,
    "errorStreams": 0,
    "avgHealthScore": 95,
    "overallStatus": "healthy"
  },
  "streams": [ /* array of stream objects */ ],
  "activeAlerts": [],
  "recentAlerts": [],
  "systemMetrics": { /* system info */ }
}
```

**✅ Test Passes If:**
- `totalStreams` matches number of added streams
- `overallStatus` is "healthy"
- All streams present in `streams` array

#### Step 6.2: Get Current Metrics
```powershell
curl http://localhost:3000/api/monitor/metrics | ConvertFrom-Json
```

**Expected Response:**
```json
{
  "timestamp": 1732876800000,
  "summary": { /* health summary */ },
  "streams": {
    "stream-1": {
      "streamId": "stream-1",
      "status": "healthy",
      "health": 95,
      "metrics": {
        "bitrate": 2500000,
        "fps": 25,
        "resolution": { "width": 1920, "height": 1080 },
        "frameDrops": 2,
        "latency": 1200
      }
    }
  },
  "compositor": { /* compositor metrics */ },
  "webrtc": { /* webrtc metrics */ },
  "system": { /* system metrics */ }
}
```

#### Step 6.3: Get Stream List
```powershell
curl http://localhost:3000/api/monitor/streams | ConvertFrom-Json
```

**Expected:** Array of all monitored streams with their details

#### Step 6.4: Get Specific Stream Metrics
```powershell
# Replace stream-1 with actual stream ID from previous response
curl "http://localhost:3000/api/monitor/streams/stream-1" | ConvertFrom-Json
```

**Expected:** Detailed metrics for that specific stream

#### Step 6.5: Get Historical Metrics
```powershell
curl "http://localhost:3000/api/monitor/metrics/history?hours=1" | ConvertFrom-Json
```

**Expected:** Time-series data for the last hour (may be empty if just started)

#### Step 6.6: Get Alert List
```powershell
curl http://localhost:3000/api/monitor/alerts | ConvertFrom-Json
```

**Expected:** Empty array if no alerts triggered yet

---

### ✅ Phase 7: WebSocket Real-Time Monitoring

#### Step 7.1: Create Test HTML File

Create `test-monitoring.html` in the `public/` folder:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Monitoring Test</title>
  <style>
    body { font-family: monospace; background: #111; color: #0f0; padding: 20px; }
    .log { background: #000; border: 1px solid #0f0; padding: 10px; margin: 10px 0; }
    .alert { background: #300; border: 1px solid #f00; color: #f00; }
    .metric { background: #003; border: 1px solid #00f; color: #0ff; }
  </style>
</head>
<body>
  <h1>Monitoring WebSocket Test</h1>
  <button onclick="subscribe()">Subscribe to Monitoring</button>
  <button onclick="clearLogs()">Clear Logs</button>
  <div id="logs"></div>

  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
    const logsDiv = document.getElementById('logs');

    function log(message, type = 'log') {
      const div = document.createElement('div');
      div.className = type;
      div.textContent = new Date().toLocaleTimeString() + ' - ' + message;
      logsDiv.insertBefore(div, logsDiv.firstChild);
    }

    function clearLogs() {
      logsDiv.innerHTML = '';
    }

    socket.on('connect', () => {
      log('Socket connected: ' + socket.id);
    });

    function subscribe() {
      log('Subscribing to monitoring...');
      socket.emit('monitoring:subscribe');
    }

    socket.on('monitoring:initial-state', (data) => {
      log('Initial state received: ' + JSON.stringify(data, null, 2), 'metric');
    });

    socket.on('monitoring:metrics-update', (data) => {
      log('Metrics update: ' + JSON.stringify(data.summary), 'metric');
    });

    socket.on('monitoring:stream-metrics', (data) => {
      log('Stream metrics: ' + data.streamId + ' health=' + data.health, 'metric');
    });

    socket.on('monitoring:alert', (alert) => {
      log('ALERT: ' + alert.type + ' (' + alert.severity + ') - ' + JSON.stringify(alert.details), 'alert');
    });

    socket.on('monitoring:alert-resolved', (alert) => {
      log('Alert resolved: ' + alert.type + ' for ' + alert.streamId, 'metric');
    });

    socket.on('monitoring:critical-alert', (alert) => {
      log('CRITICAL ALERT: ' + alert.type, 'alert');
    });
  </script>
</body>
</html>
```

#### Step 7.2: Test WebSocket Monitoring
1. Open http://localhost:3000/test-monitoring.html
2. Click "Subscribe to Monitoring"
3. Keep composer.html open with active streams

**Expected Events (every 10 seconds):**
- `monitoring:initial-state` - Initial metrics
- `monitoring:metrics-update` - Periodic updates
- `monitoring:stream-metrics` - Per-stream updates

**✅ Test Passes If:**
- Events received regularly
- No connection errors
- Metrics show current stream data

---

### ✅ Phase 8: Alert Testing

#### Step 8.1: Trigger Low Bitrate Alert

Open browser console on `composer.html` and run:

```javascript
// Simulate low bitrate (below 500 Kbps threshold)
socket.emit('monitoring:report-stream-metrics', {
  streamId: 'stream-1', // Use actual stream ID
  metrics: {
    bitrate: 300000,  // 300 Kbps - below threshold
    fps: 25,
    frameDrops: 0,
    latency: 1000
  }
});
```

**Expected:**
- Server console shows: `⚠️ [ALERT WARNING] low_bitrate`
- Test monitoring page shows alert
- Alert appears in API: `curl http://localhost:3000/api/monitor/alerts`

#### Step 8.2: Trigger Low FPS Alert

```javascript
socket.emit('monitoring:report-stream-metrics', {
  streamId: 'stream-1',
  metrics: {
    bitrate: 2500000,
    fps: 15,  // Below 20 FPS threshold
    frameDrops: 0,
    latency: 1000
  }
});
```

**Expected:** Warning alert for low FPS

#### Step 8.3: Trigger High Frame Drop Alert

```javascript
socket.emit('monitoring:report-stream-metrics', {
  streamId: 'stream-1',
  metrics: {
    bitrate: 2500000,
    fps: 25,
    frameDrops: 150,  // High frame drops
    latency: 1000
  }
});
```

**Expected:** Error alert for high frame drops

#### Step 8.4: Trigger High Latency Alert

```javascript
socket.emit('monitoring:report-stream-metrics', {
  streamId: 'stream-1',
  metrics: {
    bitrate: 2500000,
    fps: 25,
    frameDrops: 5,
    latency: 8000  // 8 seconds - above 5s threshold
  }
});
```

**Expected:** Warning alert for high latency

#### Step 8.5: Trigger Multiple Alerts

```javascript
socket.emit('monitoring:report-stream-metrics', {
  streamId: 'stream-1',
  metrics: {
    bitrate: 300000,  // LOW
    fps: 15,          // LOW
    frameDrops: 200,  // HIGH
    latency: 8000     // HIGH
  }
});
```

**Expected:** Multiple alerts triggered simultaneously

#### Step 8.6: Verify Alerts in API

```powershell
# Get active alerts
curl http://localhost:3000/api/monitor/alerts | ConvertFrom-Json

# Get alert history
curl http://localhost:3000/api/monitor/alerts/history | ConvertFrom-Json

# Get alert statistics
curl http://localhost:3000/api/monitor/alerts/stats | ConvertFrom-Json
```

#### Step 8.7: Resolve Alert Manually

```powershell
# Get alert ID from previous API call
$alertId = "alert-123"

# Resolve it
curl -X POST http://localhost:3000/api/monitor/alerts/$alertId/resolve
```

**Expected:** Alert marked as resolved in database

---

### ✅ Phase 9: WebRTC Broadcasting Test

#### Step 9.1: Start Broadcasting from Composer
1. Keep 2-3 streams playing in composer
2. Set Room ID (e.g., "room1")
3. Click "Start publish"

**Expected:**
- Button changes to "Stop publish" (enabled)
- Composer starts broadcasting via WebRTC
- Server console: "room1 joined room1 as composer"
- Viewer URL displayed

#### Step 9.2: Connect Viewer
1. Open **new browser tab/window**
2. Navigate to http://localhost:3000/viewer.html
3. Enter same Room ID ("room1")
4. Click "Join"

**Expected:**
- Status shows "Joined room room1, waiting for composer..."
- Then "P2P connected"
- Video element shows composite multiview stream
- All streams visible in single video

**Server Console:**
```
socket connected <viewer-socket-id>
<viewer-socket-id> joined room1 as viewer
```

#### Step 9.3: Test Multiple Viewers
1. Open 2-3 more viewer tabs
2. All join same room
3. Verify all receive stream

**Expected:**
- All viewers see identical composite stream
- No degradation in quality
- System metrics show increased viewer count

**Check System Metrics:**
```powershell
curl http://localhost:3000/api/monitor/dashboard | ConvertFrom-Json | Select-Object -ExpandProperty systemMetrics
```

**Expected:**
```json
{
  "activeRooms": 1,
  "totalViewers": 3,
  "timestamp": 1732876800000
}
```

---

### ✅ Phase 10: Database Testing

#### Step 10.1: Verify Database File
```powershell
# Check database exists
Test-Path .\data\monitoring.db

# Should return: True

# Check file size (should be > 0 KB)
Get-Item .\data\monitoring.db | Select-Object Length
```

#### Step 10.2: Query Database (using SQLite CLI)

If you have SQLite installed:
```powershell
# Install SQLite (if needed)
# Download from: https://www.sqlite.org/download.html

cd .\data
sqlite3 monitoring.db

# Run these queries:
```

**SQL Queries to Test:**

```sql
-- List all tables
.tables

-- Expected tables:
-- streams
-- stream_metrics
-- alerts
-- compositor_metrics
-- webrtc_metrics
-- system_metrics
-- events

-- Count streams
SELECT COUNT(*) FROM streams;

-- View recent stream metrics
SELECT * FROM stream_metrics ORDER BY timestamp DESC LIMIT 10;

-- View all alerts
SELECT alert_type, severity, COUNT(*) as count 
FROM alerts 
GROUP BY alert_type, severity;

-- View alert history
SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 20;

-- View system metrics
SELECT * FROM system_metrics ORDER BY timestamp DESC LIMIT 10;

-- Exit SQLite
.quit
```

#### Step 10.3: Test Data Retention

Wait for 5+ minutes (or adjust config retention), then:

```powershell
curl http://localhost:3000/api/monitor/metrics/history?hours=24 | ConvertFrom-Json
```

**Expected:** Only data within retention period returned

---

### ✅ Phase 11: Performance Testing

#### Step 11.1: Load Test - Multiple Streams
1. Add maximum streams (16)
2. Monitor system performance

**Check Metrics:**
```powershell
curl http://localhost:3000/api/monitor/metrics | ConvertFrom-Json | Select-Object -ExpandProperty summary
```

**Monitor Console for:**
- Processing time per frame
- Compositor FPS
- Any warnings or errors

#### Step 11.2: Memory Usage Test
```powershell
# Windows Task Manager
# Find Node.js process
# Monitor memory usage over time

# Or use PowerShell
Get-Process node | Select-Object Name, CPU, Memory
```

**Expected:**
- Stable memory usage (no memory leaks)
- CPU usage proportional to stream count

#### Step 11.3: Concurrent Viewer Test
1. Open 10+ viewer tabs
2. All join same room
3. Monitor performance

**Check:**
- All viewers receive stream
- No frame drops or stuttering
- Server handles connections smoothly

---

### ✅ Phase 12: Error Handling Testing

#### Step 12.1: Test Invalid Stream URL
1. Add invalid URL: `http://invalid-stream.test/video.m3u8`
2. Observe error handling

**Expected:**
- Error logged in console
- Stream marked as error state
- Alert triggered for connection failure

#### Step 12.2: Test Network Interruption
1. Add working stream
2. Disconnect internet briefly
3. Reconnect

**Expected:**
- Stream enters error/buffering state
- Alerts triggered
- Auto-recovery when connection restored

#### Step 12.3: Test Server Restart
1. Keep streams running
2. Stop server (Ctrl+C)
3. Restart server

**Expected:**
- Graceful shutdown message
- Database persists data
- Clean restart on next run

---

## Monitoring System Testing Checklist

### ✅ Core Features
- [ ] Server starts without errors
- [ ] Database created automatically
- [ ] Health endpoint returns healthy status
- [ ] Composer interface loads
- [ ] Viewer interface loads
- [ ] Streams can be added
- [ ] Grid layout adjusts correctly
- [ ] Canvas compositor works
- [ ] WebRTC broadcasting functional
- [ ] Multiple viewers can connect

### ✅ Monitoring Features
- [ ] StreamMonitor tracks individual streams
- [ ] Metrics collected every 10 seconds
- [ ] Health scores calculated correctly
- [ ] Dashboard API returns data
- [ ] Stream-specific metrics available
- [ ] Historical data stored
- [ ] System metrics tracked
- [ ] WebSocket events broadcast

### ✅ Alert System
- [ ] Low bitrate alerts trigger
- [ ] Low FPS alerts trigger
- [ ] High frame drop alerts trigger
- [ ] High latency alerts trigger
- [ ] Multiple alerts handled
- [ ] Alert history stored
- [ ] Alerts resolved correctly
- [ ] Critical alerts broadcast

### ✅ API Endpoints
- [ ] `/api/monitor/health` works
- [ ] `/api/monitor/dashboard` works
- [ ] `/api/monitor/metrics` works
- [ ] `/api/monitor/metrics/summary` works
- [ ] `/api/monitor/metrics/history` works
- [ ] `/api/monitor/streams` works
- [ ] `/api/monitor/streams/:id` works
- [ ] `/api/monitor/alerts` works
- [ ] `/api/monitor/alerts/history` works
- [ ] `/api/monitor/alerts/stats` works

### ✅ Database
- [ ] Database file created
- [ ] All tables exist
- [ ] Data persists correctly
- [ ] Queries return expected data
- [ ] Retention policies work
- [ ] Auto-cleanup functions

### ✅ Performance
- [ ] Handles 16 streams smoothly
- [ ] Memory usage stable
- [ ] CPU usage reasonable
- [ ] Multiple viewers supported
- [ ] No memory leaks
- [ ] Graceful error handling

---

## Troubleshooting

### Issue: Server won't start
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```powershell
# Find process using port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess

# Kill the process
Stop-Process -Id <process-id> -Force

# Or change port in server.js
$env:PORT = "3001"; npm start
```

### Issue: Database errors
```
Error: SQLITE_CANTOPEN: unable to open database file
```

**Solution:**
```powershell
# Create data directory manually
New-Item -ItemType Directory -Path .\data -Force

# Check permissions
icacls .\data
```

### Issue: Streams not loading
**Check:**
- Internet connection
- CORS issues (check browser console)
- Stream URL validity
- HLS.js library loaded

### Issue: HLS buffering warnings (bufferSeekOverHole)
```
Object { type: "mediaError", details: "bufferSeekOverHole", fatal: false }
```

**Solution:**
This is a **non-fatal warning** that occurs when HLS.js detects small gaps in the media buffer. This is normal and handled automatically by the player.

**What's happening:**
- HLS.js is seeking over a small buffer gap (typically 0.1 seconds)
- The player automatically recovers
- Stream continues playing normally

**Fixed in latest version:**
- These warnings are now filtered out from logs
- Only fatal errors are displayed
- Automatic error recovery implemented

**If streams actually fail:**
- Check internet connection
- Try a different stream URL
- Check browser console for **fatal** errors (fatal: true)
- Verify HLS.js library loaded correctly

### Issue: WebRTC not connecting
**Check:**
- Room IDs match
- Both composer and viewer connected
- Browser console for errors
- WebRTC supported by browser

### Issue: "chrome is not defined" error
```
Uncaught ReferenceError: chrome is not defined
```

**Solution:**
This error occurs when using simple-peer library in non-Chrome browsers (Firefox, Edge, Safari). 

**Fixed in latest version:**
- Added browser compatibility polyfill
- Chrome detection now works across all browsers
- Error no longer appears

**Manual fix (if needed):**
Add before simple-peer script loads:
```javascript
if (typeof chrome === 'undefined') {
  window.chrome = {};
}
```

### Issue: API endpoints not updating after adding streams
**Symptoms:**
- Added streams in composer
- Videos are playing
- But API shows: `totalStreams: 0`, `overallStatus: "warning"`

**Solution:**
This was fixed in the latest version with automatic metrics reporting.

**How it works now:**
1. When you add a stream, it's automatically registered for monitoring
2. Metrics are collected and reported every 5 seconds
3. API updates within 10-15 seconds

**If still not working:**
1. **Check browser console** for errors or warnings
2. **Wait 15 seconds** after adding streams before checking API
3. **Refresh the composer page** to get latest code
4. **Verify streams are playing** (not paused or in error state)
5. **Check server console** for stream registration messages:
   ```
   [MonitoringWS] Registering stream stream-xxx from <URL>
   StreamMonitor created for stream: stream-xxx
   ```
6. **Hard refresh** (Ctrl+Shift+R) to clear cached JavaScript

**Quick test:**
```powershell
# Add a stream in composer, wait 15 seconds, then:
curl http://localhost:3000/api/monitor/dashboard | ConvertFrom-Json | Select-Object -ExpandProperty data | Select-Object -ExpandProperty summary

# Should show:
# totalStreams: 1 (or more)
# healthyStreams: 1 (or more)
# overallStatus: "healthy"
```

**Note:** You do NOT need to press "Start publish (WebRTC)" for monitoring to work. Monitoring is completely independent of WebRTC broadcasting.

### Issue: No alerts triggering
**Verify:**
- Streams are actively monitored
- Thresholds in `monitoringConfig.js`
- Metric values actually violate thresholds
- AlertManager running

### Issue: Database not persisting
**Check:**
- Write permissions in `data/` folder
- Disk space available
- Database file not corrupted

---

## Test Summary Report Template

After completing all tests, document results:

```markdown
# Test Report - Multiview Monitoring System

**Date:** YYYY-MM-DD
**Tester:** Your Name
**Version:** 1.0.0

## Test Results

| Phase | Test | Status | Notes |
|-------|------|--------|-------|
| 1 | Setup & Installation | ✅ PASS | All dependencies installed |
| 2 | Server Startup | ✅ PASS | Server started without errors |
| 3 | Connectivity | ✅ PASS | All endpoints responsive |
| 4 | Web Interface | ✅ PASS | UI fully functional |
| 5 | Stream Monitoring | ✅ PASS | 4 streams tested |
| 6 | API Testing | ✅ PASS | All 15 endpoints working |
| 7 | WebSocket | ✅ PASS | Real-time updates working |
| 8 | Alert System | ✅ PASS | All alert types triggered |
| 9 | WebRTC | ✅ PASS | 3 viewers connected |
| 10 | Database | ✅ PASS | Data persisted correctly |
| 11 | Performance | ✅ PASS | Handled 16 streams |
| 12 | Error Handling | ✅ PASS | Graceful error recovery |

## Issues Found
- None

## Recommendations
- All features working as expected
- System ready for production

## Conclusion
✅ All tests passed successfully
```

---

## Quick Test Commands

Save these for quick testing:

```powershell
# Start server
npm start

# Test health
curl http://localhost:3000/api/monitor/health

# Get dashboard
curl http://localhost:3000/api/monitor/dashboard | ConvertFrom-Json

# Get metrics
curl http://localhost:3000/api/monitor/metrics | ConvertFrom-Json

# Get alerts
curl http://localhost:3000/api/monitor/alerts | ConvertFrom-Json

# Get streams
curl http://localhost:3000/api/monitor/streams | ConvertFrom-Json

# Stop server
# Press Ctrl+C in server terminal
```

---

## Next Steps After Testing

1. ✅ **Production Deployment**
   - Configure environment variables
   - Set up proper logging
   - Enable webhook notifications
   - Set up monitoring dashboards

2. ✅ **Security Enhancements**
   - Add authentication
   - Enable HTTPS
   - Rate limiting
   - Input validation

3. ✅ **Feature Additions**
   - Email alerts
   - SMS notifications
   - Custom dashboards
   - Historical reports

4. ✅ **Documentation**
   - API documentation
   - User manual
   - Deployment guide
   - Troubleshooting guide

---

**Testing Complete! 🎉**

This testing flow ensures your multiview monitoring system is fully functional and production-ready.

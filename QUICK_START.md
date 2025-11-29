# 🚀 Quick Start Guide - Multiview Monitoring System

## ⚡ Fast Track (5 Minutes)

### Step 1: Install & Start (2 minutes)
```powershell
# Navigate to project
cd C:\Users\hemanth\Desktop\AMAGI\multi

# Install dependencies
npm install

# Start server
npm start
```

**Expected Output:**
```
Server running on http://localhost:3000
Monitoring API: http://localhost:3000/api/monitor
Monitoring service initialized
```

### Step 2: Test Basic Functionality (1 minute)

**Open new PowerShell window:**
```powershell
# Test health
curl http://localhost:3000/api/monitor/health

# Should return: {"status":"healthy",...}
```

### Step 3: Open Composer (1 minute)
1. Open browser: **http://localhost:3000/composer.html**
2. Paste test URL: `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`
3. Click **"Add stream"**
4. Wait for video to play

### Step 4: Check Monitoring (1 minute)
**Open monitoring dashboard:**
http://localhost:3000/test-monitoring.html

**Expected:**
- Socket connected
- Auto-subscribed to monitoring
- Metrics updating every 10 seconds
- Stream health displayed

---

## 🧪 Complete Test Flow (15 Minutes)

### Phase 1: Server & API (5 minutes)

#### 1.1 Start Server
```powershell
cd C:\Users\hemanth\Desktop\AMAGI\multi
npm start
```

#### 1.2 Run API Tests
**Open new PowerShell window:**
```powershell
cd C:\Users\hemanth\Desktop\AMAGI\multi
.\test-api.ps1
```

**Expected:** All tests pass ✅

**Manual API Test:**
```powershell
# Dashboard
curl http://localhost:3000/api/monitor/dashboard | ConvertFrom-Json

# Metrics
curl http://localhost:3000/api/monitor/metrics | ConvertFrom-Json

# Alerts
curl http://localhost:3000/api/monitor/alerts | ConvertFrom-Json

# Streams
curl http://localhost:3000/api/monitor/streams | ConvertFrom-Json
```

---

### Phase 2: Stream Testing (5 minutes)

#### 2.1 Open Composer
**Browser:** http://localhost:3000/composer.html

#### 2.2 Add Multiple Streams
Use these test URLs:
```
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4
```

**Steps:**
1. Paste URL → Click "Add stream"
2. Repeat for 3-4 streams
3. Verify grid layout changes (1x1 → 2x2)
4. Check canvas shows composite

#### 2.3 Verify Monitoring
**Check server console:**
```
StreamMonitor created for stream: stream-<id>
Stream stream-<id> metrics updated: { bitrate: 2500000, fps: 25, ... }
Health check passed for stream-<id>
```

**Check API:**
```powershell
curl http://localhost:3000/api/monitor/dashboard | ConvertFrom-Json
```

**Expected:**
- `totalStreams`: 3 or 4
- `healthyStreams`: 3 or 4
- `overallStatus`: "healthy"

---

### Phase 3: Monitoring Dashboard (3 minutes)

#### 3.1 Open Test Dashboard
**Browser:** http://localhost:3000/test-monitoring.html

**Expected UI:**
- Connection status: ✅ Connected
- Stats showing: Total Streams, Healthy Streams, etc.
- Events received counter increasing
- Log entries appearing

#### 3.2 Subscribe to Monitoring
Click **"Subscribe to Monitoring"** (or wait for auto-subscribe)

**Expected Logs:**
```
📡 Subscribing to monitoring...
✅ Socket connected: <socket-id>
📊 Initial state received
📈 Metrics update - Status: healthy
📊 Stream metrics: stream-1 | Health: 95 | Status: healthy
```

#### 3.3 Watch Real-Time Updates
Wait 10-20 seconds and observe:
- Metrics update every 10 seconds
- Stream health scores
- System metrics (viewers, rooms)

---

### Phase 4: Alert Testing (2 minutes)

#### 4.1 Trigger Test Alerts
**On test dashboard (test-monitoring.html):**

1. Click **"⚠️ Low Bitrate"**
   - Expected: Alert logged with warning severity

2. Click **"⚠️ Low FPS"**
   - Expected: Another alert triggered

3. Click **"🚨 Multiple Alerts"**
   - Expected: Multiple alerts at once

4. Click **"✅ Good Metrics"**
   - Expected: Alerts should resolve

#### 4.2 Verify Alerts in API
```powershell
# Get active alerts
curl http://localhost:3000/api/monitor/alerts | ConvertFrom-Json

# Get alert history
curl http://localhost:3000/api/monitor/alerts/history | ConvertFrom-Json

# Get alert statistics
curl http://localhost:3000/api/monitor/alerts/stats | ConvertFrom-Json
```

#### 4.3 Check Server Console
**Look for:**
```
⚠️ [ALERT WARNING] low_bitrate - Stream: stream-1
⚠️ [ALERT WARNING] low_fps - Stream: stream-1
❌ [ALERT ERROR] high_frame_drop - Stream: stream-1
```

---

### Phase 5: WebRTC Broadcasting (Optional - 3 minutes)

#### 5.1 Start Broadcasting
**On composer.html:**
1. Set Room ID: "room1"
2. Click **"Start publish"**
3. Copy viewer URL

#### 5.2 Connect Viewer
**Open new tab:** http://localhost:3000/viewer.html
1. Enter Room ID: "room1"
2. Click **"Join"**

**Expected:**
- Status: "P2P connected"
- Video shows composite stream
- All added streams visible

#### 5.3 Test Multiple Viewers
Open 2-3 more viewer tabs, all join "room1"

**Check system metrics:**
```powershell
curl http://localhost:3000/api/monitor/dashboard | ConvertFrom-Json | Select-Object -ExpandProperty systemMetrics
```

**Expected:**
```json
{
  "activeRooms": 1,
  "totalViewers": 3
}
```

---

## ✅ Success Checklist

After completing the quick test, verify:

- [x] Server starts without errors
- [x] Health endpoint returns "healthy"
- [x] Composer loads and functions
- [x] Streams can be added and play
- [x] Grid layout adapts correctly
- [x] Canvas compositor works
- [x] API endpoints return data
- [x] Test dashboard shows metrics
- [x] Real-time updates received
- [x] Alerts can be triggered
- [x] WebRTC broadcasting works (optional)
- [x] Multiple viewers can connect (optional)
- [x] Database file created in `data/`

---

## 🎯 Key URLs

| Resource | URL | Description |
|----------|-----|-------------|
| **Composer** | http://localhost:3000/composer.html | Create multiview streams |
| **Viewer** | http://localhost:3000/viewer.html | Watch composite stream |
| **📊 Monitoring Dashboard** | http://localhost:3000/dashboard.html | **NEW!** Visual dashboard UI |
| **Test Dashboard** | http://localhost:3000/test-monitoring.html | WebSocket testing |
| **API Health** | http://localhost:3000/api/monitor/health | Health check endpoint |
| **API Dashboard** | http://localhost:3000/api/monitor/dashboard | Complete data (JSON) |
| **API Metrics** | http://localhost:3000/api/monitor/metrics | Current metrics (JSON) |
| **API Alerts** | http://localhost:3000/api/monitor/alerts | Active alerts (JSON) |
| **API Streams** | http://localhost:3000/api/monitor/streams | Stream list (JSON) |

---

## 🔧 Quick Commands

```powershell
# Start server
npm start

# Run API tests
.\test-api.ps1

# Check health
curl http://localhost:3000/api/monitor/health

# Get dashboard
curl http://localhost:3000/api/monitor/dashboard | ConvertFrom-Json

# View database
cd data
sqlite3 monitoring.db
.tables
.quit

# Check server is running
Test-NetConnection localhost -Port 3000

# Kill process on port 3000 (if needed)
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
```

---

## 📊 Expected Metrics

### Healthy Stream:
```json
{
  "streamId": "stream-1",
  "status": "healthy",
  "health": 95,
  "metrics": {
    "bitrate": 2500000,    // 2.5 Mbps
    "fps": 25,             // 25 FPS
    "frameDrops": 2,       // Very low
    "latency": 1200        // 1.2 seconds
  }
}
```

### Alert Thresholds:
- **Bitrate**: < 500 Kbps or > 10 Mbps
- **FPS**: < 20
- **Frame Drop Rate**: > 5%
- **Latency**: > 5 seconds

---

## ❌ Troubleshooting

### Server won't start
```powershell
# Check if port is in use
Get-NetTCPConnection -LocalPort 3000

# Kill process
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force

# Or use different port
$env:PORT = "3001"
npm start
```

### Streams not loading
- Check internet connection
- Try different stream URL
- Check browser console for errors
- Verify HLS.js loaded

### API returns empty data
- Wait 10-15 seconds after adding streams
- Streams need time to report metrics
- Check server console for errors

### Alerts not triggering
- Verify thresholds in `modules/monitoringConfig.js`
- Check metric values actually violate thresholds
- Look for errors in server console
- Try using test dashboard trigger buttons

### Database errors
```powershell
# Check data folder exists
Test-Path .\data

# Create if missing
New-Item -ItemType Directory -Path .\data -Force

# Check permissions
icacls .\data
```

---

## 📚 Next Steps

1. ✅ **Read full documentation:**
   - `TESTING_FLOW.md` - Complete testing guide
   - `MONITORING.md` - Monitoring system details
   - `PROJECT_OVERVIEW.md` - Architecture overview
   - `README.md` - General information

2. ✅ **Customize configuration:**
   - Edit `modules/monitoringConfig.js`
   - Adjust thresholds for your use case
   - Configure retention policies

3. ✅ **Build production features:**
   - Add authentication
   - Enable HTTPS
   - Set up email/SMS alerts
   - Create custom dashboards

4. ✅ **Deploy to production:**
   - Set environment variables
   - Configure logging
   - Set up monitoring (meta!)
   - Deploy to cloud

---

## 🎉 That's It!

Your multiview monitoring system is now fully functional and ready to use!

**Key Features Working:**
- ✅ Real-time stream monitoring
- ✅ Automated alerting
- ✅ Historical data tracking
- ✅ REST API
- ✅ WebSocket updates
- ✅ WebRTC broadcasting
- ✅ Database persistence
- ✅ Health scoring

**Need help?** Check the detailed `TESTING_FLOW.md` guide!

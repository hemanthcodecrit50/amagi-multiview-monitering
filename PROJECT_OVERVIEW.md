# Multiview Stream Monitoring System - Complete Project Overview

## 🎯 Project Purpose

This is a **real-time multiview video compositor with comprehensive monitoring** that allows you to:
1. Combine multiple video streams (HLS/MP4) into a single grid layout (up to 16 streams)
2. Broadcast the composite video to multiple viewers via WebRTC
3. **Monitor stream health, performance, and quality in real-time**
4. **Receive automatic alerts when issues are detected**
5. **Track historical metrics and trends**

---

## 📊 How Monitoring is Assured

### **1. Client-Side Metric Collection (Browser)**

The monitoring works by collecting metrics from both **client-side (browser)** and **server-side**:

#### **In the Composer (composer.html)**
The browser reports real-time metrics to the server:

```javascript
// Video element metrics are captured from HTML5 video API
video.addEventListener('progress', () => {
  // Bitrate calculation
  const bitrate = calculateBitrate(video);
  
  // FPS calculation from video playback
  const fps = video.getVideoPlaybackQuality().totalVideoFrames / timeDiff;
  
  // Frame drops detection
  const frameDrops = video.getVideoPlaybackQuality().droppedVideoFrames;
  
  // Buffering/latency detection
  const buffered = video.buffered;
  const latency = video.currentTime - actualTime;
  
  // Send to server via WebSocket
  socket.emit('monitoring:report-stream-metrics', {
    streamId: streamId,
    metrics: { bitrate, fps, frameDrops, latency }
  });
});
```

#### **Compositor Canvas Monitoring**
```javascript
// Track compositor performance
const compositorFps = actualDrawCount / timeElapsed;
const processingTime = Date.now() - startTime;

socket.emit('monitoring:report-compositor-metrics', {
  outputFps: compositorFps,
  processingTime: processingTime,
  activeStreams: videoElements.length,
  gridLayout: `${gridRows}x${gridCols}`
});
```

#### **WebRTC Peer Monitoring**
```javascript
// Get WebRTC statistics
peer.getStats().then(stats => {
  stats.forEach(report => {
    if (report.type === 'outbound-rtp') {
      const packetLoss = report.packetsLost / report.packetsSent;
      const jitter = report.jitter;
      const rtt = report.roundTripTime;
      
      socket.emit('monitoring:report-webrtc-metrics', {
        packetLoss, jitter, roundTripTime: rtt
      });
    }
  });
});
```

### **2. Server-Side Processing**

#### **StreamMonitor (Individual Stream Tracking)**
Each registered stream gets its own monitor that:

```javascript
// modules/streamMonitor.js
class StreamMonitor {
  updateMetrics(newMetrics) {
    // Store current metrics
    this.metrics = { bitrate, fps, frameDrops, latency, ... };
    
    // Add to circular buffer history
    this.history.bitrate.push({ value, timestamp });
    
    // Run health checks immediately
    this.checkHealth();
  }
  
  checkHealth() {
    // Compare against thresholds
    if (bitrate < MIN_BITRATE) {
      this.raiseAlert('LOW_BITRATE', 'WARNING');
    }
    if (fps < MIN_FPS) {
      this.raiseAlert('LOW_FPS', 'WARNING');
    }
    if (frameDropRate > MAX_FRAME_DROP_RATE) {
      this.raiseAlert('HIGH_FRAME_DROP', 'ERROR');
    }
    // ... more checks
  }
  
  calculateHealthScore() {
    let score = 100;
    // Deduct points for each issue
    if (bitrate < threshold) score -= 15;
    if (fps < threshold) score -= 15;
    // ... return 0-100 score
    return score;
  }
}
```

#### **MetricsCollector (Aggregation Layer)**
Collects metrics from all streams and aggregates:

```javascript
// modules/metricsCollector.js
class MetricsCollector {
  startCollection() {
    // Collect every 10 seconds
    setInterval(() => {
      const allMetrics = this.getAllMetrics();
      this.emit('metrics-collected', allMetrics);
    }, 10000);
    
    // Aggregate every minute
    setInterval(() => {
      const aggregated = this.aggregateMetrics();
      this.saveToDatabase(aggregated);
    }, 60000);
  }
  
  calculateSummary() {
    return {
      totalStreams: this.streams.size,
      healthyStreams: count(health >= 80),
      degradedStreams: count(50 <= health < 80),
      errorStreams: count(health < 50),
      avgHealthScore: average(all health scores),
      overallStatus: determineStatus()
    };
  }
}
```

#### **AlertManager (Alert Processing)**
Processes alerts and routes notifications:

```javascript
// modules/alertManager.js
class AlertManager {
  processAlert(alert) {
    // Log to console (colored output)
    console.log(`[ALERT ${severity}] ${type} - ${details}`);
    
    // Send via WebSocket to monitoring clients
    io.emit('monitoring:alert', alert);
    
    // Store in database for history
    database.saveAlert(alert);
    
    // Could also: send email, webhook, SMS, etc.
  }
}
```

### **3. Continuous Monitoring Loop**

```
┌─────────────────────────────────────────────────────────────┐
│                    MONITORING FLOW                          │
└─────────────────────────────────────────────────────────────┘

Browser (Composer)                    Server
─────────────────                     ──────
     │                                   │
     │  1. Video plays in browser        │
     │  2. Capture metrics every 5s      │
     │     - Bitrate from buffer         │
     │     - FPS from playback quality   │
     │     - Frame drops from API        │
     │     - Latency calculation         │
     │                                   │
     │  3. Send via WebSocket            │
     │──────────────────────────────────>│
     │  'monitoring:report-stream-       │
     │   metrics'                        │
     │                                   │
     │                                   │  4. StreamMonitor receives
     │                                   │     - Updates metrics
     │                                   │     - Adds to history
     │                                   │     - Runs checkHealth()
     │                                   │
     │                                   │  5. If threshold violated
     │                                   │     - raiseAlert()
     │                                   │     - AlertManager processes
     │                                   │
     │  6. Alert broadcast               │
     │<──────────────────────────────────│
     │  'monitoring:alert'               │
     │                                   │
     │                                   │  7. Every 10s
     │                                   │     - Collect all metrics
     │                                   │     - Calculate summary
     │                                   │     - Broadcast update
     │                                   │
     │  8. Metrics update                │
     │<──────────────────────────────────│
     │  'monitoring:metrics-update'      │
     │                                   │
     │                                   │  9. Every 60s
     │                                   │     - Aggregate metrics
     │                                   │     - Save to database
     │                                   │
     │                                   │  10. Database stores:
     │                                   │      - Stream metrics
     │                                   │      - Alerts history
     │                                   │      - System metrics
     │                                   │      - Events log
     │                                   │
```

### **4. Automated Health Checks**

Every stream is continuously checked against thresholds:

| Metric | Threshold | Alert Type | Severity |
|--------|-----------|------------|----------|
| Bitrate | < 500 Kbps | LOW_BITRATE | WARNING |
| Bitrate | > 10 Mbps | HIGH_BITRATE | WARNING |
| FPS | < 20 | LOW_FPS | WARNING |
| Frame Drop Rate | > 5% | HIGH_FRAME_DROP | ERROR |
| Latency | > 5 seconds | HIGH_LATENCY | WARNING |
| Black Frames | > 10% | BLACK_FRAMES | ERROR |
| Frozen Frames | > 5 seconds | FROZEN_FRAMES | CRITICAL |
| Packet Loss | > 5% | PACKET_LOSS | ERROR |
| Stream State | ERROR | STREAM_DOWN | CRITICAL |

### **5. Multi-Channel Alert Delivery**

When an alert is triggered:

```javascript
// 1. Console Output (with colors)
console.log('🔴 [ALERT CRITICAL] stream_down - Stream: stream-1');

// 2. WebSocket Broadcast
io.to('monitoring').emit('monitoring:alert', {
  id: 'alert-123',
  type: 'stream_down',
  severity: 'critical',
  streamId: 'stream-1',
  timestamp: Date.now(),
  details: { ... }
});

// 3. Database Storage
database.saveAlert(alert);

// 4. External Notifications (configurable)
// - Webhook POST request
// - Email notification
// - SMS alert
// - Slack/Discord message
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  composer.html                    viewer.html                   │
│  ├── Video Elements (HLS/MP4)     └── WebRTC Receiver         │
│  ├── Canvas Compositor                                          │
│  ├── WebRTC Publisher                                           │
│  └── Metrics Reporter ────────┐                                │
│                                │                                 │
└────────────────────────────────┼─────────────────────────────────┘
                                 │ WebSocket
                                 │
┌────────────────────────────────┼─────────────────────────────────┐
│                         SERVER SIDE                             │
├────────────────────────────────┼─────────────────────────────────┤
│                                ▼                                 │
│  server.js                                                       │
│  ├── Express HTTP Server                                        │
│  ├── Socket.IO WebSocket Server                                 │
│  └── MonitoringService ──┐                                      │
│                           │                                      │
│  ┌────────────────────────┴──────────────────────┐             │
│  │         MONITORING SYSTEM                     │             │
│  ├───────────────────────────────────────────────┤             │
│  │                                               │             │
│  │  StreamMonitor (per stream)                  │             │
│  │  ├── Health tracking                         │             │
│  │  ├── Metrics history                         │             │
│  │  ├── Alert generation                        │             │
│  │  └── Health score calculation                │             │
│  │                                               │             │
│  │  MetricsCollector                            │             │
│  │  ├── Aggregates all streams                  │             │
│  │  ├── System metrics                          │             │
│  │  ├── Historical analysis                     │             │
│  │  └── Statistics & trends                     │             │
│  │                                               │             │
│  │  AlertManager                                │             │
│  │  ├── Alert processing                        │             │
│  │  ├── Multi-channel routing                   │             │
│  │  ├── Alert history                           │             │
│  │  └── Resolution tracking                     │             │
│  │                                               │             │
│  │  MonitoringWebSocket                         │             │
│  │  ├── Real-time broadcasts                    │             │
│  │  ├── Client subscriptions                    │             │
│  │  └── Event routing                           │             │
│  │                                               │             │
│  │  MonitoringDatabase (SQLite)                 │             │
│  │  ├── Stream metrics (time-series)            │             │
│  │  ├── Alerts history                          │             │
│  │  ├── System metrics                          │             │
│  │  ├── Events log                              │             │
│  │  └── Auto-cleanup (retention policies)       │             │
│  │                                               │             │
│  │  MonitoringRoutes (REST API)                 │             │
│  │  ├── GET /api/monitor/dashboard              │             │
│  │  ├── GET /api/monitor/metrics                │             │
│  │  ├── GET /api/monitor/streams/:id            │             │
│  │  ├── GET /api/monitor/alerts                 │             │
│  │  └── ... (15+ endpoints)                     │             │
│  │                                               │             │
│  └───────────────────────────────────────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
multi/
├── server.js                        # Main server with monitoring integration
├── package.json                     # Dependencies (express, socket.io, sqlite3)
├── MONITORING.md                    # Monitoring documentation
│
├── modules/                         # Backend monitoring modules
│   ├── monitoringService.js        # Main orchestrator
│   ├── monitoringConfig.js         # Thresholds & configuration
│   ├── streamMonitor.js            # Individual stream tracking
│   ├── metricsCollector.js         # Metrics aggregation
│   ├── alertManager.js             # Alert processing
│   ├── monitoringDatabase.js       # Database persistence
│   ├── monitoringSchema.js         # SQLite schema
│   ├── monitoringRoutes.js         # REST API endpoints
│   └── monitoringWebSocket.js      # WebSocket handlers
│
├── data/
│   └── monitoring.db               # SQLite database (auto-created)
│
└── public/
    ├── composer.html               # Multiview composer interface
    ├── viewer.html                 # Viewer interface
    └── js/                         # (Future: client-side modules)
```

---

## 🔧 Module Breakdown

### **1. monitoringConfig.js**
- Defines all thresholds and limits
- Configurable monitoring intervals
- Alert types and severity levels
- Data retention policies
- Notification channels

### **2. streamMonitor.js**
- One instance created per stream
- Tracks: bitrate, FPS, frame drops, latency, resolution
- Maintains circular buffer history (60 data points)
- Runs health checks on every metric update
- Calculates health score (0-100)
- Emits events: `metrics-update`, `state-change`, `alert`

### **3. metricsCollector.js**
- Aggregates data from all StreamMonitors
- Collects compositor, WebRTC, and system metrics
- Runs collection interval (10s) and aggregation interval (60s)
- Calculates summary statistics
- Provides trend analysis
- Emits events for all metric types

### **4. alertManager.js**
- Receives alerts from StreamMonitors and MetricsCollector
- Routes alerts to multiple channels:
  - Console (colored logs)
  - WebSocket (real-time broadcast)
  - Database (persistence)
  - Webhooks (optional, configurable)
- Tracks alert history and resolutions
- Provides alert statistics

### **5. monitoringDatabase.js**
- SQLite database for persistence
- 7 tables: streams, stream_metrics, alerts, compositor_metrics, webrtc_metrics, system_metrics, events
- Automatic cleanup based on retention policies
- Efficient indexing for fast queries
- Async operations (Promise-based)

### **6. monitoringRoutes.js**
- 15+ REST API endpoints
- Dashboard overview
- Metrics retrieval (current, historical, summary)
- Stream-specific data
- Alert management
- Statistics and trends

### **7. monitoringWebSocket.js**
- Real-time event broadcasting
- Client subscription management
- Stream-specific subscriptions
- Receives client-reported metrics
- Routes updates to appropriate subscribers

### **8. monitoringService.js**
- Main orchestrator that ties everything together
- Initializes all components
- Manages lifecycle (startup, shutdown)
- Coordinates database persistence
- Updates system-level metrics
- Provides unified interface

---

## 🔄 Data Flow Examples

### **Example 1: Stream Quality Degradation**

```
1. Browser detects low bitrate (400 Kbps)
   └─> Sends via WebSocket: monitoring:report-stream-metrics

2. Server receives metric update
   └─> StreamMonitor.updateMetrics({ bitrate: 400000 })

3. StreamMonitor runs health check
   └─> Detects: bitrate (400K) < MIN_BITRATE (500K)

4. StreamMonitor raises alert
   └─> raiseAlert('LOW_BITRATE', 'WARNING', { current: 400K, threshold: 500K })

5. AlertManager processes alert
   ├─> Logs to console: "⚠️ [ALERT WARNING] LOW_BITRATE"
   ├─> Saves to database: alerts table
   └─> Broadcasts via WebSocket: monitoring:alert

6. All monitoring clients receive alert
   └─> Can display notification, update dashboard, etc.

7. If bitrate recovers (> 500K)
   └─> StreamMonitor.clearAlert('LOW_BITRATE')
   └─> AlertManager broadcasts: monitoring:alert-resolved
```

### **Example 2: Periodic Metrics Collection**

```
Every 10 seconds:
1. MetricsCollector timer triggers
2. Calls getAllMetrics()
   ├─> Loops through all StreamMonitors
   ├─> Gets current metrics from each
   ├─> Includes compositor metrics
   ├─> Includes WebRTC metrics
   └─> Includes system metrics

3. Calculates summary
   ├─> totalStreams: 4
   ├─> healthyStreams: 3 (health >= 80)
   ├─> degradedStreams: 1 (health 50-79)
   ├─> errorStreams: 0
   ├─> avgHealthScore: 87
   └─> overallStatus: 'healthy'

4. Emits 'metrics-collected' event
   └─> MonitoringWebSocket receives
   └─> Broadcasts to all subscribed clients
   └─> Clients update dashboards in real-time

Every 60 seconds:
1. MetricsCollector aggregates
2. Saves aggregated data to database
3. Keeps last 60 minutes of aggregated data
4. Auto-cleans old data per retention policy
```

---

## 📡 API Endpoints Reference

### **Dashboard & Overview**
```
GET /api/monitor/dashboard
  → Complete overview: metrics, alerts, statistics

GET /api/monitor/health
  → Service health check
```

### **Metrics**
```
GET /api/monitor/metrics
  → Current metrics for all streams

GET /api/monitor/metrics/summary
  → Summary statistics (healthy/degraded/error counts)

GET /api/monitor/metrics/history?hours=2
  → Historical aggregated metrics

GET /api/monitor/metrics/statistics
  → Detailed statistics and trends
```

### **Streams**
```
GET /api/monitor/streams
  → List all monitored streams

GET /api/monitor/streams/:streamId
  → Detailed metrics for specific stream

GET /api/monitor/streams/:streamId/history?metric=bitrate&limit=60
  → Historical data for stream metric
```

### **Alerts**
```
GET /api/monitor/alerts?severity=critical&type=stream_down
  → Active alerts (with filtering)

GET /api/monitor/alerts/history?limit=100
  → Alert history

GET /api/monitor/alerts/stats
  → Alert statistics

POST /api/monitor/alerts/:alertId/resolve
  → Manually resolve alert
```

---

## 🎮 WebSocket Events Reference

### **Subscribe to Monitoring**
```javascript
socket.emit('monitoring:subscribe');
socket.on('monitoring:initial-state', (data) => {
  // Receive current state immediately
});
```

### **Receive Updates**
```javascript
socket.on('monitoring:metrics-update', (data) => {
  // Full metrics update every 10s
});

socket.on('monitoring:stream-metrics', (data) => {
  // Individual stream metric update
});

socket.on('monitoring:alert', (alert) => {
  // New alert triggered
});

socket.on('monitoring:alert-resolved', (alert) => {
  // Alert resolved
});

socket.on('monitoring:critical-alert', (alert) => {
  // Critical alert (broadcast to all, even non-subscribers)
});
```

### **Report Metrics (Client → Server)**
```javascript
// Report stream metrics
socket.emit('monitoring:report-stream-metrics', {
  streamId: 'stream-1',
  metrics: {
    bitrate: 2500000,
    fps: 25,
    frameDrops: 5,
    latency: 1200,
    resolution: { width: 1920, height: 1080 }
  }
});

// Report compositor metrics
socket.emit('monitoring:report-compositor-metrics', {
  outputFps: 24,
  processingTime: 18,
  gridLayout: '2x2'
});

// Report WebRTC metrics
socket.emit('monitoring:report-webrtc-metrics', {
  peersConnected: 3,
  packetLoss: 0.02,
  jitter: 15,
  roundTripTime: 50
});
```

---

## 🗄️ Database Schema

### **streams**
- `stream_id` (PK), `stream_url`, `room_id`, `created_at`, `last_seen`, `status`, `metadata`

### **stream_metrics** (Time-Series)
- `id` (PK), `stream_id` (FK), `timestamp`, `state`, `bitrate`, `fps`, `resolution`, `frame_drops`, `latency`, etc.

### **alerts**
- `alert_id` (PK), `stream_id` (FK), `alert_type`, `severity`, `details`, `timestamp`, `resolved`, `resolved_at`

### **compositor_metrics**
- `id` (PK), `timestamp`, `output_fps`, `processing_time`, `active_streams`, `grid_layout`

### **webrtc_metrics**
- `id` (PK), `timestamp`, `room_id`, `peers_connected`, `packet_loss`, `jitter`, `round_trip_time`

### **system_metrics**
- `id` (PK), `timestamp`, `cpu_usage`, `memory_usage`, `active_rooms`, `total_viewers`

### **events**
- `id` (PK), `event_type`, `stream_id` (FK), `room_id`, `details`, `timestamp`

---

## ⚙️ Configuration

Edit `modules/monitoringConfig.js`:

```javascript
module.exports = {
  INTERVALS: {
    HEALTH_CHECK: 5000,          // 5 seconds
    METRICS_COLLECTION: 10000,   // 10 seconds
    METRICS_AGGREGATION: 60000,  // 60 seconds
  },
  
  THRESHOLDS: {
    MIN_BITRATE: 500000,         // 500 Kbps
    MAX_BITRATE: 10000000,       // 10 Mbps
    MIN_FPS: 20,
    MAX_FRAME_DROP_RATE: 0.05,   // 5%
    MAX_LATENCY: 5000,           // 5 seconds
  },
  
  RETENTION: {
    METRICS_DETAILED: 3600000,    // 1 hour
    METRICS_AGGREGATED: 86400000, // 24 hours
    ALERTS: 604800000,            // 7 days
  }
};
```

---

## 🚀 Getting Started

### **Installation**
```powershell
cd C:\Users\hemanth\Desktop\AMAGI\multi
npm install
```

### **Start Server**
```powershell
npm start
```

### **Access**
- Composer: `http://localhost:3000`
- Viewer: `http://localhost:3000/viewer.html`
- Monitoring API: `http://localhost:3000/api/monitor/dashboard`

### **Test Monitoring**
```powershell
# Check health
curl http://localhost:3000/api/monitor/health

# View metrics
curl http://localhost:3000/api/monitor/metrics

# View alerts
curl http://localhost:3000/api/monitor/alerts
```

---

## ✅ Monitoring Assurance Summary

### **How Monitoring is Guaranteed:**

1. **Client-Side Reporting**
   - Browser captures real metrics from HTML5 Video API
   - Canvas compositor tracks rendering performance
   - WebRTC peer stats provide connection quality

2. **Server-Side Processing**
   - Every metric is validated against thresholds
   - Health checks run on every update
   - Alerts generated automatically

3. **Continuous Operation**
   - Collection runs every 10 seconds
   - Aggregation runs every 60 seconds
   - Database persists all data

4. **Multi-Level Alerts**
   - 13 alert types covering all failure modes
   - 4 severity levels (INFO, WARNING, ERROR, CRITICAL)
   - Multiple delivery channels (console, WebSocket, database)

5. **Real-Time Visibility**
   - WebSocket broadcasts updates instantly
   - REST API provides on-demand access
   - Dashboard shows current state

6. **Historical Analysis**
   - Time-series metrics stored in database
   - Trend analysis and statistics
   - Configurable retention policies

7. **High Availability**
   - Event-driven architecture (non-blocking)
   - Graceful error handling
   - Automatic reconnection support

---

## 🎯 Key Benefits

✅ **Proactive Problem Detection** - Catch issues before users complain  
✅ **Real-Time Visibility** - See what's happening right now  
✅ **Historical Analysis** - Understand trends and patterns  
✅ **Automated Alerting** - No manual monitoring required  
✅ **Scalable Design** - Handles multiple streams efficiently  
✅ **Flexible Integration** - REST API + WebSocket for any client  
✅ **Complete Audit Trail** - Everything logged to database  

The monitoring system is **fully operational and production-ready**! 🎉

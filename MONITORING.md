# Multiview Monitoring System

A comprehensive backend monitoring system for the multiview video compositor.

## Features

### 📊 Stream Monitoring
- Real-time health tracking for each video stream
- Metrics: bitrate, FPS, resolution, frame drops, latency
- Automatic detection of black frames, frozen frames
- Stream state management (connecting, playing, buffering, error)
- Health score calculation (0-100) for quick status overview

### 🚨 Alert Management
- Configurable threshold-based alerts
- Multiple severity levels: INFO, WARNING, ERROR, CRITICAL
- Alert types:
  - Stream down/degraded
  - Low/high bitrate
  - Low FPS
  - High frame drop rate
  - Black frames detected
  - Frozen frames detected
  - High latency
  - WebRTC connection failures
  - Packet loss
- Real-time alert notifications via WebSocket
- Alert history and resolution tracking

### 📈 Metrics Collection
- Aggregated metrics across all streams
- Historical data retention with configurable policies
- Compositor performance metrics (output FPS, processing time)
- WebRTC connection metrics (packet loss, jitter, RTT)
- System metrics (CPU, memory, active rooms, viewers)
- Trend analysis and statistics

### 💾 Data Persistence
- SQLite database for metric and alert storage
- Automatic cleanup based on retention policies
- Efficient indexing for fast queries
- Export capabilities for external analysis

### 🔌 REST API
Complete monitoring API available at `/api/monitor`:

**Dashboard**
- `GET /api/monitor/dashboard` - Complete overview

**Metrics**
- `GET /api/monitor/metrics` - Current metrics for all streams
- `GET /api/monitor/metrics/summary` - Summary statistics
- `GET /api/monitor/metrics/history?hours=1` - Historical metrics
- `GET /api/monitor/metrics/statistics` - Detailed statistics and trends

**Streams**
- `GET /api/monitor/streams` - List all monitored streams
- `GET /api/monitor/streams/:streamId` - Stream details
- `GET /api/monitor/streams/:streamId/history?metric=bitrate&limit=60` - Stream metric history

**Alerts**
- `GET /api/monitor/alerts` - Active alerts (filter by severity, type, streamId)
- `GET /api/monitor/alerts/history` - Alert history with filtering
- `GET /api/monitor/alerts/stats` - Alert statistics
- `POST /api/monitor/alerts/:alertId/resolve` - Manually resolve alert

**Health**
- `GET /api/monitor/health` - Service health check

### 🔄 WebSocket Events

**Subscribe to monitoring**
```javascript
socket.emit('monitoring:subscribe');
socket.on('monitoring:initial-state', (data) => {
  // Initial metrics and alerts
});
```

**Real-time updates**
- `monitoring:metrics-update` - Full metrics update
- `monitoring:stream-metrics` - Stream-specific metrics
- `monitoring:stream-state-change` - Stream state changed
- `monitoring:compositor-metrics` - Compositor performance
- `monitoring:webrtc-metrics` - WebRTC connection metrics
- `monitoring:system-metrics` - System metrics
- `monitoring:alert` - New alert created
- `monitoring:alert-resolved` - Alert resolved
- `monitoring:critical-alert` - Critical alert (broadcast to all)

**Stream-specific monitoring**
```javascript
socket.emit('monitoring:subscribe-stream', { streamId: 'stream-1' });
socket.on('monitoring:stream-update', (data) => {
  // Updates for specific stream
});
```

**Report metrics from client**
```javascript
// Report stream metrics from browser
socket.emit('monitoring:report-stream-metrics', {
  streamId: 'stream-1',
  metrics: {
    bitrate: 2500000,
    fps: 25,
    frameDrops: 5,
    latency: 1500
  }
});

// Report compositor metrics
socket.emit('monitoring:report-compositor-metrics', {
  outputFps: 25,
  processingTime: 15,
  gridLayout: '2x2'
});
```

## Module Structure

```
multi/
├── modules/
│   ├── monitoringConfig.js       # Configuration and thresholds
│   ├── streamMonitor.js          # Individual stream monitoring
│   ├── metricsCollector.js       # Aggregates all metrics
│   ├── alertManager.js           # Alert creation and routing
│   ├── monitoringDatabase.js     # Database persistence
│   ├── monitoringSchema.js       # Database schema
│   ├── monitoringRoutes.js       # REST API endpoints
│   ├── monitoringWebSocket.js    # WebSocket event handlers
│   └── monitoringService.js      # Main orchestrator
├── data/
│   └── monitoring.db             # SQLite database (auto-created)
└── server.js                     # Main server with monitoring

```

## Configuration

Edit `modules/monitoringConfig.js` to customize:

### Monitoring Intervals
- Health checks: 5 seconds
- Metrics collection: 10 seconds
- Metrics aggregation: 60 seconds
- Cleanup: 5 minutes

### Thresholds
- Bitrate: 500 Kbps - 10 Mbps
- FPS: 20-60
- Frame drop rate: 5% max
- Latency: 5 seconds max
- Packet loss: 5% max

### Data Retention
- Detailed metrics: 1 hour
- Aggregated metrics: 24 hours
- Alerts: 7 days
- Events: 30 days

## Usage

### Starting the Server
```bash
npm install
npm start
```

The monitoring system initializes automatically and is available at:
- Server: `http://localhost:3000`
- Monitoring API: `http://localhost:3000/api/monitor`
- Composer: `http://localhost:3000/composer.html`
- Viewer: `http://localhost:3000/viewer.html`

### Registering Streams for Monitoring

```javascript
// In your application code
const streamMonitor = monitoringService.registerStream(
  'stream-1',
  'https://example.com/stream.m3u8',
  'room1'
);

// Update metrics from client side
streamMonitor.updateMetrics({
  bitrate: 2500000,
  fps: 25,
  frameDrops: 2,
  latency: 1200
});

// Stream state updates
streamMonitor.updateState('playing');
streamMonitor.updateState('buffering');
streamMonitor.updateState('error');
```

### Accessing Monitoring Data

```bash
# Get dashboard overview
curl http://localhost:3000/api/monitor/dashboard

# Get current metrics
curl http://localhost:3000/api/monitor/metrics

# Get active alerts
curl http://localhost:3000/api/monitor/alerts

# Get stream-specific data
curl http://localhost:3000/api/monitor/streams/stream-1

# Get historical metrics
curl "http://localhost:3000/api/monitor/metrics/history?hours=2"
```

## Client-Side Integration

### HTML Example
```html
<script src="/socket.io/socket.io.js"></script>
<script>
  const socket = io();
  
  // Subscribe to monitoring updates
  socket.emit('monitoring:subscribe');
  
  socket.on('monitoring:initial-state', (data) => {
    console.log('Initial state:', data);
    updateDashboard(data);
  });
  
  socket.on('monitoring:alert', (alert) => {
    console.log('New alert:', alert);
    showAlert(alert);
  });
  
  socket.on('monitoring:metrics-update', (data) => {
    console.log('Metrics update:', data);
    updateMetrics(data);
  });
</script>
```

## Architecture

### Flow
1. **Stream Monitors** track individual stream health and metrics
2. **Metrics Collector** aggregates data from all monitors
3. **Alert Manager** processes threshold violations and creates alerts
4. **Database** persists metrics and alerts for historical analysis
5. **WebSocket** broadcasts real-time updates to connected clients
6. **REST API** provides on-demand access to monitoring data

### Event-Driven Design
All components use EventEmitter for loose coupling:
- StreamMonitor emits metric updates and state changes
- MetricsCollector listens and aggregates
- AlertManager creates and routes alerts
- WebSocket broadcasts to clients
- Database persists asynchronously

## Benefits

✅ **Real-time visibility** into stream health and performance  
✅ **Proactive alerting** catches issues before users complain  
✅ **Historical analysis** helps identify patterns and trends  
✅ **Scalable architecture** handles multiple streams efficiently  
✅ **Flexible API** integrates with dashboards and external tools  
✅ **Event-driven** ensures low latency and high throughput  
✅ **Database persistence** enables long-term analytics  

## Next Steps

1. Install dependencies: `npm install`
2. Start the server: `npm start`
3. Access monitoring dashboard (create frontend)
4. Integrate client-side metric reporting in composer.html
5. Configure alert thresholds for your use case
6. Set up external alert notifications (webhooks, email)

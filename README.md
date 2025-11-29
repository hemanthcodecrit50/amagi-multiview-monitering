# Multiview Stream Monitoring System

A real-time multiview video compositor with comprehensive monitoring that combines multiple video streams (HLS/MP4) into a single grid layout and broadcasts via WebRTC, with built-in health monitoring, alerting, and analytics.

## ✨ Features

- 🎥 **Multiview Compositor** - Combine up to 16 video streams in a responsive grid (1x1, 2x2, 3x3, 4x4)
- 📡 **WebRTC Broadcasting** - Stream the composite video to multiple viewers in real-time
- 📊 **Real-Time Monitoring** - Track stream health, performance, and quality metrics
- 🚨 **Automated Alerting** - Threshold-based alerts for proactive problem detection
- 💾 **Data Persistence** - SQLite database for historical analysis
- 🔌 **REST API** - 15+ endpoints for programmatic access
- ⚡ **WebSocket Events** - Real-time metric updates and alerts
- 📈 **Analytics** - Trend analysis and statistics

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/hemanthcodecrit50/amagi-multiview-monitering.git
cd amagi-multiview-monitering/multi

# Install dependencies
npm install

# Start the server
npm start
```

The server will start on `http://localhost:3000`

### Access the Application

- **Composer**: `http://localhost:3000/composer.html` - Create and manage multiview streams
- **Viewer**: `http://localhost:3000/viewer.html` - Watch the composite stream
- **Monitoring Dashboard**: `http://localhost:3000/dashboard.html` - **NEW!** Visual monitoring dashboard
- **Test Dashboard**: `http://localhost:3000/test-monitoring.html` - WebSocket testing interface
- **Monitoring API**: `http://localhost:3000/api/monitor/dashboard` - REST API endpoint

## 📖 Usage

### Creating a Multiview

1. Open the composer at `http://localhost:3000`
2. Add video stream URLs (HLS or MP4):
   ```
   https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
   https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
   ```
3. Click "Add stream" for each URL
4. Click "Start publish" to begin broadcasting
5. Share the viewer URL with others

### Monitoring Streams

#### REST API Examples

```bash
# Get dashboard overview
curl http://localhost:3000/api/monitor/dashboard

# Get current metrics
curl http://localhost:3000/api/monitor/metrics

# Get active alerts
curl http://localhost:3000/api/monitor/alerts

# Get stream-specific metrics
curl http://localhost:3000/api/monitor/streams/stream-1

# Get historical metrics
curl "http://localhost:3000/api/monitor/metrics/history?hours=2"
```

#### WebSocket Integration

```javascript
const socket = io();

// Subscribe to monitoring updates
socket.emit('monitoring:subscribe');

socket.on('monitoring:initial-state', (data) => {
  console.log('Current state:', data);
});

socket.on('monitoring:alert', (alert) => {
  console.log('Alert:', alert);
});

socket.on('monitoring:metrics-update', (metrics) => {
  console.log('Metrics:', metrics);
});
```

## 📊 Monitoring Features

### Tracked Metrics

- **Stream Quality**: Bitrate, FPS, resolution, frame drops
- **Performance**: Latency, buffer duration, reconnection count
- **Compositor**: Output FPS, processing time, grid layout
- **WebRTC**: Packet loss, jitter, round-trip time
- **System**: CPU usage, memory, active rooms, viewers

### Alert Types

- Stream down/degraded
- Low/high bitrate
- Low FPS
- High frame drop rate
- Black/frozen frames
- High latency
- WebRTC failures
- Packet loss

### Severity Levels

- **INFO** - Informational events
- **WARNING** - Minor issues, degraded quality
- **ERROR** - Significant problems
- **CRITICAL** - Service-affecting failures

## 🏗️ Architecture

```
Client (Browser)          Server
─────────────            ───────
Composer/Viewer    ←→    Express + Socket.IO
   │                           │
   │                           ├─ MonitoringService
   │                           │  ├─ StreamMonitor
   │                           │  ├─ MetricsCollector
   │                           │  ├─ AlertManager
   │                           │  ├─ Database (SQLite)
   │                           │  └─ WebSocket Handler
   │                           │
   └─────────────────────────────→ REST API
```

## 📁 Project Structure

```
multi/
├── server.js                    # Main server
├── package.json                 # Dependencies
├── MONITORING.md               # Monitoring documentation
├── PROJECT_OVERVIEW.md         # Complete project overview
├── modules/                    # Backend modules
│   ├── monitoringService.js   # Main orchestrator
│   ├── streamMonitor.js       # Stream health tracking
│   ├── metricsCollector.js    # Metrics aggregation
│   ├── alertManager.js        # Alert processing
│   ├── monitoringDatabase.js  # Database operations
│   ├── monitoringRoutes.js    # REST API endpoints
│   └── monitoringWebSocket.js # WebSocket handlers
├── data/                      # Database storage (gitignored)
└── public/                    # Frontend files
    ├── composer.html          # Multiview composer
    └── viewer.html            # Viewer interface
```

## ⚙️ Configuration

Edit `modules/monitoringConfig.js` to customize:

```javascript
module.exports = {
  INTERVALS: {
    HEALTH_CHECK: 5000,        // Health check frequency
    METRICS_COLLECTION: 10000, // Metrics collection frequency
  },
  THRESHOLDS: {
    MIN_BITRATE: 500000,       // 500 Kbps minimum
    MAX_BITRATE: 10000000,     // 10 Mbps maximum
    MIN_FPS: 20,               // Minimum FPS
    MAX_LATENCY: 5000,         // Maximum latency (ms)
  },
  RETENTION: {
    METRICS_DETAILED: 3600000,  // 1 hour
    ALERTS: 604800000,          // 7 days
  }
};
```

## 🔌 API Reference

### Dashboard & Health
- `GET /api/monitor/dashboard` - Complete overview
- `GET /api/monitor/health` - Service health check

### Metrics
- `GET /api/monitor/metrics` - Current metrics
- `GET /api/monitor/metrics/summary` - Summary statistics
- `GET /api/monitor/metrics/history` - Historical data
- `GET /api/monitor/metrics/statistics` - Trends and stats

### Streams
- `GET /api/monitor/streams` - List all streams
- `GET /api/monitor/streams/:id` - Stream details
- `GET /api/monitor/streams/:id/history` - Stream history

### Alerts
- `GET /api/monitor/alerts` - Active alerts
- `GET /api/monitor/alerts/history` - Alert history
- `GET /api/monitor/alerts/stats` - Alert statistics
- `POST /api/monitor/alerts/:id/resolve` - Resolve alert

## 🧪 Testing

### Test Stream URLs

```
# HLS Streams
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8
https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8

# MP4 Videos
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4
```

### Triggering Test Alerts

Open browser console on composer.html:

```javascript
// Simulate poor quality to trigger alerts
socket.emit('monitoring:report-stream-metrics', {
  streamId: 'stream-1',
  metrics: {
    bitrate: 300000,    // Below threshold
    fps: 15,            // Below threshold
    frameDrops: 100,    // High
    latency: 8000       // Above threshold
  }
});
```

## 📝 Documentation

- **[MONITORING.md](MONITORING.md)** - Complete monitoring system documentation
- **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** - Detailed project overview with architecture

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Hemanth**
- GitHub: [@hemanthcodecrit50](https://github.com/hemanthcodecrit50)
- Repository: [amagi-multiview-monitering](https://github.com/hemanthcodecrit50/amagi-multiview-monitering)

## 🙏 Acknowledgments

- HLS.js for HLS playback
- Simple-peer for WebRTC connections
- Socket.IO for real-time communication
- Express for HTTP server
- SQLite for data persistence

---

**Need Help?** Check the documentation files or open an issue on GitHub.

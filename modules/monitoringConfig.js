/**
 * Monitoring Configuration
 * Defines monitoring intervals, thresholds, and alert rules
 */

module.exports = {
  // Monitoring intervals (in milliseconds)
  INTERVALS: {
    HEALTH_CHECK: 5000,          // Check stream health every 5 seconds
    METRICS_COLLECTION: 10000,   // Collect metrics every 10 seconds
    METRICS_AGGREGATION: 60000,  // Aggregate metrics every minute
    CLEANUP: 300000              // Cleanup old data every 5 minutes
  },

  // Health check thresholds
  THRESHOLDS: {
    // Stream status
    MAX_RECONNECT_ATTEMPTS: 3,
    CONNECTION_TIMEOUT: 30000,   // 30 seconds
    
    // Video quality
    MIN_BITRATE: 500000,         // 500 Kbps minimum
    MAX_BITRATE: 10000000,       // 10 Mbps maximum
    MIN_FPS: 20,                 // Minimum 20 FPS
    MAX_FPS: 60,                 // Maximum 60 FPS
    
    // Frame quality
    MAX_FRAME_DROP_RATE: 0.05,   // 5% max frame drop rate
    MAX_BLACK_FRAME_RATIO: 0.1,  // 10% max black frames
    MAX_FROZEN_FRAME_DURATION: 5000, // 5 seconds
    
    // Latency
    MAX_LATENCY: 5000,           // 5 seconds max latency
    MAX_BUFFER_DURATION: 10000,  // 10 seconds max buffer
    
    // Compositor performance
    MIN_COMPOSITOR_FPS: 20,      // Minimum compositor output FPS
    MAX_COMPOSITOR_LAG: 2000,    // 2 seconds max lag
    
    // WebRTC
    MAX_PACKET_LOSS: 0.05,       // 5% max packet loss
    MIN_PEER_CONNECTION_STATE_DURATION: 3000 // 3 seconds in failed state triggers alert
  },

  // Alert severity levels
  SEVERITY: {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical'
  },

  // Alert types
  ALERT_TYPES: {
    STREAM_DOWN: 'stream_down',
    STREAM_DEGRADED: 'stream_degraded',
    LOW_BITRATE: 'low_bitrate',
    HIGH_BITRATE: 'high_bitrate',
    LOW_FPS: 'low_fps',
    HIGH_FRAME_DROP: 'high_frame_drop',
    BLACK_FRAMES: 'black_frames',
    FROZEN_FRAMES: 'frozen_frames',
    HIGH_LATENCY: 'high_latency',
    CONNECTION_FAILED: 'connection_failed',
    COMPOSITOR_PERFORMANCE: 'compositor_performance',
    WEBRTC_FAILURE: 'webrtc_failure',
    PACKET_LOSS: 'packet_loss',
    VIEWER_DISCONNECTED: 'viewer_disconnected'
  },

  // Stream states
  STREAM_STATE: {
    INITIALIZING: 'initializing',
    CONNECTED: 'connected',
    BUFFERING: 'buffering',
    PLAYING: 'playing',
    PAUSED: 'paused',
    ERROR: 'error',
    DISCONNECTED: 'disconnected'
  },

  // Data retention periods (in milliseconds)
  RETENTION: {
    METRICS_DETAILED: 3600000,    // 1 hour of detailed metrics
    METRICS_AGGREGATED: 86400000, // 24 hours of aggregated metrics
    ALERTS: 604800000,            // 7 days of alerts
    EVENTS: 2592000000            // 30 days of events
  },

  // Metrics to track
  METRICS: {
    STREAM: [
      'bitrate',
      'fps',
      'resolution',
      'frameDrops',
      'blackFrames',
      'frozenFrames',
      'latency',
      'bufferDuration',
      'reconnectCount'
    ],
    COMPOSITOR: [
      'outputFps',
      'processingTime',
      'activeStreams',
      'gridLayout'
    ],
    WEBRTC: [
      'peersConnected',
      'bytesTransferred',
      'packetLoss',
      'jitter',
      'roundTripTime'
    ],
    SYSTEM: [
      'cpuUsage',
      'memoryUsage',
      'activeRooms',
      'totalViewers'
    ]
  },

  // Alert notification channels
  NOTIFICATION_CHANNELS: {
    WEBSOCKET: true,    // Send alerts via WebSocket
    CONSOLE: true,      // Log to console
    DATABASE: true,     // Store in database
    WEBHOOK: false,     // Send to external webhook
    EMAIL: false        // Send email notifications
  },

  // Webhook configuration (if enabled)
  WEBHOOK: {
    URL: process.env.MONITORING_WEBHOOK_URL || '',
    TIMEOUT: 5000,
    RETRY_ATTEMPTS: 3
  }
};

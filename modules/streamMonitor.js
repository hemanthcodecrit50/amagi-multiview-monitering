/**
 * Stream Monitor Module
 * Tracks individual stream health, quality metrics, and status
 */

const EventEmitter = require('events');
const config = require('./monitoringConfig');

class StreamMonitor extends EventEmitter {
  constructor(streamId, streamUrl) {
    super();
    this.streamId = streamId;
    this.streamUrl = streamUrl;
    this.state = config.STREAM_STATE.INITIALIZING;
    this.startTime = Date.now();
    this.lastUpdateTime = Date.now();
    
    // Current metrics
    this.metrics = {
      bitrate: 0,
      fps: 0,
      resolution: { width: 0, height: 0 },
      frameDrops: 0,
      blackFrames: 0,
      frozenFrames: 0,
      latency: 0,
      bufferDuration: 0,
      reconnectCount: 0,
      errorCount: 0,
      lastError: null
    };

    // Historical data (circular buffer)
    this.history = {
      bitrate: [],
      fps: [],
      frameDrops: [],
      maxHistorySize: 60 // Keep 60 data points
    };

    // Alert tracking
    this.activeAlerts = new Map();
    this.alertHistory = [];
  }

  /**
   * Update stream state
   */
  updateState(newState) {
    const oldState = this.state;
    this.state = newState;
    this.lastUpdateTime = Date.now();

    this.emit('state-change', {
      streamId: this.streamId,
      oldState,
      newState,
      timestamp: this.lastUpdateTime
    });

    // Check for alerts based on state
    if (newState === config.STREAM_STATE.ERROR) {
      this.raiseAlert(config.ALERT_TYPES.STREAM_DOWN, config.SEVERITY.CRITICAL);
    } else if (newState === config.STREAM_STATE.BUFFERING) {
      this.raiseAlert(config.ALERT_TYPES.STREAM_DEGRADED, config.SEVERITY.WARNING);
    }
  }

  /**
   * Update metrics from client-side monitoring
   */
  updateMetrics(newMetrics) {
    this.lastUpdateTime = Date.now();
    
    // Update current metrics
    Object.assign(this.metrics, newMetrics);

    // Add to history
    this.addToHistory('bitrate', this.metrics.bitrate);
    this.addToHistory('fps', this.metrics.fps);
    this.addToHistory('frameDrops', this.metrics.frameDrops);

    // Run health checks
    this.checkHealth();

    // Emit metrics update event
    this.emit('metrics-update', {
      streamId: this.streamId,
      metrics: this.metrics,
      timestamp: this.lastUpdateTime
    });
  }

  /**
   * Add data point to history
   */
  addToHistory(metric, value) {
    if (!this.history[metric]) {
      this.history[metric] = [];
    }

    this.history[metric].push({
      value,
      timestamp: Date.now()
    });

    // Keep only last N points
    if (this.history[metric].length > this.history.maxHistorySize) {
      this.history[metric].shift();
    }
  }

  /**
   * Run health checks and raise alerts if needed
   */
  checkHealth() {
    const { bitrate, fps, frameDrops, latency } = this.metrics;
    const thresholds = config.THRESHOLDS;

    // Check bitrate
    if (bitrate > 0 && bitrate < thresholds.MIN_BITRATE) {
      this.raiseAlert(config.ALERT_TYPES.LOW_BITRATE, config.SEVERITY.WARNING, {
        current: bitrate,
        threshold: thresholds.MIN_BITRATE
      });
    } else if (bitrate > thresholds.MAX_BITRATE) {
      this.raiseAlert(config.ALERT_TYPES.HIGH_BITRATE, config.SEVERITY.WARNING, {
        current: bitrate,
        threshold: thresholds.MAX_BITRATE
      });
    } else {
      this.clearAlert(config.ALERT_TYPES.LOW_BITRATE);
      this.clearAlert(config.ALERT_TYPES.HIGH_BITRATE);
    }

    // Check FPS
    if (fps > 0 && fps < thresholds.MIN_FPS) {
      this.raiseAlert(config.ALERT_TYPES.LOW_FPS, config.SEVERITY.WARNING, {
        current: fps,
        threshold: thresholds.MIN_FPS
      });
    } else {
      this.clearAlert(config.ALERT_TYPES.LOW_FPS);
    }

    // Check frame drops
    const frameDropRate = this.calculateFrameDropRate();
    if (frameDropRate > thresholds.MAX_FRAME_DROP_RATE) {
      this.raiseAlert(config.ALERT_TYPES.HIGH_FRAME_DROP, config.SEVERITY.ERROR, {
        current: frameDropRate,
        threshold: thresholds.MAX_FRAME_DROP_RATE
      });
    } else {
      this.clearAlert(config.ALERT_TYPES.HIGH_FRAME_DROP);
    }

    // Check latency
    if (latency > thresholds.MAX_LATENCY) {
      this.raiseAlert(config.ALERT_TYPES.HIGH_LATENCY, config.SEVERITY.WARNING, {
        current: latency,
        threshold: thresholds.MAX_LATENCY
      });
    } else {
      this.clearAlert(config.ALERT_TYPES.HIGH_LATENCY);
    }
  }

  /**
   * Calculate frame drop rate from history
   */
  calculateFrameDropRate() {
    if (this.history.frameDrops.length < 2) return 0;

    const recent = this.history.frameDrops.slice(-10);
    const totalFrames = recent.reduce((sum, point) => sum + point.value, 0);
    const droppedFrames = this.metrics.frameDrops;

    return totalFrames > 0 ? droppedFrames / totalFrames : 0;
  }

  /**
   * Raise an alert
   */
  raiseAlert(type, severity, details = {}) {
    const alertKey = `${type}`;
    
    // Check if alert is already active
    if (this.activeAlerts.has(alertKey)) {
      return;
    }

    const alert = {
      id: `${this.streamId}-${type}-${Date.now()}`,
      streamId: this.streamId,
      type,
      severity,
      details,
      timestamp: Date.now(),
      resolved: false
    };

    this.activeAlerts.set(alertKey, alert);
    this.alertHistory.push(alert);

    this.emit('alert', alert);
  }

  /**
   * Clear an alert
   */
  clearAlert(type) {
    const alertKey = `${type}`;
    
    if (this.activeAlerts.has(alertKey)) {
      const alert = this.activeAlerts.get(alertKey);
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      
      this.activeAlerts.delete(alertKey);
      this.emit('alert-cleared', alert);
    }
  }

  /**
   * Record an error
   */
  recordError(error) {
    this.metrics.errorCount++;
    this.metrics.lastError = {
      message: error.message || error,
      timestamp: Date.now()
    };

    this.emit('error', {
      streamId: this.streamId,
      error: this.metrics.lastError
    });
  }

  /**
   * Get current status summary
   */
  getStatus() {
    return {
      streamId: this.streamId,
      streamUrl: this.streamUrl,
      state: this.state,
      uptime: Date.now() - this.startTime,
      lastUpdate: this.lastUpdateTime,
      metrics: this.metrics,
      activeAlerts: Array.from(this.activeAlerts.values()),
      health: this.calculateHealthScore()
    };
  }

  /**
   * Calculate overall health score (0-100)
   */
  calculateHealthScore() {
    let score = 100;
    const thresholds = config.THRESHOLDS;

    // Deduct points for issues
    if (this.state === config.STREAM_STATE.ERROR) return 0;
    if (this.state === config.STREAM_STATE.DISCONNECTED) return 10;
    if (this.state === config.STREAM_STATE.BUFFERING) score -= 20;

    // Check metrics
    if (this.metrics.bitrate < thresholds.MIN_BITRATE) score -= 15;
    if (this.metrics.fps < thresholds.MIN_FPS) score -= 15;
    if (this.calculateFrameDropRate() > thresholds.MAX_FRAME_DROP_RATE) score -= 20;
    if (this.metrics.latency > thresholds.MAX_LATENCY) score -= 10;

    // Deduct for active alerts
    score -= this.activeAlerts.size * 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get metrics history
   */
  getHistory(metric, limit = 60) {
    if (!this.history[metric]) return [];
    return this.history[metric].slice(-limit);
  }

  /**
   * Cleanup and destroy monitor
   */
  destroy() {
    this.removeAllListeners();
    this.history = {};
    this.activeAlerts.clear();
  }
}

module.exports = StreamMonitor;

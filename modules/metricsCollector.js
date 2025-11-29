/**
 * Metrics Collector Module
 * Aggregates and stores metrics from all stream monitors
 */

const EventEmitter = require('events');
const config = require('./monitoringConfig');

class MetricsCollector extends EventEmitter {
  constructor() {
    super();
    this.streams = new Map(); // streamId => StreamMonitor
    this.compositorMetrics = {
      outputFps: 0,
      processingTime: 0,
      activeStreams: 0,
      gridLayout: '1x1'
    };
    this.webrtcMetrics = {
      peersConnected: 0,
      bytesTransferred: 0,
      packetLoss: 0,
      jitter: 0,
      roundTripTime: 0
    };
    this.systemMetrics = {
      cpuUsage: 0,
      memoryUsage: 0,
      activeRooms: 0,
      totalViewers: 0
    };

    // Aggregated metrics storage
    this.aggregatedMetrics = {
      hourly: [],
      daily: []
    };

    this.collectionInterval = null;
    this.aggregationInterval = null;
  }

  /**
   * Register a stream monitor
   */
  registerStream(streamMonitor) {
    this.streams.set(streamMonitor.streamId, streamMonitor);

    // Listen to stream events
    streamMonitor.on('metrics-update', (data) => {
      this.emit('stream-metrics', data);
    });

    streamMonitor.on('alert', (alert) => {
      this.emit('alert', alert);
    });

    streamMonitor.on('state-change', (data) => {
      this.emit('stream-state-change', data);
    });
  }

  /**
   * Unregister a stream monitor
   */
  unregisterStream(streamId) {
    const monitor = this.streams.get(streamId);
    if (monitor) {
      monitor.removeAllListeners();
      this.streams.delete(streamId);
    }
  }

  /**
   * Update compositor metrics
   */
  updateCompositorMetrics(metrics) {
    Object.assign(this.compositorMetrics, metrics);
    this.compositorMetrics.activeStreams = this.streams.size;
    
    this.emit('compositor-metrics', {
      ...this.compositorMetrics,
      timestamp: Date.now()
    });

    // Check compositor health
    if (this.compositorMetrics.outputFps < config.THRESHOLDS.MIN_COMPOSITOR_FPS) {
      this.emit('alert', {
        id: `compositor-fps-${Date.now()}`,
        type: config.ALERT_TYPES.COMPOSITOR_PERFORMANCE,
        severity: config.SEVERITY.WARNING,
        details: {
          currentFps: this.compositorMetrics.outputFps,
          threshold: config.THRESHOLDS.MIN_COMPOSITOR_FPS
        },
        timestamp: Date.now()
      });
    }
  }

  /**
   * Update WebRTC metrics
   */
  updateWebRTCMetrics(metrics) {
    Object.assign(this.webrtcMetrics, metrics);
    
    this.emit('webrtc-metrics', {
      ...this.webrtcMetrics,
      timestamp: Date.now()
    });

    // Check WebRTC health
    if (this.webrtcMetrics.packetLoss > config.THRESHOLDS.MAX_PACKET_LOSS) {
      this.emit('alert', {
        id: `webrtc-packetloss-${Date.now()}`,
        type: config.ALERT_TYPES.PACKET_LOSS,
        severity: config.SEVERITY.ERROR,
        details: {
          currentLoss: this.webrtcMetrics.packetLoss,
          threshold: config.THRESHOLDS.MAX_PACKET_LOSS
        },
        timestamp: Date.now()
      });
    }
  }

  /**
   * Update system metrics
   */
  updateSystemMetrics(metrics) {
    Object.assign(this.systemMetrics, metrics);
    
    this.emit('system-metrics', {
      ...this.systemMetrics,
      timestamp: Date.now()
    });
  }

  /**
   * Get all current metrics
   */
  getAllMetrics() {
    const streamMetrics = [];
    this.streams.forEach((monitor, streamId) => {
      streamMetrics.push(monitor.getStatus());
    });

    return {
      timestamp: Date.now(),
      streams: streamMetrics,
      compositor: this.compositorMetrics,
      webrtc: this.webrtcMetrics,
      system: this.systemMetrics,
      summary: this.calculateSummary()
    };
  }

  /**
   * Get metrics for a specific stream
   */
  getStreamMetrics(streamId) {
    const monitor = this.streams.get(streamId);
    return monitor ? monitor.getStatus() : null;
  }

  /**
   * Get all active alerts across all streams
   */
  getAllAlerts() {
    const alerts = [];
    this.streams.forEach((monitor) => {
      alerts.push(...monitor.activeAlerts.values());
    });
    return alerts;
  }

  /**
   * Calculate summary statistics
   */
  calculateSummary() {
    const totalStreams = this.streams.size;
    let healthyStreams = 0;
    let degradedStreams = 0;
    let errorStreams = 0;
    let totalAlerts = 0;
    let avgHealthScore = 0;

    this.streams.forEach((monitor) => {
      const health = monitor.calculateHealthScore();
      avgHealthScore += health;
      
      if (health >= 80) healthyStreams++;
      else if (health >= 50) degradedStreams++;
      else errorStreams++;

      totalAlerts += monitor.activeAlerts.size;
    });

    if (totalStreams > 0) {
      avgHealthScore = Math.round(avgHealthScore / totalStreams);
    }

    return {
      totalStreams,
      healthyStreams,
      degradedStreams,
      errorStreams,
      totalAlerts,
      avgHealthScore,
      overallStatus: this.determineOverallStatus(avgHealthScore, errorStreams)
    };
  }

  /**
   * Determine overall system status
   */
  determineOverallStatus(avgHealthScore, errorStreams) {
    if (errorStreams > 0) return 'critical';
    if (avgHealthScore >= 80) return 'healthy';
    if (avgHealthScore >= 50) return 'degraded';
    return 'warning';
  }

  /**
   * Aggregate metrics for long-term storage
   */
  aggregateMetrics() {
    const current = this.getAllMetrics();
    
    const aggregated = {
      timestamp: Date.now(),
      summary: current.summary,
      compositor: { ...this.compositorMetrics },
      webrtc: { ...this.webrtcMetrics },
      system: { ...this.systemMetrics },
      streamCount: this.streams.size,
      alertCount: this.getAllAlerts().length
    };

    // Add to hourly aggregation
    this.aggregatedMetrics.hourly.push(aggregated);

    // Keep only retention period worth of data
    const hourlyRetention = config.RETENTION.METRICS_AGGREGATED;
    const cutoff = Date.now() - hourlyRetention;
    this.aggregatedMetrics.hourly = this.aggregatedMetrics.hourly.filter(
      m => m.timestamp > cutoff
    );

    this.emit('metrics-aggregated', aggregated);

    return aggregated;
  }

  /**
   * Get historical metrics
   */
  getHistoricalMetrics(hours = 1) {
    const cutoff = Date.now() - (hours * 3600000);
    return this.aggregatedMetrics.hourly.filter(m => m.timestamp > cutoff);
  }

  /**
   * Get stream history
   */
  getStreamHistory(streamId, metric, limit = 60) {
    const monitor = this.streams.get(streamId);
    return monitor ? monitor.getHistory(metric, limit) : [];
  }

  /**
   * Start collecting metrics
   */
  startCollection() {
    if (this.collectionInterval) return;

    // Collect detailed metrics
    this.collectionInterval = setInterval(() => {
      this.emit('metrics-collected', this.getAllMetrics());
    }, config.INTERVALS.METRICS_COLLECTION);

    // Aggregate metrics periodically
    this.aggregationInterval = setInterval(() => {
      this.aggregateMetrics();
    }, config.INTERVALS.METRICS_AGGREGATION);

    console.log('[MetricsCollector] Started metrics collection');
  }

  /**
   * Stop collecting metrics
   */
  stopCollection() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }

    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
      this.aggregationInterval = null;
    }

    console.log('[MetricsCollector] Stopped metrics collection');
  }

  /**
   * Cleanup old data
   */
  cleanup() {
    const now = Date.now();

    // Cleanup aggregated metrics
    this.aggregatedMetrics.hourly = this.aggregatedMetrics.hourly.filter(
      m => (now - m.timestamp) < config.RETENTION.METRICS_AGGREGATED
    );

    // Cleanup resolved alerts from stream monitors
    this.streams.forEach((monitor) => {
      const cutoff = now - config.RETENTION.ALERTS;
      monitor.alertHistory = monitor.alertHistory.filter(
        alert => alert.timestamp > cutoff
      );
    });
  }

  /**
   * Get statistics for export
   */
  getStatistics() {
    const metrics = this.getAllMetrics();
    const alerts = this.getAllAlerts();
    const history = this.getHistoricalMetrics(1);

    return {
      current: metrics,
      alerts: {
        total: alerts.length,
        bySeverity: this.groupBySeverity(alerts),
        byType: this.groupByType(alerts)
      },
      trends: this.calculateTrends(history)
    };
  }

  /**
   * Group alerts by severity
   */
  groupBySeverity(alerts) {
    const grouped = {};
    alerts.forEach(alert => {
      grouped[alert.severity] = (grouped[alert.severity] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Group alerts by type
   */
  groupByType(alerts) {
    const grouped = {};
    alerts.forEach(alert => {
      grouped[alert.type] = (grouped[alert.type] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Calculate trends from historical data
   */
  calculateTrends(history) {
    if (history.length < 2) return null;

    const latest = history[history.length - 1];
    const previous = history[0];

    return {
      streamCount: {
        current: latest.streamCount,
        change: latest.streamCount - previous.streamCount
      },
      alertCount: {
        current: latest.alertCount,
        change: latest.alertCount - previous.alertCount
      },
      healthScore: {
        current: latest.summary.avgHealthScore,
        change: latest.summary.avgHealthScore - previous.summary.avgHealthScore
      }
    };
  }

  /**
   * Cleanup and destroy collector
   */
  destroy() {
    this.stopCollection();
    this.streams.forEach(monitor => monitor.destroy());
    this.streams.clear();
    this.removeAllListeners();
  }
}

module.exports = MetricsCollector;

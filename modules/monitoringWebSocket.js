/**
 * Monitoring WebSocket Handler
 * Handles real-time monitoring updates via WebSocket
 */

const config = require('./monitoringConfig');

class MonitoringWebSocket {
  constructor(io, metricsCollector, alertManager) {
    this.io = io;
    this.metricsCollector = metricsCollector;
    this.alertManager = alertManager;
    this.monitoringClients = new Set();
  }

  /**
   * Initialize monitoring WebSocket handlers
   */
  initialize() {
    // Listen to metrics collector events
    this.metricsCollector.on('metrics-collected', (metrics) => {
      this.broadcastMetrics(metrics);
    });

    this.metricsCollector.on('stream-metrics', (data) => {
      this.broadcastStreamMetrics(data);
    });

    this.metricsCollector.on('stream-state-change', (data) => {
      this.broadcastStreamStateChange(data);
    });

    this.metricsCollector.on('compositor-metrics', (data) => {
      this.broadcastCompositorMetrics(data);
    });

    this.metricsCollector.on('webrtc-metrics', (data) => {
      this.broadcastWebRTCMetrics(data);
    });

    this.metricsCollector.on('system-metrics', (data) => {
      this.broadcastSystemMetrics(data);
    });

    this.metricsCollector.on('metrics-aggregated', (data) => {
      this.broadcastAggregatedMetrics(data);
    });

    // Listen to alert manager events
    this.alertManager.on('alert-created', (alert) => {
      this.broadcastAlert(alert);
    });

    this.alertManager.on('alert-resolved', (alert) => {
      this.broadcastAlertResolved(alert);
    });

    console.log('[MonitoringWS] Monitoring WebSocket initialized');
  }

  /**
   * Setup socket handlers for monitoring clients
   */
  setupSocketHandlers(socket) {
    // Client subscribes to monitoring updates
    socket.on('monitoring:subscribe', () => {
      this.monitoringClients.add(socket.id);
      socket.join('monitoring');
      
      console.log(`[MonitoringWS] Client ${socket.id} subscribed to monitoring`);

      // Send current state immediately
      const currentMetrics = this.metricsCollector.getAllMetrics();
      const activeAlerts = this.alertManager.getActiveAlerts();
      
      socket.emit('monitoring:initial-state', {
        metrics: currentMetrics,
        alerts: activeAlerts,
        timestamp: Date.now()
      });
    });

    // Client unsubscribes from monitoring
    socket.on('monitoring:unsubscribe', () => {
      this.monitoringClients.delete(socket.id);
      socket.leave('monitoring');
      console.log(`[MonitoringWS] Client ${socket.id} unsubscribed from monitoring`);
    });

    // Client subscribes to specific stream monitoring
    socket.on('monitoring:subscribe-stream', ({ streamId }) => {
      socket.join(`monitor:stream:${streamId}`);
      console.log(`[MonitoringWS] Client ${socket.id} subscribed to stream ${streamId}`);

      // Send current stream state
      const streamMetrics = this.metricsCollector.getStreamMetrics(streamId);
      if (streamMetrics) {
        socket.emit('monitoring:stream-state', streamMetrics);
      }
    });

    // Client unsubscribes from specific stream
    socket.on('monitoring:unsubscribe-stream', ({ streamId }) => {
      socket.leave(`monitor:stream:${streamId}`);
      console.log(`[MonitoringWS] Client ${socket.id} unsubscribed from stream ${streamId}`);
    });

    // Client requests metrics snapshot
    socket.on('monitoring:request-metrics', () => {
      const metrics = this.metricsCollector.getAllMetrics();
      socket.emit('monitoring:metrics-snapshot', metrics);
    });

    // Client requests alert snapshot
    socket.on('monitoring:request-alerts', () => {
      const alerts = this.alertManager.getActiveAlerts();
      socket.emit('monitoring:alerts-snapshot', alerts);
    });

    // Client reports stream metrics (from client-side monitoring)
    socket.on('monitoring:report-stream-metrics', ({ streamId, metrics }) => {
      const monitor = this.metricsCollector.streams.get(streamId);
      if (monitor) {
        monitor.updateMetrics(metrics);
      }
    });

    // Client reports compositor metrics
    socket.on('monitoring:report-compositor-metrics', (metrics) => {
      this.metricsCollector.updateCompositorMetrics(metrics);
    });

    // Client reports WebRTC metrics
    socket.on('monitoring:report-webrtc-metrics', (metrics) => {
      this.metricsCollector.updateWebRTCMetrics(metrics);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      this.monitoringClients.delete(socket.id);
    });
  }

  /**
   * Broadcast complete metrics update
   */
  broadcastMetrics(metrics) {
    this.io.to('monitoring').emit('monitoring:metrics-update', {
      type: 'full-metrics',
      data: metrics,
      timestamp: Date.now()
    });
  }

  /**
   * Broadcast stream-specific metrics
   */
  broadcastStreamMetrics(data) {
    // Send to monitoring room
    this.io.to('monitoring').emit('monitoring:stream-metrics', data);
    
    // Send to stream-specific subscribers
    this.io.to(`monitor:stream:${data.streamId}`).emit('monitoring:stream-update', data);
  }

  /**
   * Broadcast stream state change
   */
  broadcastStreamStateChange(data) {
    this.io.to('monitoring').emit('monitoring:stream-state-change', data);
    this.io.to(`monitor:stream:${data.streamId}`).emit('monitoring:state-change', data);
  }

  /**
   * Broadcast compositor metrics
   */
  broadcastCompositorMetrics(data) {
    this.io.to('monitoring').emit('monitoring:compositor-metrics', data);
  }

  /**
   * Broadcast WebRTC metrics
   */
  broadcastWebRTCMetrics(data) {
    this.io.to('monitoring').emit('monitoring:webrtc-metrics', data);
  }

  /**
   * Broadcast system metrics
   */
  broadcastSystemMetrics(data) {
    this.io.to('monitoring').emit('monitoring:system-metrics', data);
  }

  /**
   * Broadcast aggregated metrics
   */
  broadcastAggregatedMetrics(data) {
    this.io.to('monitoring').emit('monitoring:metrics-aggregated', data);
  }

  /**
   * Broadcast new alert
   */
  broadcastAlert(alert) {
    // Send to all monitoring clients
    this.io.to('monitoring').emit('monitoring:alert', alert);

    // Send to stream-specific subscribers if applicable
    if (alert.streamId) {
      this.io.to(`monitor:stream:${alert.streamId}`).emit('monitoring:stream-alert', alert);
    }

    // Send notification based on severity
    if (alert.severity === config.SEVERITY.CRITICAL) {
      this.io.emit('monitoring:critical-alert', alert);
    }
  }

  /**
   * Broadcast alert resolution
   */
  broadcastAlertResolved(alert) {
    this.io.to('monitoring').emit('monitoring:alert-resolved', alert);
    
    if (alert.streamId) {
      this.io.to(`monitor:stream:${alert.streamId}`).emit('monitoring:stream-alert-resolved', alert);
    }
  }

  /**
   * Broadcast custom monitoring event
   */
  broadcastEvent(eventType, data) {
    this.io.to('monitoring').emit('monitoring:event', {
      type: eventType,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get connected monitoring clients count
   */
  getMonitoringClientsCount() {
    return this.monitoringClients.size;
  }

  /**
   * Send health summary to all clients
   */
  broadcastHealthSummary() {
    const summary = this.metricsCollector.calculateSummary();
    const alerts = this.alertManager.getActiveAlerts();

    this.io.to('monitoring').emit('monitoring:health-summary', {
      summary,
      alertCount: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === config.SEVERITY.CRITICAL).length,
      timestamp: Date.now()
    });
  }

  /**
   * Cleanup
   */
  destroy() {
    this.monitoringClients.clear();
    this.metricsCollector.removeAllListeners();
    this.alertManager.removeAllListeners();
  }
}

module.exports = MonitoringWebSocket;

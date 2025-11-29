/**
 * Alert Manager Module
 * Handles alert creation, notification, and delivery
 */

const EventEmitter = require('events');
const config = require('./monitoringConfig');

class AlertManager extends EventEmitter {
  constructor(io) {
    super();
    this.io = io;
    this.alerts = new Map(); // alertId => alert
    this.alertHistory = [];
    this.notificationChannels = config.NOTIFICATION_CHANNELS;
  }

  /**
   * Process and route an alert
   */
  processAlert(alert) {
    // Store alert
    this.alerts.set(alert.id, alert);
    this.alertHistory.push(alert);

    // Log to console if enabled
    if (this.notificationChannels.CONSOLE) {
      this.logToConsole(alert);
    }

    // Send via WebSocket if enabled
    if (this.notificationChannels.WEBSOCKET && this.io) {
      this.sendViaWebSocket(alert);
    }

    // Emit event for external handlers
    this.emit('alert-created', alert);

    return alert;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    alert.resolved = true;
    alert.resolvedAt = Date.now();

    // Notify resolution
    if (this.notificationChannels.CONSOLE) {
      console.log(`[ALERT RESOLVED] ${alert.type} - ${alert.id}`);
    }

    if (this.notificationChannels.WEBSOCKET && this.io) {
      this.io.emit('alert-resolved', alert);
    }

    this.alerts.delete(alertId);
    this.emit('alert-resolved', alert);

    return alert;
  }

  /**
   * Log alert to console with formatting
   */
  logToConsole(alert) {
    const timestamp = new Date(alert.timestamp).toISOString();
    const severityColors = {
      [config.SEVERITY.INFO]: '\x1b[36m',      // Cyan
      [config.SEVERITY.WARNING]: '\x1b[33m',   // Yellow
      [config.SEVERITY.ERROR]: '\x1b[31m',     // Red
      [config.SEVERITY.CRITICAL]: '\x1b[35m'   // Magenta
    };

    const color = severityColors[alert.severity] || '\x1b[0m';
    const reset = '\x1b[0m';

    console.log(
      `${color}[ALERT ${alert.severity.toUpperCase()}]${reset} ` +
      `${timestamp} - ${alert.type} - Stream: ${alert.streamId || 'N/A'}`
    );
    
    if (alert.details && Object.keys(alert.details).length > 0) {
      console.log('  Details:', JSON.stringify(alert.details, null, 2));
    }
  }

  /**
   * Send alert via WebSocket
   */
  sendViaWebSocket(alert) {
    // Broadcast to all monitoring clients
    this.io.emit('monitoring:alert', alert);

    // Send to specific room if stream-related
    if (alert.streamId) {
      this.io.to(`monitor:${alert.streamId}`).emit('stream:alert', alert);
    }
  }

  /**
   * Send alert via webhook (if configured)
   */
  async sendViaWebhook(alert) {
    if (!this.notificationChannels.WEBHOOK || !config.WEBHOOK.URL) {
      return;
    }

    const payload = {
      alert: alert,
      timestamp: Date.now(),
      source: 'multiview-monitoring'
    };

    // Implementation would use fetch or axios
    // For now, just emit event
    this.emit('webhook-send', payload);
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts() {
    return Array.from(this.alerts.values());
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity) {
    return this.getActiveAlerts().filter(alert => alert.severity === severity);
  }

  /**
   * Get alerts by type
   */
  getAlertsByType(type) {
    return this.getActiveAlerts().filter(alert => alert.type === type);
  }

  /**
   * Get alerts for a specific stream
   */
  getStreamAlerts(streamId) {
    return this.getActiveAlerts().filter(alert => alert.streamId === streamId);
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 100, filters = {}) {
    let history = [...this.alertHistory];

    // Apply filters
    if (filters.severity) {
      history = history.filter(a => a.severity === filters.severity);
    }
    if (filters.type) {
      history = history.filter(a => a.type === filters.type);
    }
    if (filters.streamId) {
      history = history.filter(a => a.streamId === filters.streamId);
    }
    if (filters.startTime) {
      history = history.filter(a => a.timestamp >= filters.startTime);
    }
    if (filters.endTime) {
      history = history.filter(a => a.timestamp <= filters.endTime);
    }

    // Sort by timestamp descending
    history.sort((a, b) => b.timestamp - a.timestamp);

    // Limit results
    return history.slice(0, limit);
  }

  /**
   * Get alert statistics
   */
  getAlertStats() {
    const active = this.getActiveAlerts();
    const history = this.alertHistory;

    return {
      activeCount: active.length,
      totalCount: history.length,
      bySeverity: {
        [config.SEVERITY.INFO]: active.filter(a => a.severity === config.SEVERITY.INFO).length,
        [config.SEVERITY.WARNING]: active.filter(a => a.severity === config.SEVERITY.WARNING).length,
        [config.SEVERITY.ERROR]: active.filter(a => a.severity === config.SEVERITY.ERROR).length,
        [config.SEVERITY.CRITICAL]: active.filter(a => a.severity === config.SEVERITY.CRITICAL).length
      },
      byType: this.groupByType(active),
      recentResolutions: this.getRecentResolutions(10)
    };
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
   * Get recently resolved alerts
   */
  getRecentResolutions(limit = 10) {
    return this.alertHistory
      .filter(a => a.resolved)
      .sort((a, b) => b.resolvedAt - a.resolvedAt)
      .slice(0, limit);
  }

  /**
   * Cleanup old alerts from history
   */
  cleanup() {
    const cutoff = Date.now() - config.RETENTION.ALERTS;
    this.alertHistory = this.alertHistory.filter(alert => alert.timestamp > cutoff);
  }

  /**
   * Destroy alert manager
   */
  destroy() {
    this.alerts.clear();
    this.alertHistory = [];
    this.removeAllListeners();
  }
}

module.exports = AlertManager;

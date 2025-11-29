/**
 * Monitoring Service
 * Main orchestrator for the monitoring system
 */

const StreamMonitor = require('./streamMonitor');
const MetricsCollector = require('./metricsCollector');
const AlertManager = require('./alertManager');
const MonitoringDatabase = require('./monitoringDatabase');
const MonitoringWebSocket = require('./monitoringWebSocket');
const createMonitoringRoutes = require('./monitoringRoutes');
const config = require('./monitoringConfig');

class MonitoringService {
  constructor(io, app) {
    this.io = io;
    this.app = app;
    
    // Initialize components
    this.metricsCollector = new MetricsCollector();
    this.alertManager = new AlertManager(io);
    this.database = new MonitoringDatabase();
    this.websocket = new MonitoringWebSocket(io, this.metricsCollector, this.alertManager);
    
    // Cleanup interval
    this.cleanupInterval = null;
  }

  /**
   * Initialize the monitoring service
   */
  async initialize() {
    try {
      // Initialize database
      if (config.NOTIFICATION_CHANNELS.DATABASE) {
        await this.database.initialize();
        this.setupDatabasePersistence();
      }

      // Initialize WebSocket handlers
      this.websocket.initialize();

      // Setup monitoring API routes
      const monitoringRoutes = createMonitoringRoutes(
        this.metricsCollector,
        this.alertManager
      );
      this.app.use('/api/monitor', monitoringRoutes);

      // Start metrics collection
      this.metricsCollector.startCollection();

      // Setup cleanup interval
      this.cleanupInterval = setInterval(() => {
        this.performCleanup();
      }, config.INTERVALS.CLEANUP);

      console.log('[MonitoringService] Monitoring service initialized');
      console.log('[MonitoringService] API available at /api/monitor');
    } catch (error) {
      console.error('[MonitoringService] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Setup database persistence for metrics and alerts
   */
  setupDatabasePersistence() {
    // Save stream metrics to database
    this.metricsCollector.on('stream-metrics', async (data) => {
      try {
        const monitor = this.metricsCollector.streams.get(data.streamId);
        if (monitor) {
          await this.database.saveStreamMetrics(data.streamId, {
            ...data.metrics,
            state: monitor.state,
            healthScore: monitor.calculateHealthScore()
          });
        }
      } catch (error) {
        console.error('[MonitoringService] Error saving stream metrics:', error);
      }
    });

    // Save alerts to database
    this.alertManager.on('alert-created', async (alert) => {
      try {
        await this.database.saveAlert(alert);
      } catch (error) {
        console.error('[MonitoringService] Error saving alert:', error);
      }
    });

    // Update alert resolution in database
    this.alertManager.on('alert-resolved', async (alert) => {
      try {
        await this.database.saveAlert(alert);
      } catch (error) {
        console.error('[MonitoringService] Error updating resolved alert:', error);
      }
    });

    // Save compositor metrics
    this.metricsCollector.on('compositor-metrics', async (data) => {
      try {
        await this.database.saveCompositorMetrics(data);
      } catch (error) {
        console.error('[MonitoringService] Error saving compositor metrics:', error);
      }
    });

    // Save system metrics
    this.metricsCollector.on('system-metrics', async (data) => {
      try {
        await this.database.saveSystemMetrics(data);
      } catch (error) {
        console.error('[MonitoringService] Error saving system metrics:', error);
      }
    });
  }

  /**
   * Register a new stream for monitoring
   */
  registerStream(streamId, streamUrl, roomId = null) {
    const monitor = new StreamMonitor(streamId, streamUrl);
    this.metricsCollector.registerStream(monitor);

    // Save to database
    if (config.NOTIFICATION_CHANNELS.DATABASE) {
      this.database.saveStream(streamId, streamUrl, roomId).catch(err => {
        console.error('[MonitoringService] Error saving stream:', err);
      });

      this.database.saveEvent('stream_registered', streamId, roomId, {
        streamUrl
      }).catch(err => {
        console.error('[MonitoringService] Error saving event:', err);
      });
    }

    console.log(`[MonitoringService] Registered stream ${streamId} for monitoring`);
    
    return monitor;
  }

  /**
   * Unregister a stream from monitoring
   */
  unregisterStream(streamId) {
    this.metricsCollector.unregisterStream(streamId);

    // Save event to database
    if (config.NOTIFICATION_CHANNELS.DATABASE) {
      this.database.saveEvent('stream_unregistered', streamId, null, {}).catch(err => {
        console.error('[MonitoringService] Error saving event:', err);
      });
    }

    console.log(`[MonitoringService] Unregistered stream ${streamId} from monitoring`);
  }

  /**
   * Setup socket handlers for a new connection
   */
  setupSocketHandlers(socket) {
    this.websocket.setupSocketHandlers(socket);
  }

  /**
   * Update system-level metrics
   */
  updateSystemMetrics(activeRooms, totalViewers) {
    const memUsage = process.memoryUsage();
    
    this.metricsCollector.updateSystemMetrics({
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
      memoryUsage: memUsage.heapUsed / memUsage.heapTotal,
      activeRooms,
      totalViewers
    });
  }

  /**
   * Get monitoring dashboard data
   */
  getDashboardData() {
    return {
      metrics: this.metricsCollector.getAllMetrics(),
      alerts: this.alertManager.getActiveAlerts(),
      statistics: this.metricsCollector.getStatistics(),
      alertStats: this.alertManager.getAlertStats()
    };
  }

  /**
   * Perform cleanup of old data
   */
  async performCleanup() {
    try {
      // Cleanup in-memory data
      this.metricsCollector.cleanup();
      this.alertManager.cleanup();

      // Cleanup database
      if (config.NOTIFICATION_CHANNELS.DATABASE) {
        await this.database.cleanup();
      }

      console.log('[MonitoringService] Cleanup completed');
    } catch (error) {
      console.error('[MonitoringService] Cleanup error:', error);
    }
  }

  /**
   * Get service statistics
   */
  getServiceStats() {
    return {
      monitoredStreams: this.metricsCollector.streams.size,
      activeAlerts: this.alertManager.alerts.size,
      monitoringClients: this.websocket.getMonitoringClientsCount(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }

  /**
   * Shutdown the monitoring service
   */
  async shutdown() {
    console.log('[MonitoringService] Shutting down...');

    // Stop cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Stop metrics collection
    this.metricsCollector.stopCollection();

    // Cleanup components
    this.websocket.destroy();
    this.metricsCollector.destroy();
    this.alertManager.destroy();

    // Close database
    if (config.NOTIFICATION_CHANNELS.DATABASE) {
      await this.database.close();
    }

    console.log('[MonitoringService] Shutdown complete');
  }
}

module.exports = MonitoringService;

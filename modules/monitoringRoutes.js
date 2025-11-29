/**
 * Monitoring API Routes
 * REST API endpoints for accessing monitoring data
 */

const express = require('express');
const router = express.Router();

/**
 * Initialize monitoring routes
 */
function createMonitoringRoutes(metricsCollector, alertManager) {
  
  // ===== Dashboard Overview =====
  
  /**
   * GET /api/monitor/dashboard
   * Get complete dashboard overview
   */
  router.get('/dashboard', (req, res) => {
    try {
      const metrics = metricsCollector.getAllMetrics();
      const alerts = alertManager.getActiveAlerts();
      const stats = alertManager.getAlertStats();

      res.json({
        success: true,
        data: {
          metrics,
          alerts: alerts.slice(0, 20), // Latest 20 alerts
          alertStats: stats,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ===== Metrics Endpoints =====

  /**
   * GET /api/monitor/metrics
   * Get current metrics for all streams
   */
  router.get('/metrics', (req, res) => {
    try {
      const metrics = metricsCollector.getAllMetrics();
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/monitor/metrics/summary
   * Get summary statistics
   */
  router.get('/metrics/summary', (req, res) => {
    try {
      const summary = metricsCollector.calculateSummary();
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/monitor/metrics/history
   * Get historical aggregated metrics
   */
  router.get('/metrics/history', (req, res) => {
    try {
      const hours = parseInt(req.query.hours) || 1;
      const history = metricsCollector.getHistoricalMetrics(hours);
      
      res.json({
        success: true,
        data: {
          hours,
          dataPoints: history.length,
          metrics: history
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/monitor/metrics/statistics
   * Get detailed statistics and trends
   */
  router.get('/metrics/statistics', (req, res) => {
    try {
      const stats = metricsCollector.getStatistics();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ===== Stream-Specific Endpoints =====

  /**
   * GET /api/monitor/streams
   * Get list of all monitored streams
   */
  router.get('/streams', (req, res) => {
    try {
      const streams = [];
      metricsCollector.streams.forEach((monitor, streamId) => {
        streams.push({
          streamId,
          streamUrl: monitor.streamUrl,
          state: monitor.state,
          health: monitor.calculateHealthScore()
        });
      });

      res.json({
        success: true,
        data: {
          count: streams.length,
          streams
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/monitor/streams/:streamId
   * Get detailed metrics for a specific stream
   */
  router.get('/streams/:streamId', (req, res) => {
    try {
      const { streamId } = req.params;
      const metrics = metricsCollector.getStreamMetrics(streamId);

      if (!metrics) {
        return res.status(404).json({
          success: false,
          error: 'Stream not found'
        });
      }

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/monitor/streams/:streamId/history
   * Get historical data for a specific stream metric
   */
  router.get('/streams/:streamId/history', (req, res) => {
    try {
      const { streamId } = req.params;
      const { metric = 'bitrate', limit = 60 } = req.query;

      const history = metricsCollector.getStreamHistory(
        streamId,
        metric,
        parseInt(limit)
      );

      if (!history) {
        return res.status(404).json({
          success: false,
          error: 'Stream not found'
        });
      }

      res.json({
        success: true,
        data: {
          streamId,
          metric,
          dataPoints: history.length,
          history
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ===== Alert Endpoints =====

  /**
   * GET /api/monitor/alerts
   * Get active alerts with optional filtering
   */
  router.get('/alerts', (req, res) => {
    try {
      const { severity, type, streamId } = req.query;
      
      let alerts = alertManager.getActiveAlerts();

      // Apply filters
      if (severity) {
        alerts = alerts.filter(a => a.severity === severity);
      }
      if (type) {
        alerts = alerts.filter(a => a.type === type);
      }
      if (streamId) {
        alerts = alerts.filter(a => a.streamId === streamId);
      }

      res.json({
        success: true,
        data: {
          count: alerts.length,
          alerts
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/monitor/alerts/history
   * Get alert history with filtering
   */
  router.get('/alerts/history', (req, res) => {
    try {
      const {
        limit = 100,
        severity,
        type,
        streamId,
        startTime,
        endTime
      } = req.query;

      const filters = {};
      if (severity) filters.severity = severity;
      if (type) filters.type = type;
      if (streamId) filters.streamId = streamId;
      if (startTime) filters.startTime = parseInt(startTime);
      if (endTime) filters.endTime = parseInt(endTime);

      const history = alertManager.getAlertHistory(parseInt(limit), filters);

      res.json({
        success: true,
        data: {
          count: history.length,
          filters,
          alerts: history
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/monitor/alerts/stats
   * Get alert statistics
   */
  router.get('/alerts/stats', (req, res) => {
    try {
      const stats = alertManager.getAlertStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/monitor/alerts/:alertId/resolve
   * Manually resolve an alert
   */
  router.post('/alerts/:alertId/resolve', (req, res) => {
    try {
      const { alertId } = req.params;
      const alert = alertManager.resolveAlert(alertId);

      if (!alert) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }

      res.json({
        success: true,
        data: alert
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ===== Health Check =====

  /**
   * GET /api/monitor/health
   * Simple health check endpoint
   */
  router.get('/health', (req, res) => {
    res.json({
      success: true,
      status: 'ok',
      timestamp: Date.now(),
      uptime: process.uptime()
    });
  });

  return router;
}

module.exports = createMonitoringRoutes;

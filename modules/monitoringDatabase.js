/**
 * Monitoring Database Module
 * Handles persistence of monitoring data to SQLite
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { createMonitoringSchema } = require('./monitoringSchema');
const config = require('./monitoringConfig');

class MonitoringDatabase {
  constructor(dbPath = './data/monitoring.db') {
    this.dbPath = dbPath;
    this.db = null;
  }

  /**
   * Initialize database connection and schema
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('[MonitoringDB] Error opening database:', err);
          return reject(err);
        }

        console.log(`[MonitoringDB] Connected to database at ${this.dbPath}`);

        // Create schema
        this.db.exec(createMonitoringSchema(), (err) => {
          if (err) {
            console.error('[MonitoringDB] Error creating schema:', err);
            return reject(err);
          }

          console.log('[MonitoringDB] Schema initialized');
          resolve();
        });
      });
    });
  }

  /**
   * Save stream information
   */
  saveStream(streamId, streamUrl, roomId, metadata = {}) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO streams (stream_id, stream_url, room_id, created_at, last_seen, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [streamId, streamUrl, roomId, Date.now(), Date.now(), JSON.stringify(metadata)],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  }

  /**
   * Save stream metrics
   */
  saveStreamMetrics(streamId, metrics) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO stream_metrics (
          stream_id, timestamp, state, bitrate, fps, resolution,
          frame_drops, black_frames, frozen_frames, latency,
          buffer_duration, reconnect_count, error_count, health_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const resolution = metrics.resolution ? 
        `${metrics.resolution.width}x${metrics.resolution.height}` : null;

      this.db.run(
        sql,
        [
          streamId,
          Date.now(),
          metrics.state,
          metrics.bitrate,
          metrics.fps,
          resolution,
          metrics.frameDrops,
          metrics.blackFrames,
          metrics.frozenFrames,
          metrics.latency,
          metrics.bufferDuration,
          metrics.reconnectCount,
          metrics.errorCount,
          metrics.healthScore
        ],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  }

  /**
   * Save alert
   */
  saveAlert(alert) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO alerts (
          alert_id, stream_id, alert_type, severity, details,
          timestamp, resolved, resolved_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          alert.id,
          alert.streamId || null,
          alert.type,
          alert.severity,
          JSON.stringify(alert.details),
          alert.timestamp,
          alert.resolved ? 1 : 0,
          alert.resolvedAt || null
        ],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  }

  /**
   * Save compositor metrics
   */
  saveCompositorMetrics(metrics) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO compositor_metrics (
          timestamp, output_fps, processing_time, active_streams, grid_layout
        ) VALUES (?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          Date.now(),
          metrics.outputFps,
          metrics.processingTime,
          metrics.activeStreams,
          metrics.gridLayout
        ],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  }

  /**
   * Save WebRTC metrics
   */
  saveWebRTCMetrics(roomId, metrics) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO webrtc_metrics (
          timestamp, room_id, peers_connected, bytes_transferred,
          packet_loss, jitter, round_trip_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          Date.now(),
          roomId,
          metrics.peersConnected,
          metrics.bytesTransferred,
          metrics.packetLoss,
          metrics.jitter,
          metrics.roundTripTime
        ],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  }

  /**
   * Save system metrics
   */
  saveSystemMetrics(metrics) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO system_metrics (
          timestamp, cpu_usage, memory_usage, active_rooms, total_viewers
        ) VALUES (?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          Date.now(),
          metrics.cpuUsage,
          metrics.memoryUsage,
          metrics.activeRooms,
          metrics.totalViewers
        ],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  }

  /**
   * Save event
   */
  saveEvent(eventType, streamId, roomId, details) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO events (event_type, stream_id, room_id, details, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [eventType, streamId || null, roomId || null, JSON.stringify(details), Date.now()],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  }

  /**
   * Get stream metrics history
   */
  getStreamMetricsHistory(streamId, hours = 1) {
    return new Promise((resolve, reject) => {
      const cutoff = Date.now() - (hours * 3600000);
      const sql = `
        SELECT * FROM stream_metrics
        WHERE stream_id = ? AND timestamp > ?
        ORDER BY timestamp ASC
      `;

      this.db.all(sql, [streamId, cutoff], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  /**
   * Get alerts with filtering
   */
  getAlerts(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM alerts WHERE 1=1';
      const params = [];

      if (filters.streamId) {
        sql += ' AND stream_id = ?';
        params.push(filters.streamId);
      }
      if (filters.severity) {
        sql += ' AND severity = ?';
        params.push(filters.severity);
      }
      if (filters.type) {
        sql += ' AND alert_type = ?';
        params.push(filters.type);
      }
      if (filters.resolved !== undefined) {
        sql += ' AND resolved = ?';
        params.push(filters.resolved ? 1 : 0);
      }
      if (filters.startTime) {
        sql += ' AND timestamp >= ?';
        params.push(filters.startTime);
      }

      sql += ' ORDER BY timestamp DESC LIMIT ?';
      params.push(filters.limit || 100);

      this.db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        
        // Parse JSON fields
        const alerts = rows.map(row => ({
          ...row,
          details: row.details ? JSON.parse(row.details) : {},
          resolved: row.resolved === 1
        }));
        
        resolve(alerts);
      });
    });
  }

  /**
   * Cleanup old data based on retention policies
   */
  async cleanup() {
    const now = Date.now();
    const promises = [];

    // Cleanup old detailed metrics
    promises.push(
      new Promise((resolve, reject) => {
        const cutoff = now - config.RETENTION.METRICS_DETAILED;
        this.db.run(
          'DELETE FROM stream_metrics WHERE timestamp < ?',
          [cutoff],
          (err) => err ? reject(err) : resolve()
        );
      })
    );

    // Cleanup old alerts
    promises.push(
      new Promise((resolve, reject) => {
        const cutoff = now - config.RETENTION.ALERTS;
        this.db.run(
          'DELETE FROM alerts WHERE timestamp < ?',
          [cutoff],
          (err) => err ? reject(err) : resolve()
        );
      })
    );

    // Cleanup old events
    promises.push(
      new Promise((resolve, reject) => {
        const cutoff = now - config.RETENTION.EVENTS;
        this.db.run(
          'DELETE FROM events WHERE timestamp < ?',
          [cutoff],
          (err) => err ? reject(err) : resolve()
        );
      })
    );

    try {
      await Promise.all(promises);
      console.log('[MonitoringDB] Cleanup completed');
    } catch (error) {
      console.error('[MonitoringDB] Cleanup error:', error);
    }
  }

  /**
   * Close database connection
   */
  close() {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve();

      this.db.close((err) => {
        if (err) {
          console.error('[MonitoringDB] Error closing database:', err);
          return reject(err);
        }
        console.log('[MonitoringDB] Database connection closed');
        resolve();
      });
    });
  }
}

module.exports = MonitoringDatabase;

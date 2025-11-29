/**
 * Database Schema for Monitoring
 * SQLite schema for storing monitoring data
 */

const createMonitoringSchema = () => {
  return `
    -- Streams table: stores stream information
    CREATE TABLE IF NOT EXISTS streams (
      stream_id TEXT PRIMARY KEY,
      stream_url TEXT NOT NULL,
      room_id TEXT,
      created_at INTEGER NOT NULL,
      last_seen INTEGER,
      status TEXT DEFAULT 'active',
      metadata TEXT
    );

    -- Stream metrics table: stores time-series metrics
    CREATE TABLE IF NOT EXISTS stream_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stream_id TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      state TEXT,
      bitrate INTEGER,
      fps REAL,
      resolution TEXT,
      frame_drops INTEGER,
      black_frames INTEGER,
      frozen_frames INTEGER,
      latency INTEGER,
      buffer_duration INTEGER,
      reconnect_count INTEGER,
      error_count INTEGER,
      health_score INTEGER,
      FOREIGN KEY (stream_id) REFERENCES streams(stream_id) ON DELETE CASCADE
    );

    -- Alerts table: stores all alerts
    CREATE TABLE IF NOT EXISTS alerts (
      alert_id TEXT PRIMARY KEY,
      stream_id TEXT,
      alert_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      details TEXT,
      timestamp INTEGER NOT NULL,
      resolved INTEGER DEFAULT 0,
      resolved_at INTEGER,
      FOREIGN KEY (stream_id) REFERENCES streams(stream_id) ON DELETE SET NULL
    );

    -- Compositor metrics table: stores compositor performance
    CREATE TABLE IF NOT EXISTS compositor_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      output_fps REAL,
      processing_time INTEGER,
      active_streams INTEGER,
      grid_layout TEXT
    );

    -- WebRTC metrics table: stores WebRTC connection metrics
    CREATE TABLE IF NOT EXISTS webrtc_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      room_id TEXT,
      peers_connected INTEGER,
      bytes_transferred INTEGER,
      packet_loss REAL,
      jitter REAL,
      round_trip_time INTEGER
    );

    -- System metrics table: stores system-level metrics
    CREATE TABLE IF NOT EXISTS system_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      cpu_usage REAL,
      memory_usage REAL,
      active_rooms INTEGER,
      total_viewers INTEGER
    );

    -- Events table: stores significant events
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      stream_id TEXT,
      room_id TEXT,
      details TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (stream_id) REFERENCES streams(stream_id) ON DELETE SET NULL
    );

    -- Create indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_stream_metrics_stream_id ON stream_metrics(stream_id);
    CREATE INDEX IF NOT EXISTS idx_stream_metrics_timestamp ON stream_metrics(timestamp);
    CREATE INDEX IF NOT EXISTS idx_alerts_stream_id ON alerts(stream_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
    CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);
    CREATE INDEX IF NOT EXISTS idx_compositor_metrics_timestamp ON compositor_metrics(timestamp);
    CREATE INDEX IF NOT EXISTS idx_webrtc_metrics_timestamp ON webrtc_metrics(timestamp);
    CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);
    CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_events_stream_id ON events(stream_id);
  `;
};

module.exports = { createMonitoringSchema };

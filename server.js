// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const MonitoringService = require('./modules/monitoringService');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Initialize monitoring service
const monitoringService = new MonitoringService(io, app);

// serve static
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON bodies
app.use(express.json());

// simple index
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'composer.html'));
});

// Helper function to count active rooms and viewers
function updateSystemMetrics() {
  const rooms = io.sockets.adapter.rooms;
  let activeRooms = 0;
  let totalViewers = 0;

  rooms.forEach((sockets, roomId) => {
    // Skip individual socket rooms (they match socket IDs)
    if (!io.sockets.sockets.has(roomId)) {
      activeRooms++;
      // Count viewers in this room
      sockets.forEach((socketId) => {
        const socket = io.sockets.sockets.get(socketId);
        if (socket && socket.data.role === 'viewer') {
          totalViewers++;
        }
      });
    }
  });

  monitoringService.updateSystemMetrics(activeRooms, totalViewers);
}

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  // Setup monitoring handlers for this socket
  monitoringService.setupSocketHandlers(socket);

  // composer announces itself with "role":"composer" and a room id
  socket.on('join-room', ({ roomId, role }) => {
    socket.join(roomId);
    socket.data.role = role;
    socket.data.roomId = roomId;
    console.log(`${socket.id} joined ${roomId} as ${role}`);

    if (role === 'composer') {
      // notify watchers that composer is present
      socket.to(roomId).emit('composer-ready', { composerId: socket.id });
    }

    // Update system metrics
    updateSystemMetrics();
  });

  // forward signalling between composer and viewers
  socket.on('signal', ({ to, data }) => {
    if (!to) return;
    io.to(to).emit('signal', { from: socket.id, data });
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id);
    const roomId = socket.data.roomId;
    if (roomId) {
      socket.to(roomId).emit('peer-disconnected', { id: socket.id, role: socket.data.role });
    }

    // Update system metrics
    updateSystemMetrics();
  });
});

// Update system metrics periodically
setInterval(updateSystemMetrics, 10000);

const PORT = process.env.PORT || 3000;

// Initialize monitoring service before starting server
monitoringService.initialize()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Monitoring API: http://localhost:${PORT}/api/monitor`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize monitoring service:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await monitoringService.shutdown();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await monitoringService.shutdown();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});


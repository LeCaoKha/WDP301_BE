// socket/socketService.js
const { Server } = require('socket.io');

let io = null;

/**
 * Initialize Socket.io server
 * @param {http.Server} server - HTTP server instance
 */
function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*", // Allow all origins for React Native mobile app
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ['websocket', 'polling'], // Support both for mobile compatibility
  });

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Join room for specific charging session
    socket.on('join_session', (session_id) => {
      socket.join(`session:${session_id}`);
      console.log(`📱 Client ${socket.id} joined session: ${session_id}`);
      
      // Send confirmation
      socket.emit('joined_session', {
        session_id,
        message: 'Successfully joined charging session room',
      });
    });

    // Leave session room
    socket.on('leave_session', (session_id) => {
      socket.leave(`session:${session_id}`);
      console.log(`📱 Client ${socket.id} left session: ${session_id}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  console.log('🔌 Socket.io initialized');
  return io;
}

/**
 * Get Socket.io instance
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return io;
}

/**
 * Emit battery update to all clients in session room
 * @param {string} session_id - Charging session ID
 * @param {object} batteryData - Battery status data
 */
function emitBatteryUpdate(session_id, batteryData) {
  if (!io) {
    console.warn('⚠️ Socket.io not initialized. Cannot emit battery update.');
    return;
  }
  
  io.to(`session:${session_id}`).emit('battery_update', {
    session_id,
    ...batteryData,
    timestamp: new Date().toISOString(),
  });
  
  console.log(`📡 Emitted battery update for session: ${session_id}`);
}

/**
 * Emit session status change (started, completed, cancelled)
 * @param {string} session_id - Charging session ID
 * @param {object} statusData - Status change data
 */
function emitSessionStatusChange(session_id, statusData) {
  if (!io) {
    console.warn('⚠️ Socket.io not initialized. Cannot emit status change.');
    return;
  }
  
  io.to(`session:${session_id}`).emit('session_status_change', {
    session_id,
    ...statusData,
    timestamp: new Date().toISOString(),
  });
  
  console.log(`📡 Emitted status change for session: ${session_id}`);
}

module.exports = {
  initializeSocket,
  getIO,
  emitBatteryUpdate,
  emitSessionStatusChange,
};
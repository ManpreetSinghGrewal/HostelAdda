require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const userRoutes = require('./routes/userRoutes');
const Message = require('./models/Message');
const User = require('./models/User');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/users', userRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Make io accessible in controllers
app.set('io', io);

let waitingUser = null; // For Omegle-style matching

// Track number of active sockets per user to handle multiple tabs & refreshes
const userConnectionCounts = new Map();

io.on('connection', async (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId && userId !== 'undefined') {
    const currentCount = (userConnectionCounts.get(userId) || 0) + 1;
    userConnectionCounts.set(userId, currentCount);
    
    console.log(`User connected: ${userId} with socket ${socket.id}. Active connections: ${currentCount}`);
    
    // Only set to online if this is their first connection
    if (currentCount === 1) {
      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit('user-online', userId);
    }
  }

  // Normal Room Join
  socket.on('join-room', (data) => {
    // Support legacy string or new object
    const roomId = typeof data === 'string' ? data : data.roomId;
    const roomUserId = typeof data === 'string' ? null : data.userId;
    
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
    // Notify others in room so they can initiate WebRTC offer
    socket.to(roomId).emit('user-joined', { socketId: socket.id, userId: roomUserId });
  });

  // Random Matchmaking (Omegle style)
  socket.on('join-random', (userName) => {
    if (waitingUser && waitingUser.socketId !== socket.id) {
      const roomId = 'random-' + Date.now();
      
      const partnerSocket = io.sockets.sockets.get(waitingUser.socketId);
      if (partnerSocket) {
        // Send match individually so they join via ChatRoom explicitly. 
        socket.emit('match-found', { roomId, partnerUserId: waitingUser.userId, partnerName: waitingUser.userName });
        partnerSocket.emit('match-found', { roomId, partnerUserId: userId, partnerName: userName });
      } else {
        // Partner disconnected while waiting, put this user in queue
        waitingUser = { socketId: socket.id, userId, userName };
        return;
      }
      waitingUser = null;
    } else {
      waitingUser = { socketId: socket.id, userId, userName };
    }
  });

  socket.on('leave-room', async (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('user-left', socket.id);
    if (waitingUser && waitingUser.socketId === socket.id) {
      waitingUser = null;
    }

    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room || room.size === 0) {
      if (!roomId.startsWith('random-')) {
        try {
          await Message.deleteMany({ roomId });
          console.log(`Room ${roomId} is empty, cleared messages.`);
        } catch (error) {
          console.error('Error clearing empty room chat', error);
        }
      }
    }
  });

  socket.on('send-message', async (data) => {
    try {
      const { roomId, senderId, senderName, text, time } = data;
      // Don't save random chat messages to DB
      if (!roomId.startsWith('random-')) {
        await Message.create({ roomId, senderId, senderName, text, time });
      }
      io.to(roomId).emit('receive-message', { roomId, senderId, senderName, text, time });
    } catch (error) {
      console.error('Error saving message', error);
    }
  });

  // WebRTC Signaling
  socket.on('webrtc-offer', (data) => {
    socket.to(data.target).emit('webrtc-offer', {
      sdp: data.sdp,
      callerId: socket.id,
      callerName: data.callerName
    });
  });

  socket.on('webrtc-answer', (data) => {
    socket.to(data.target).emit('webrtc-answer', {
      sdp: data.sdp,
      answererId: socket.id,
      answererName: data.answererName
    });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    socket.to(data.target).emit('webrtc-ice-candidate', {
      candidate: data.candidate,
      senderId: socket.id
    });
  });

  socket.on('disconnecting', async () => {
    if (waitingUser && waitingUser.socketId === socket.id) {
      waitingUser = null;
    }
    // Tell all rooms they were in that they left
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) {
        socket.to(roomId).emit('user-left', socket.id);
        
        const room = io.sockets.adapter.rooms.get(roomId);
        // If size is 1, this socket is the last one in the room (since it hasn't fully left yet)
        if (room && room.size === 1) {
          if (!roomId.startsWith('random-')) {
            try {
              await Message.deleteMany({ roomId });
              console.log(`Room ${roomId} is empty (disconnecting), cleared messages.`);
            } catch (error) {
              console.error('Error clearing empty room chat on disconnect', error);
            }
          }
        }
      }
    }
  });

  socket.on('disconnect', async () => {
    if (userId && userId !== 'undefined') {
      const currentCount = (userConnectionCounts.get(userId) || 0) - 1;
      
      if (currentCount <= 0) {
        userConnectionCounts.delete(userId);
        console.log(`User completely disconnected: ${userId}`);
        await User.findByIdAndUpdate(userId, { isOnline: false });
        io.emit('user-offline', userId);
      } else {
        userConnectionCounts.set(userId, currentCount);
        console.log(`User socket disconnected: ${userId}. Remaining connections: ${currentCount}`);
      }
    }
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

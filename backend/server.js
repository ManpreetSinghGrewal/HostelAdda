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

let waitingUser = null; // For Omegle-style matching

io.on('connection', async (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId && userId !== 'undefined') {
    console.log(`User connected: ${userId} with socket ${socket.id}`);
    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit('user-online', userId);
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

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('user-left', socket.id);
    if (waitingUser && waitingUser.socketId === socket.id) {
      waitingUser = null;
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
      callerId: socket.id
    });
  });

  socket.on('webrtc-answer', (data) => {
    socket.to(data.target).emit('webrtc-answer', {
      sdp: data.sdp,
      answererId: socket.id
    });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    socket.to(data.target).emit('webrtc-ice-candidate', {
      candidate: data.candidate,
      senderId: socket.id
    });
  });

  socket.on('disconnect', async () => {
    if (waitingUser && waitingUser.socketId === socket.id) {
      waitingUser = null;
    }
    // Tell all rooms they were in that they left
    socket.rooms.forEach(roomId => {
      socket.to(roomId).emit('user-left', socket.id);
    });

    if (userId && userId !== 'undefined') {
      console.log(`User disconnected: ${userId}`);
      await User.findByIdAndUpdate(userId, { isOnline: false });
      io.emit('user-offline', userId);
    }
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

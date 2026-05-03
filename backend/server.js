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

io.on('connection', async (socket) => {
  const userId = socket.handshake.query.userId;
  
  if (userId && userId !== 'undefined') {
    console.log(`User connected: ${userId} with socket ${socket.id}`);
    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit('user-online', userId);
  } else {
    console.log('Anonymous connected:', socket.id);
  }

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('send-message', async (data) => {
    try {
      const { roomId, senderId, senderName, text, time } = data;
      const newMessage = await Message.create({ roomId, senderId, senderName, text, time });
      io.to(roomId).emit('receive-message', newMessage);
    } catch (error) {
      console.error('Error saving message', error);
    }
  });

  // WebRTC Signaling
  socket.on('webrtc-offer', (data) => {
    socket.to(data.roomId).emit('webrtc-offer', data);
  });

  socket.on('webrtc-answer', (data) => {
    socket.to(data.roomId).emit('webrtc-answer', data);
  });

  socket.on('webrtc-ice-candidate', (data) => {
    socket.to(data.roomId).emit('webrtc-ice-candidate', data);
  });

  socket.on('disconnect', async () => {
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

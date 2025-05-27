require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./src/config/database');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const socketAuthMiddleware = require('./src/middleware/socketAuthMiddleware');

const express = require('express');
const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// In-memory store for active users: Map<userId, Set<socketId>>
const activeUsers = new Map();

io.use(socketAuthMiddleware);

connectDB();

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Banana Clicker Backend is Alive!');
});

io.on('connection', (socket) => {
  if (socket.user) {
    const userId = socket.user._id.toString();
    const username = socket.user.username;

    console.log(
      `New client connected: ${socket.id}, User: ${username} (ID: ${userId})`
    );

    if (!activeUsers.has(userId)) {
      activeUsers.set(userId, new Set());
    }
    activeUsers.get(userId).add(socket.id);

    console.log('Active Users:', Array.from(activeUsers.keys()));
  } else {
    console.log(
      `New client connected: ${socket.id}, but user is not authenticated.`
    );
    return;
  }

  socket.on('disconnect', () => {
    if (socket.user) {
      const userId = socket.user._id.toString();
      const username = socket.user.username;

      console.log(
        `Client disconnected: ${socket.id}, User: ${username} (ID: ${userId})`
      );

      if (activeUsers.has(userId)) {
        activeUsers.get(userId).delete(socket.id);
        if (activeUsers.get(userId).size === 0) {
          activeUsers.delete(userId);
        }
      }
      console.log('Active Users:', Array.from(activeUsers.keys()));
    } else {
      console.log(
        `Client disconnected: ${socket.id}, but user was not authenticated.`
      );
    }
  });
});

server.listen(PORT, () => {
  console.log(
    `Server (HTTP & Socket.io) is running on http://localhost:${PORT}`
  );
});

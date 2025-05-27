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
  // At this point, if connection is successful, socket.user should be populated
  console.log(
    `New client connected: ${socket.id}, User: ${socket.user ? socket.user.username : 'Guest/Unauthorized'}`
  );

  socket.on('disconnect', () => {
    console.log(
      `Client disconnected: ${socket.id}, User: ${socket.user ? socket.user.username : 'Guest/Unauthorized'}`
    );
  });
});

server.listen(PORT, () => {
  console.log(
    `Server (HTTP & Socket.io) is running on http://localhost:${PORT}`
  );
});

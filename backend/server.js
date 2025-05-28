require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./src/config/database');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const socketAuthMiddleware = require('./src/middleware/socketAuthMiddleware');
const User = require('./src/models/User');
const errorHandlerMiddleware = require('./src/middleware/errorHandlerMiddleware');

// Helper function to get current ranks
const getRanks = async () => {
  try {
    const rankedUsers = await User.find({ isDeleted: false, isBlocked: false })
      .sort({ bananaCount: -1 })
      .limit(100)
      .select('username displayName avatarUrl bananaCount');

    return rankedUsers;
  } catch (error) {
    console.error('Error fetching ranks:', error);
    return [];
  }
};

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

app.set('socketio', io);
app.set('activeUsers', activeUsers);

connectDB();

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Banana Clicker Backend is Alive!');
});

// Global Error Handler
app.use(errorHandlerMiddleware);

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

    if (socket.user.role === 'admin') {
      socket.join('admin_room');
      console.log(`Admin ${username} (Socket: ${socket.id}) joined admin_room`);
    }

    // Join a room named after their own userId
    socket.join(userId);
    console.log(
      `User ${username} (Socket: ${socket.id}) joined room: ${userId}`
    );

    io.to('admin_room').emit('user_status_update', {
      userId,
      username,
      status: 'online',
      bananaCount: socket.user.bananaCount,
      activeSockets: activeUsers.get(userId)?.size || 0,
    });
  } else {
    console.log(
      `New client connected: ${socket.id}, but user is not authenticated.`
    );
    return;
  }

  // --- Handle 'banana_click' event ---
  socket.on('banana_click', async () => {
    try {
      if (!socket.user) {
        console.error(`banana_click from unauthenticated socket: ${socket.id}`);
        return;
      }

      const clickingUserId = socket.user._id;
      const user = await User.findById(clickingUserId);

      if (user) {
        user.bananaCount += 1;
        await user.save();
        console.log(
          `User ${socket.user.username} clicked. New count: ${user.bananaCount}`
        );

        // --- Emit 'player_score_update' back to the clicking player ---
        socket.emit('player_score_update', {
          userId: clickingUserId,
          bananaCount: user.bananaCount,
        });

        io.to('admin_room').emit('user_status_update', {
          userId: user._id.toString(),
          username: user.username,
          status: 'online',
          bananaCount: user.bananaCount,
          activeSockets: activeUsers.get(clickingUserId.toString())?.size || 0,
        });

        // --- Fetch updated ranks and emit to all clients ---
        const updatedRanks = await getRanks();
        io.emit('rank_update', updatedRanks);
      } else {
        console.error(
          `User not found for ID: ${clickingUserId} on banana_click`
        );
      }
    } catch (error) {
      console.error(
        `Error handling banana_click for user ${socket.user ? socket.user.username : 'unknown'}:`,
        error
      );
    }
  });
  // --- End of 'banana_click' event handler ---

  socket.on('disconnect', () => {
    if (socket.user) {
      const userId = socket.user._id.toString();
      const username = socket.user.username;

      console.log(
        `Client disconnected: ${socket.id}, User: ${username} (ID: ${userId})`
      );

      if (activeUsers.has(userId)) {
        const userSockets = activeUsers.get(userId);
        userSockets.delete(socket.id);
        const remainingSockets = userSockets.size;

        if (remainingSockets === 0) {
          activeUsers.delete(userId);
        }

        io.to('admin_room').emit('user_status_update', {
          userId,
          username,
          status: remainingSockets === 0 ? 'offline' : 'online',
          bananaCount: socket.user.bananaCount,
          activeSockets: remainingSockets,
        });
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

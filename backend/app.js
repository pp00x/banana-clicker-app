require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swaggerConfig');
const cors = require('cors');

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const socketAuthMiddleware = require('./src/middleware/socketAuthMiddleware');
const User = require('./src/models/User');
const errorHandlerMiddleware = require('./src/middleware/errorHandlerMiddleware');
const logger = require('./src/config/logger');

const app = express();
const httpServer = http.createServer(app);


const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8000';

const io = new Server(httpServer, {
  cors: {
    origin: frontendUrl,
    methods: ['GET', 'POST'],
  },
});

const activeUsers = new Map();

const getRanks = async () => {
  try {
    const rankedUsers = await User.find({ isDeleted: false, isBlocked: false })
      .sort({ bananaCount: -1 })
      .limit(100)
      .select('username displayName avatarUrl bananaCount');
    return rankedUsers;
  } catch (error) {
    logger.error('Error fetching ranks:', {
      error: error.message,
      stack: error.stack,
    });
    return [];
  }
};

io.use(socketAuthMiddleware);
app.set('socketio', io);
app.set('activeUsers', activeUsers);

app.use(cors({ 
  origin: frontendUrl,
  credentials: true
}));

app.use(helmet());
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(morgan('combined', { stream: logger.stream }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Swagger API Documentation Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => {
  res.send('Banana Clicker Backend is Alive!');
});

app.use(errorHandlerMiddleware);

io.on('connection', (socket) => {
  if (socket.user) {
    const userId = socket.user._id.toString();
    const username = socket.user.username;

    logger.info(
      `New client connected: ${socket.id}, User: ${username} (ID: ${userId})`
    );

    if (!activeUsers.has(userId)) {
      activeUsers.set(userId, new Set());
    }
    activeUsers.get(userId).add(socket.id);
    logger.debug('Active Users:', {
      activeUsers: Array.from(activeUsers.keys()),
    });

    if (socket.user.role === 'admin') {
      socket.join('admin_room');
      logger.info(`Admin ${username} (Socket: ${socket.id}) joined admin_room`);
    }
    socket.join(userId);
    logger.info(
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
    logger.warn(`Unauthenticated client connection attempt: ${socket.id}`);
    // Do not set up further listeners if socket is not associated with a user.
    // The 'return' here was for the 'if (socket.user)' block, not the whole connection.
    // We should ensure that listeners like 'request_initial_ranks' are only for authenticated users.
    // The check `if (!socket.user)` inside the handler itself is a good safeguard.
  }

  // Listen for a client's request for initial ranking data
  socket.on('request_initial_ranks', async () => {
    // Ensure the socket is associated with an authenticated user
    // This check is crucial if the main 'if (socket.user)' block above didn't 'return' from the whole connection handler
    if (!socket.user) {
      logger.warn(`'request_initial_ranks' from unauthenticated socket: ${socket.id}`);
      return; // Ignore requests from unauthenticated sockets
    }
    try {
      logger.info(`User ${socket.user.username} (Socket: ${socket.id}) requested initial ranks.`);
      const currentRanks = await getRanks(); // Assumes getRanks() is defined in this scope
      socket.emit('rank_update', currentRanks); // Send ranks back to the requesting client
    } catch (error) {
      logger.error(`Error fetching initial ranks for ${socket.user.username} (Socket: ${socket.id}):`, {
        error: error.message,
        stack: error.stack
      });
      // Optionally, emit an error event back to the client if desired
      // socket.emit('error_fetching_ranks', { message: 'Could not retrieve rankings.' });
    }
  });

  socket.on('banana_click', async () => {
    try {
      if (!socket.user) {
        logger.warn(`banana_click from unauthenticated socket: ${socket.id}`);
        return;
      }
      const clickingUserId = socket.user._id;
      const user = await User.findById(clickingUserId);
      if (user) {
        user.bananaCount += 1;
        await user.save();
        logger.info(
          `User ${socket.user.username} clicked. New count: ${user.bananaCount}`
        );
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
        const updatedRanks = await getRanks();
        io.emit('rank_update', updatedRanks);
      } else {
        logger.error(
          `User not found for ID: ${clickingUserId} on banana_click`
        );
      }
    } catch (error) {
      logger.error(
        `Error handling banana_click for user ${socket.user ? socket.user.username : 'unknown'}:`,
        { error: error.message, stack: error.stack }
      );
    }
  });

  socket.on('disconnect', () => {
    if (socket.user) {
      const userId = socket.user._id.toString();
      const username = socket.user.username;
      logger.info(
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
      logger.debug('Active Users:', {
        activeUsers: Array.from(activeUsers.keys()),
      });
    } else {
      logger.warn(`Unauthenticated client disconnected: ${socket.id}`);
    }
  });
});

module.exports = { app, httpServer, io, activeUsers, getRanks };

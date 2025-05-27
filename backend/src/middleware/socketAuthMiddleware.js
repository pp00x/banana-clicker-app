const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketAuthMiddleware = async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error: No token provided.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || user.isDeleted || user.isBlocked) {
      return next(
        new Error('Authentication error: User not found, deleted, or blocked.')
      );
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket Auth Error:', error.message);
    return next(new Error('Authentication error: Token verification failed.'));
  }
};

module.exports = socketAuthMiddleware;

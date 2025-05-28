require('dotenv').config();
const { httpServer } = require('./app');
const connectDB = require('./src/config/database');
const logger = require('./src/config/logger');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      logger.info(
        `Server (HTTP & Socket.io) is running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    logger.error('Failed to start server:', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

startServer();

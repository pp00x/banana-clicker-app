const mongoose = require('mongoose');
const logger = require('./logger');
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      logger.error(
        'FATAL ERROR: MONGODB_URI is not defined in .env file. Application will exit.'
      );
      process.exit(1);
    }

    await mongoose.connect(mongoURI);

    logger.info('MongoDB Connected Successfully!');
  } catch (err) {
    logger.error('MongoDB Connection Error. Application will exit.', {
      message: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
};

module.exports = connectDB;

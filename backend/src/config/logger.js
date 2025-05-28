const winston = require('winston');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');

const logFormat = winston.format.printf(
  ({ timestamp, level, message, stack, metadata }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    if (metadata && Object.keys(metadata).length > 0) {
      log += `\n${JSON.stringify(metadata, null, 2)}`;
    }
    return log;
  }
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.metadata({
      fillExcept: ['message', 'level', 'timestamp', 'stack'],
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
      stderrLevels: ['error'],
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: logFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      format: logFormat,
    }),
  ],
  exitOnError: false,
});

logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

module.exports = logger;

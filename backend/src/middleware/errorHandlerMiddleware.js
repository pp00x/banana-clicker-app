const logger = require('../config/logger');

// eslint-disable-next-line no-unused-vars
const errorHandlerMiddleware = (err, req, res, next) => {
  logger.error('Unhandled Error Caught by Global Error Handler:', {
    message: err.message,
    stack: err.stack,
    statusCodeFromError: err.statusCode,
    resolvedStatusCode:
      res.statusCode === 200 && !err.statusCode
        ? 500
        : err.statusCode || res.statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  const statusCode =
    err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode);

  res.json({
    message: err.message || 'An unexpected error occurred.',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    details: err.details || null,
  });
};

module.exports = errorHandlerMiddleware;

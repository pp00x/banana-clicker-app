// eslint-disable-next-line no-unused-vars
const errorHandlerMiddleware = (err, req, res, next) => {
  console.error('ERROR STACK:', err.stack);
  console.error('ERROR MESSAGE:', err.message);

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

// server/middleware/errorHandler.js
// Information Disclosure Prevention — Generic error responses in production
// See docs/security/04_information_disclosure.md
//
// Usage: app.use(errorHandler) — must be the LAST middleware in server/index.js
//
// In production: returns generic "Something went wrong" — hides internal err.message
//   which can leak file paths, library names, MongoDB query details, etc.
// In development: returns full err.message for easier debugging.

const errorHandler = (err, _req, res, _next) => {
  // Always log the full error server-side — you need this for debugging
  console.error('[ERROR]', err.stack || err.message || err);

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : err.message || 'Internal server error',
  });
};

module.exports = errorHandler;

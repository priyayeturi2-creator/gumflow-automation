/**
 * @fileoverview Enhanced error handling middleware
 * @description Centralized error handling with security considerations
 */

const crypto = require('crypto');

/**
 * Enhanced error handler with security considerations
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Generate error ID for tracking
  const errorId = crypto.randomUUID();
  
  // Log error details (server-side only)
  console.error(`Error ID: ${errorId}`, {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = err.statusCode || err.status || 500;
  let message = 'An internal server error occurred';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Authentication failed';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Access forbidden';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource not found';
  } else if (err.name === 'MongoError' || err.name === 'MongooseError') {
    statusCode = 500;
    message = 'Database error occurred';
  }

  // Security consideration: Don't leak error details in production
  const response = {
    error: true,
    message: message,
    error_id: errorId,
    timestamp: new Date().toISOString()
  };

  // In development, include more details
  if (process.env.NODE_ENV === 'development') {
    response.details = {
      message: err.message,
      stack: err.stack,
      name: err.name
    };
  }

  res.status(statusCode).json(response);
};

/**
 * Handle 404 errors for undefined routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: true,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

/**
 * Async error handler wrapper
 * Catches async errors and passes them to error middleware
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
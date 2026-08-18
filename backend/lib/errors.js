import { log } from './logger.js';

/**
 * Operational error carrying an HTTP status and a client-safe message. Anything
 * thrown as an `AppError` is a deliberate, expected failure (bad input, not
 * found, forbidden) and its message may be shown to the caller. Everything else
 * is treated as a bug and hidden behind a generic 500 in production, so raw
 * Mongoose/Mongo internals never leak to clients.
 */
export class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
    if (details) this.details = details;
  }
}

export const badRequest = (msg, details) => new AppError(400, msg, details);
export const unauthorized = (msg = 'Authentication required') => new AppError(401, msg);
export const forbidden = (msg = 'Not allowed') => new AppError(403, msg);
export const notFound = (msg = 'Not found') => new AppError(404, msg);
export const conflict = (msg, details) => new AppError(409, msg, details);
export const unprocessable = (msg, details) => new AppError(422, msg, details);

/**
 * Wraps an async Express handler so a rejected promise reaches the central
 * error middleware instead of crashing the process. Removes the try/catch
 * boilerplate that was duplicated across every controller.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** 404 fallthrough for unmatched routes. */
export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
};

/**
 * Central error middleware. Operational AppErrors return their real message;
 * unexpected errors are logged in full server-side and return a generic message
 * to the client. Mongoose validation/duplicate-key errors are mapped to 400/409.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(err.errors || {}).map((e) => e.message);
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate value';
    details = err.keyValue;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  }

  if (statusCode >= 500) {
    log.error('Unhandled request error', {
      method: req.method,
      path: req.path,
      error: err.message,
      stack: err.stack,
    });
    if (process.env.NODE_ENV === 'production') {
      message = 'Internal server error';
      details = undefined;
    }
  }

  res.status(statusCode).json({ message, ...(details ? { details } : {}) });
};

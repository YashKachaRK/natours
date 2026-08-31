class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;

    this.status = `${statusCode}`.startsWith("4")
      ? "Fail"
      : "Error";

    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// ===========================================================
// EXPORT APP ERROR
// ===========================================================

module.exports = AppError;
const AppError = require("../utils/appError");

// ==================================================================================

// Send detailed error information during development.
// This is useful for debugging because developers need to see
// the error message, stack, name, and complete error object.

// ==================================================================================

const sendErrorDevelopment = (res, error) => {
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    err: error,
    stack: error.stack,
    name: error.name,
  });
};

// ==================================================================================

// Send a simple error response during production.
// We only send trusted operational errors to the client.
// Programming errors and unknown errors are hidden so we don't
// expose sensitive information about our application.

// ==================================================================================

const sendErrorProduction = (error, res) => {
  // Trusted operational error: send the error details to the client
  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  } else {
    // Programming or unknown error: don't leak internal error details
    console.error("Error : ", error);

    res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
};

// ==================================================================================

// Handle MongoDB/Mongoose CastError.
// This error occurs when MongoDB receives an invalid value for a field,
// for example, an invalid MongoDB ObjectId.

// ==================================================================================

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} and ${err.value}`;

  return new AppError(message, 400);
};

// ==================================================================================

// Handle MongoDB duplicate-field errors.
// This error occurs when a user tries to insert a value that already
// exists in a field with a unique constraint.

// ==================================================================================

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/"([^"]*)"/)[0];

  const message = `Duplicate data inserted ${value}: Please use another value`;

  return new AppError(message, 400);
};

// ==================================================================================

// Handle Mongoose validation errors.
// This error occurs when the user sends data that doesn't satisfy
// the validation rules defined in the Mongoose schema.

// ==================================================================================

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Validation Error: ${errors.join(" && ")}`;

  return new AppError(message, 400);
};

// ==================================================================================

// Handle invalid JWT errors.
// This error occurs when the user sends an invalid authentication token.

// ==================================================================================

const handleJWTError = (err) => {
  return new AppError(
    "Invalid Token or Expired Token, Please log in again",
    401
  );
};

// ==================================================================================

// Main global error-handling middleware.
// This function receives errors from all parts of the application
// and sends an appropriate response to the client.

// ==================================================================================

module.exports = (err, req, res, next) => {
  // Set default error status code and status if they are not provided.
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Development: send complete error details for debugging.
  if (process.env.NODE_ENV === "development") {
    sendErrorDevelopment(res, err);
  }

  // Production: hide sensitive error details and handle known errors.
  else if (process.env.NODE_ENV === "production") {
    let error = Object.create(err);

    // 1) Handle invalid MongoDB ObjectId / CastError.
    if (error.name === "CastError") {
      error = handleCastErrorDB(error);
    }

    // 2) Handle duplicate field / unique constraint errors.
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }

    // 3) Handle Mongoose schema validation errors.
    if (error.name === "ValidationError") {
      error = handleValidationErrorDB(error);
    }

    // 4) Handle invalid JWT errors.
    if (error.name === "JsonWebTokenError") {
      error = handleJWTError(error);
    }

    // 5) Handle expired JWT errors.
    if (error.name === "TokenExpiredError") {
      error = handleJWTError(error);
    }

    // Send the final production error response.
    sendErrorProduction(error, res);
  }
};
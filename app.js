const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");

// Routes
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const authRouter = require("./routes/authRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const testRoute = require("./routes/testRoute")
// Utils / Middleware
const AppError = require("./utils/appError");
const errorController = require("./controller/errorController");
const apiLogger = require("./utils/logger");
const limiter = require("./middleware/rateLimit");
const compression = require('compression')
const app = express();

/*
===========================================================
  SECURITY MIDDLEWARE
===========================================================
*/

app.use(helmet());

/*
  Express uses "extended" query parser so queries like:

  ?duration[gt]=5

  become:

  {
    duration: {
      gt: "5"
    }
  }
*/
app.set("query parser", "extended");

app.use(cookieParser());

/*
===========================================================
  BODY PARSER
===========================================================
*/

app.use(express.json());

/*
===========================================================
  HTTP PARAMETER POLLUTION PROTECTION
===========================================================
*/

app.use(
  hpp({
    whitelist: ["duration"],
  }),
);

/*
===========================================================
  GLOBAL API LOGGER
===========================================================
*/

app.use(apiLogger);
app.use(compression())

/*
===========================================================
  REQUEST TIME
===========================================================
*/

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

/*
===========================================================
  DEVELOPMENT LOGGING
===========================================================
*/

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/*
===========================================================
  RATE LIMITER
===========================================================
*/

app.use("/api", limiter);

/*
===========================================================
  ROUTES
===========================================================
*/

app.use("/api/v1/tours", tourRouter);

app.use("/api/v1/users", userRouter);

app.use("/api/v1/auth", authRouter);

app.use("/api/v1/review", reviewRouter);
app.use("/api/v1/test", testRoute);

/*
===========================================================
  HANDLE UNKNOWN ROUTES
===========================================================
*/

app.use((req, res, next) => {
  next(
    new AppError(
      `This URL is not available on this server. URL: ${req.originalUrl}, Method: ${req.method}`,
      404,
    ),
  );
});

/*
===========================================================
  GLOBAL ERROR HANDLING MIDDLEWARE
===========================================================
*/

app.use(errorController);

module.exports = app;
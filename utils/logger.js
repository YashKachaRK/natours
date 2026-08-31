const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

// ===========================================================
// LOG DIRECTORY CONFIGURATION
// ===========================================================

// Main logs folder

const logDirectory = path.join(__dirname, "logs");

// Create main logs folder if it doesn't exist

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// ===========================================================
// API LOGGER
// ===========================================================

const apiLogger = (req, res, next) => {
  const startTime = Date.now();

  // Save original res.end

  const originalEnd = res.end;

  // Override res.end so we can capture response status and time

  res.end = function (...args) {
    const responseTime = Date.now() - startTime;

    // =========================================================
    // DATE & TIME
    // =========================================================

    const now = new Date();

    // Example: August-2026

    const monthFolderName = now.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });

    // Example: 26-08-2026

    const dateFileName =
      `${String(now.getDate()).padStart(2, "0")}-` +
      `${String(now.getMonth() + 1).padStart(2, "0")}-` +
      `${now.getFullYear()}.log`;

    // =========================================================
    // CREATE MONTH FOLDER
    // =========================================================

    const monthDirectory = path.join(logDirectory, monthFolderName);

    if (!fs.existsSync(monthDirectory)) {
      fs.mkdirSync(monthDirectory, { recursive: true });
    }

    // =========================================================
    // CREATE DATE-WISE LOG FILE
    // =========================================================

    const logFile = path.join(monthDirectory, dateFileName);

    // =========================================================
    // REMOVE SENSITIVE HEADERS
    // =========================================================

    const safeHeaders = { ...req.headers };

    delete safeHeaders.authorization;
    delete safeHeaders.cookie;

    // =========================================================
    // REMOVE SENSITIVE BODY FIELDS
    // =========================================================

    const safeBody = { ...req.body };

    delete safeBody.password;
    delete safeBody.passwordConfirm;
    delete safeBody.oldPassword;
    delete safeBody.newPassword;

    // =========================================================
    // CREATE LOG DATA
    // =========================================================

    const logData = {
      time: now.toISOString(),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      params: req.params,
      query: req.query,
      body: safeBody,
      headers: safeHeaders,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
    };

    // =========================================================
    // WRITE LOG TO FILE
    // =========================================================

    fs.appendFile(
      logFile,
      JSON.stringify(logData) +
        "\n===============================================================================================\n" +
        "===============================================================================================\n",
      (err) => {
        if (err) {
          console.error("Error writing API log:", err);
        }
      },
    );

    // Call original res.end

    originalEnd.apply(res, args);
  };

  next();
};

// ===========================================================
// EXPORT API LOGGER
// ===========================================================

module.exports = apiLogger;

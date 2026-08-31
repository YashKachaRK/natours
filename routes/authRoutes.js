const express = require("express");

const authController = require("../controller/authController");

const router = express.Router();

// ===========================================================
// PARAMETER MIDDLEWARE
// ===========================================================

router.param("id", (req, res, next, val) => {


  next();
});

// ===========================================================
// AUTH ROUTES
// ===========================================================

// User Signup
router.route("/signup").post(authController.signup);

// User Login
router.route("/login").post(authController.login);

// Forgot Password
router.route("/forgotPassword").post(authController.forgotPassword);

// Reset Password
router
  .route("/resetPassword/:token")
  .patch(authController.resetPassword);

// Update Password
router
  .route("/updatePassword")
  .patch(authController.protect, authController.updatePassword);

// ===========================================================
// EXPORT ROUTER
// ===========================================================

module.exports = router;
const express = require("express");

const userController = require("../controller/userController");
const authController = require("../controller/authController");

// Multer

// this line work like when user image store in localy

const router = express.Router();

// ===========================================================
// GET ALL USERS
// ===========================================================

// GET /api/v1/users
// User must be logged in

router.route("/").get(authController.protect, userController.getAllUser);

// ===========================================================
// UPDATE / DELETE / GET SPECIFIC USER
// ===========================================================

// PATCH /api/v1/users/:id
// DELETE /api/v1/users/:id
// GET /api/v1/users/:id

router
  .route("/:id")

  .delete(authController.protect, userController.deleteUser)
  .get(authController.protect, userController.getSpecificUser);
router
  .route("/updateMe")
  .patch(
    authController.protect,
    userController.uploadUserPhoto,
    userController.resizePhoto,
    userController.updateUser,
  );
// ===========================================================
// ACTIVE USER
// ===========================================================

// POST /api/v1/users/activeUser

router.route("/activeUser").post(userController.activeUser);

// ===========================================================
// GET CURRENT USER
// ===========================================================

// GET /api/v1/users/getMe
// authController.protect -> Check if user is logged in

router.route("/getMe").get(authController.protect, userController.getMe);

// ===========================================================
// EXPORT ROUTER
// ===========================================================

module.exports = router;

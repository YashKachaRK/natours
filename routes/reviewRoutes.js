const express = require("express");

const userController = require("../controller/userController");
const authController = require("../controller/authController");
const reviewController = require("../controller/reviewController");

const router = express.Router();

// ===========================================================
// ADD REVIEW
// ===========================================================

// POST /api/v1/review/addReviews
router
  .route("/addReviews")
  .post(
    authController.protect,
    authController.restrictTour("user", "guide"),
    reviewController.addReviews,
  );

// ===========================================================
// SHOW REVIEWS
// ===========================================================

// GET /api/v1/review/showReview
router
  .route("/showReview")
  .get(authController.protect, reviewController.showReview);

// ===========================================================
// DELETE REVIEW
// ===========================================================

// DELETE /api/v1/review/deleteReview/:id
router
  .route("/deleteReview/:id")
  .delete(
    authController.protect,
    authController.restrictTour("user"),
    reviewController.deleteReview,
  );

// ===========================================================
// UPDATE REVIEW
// ===========================================================

// PATCH /api/v1/review/updateReview/:id
router
  .route("/updateReview/:id")
  .patch(
    authController.protect,
    authController.restrictTour("user", "guide"),
    reviewController.updateReview,
  );

// ===========================================================
// NESTED ROUTES
// ===========================================================

// POST /api/v1/tours/:tourId/reviews

module.exports = router;

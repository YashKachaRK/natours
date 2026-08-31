const express = require("express");

const tourController = require("../controller/tourController");
const authController = require("../controller/authController");
const reviewController = require("../controller/reviewController");

const router = express.Router();

// ===========================================================
// TOP 5 CHEAPEST TOURS
// ===========================================================

// GET /api/v1/tours/getTop5CheapestPlace
// authController.protect -> Check if user is logged in
// getTop5CheapestPlace -> Set limit, sort, and fields
// getAllTours -> Get the final tour data

router
  .route("/getTop5CheapestPlace")
  .get(
    authController.protect,
    tourController.getTop5CheapestPlace,
    tourController.getAllTours,
  );

// ===========================================================
// TOUR STATISTICS
// ===========================================================

// GET /api/v1/tours/getToursStats

router
  .route("/getToursStats")
  .get(authController.protect, tourController.getToursStats);

// ===========================================================
// MONTHLY PLAN
// ===========================================================

// GET /api/v1/tours/getMonthlyPlan/:year
// Only admin and lead-guide can access this route

router
  .route("/getMonthlyPlan/:year")
  .get(
    authController.protect,
    authController.restrictTour("admin", "lead-guide"),
    tourController.getMonthlyPlan,
  );

// ===========================================================
// ALL TOURS
// ===========================================================

// GET /api/v1/tours
// authController.protect -> User must be logged in

// POST /api/v1/tours
// Only admin and lead-guide can create a tour

router
  .route("/")
  .get(authController.protect, tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTour("admin", "lead-guide"),
    tourController.addTours,
  );

// ===========================================================
// SPECIFIC TOUR
// ===========================================================

// GET /api/v1/tours/:id
// PATCH /api/v1/tours/:id
// DELETE /api/v1/tours/:id

router
  .route("/:id")
  .patch(
    authController.protect,
    authController.restrictTour("admin", "lead-guide"),
    tourController.uploadTourPhoto,
    tourController.resizeImages,
    tourController.updateTours,
  )
  .delete(
    authController.protect,
    authController.restrictTour("admin", "lead-guide"),
    tourController.deleteTours,
  )
  .get(tourController.getSpecificTours);

// ===========================================================
// RELATED REVIEWS
// ===========================================================

// POST /api/v1/tours/:tourID/addReview
// Logged-in users with user/guide role can add a review

router
  .route("/:tourID/addReview")
  .post(
    authController.protect,
    authController.restrictTour("user", "guide"),
    reviewController.setTourUserId,
    reviewController.addReviews,
  );

// GET /api/v1/tours/:tourID/showReview
// Logged-in users can see reviews

router
  .route("/:tourID/showReview")
  .get(authController.protect, reviewController.showReview);

// Geospatical

router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(tourController.getTourWithIn);
router.route("/distance/:latlng/unit/:unit").get(tourController.getDistances);
// ===========================================================
// EXPORT ROUTER
// ===========================================================

module.exports = router;

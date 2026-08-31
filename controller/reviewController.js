const catchAsync = require("../utils/catchAsync.js");

const Review = require("../models/reviewModel.js");

const handlerFactory = require("./handlerFactory.js");

// =============================================================================================

// Here we create Add review Endpoint

// Api :- http://localhost:3000/api/v1/review/addReviews

// =============================================================================================

exports.setTourUserId = (req, res, next) => {
  if (!req.body.refToTour) {
    req.body.refToTour = req.params.tourID;
  }

  if (!req.body.refToUser) {
    req.body.refToUser = req.user.id;
  }

  next();
};

exports.addReviews = handlerFactory.createOne(Review);

// =============================================================================================

// Here we create show review Endpoint

// Api :- http://localhost:3000/api/v1/review/showReview

// =============================================================================================

exports.showReview = catchAsync(async (req, res, next) => {
  let filter = {};

  if (req.params.tourID) {
    filter = { refToTour: req.params.tourID };
  }

  const review = await Review.find(filter)
    .populate({
      path: "refToTour",
      select: "name ratingsAverage",
    })
    .populate({
      path: "refToUser",
      select: "name email",
    });

  res.status(200).json({
    status: "success",
    results: review.length,
    data: {
      review,
    },
  });
});

exports.updateReview = handlerFactory.updateOne(Review);

exports.deleteReview = handlerFactory.deleteOne(Review);

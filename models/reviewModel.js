const mongoose = require("mongoose");
const Tour = require("./tourModels");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review Cant not empty!"],
    },
    rating: {
      type: Number,
      default: 3,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
    },
    createAt: {
      type: Date,
      default: () => new Date(Date.now() + 5.5 * 60 * 60 * 1000),
    },
    refToTour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
    },
    refToUser: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
reviewSchema.index({ refToTour: 1, refToUser: 1 }, { unique: true });
//  this middleware count number of rating and avgrating for specific tour and update tour model data
reviewSchema.statics.calcAverageRating = async function (refToTour) {
  const stats = await this.aggregate([
    {
      $match: { refToTour: refToTour },
    },
    {
      $group: {
        _id: "$refToTour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);



  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(refToTour, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(refToTour, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// findByIdAndUpdate
// findByIdAndDelete
// Here we are update review and delete review middleware create

reviewSchema.post("save", function () {
  this.constructor.calcAverageRating(this.refToTour);
});

//* here any one update review so automatically update in tour model ratingsAverage
//* if user delete review so also update tour model ratingsQuantity and ratingsAverage also
reviewSchema.pre(/^findOneAnd/, async function () {
  this.r = await this.model.findOne(this.getQuery());

});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRating(this.r.refToTour);
});

// exports method
const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;

const mongoose = require("mongoose");
const slugify = require("slugify");

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      uniq: true,
    },
    slug: String,
    superScreat: {
      type: Boolean,
      default: false,
    },
    duration: {
      type: Number,
      required: true,
    },

    maxGroupSize: {
      type: Number,
      required: true,
    },

    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy, medium, difficult",
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: (val) => Math.round(val * 10) / 10,  
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: true,
    },

    summary: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    imageCover: {
      type: String,
      required: true,
    },

    images: {
      type: [String],
      required: true,
    },

    startDates: {
      type: [Date],
      required: true,
    },
    createAt: {
      type: Date,
      default: () => new Date(Date.now() + 5.5 * 60 * 60 * 1000),
    },
    updatedAt: {
      type: Date,
      default: () => new Date(Date.now() + 5.5 * 60 * 60 * 1000),
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number], // * Array of Number [longitude, latitude]
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
tourSchema.index({startLocation : "2dsphere"})
//* ========================================================================================================

// * this propety actualy not part of database he get value in database than only clint side show this value

//* ========================================================================================================

// tourSchema.virtual("USD $").get(function () {
//   return this.price / 95.71;
// });
// * we connect two or moremodel here  with fields
tourSchema.virtual("reviews", {
  ref: "Review", // * here we get another model we are takeing some data another model
  foreignField: "refToTour", //* which data get for another model here put in name if field
  localField: "_id", //* this is local field here we are puting a this model ID
});

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
//* ========================================================================================================

// * pre function use for what take action before save documents

//* ========================================================================================================

tourSchema.pre("save", function () {
  
  this.slug = slugify(this.name, { lower: true });
});

// tourSchema.pre("save", async function () {
//   const guidesPromise = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromise);

// });
//* ========================================================================================================

// * QUERY MIDDLEWARE

//* ========================================================================================================

tourSchema.pre(/^find/, function () {
  // * here find is when controller find is excuted then this middleware is work
  this.find({ superScreat: { $ne: true } });
});

// tourSchema.pre(/^find/, function () {
//   this.populate({
//       path: "guides",
//       select: "-__v -passwordChangeAt -photo",
//     });
// });
//* populate atale database ma to khali object id che but jyare apade api thi check kari ne tyare guides ni badhi details jova male chhe
//* ========================================================================================================

//* Aggregation MiddleWare

//* ========================================================================================================

// tourSchema.pre("aggregate", function () {
//   this.pipeline().unshift({ $match: { superScreat: { $ne: true } } });
// });

const Tour = mongoose.model("Tour", tourSchema);
module.exports = Tour;

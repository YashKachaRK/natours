const Tour = require("../models/tourModels");

const APIFetures = require("../utils/tourUtils");

const catchAsync = require("../utils/catchAsync.js");

const AppError = require("../utils/appError.js");

const handlerFactory = require("./handlerFactory.js");

const multer = require("multer");

const sharp = require("sharp");

// storeImage Multi Image
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/img/tourCover");
//   },
//   filename: (req, file, cb) => {
//     //user-id-timestamp
//     const ext = file.mimetype.split("/")[1];
//     cb(null, `tourCover-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

// const multerFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith("image")) {
//     cb(null, true);
//   } else {
//     cb(new AppError("Not an image! Please upload only images", 400), false);
//   }
// };

// const upload = multer({
//   storage: multerStorage,
//   fileFilter: multerFilter,
// });

// exports.uploadTourCoverPhoto = upload.single("coverImage");

// * Upload multiple file

const multerStorage = multer.memoryStorage();
// here we check upload file is img or file if image than upload function word else send error

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images", 400), false);
  }
};

//save actual name in database
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// now we create multer middleware
exports.uploadTourPhoto = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

exports.resizeImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) {
    return next();
  }
  //coverImage
  const tourFileName = `tours-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1200)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${tourFileName}`); // store in localStorage
  req.body.imageCover = tourFileName;

  // images 
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const fileName = `tours-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(1000, 600)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${fileName}`);
      req.body.images.push(fileName);
    }),
  );
  next();
});

// ============================================================
// Get Top 5 Cheapest Places
// ===========================================================

// This is middleware for getTop5CheapestPlace
// API :- http://localhost:3000/api/v1/tours/getTop5CheapestPlace

exports.getTop5CheapestPlace = (req, res, next) => {
  console.log("TOP 5 MIDDLEWARE CALLED");

  req.queryOptions = {
    ...req.query,
    limit: "5",
    sort: "price",
    fields: "name,price,difficulty,ratingsAverage",
  };

  console.log("TOP 5 QUERY:", req.queryOptions);

  next();
};

// ===========================================================
// Get All Tours
// ===========================================================

exports.getAllTours = catchAsync(async (req, res, next) => {
  const queryParams = req.queryOptions || req.query;

  // TODO Run Query

  // Create instance of APIFetures class
  const fetures = new APIFetures(
    Tour.find().populate({
      path: "guides",
      select: "-__v -passwordChangeAt -photo",
    }),
    queryParams,
  )
    .filter()
    .sort()
    .field()
    .pageLimit();

  const newTour = await fetures.query.explain();

  if (newTour.length === 0) {
    return next(new AppError("Here This type of no data found", 404));
  }

  res.status(200).json({
    // 200 Means OK Done Status Data is visible
    status: "Success",
    results: newTour.length,
    data: {
      tour: newTour,
    },
  });
});

// ===========================================================
// Get Specific Tour
// ===========================================================

exports.getSpecificTours = catchAsync(async (req, res, next) => {
  const newTour = await Tour.findById(req.params.id)
    .populate({
      path: "guides",
      select: "-__v -passwordChangeAt -photo",
    })
    .populate({
      path: "reviews",
      populate: {
        path: "refToUser",
        select: "name",
      },
    });

  if (!newTour) {
    return next(new AppError("!No Data Found , Please Give Correct id ", 404));
  }

  res.status(200).json({
    status: "Success",
    data: {
      tour: newTour,
    },
  });
});

// ===========================================================
// Create / Update / Delete Tours
// ===========================================================

// This function says:
// "Hey async function, give me your try catch block.
// I can handle it. You can work with your promise and use await."

// This function creates a new anonymous function.

exports.addTours = handlerFactory.createOne(Tour);

exports.updateTours = handlerFactory.updateOne(Tour);

exports.deleteTours = handlerFactory.deleteOne(Tour);

// ===========================================================
// Get Tours Statistics
// ===========================================================

// In order to calculate averages or calculate minimum and maximum
// values, or even calculate distances, predefined methods are available.

exports.getToursStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    // Pipelines inside an array
    {
      $match: {
        ratingsAverage: { $gte: 4 },
      }, // This looks like a WHERE condition in SQL
    },

    {
      $group: {
        // Group all data
        _id: { $toUpper: "$difficulty" },

        totolTours: { $sum: 1 },

        avgRating: { $avg: "$ratingsAverage" },

        totalPrice: { $sum: "$price" },

        avgPrice: { $avg: "$price" },

        minPrice: { $min: "$price" },

        maxPrice: { $max: "$price" },
      },
    },

    {
      $sort: {
        avgPrice: -1,
      }, // Sort key ordering must be 1 (ascending) or -1 (descending)
    },
  ]);

  res.status(200).json({
    status: "Success",
    data: {
      stats,
    },
  });
});

// ===========================================================
// Get Monthly Plan
// ===========================================================

// Now get the most busy month with startDates.
// Here we get data according to startDates.
// It means we get the most common date as busy month.

// We want to count how many tours there are for each of the months
// in a given year.

exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
      // $unwind deconstructs an array field from documents
      // and outputs one document for each element of the array.
    },

    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),

          $lte: new Date(`${year + 1}-01-01`),
        },
      },
    },

    {
      $group: {
        _id: { $month: "$startDates" },

        totalTour: { $sum: 1 },

        tours: { $push: "$name" },
        // $push pushes data into a new array and returns this array

        toursDate: { $push: "$startDates" },
      },
    },

    {
      $addFields: {
        month: "$_id",
      },
      // Add field and name it "month"
      // Get data from _id
    },

    {
      $project: {
        _id: 0,
        // Project works like showing/hiding fields.
        // 0 means don't show, 1 means show.
      },
    },

    {
      $sort: {
        totalTour: -1,
      },
    },

    // {
    //   $limit: 2,
    // },
  ]);

  res.status(200).json({
    status: "Success",
    data: {
      plan,
    },
  });
});

exports.getTourWithIn = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;
  if (!distance || !lat || !lng || !unit) {
    return next(new AppError("Please provide neccsary details", 400));
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: "Done",
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");
  const multi = unit === "mi" ? 0.000621371 : 0.001;
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng || !unit) {
    return next(new AppError("Please provide neccsary details", 400));
  }
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: "distance",
        distanceMultiplier: multi,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: "Done",
    results: distances.length,
    data: {
      distances,
    },
  });
});

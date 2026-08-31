const catchAsync = require("../utils/catchAsync.js");

const AppError = require("../utils/appError.js");

// =============================================================
// DELETE ONE
// =============================================================

// Delete one document from any Model
// Model is passed as an argument
// req.params.id contains the document ID

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // Find document by ID and delete it
    const doc = await Model.findByIdAndDelete(req.params.id);

    // If document is not found, send error to global error handler
    if (!doc) {
      return next(
        new AppError("!No Data Found , Please Give Correct id ", 404),
      );
    }

    // Send successfully deleted document in response
    res.status(200).json({
      status: "Success",
      data: {
        message: "data is deleted",
        data: doc,
      },
    });
  });

// =============================================================
// CREATE ONE
// =============================================================

// Create one document in the database
// req.body contains the data sent by the client

exports.createOne = (Model) =>
  catchAsync(async (req, res) => {
    // Create a new document using req.body
    const doc = await Model.create(req.body);

    // Send success response
    res.status(201).json({
      status: "Success",
      data: {
        tour: `Success Full Add data `,
      },
    });
  });

// =============================================================
// UPDATE ONE
// =============================================================

// Update one document from any Model
// req.params.id contains the document ID
// req.body contains the fields that need to be updated

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // Find document by ID and update it
    const doc = await Model.findByIdAndUpdate(
      req.params.id,

      // Update fields received from the client
      // Also manually update updatedAt
      {
        ...req.body,
        updatedAt: Date.now() + 5.5 * 60 * 60 * 1000,
      },

      {
        // Return the updated document instead of the old document
        returnDocument: "after",

        // Run schema validators during update
        runValidators: true,
      },
    );

    // If document is not found, send error to global error handler
    if (!doc) {
      return next(
        new AppError("!No Data Found , Please Give Correct id ", 404),
      );
    }

    // Send updated document in response
    res.status(202).json({
      status: "Success",
      data: {
        data: doc,
      },
    });
  });
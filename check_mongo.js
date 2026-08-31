const mongoose = require("mongoose");
require("dotenv").config();

const DB = process.env.MONGODB_URI;

mongoose
  .connect(DB)
  .then(() => console.log("DB connection successful!"))
  .catch(err => console.log(err));
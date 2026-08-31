require("dotenv").config();
const app = require("./app");
const port = process.env.PORT || 3000;
const mongoose = require("mongoose");
const DB = process.env.MONGODB_LOCAL;
mongoose
  .connect(DB)
  .then(() => console.log("DB connection successful!"))
  .catch((err) => console.log(err));

// process.on('unhandleRejection',err =>{
//   console.log(err.name , err.message)
//   process.exit(1)
// })

app.listen(port, () =>
  console.log(`Example app listening on port http://localhost:${port}`),
);

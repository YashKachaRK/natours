const crypto = require("crypto");
const mongoose = require("mongoose");
const slugify = require("slugify");
const validator = require("validator");
const bcrypt = require("bcrypt");

//* ===========================================================

// * Here we write a schema for name email photo role password

//* ===========================================================

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: [true, "Please Tell me your name"],
  },
  email: {
    type: String,
    require: [true, "Please Provide your email id"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please Provide a valid user"],
  },
  photo: {
    type: String,
    default: "default.jpg",
  },
  role: {
    type: String,
    enum: ["admin", "user", "guide", "lead-guide"],
    default: "user",
  },
  password: {
    type: String,
    require: [true, "Please provide password"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    require: [true, "Please Provide match password"],
    validate: {
      // * This only work on save
      validator: function (e) {
        return e === this.password;
      },
      message: "Password is not matched Please Check Your Password",
    },
  },
  passwordChangeAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  loginAttempts: {
    type: Number,
    defualt: 0,
    select: false,
  },
  lockUntil: {
    type: Date,
    default: null,
    select: false,
  },
});

//* ===========================================================

// * This middleware work like when password change that time here update date passwordChagneAt

//* ===========================================================
userSchema.pre("save", function () {
  if (!this.isModified("password") || this.isNew) {
    return;
  }

  this.passwordChangeAt = Date.now();
});

//* ===========================================================

//* Here we converting password in hash When user.save() something save method call that time this fuction work

//* ===========================================================

userSchema.pre("save", async function (next) {
  // * Onlu run fucntion if password actualy modifies
  if (!this.isModified("password")) return next;
  // * Here password convert to hash password also add salt
  this.password = await bcrypt.hash(this.password, 12); // * if here we take 16 he take a lot of time
  // * Here Password Confirm Field Is deleted bcz only check for Confir Password and Password is match
  this.passwordConfirm = undefined;
});

//* ===========================================================

// * candidatePassword is come from user side like pass123 and userPassword is hash password we compare is true return true  this functon return true or false

//* ===========================================================
userSchema.methods.correctPassword = async function (
  candidatePasseword,
  userPassword,
) {
  return await bcrypt.compare(candidatePasseword, userPassword);
};

//* ===========================================================

//* Here we check If user change password and than e login same auth token here we check if authtoken and passwordchangeAt date compare

//* ===========================================================
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangeAt) {
    const changeTimeStamp = parseInt(
      this.passwordChangeAt.getTime() / 1000,
      10,
    );
  
    return JWTTimestamp < changeTimeStamp; // * If this condtion come false so passord is changed by usuer so we so error please login again
  }

  return false; // * if not password change so we return false so user not change password
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex"); // * here token is createed
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex"); // * here we encrypt this token and set in passwordResetToken in database

 
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // *here we set token expires

  return resetToken; // * here we return simple token and not encrypt token
};

//* ===========================================================

//* This middleware is work give only active user when we wrtie query using a find so onnnly give active user
//* ifyou want skip this middleware like actiuve user set that use this : .setOptions({ findInactive: true }) so middleware not run that time

//* ===========================================================
userSchema.pre(/^find/, function () {
  if (this.getOptions().findInactive) return;
  this.find({ active: true });
});

const User = mongoose.model("User", userSchema);
module.exports = User;

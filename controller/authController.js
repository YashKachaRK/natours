const crypto = require("crypto");
const User = require("../models/userModels");
const catchAsync = require("../utils/catchAsync.js");
const AppError = require("../utils/appError.js");
const fs = require("fs");
const path = require("path");
const Email = require("../utils/emailHandler.js");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");

//* ========================================================================================================

// * Here we check authToken is correct or not

//* ========================================================================================================

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

//* ========================================================================================================

//* Create AuthToken function

//* ========================================================================================================

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const opations = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),

    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") opations.secure = true;
  res.cookie("jwt", token, opations);
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};
//* ========================================================================================================

// * here we user create field : Name , Email , Password , Confirm Password and also give one token

//* ========================================================================================================

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  try {
    await new Email(newUser).sendWelcome();
  } catch (error) {
    console.log(error);
  }
  res.status(201).json({
    status: "success",
    message: "User Created..",
  });
});
//* ========================================================================================================

// * Here User can login over system if user is valid we return a token inside JSON

//* ========================================================================================================

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //* ===========================================================

  //* 1) This Email and password is exixts in body

  //* ===========================================================

  if (!email || !password) {
    return next(new AppError("Please Provide Email and Password!", 400));
  }

  //* ===========================================================

  //* 2) check this user exists && password is correct

  //* ===========================================================

  const user = await User.findOne({ email: email }).select(
    "+password +active +loginAttempts +lockUntil",
  );

  if (!user) {
    return next(
      new AppError(
        "Incorrect Email or Password or Your account is deactive please active your account ",
        401,
      ),
    );
  }

  //* check account is loacked ?

  if (user.lockUntil && user.lockUntil > new Date()) {
    const remainingMinutes = Math.ceil((user.lockUntil - new Date()) / 60000);
    return next(
      new AppError(
        `Too many incorrect attempts. Please try again after ${remainingMinutes} minute(s).`,
        429,
      ),
    );
  }
  //* check password id correct or not

  const isPassword = await user.correctPassword(password, user.password);

  if (!isPassword) {
    user.loginAttempts += 1;
    if (user.loginAttempts >= 3) {
      user.lockUntil = new Date(Date.now() + 10 * 60 * 1000);
    }

    await user.save();

    if (user.loginAttempts >= 3) {
      const unlockTime = new Date(user.lockUntil).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      await new Email(user).loginMail();
      return next(
        new AppError(
          "Too many incorrect password attempts. Your account is locked for 10 minutes.",
          429,
        ),
      );
    }
    return next(
      new AppError(
        `Incorrect Email or Password. Attempt ${user.loginAttempts} of 3.`,
        401,
      ),
    );
  }

  user.loginAttempts = 0;
  user.lockUntil = null;

  await user.save();

  //* =========== ================================================

  //* 3) it everthing ok so send token to clint

  //* ===========================================================

  createSendToken(user, 200, res);
});

//* ========================================================================================================

//* Now here we create middleware for user is login than he can asscess over system functionalty

//* ========================================================================================================

exports.protect = catchAsync(async (req, res, next) => {
  //* ===========================================================

  //* 1) Getting Token

  //* ===========================================================

  const token = req.cookies.jwt;

  if (!token) {
    return next(new AppError("You are not logged in!", 401));
  }

  //* ===========================================================

  //* 2) Verify Token

  //* ===========================================================

  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET); //*promisify() converts a callback-based function into a Promise-based function.

  //* ===========================================================

  //* 3) Check if user stil exits

  //* ===========================================================

  const currentUser = await User.findById(decode.id);

  if (!currentUser) {
    return next(new AppError("Please Singup Again", 401));
  }

  //* ===========================================================

  //* 4) Check If user change password after JWT token generat or issued

  //* ===========================================================

  if (currentUser.changedPasswordAfter(decode.iat)) {
    return next(
      new AppError("Please Login Again Your Password is changed", 401),
    );
  }

  //* ===========================================================

  //* 5) If upside all step pass he can access

  //* ===========================================================
  req.user = currentUser;
  next();
});
//* ========================================================================================================

// * Here now we add authorize person he can delete and update tour not update and delete normal user

//* ========================================================================================================

exports.restrictTour = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      // * req.user.role is user is user come so this function through error
      return next(
        new AppError(
          "You do not have permission to perform this operation",
          403,
        ),
      );
    }
    next();
  };
};
//* ========================================================================================================

//* Here Reset Password through email address

//* ========================================================================================================

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //* ===========================================================

  //* 1)Check user base on email in database

  //* ===========================================================

  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with this email", 404));
  }

  //* ===========================================================

  //* 2) Generate random reset Token

  //* ===========================================================

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //* ===========================================================

  //* 3) Send it email

  //* ===========================================================
  const resetURL = `${req.protocol}://${req.get("host")}/api/v1/auth/resetPassword/${resetToken}`;

  try {
    await new Email(user, resetURL).resetPassword();

    res.status(200).json({
      status: "success",
      message: "Token sent to mail",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was error some , issues is there please try again latter",
        500,
      ),
    );
  }
});

//* ========================================================================================================

//* Here we get authtoken from url and we change password

//* ========================================================================================================

exports.resetPassword = catchAsync(async (req, res, next) => {
  //* ===========================================================
  // * 1) Get User base on token
  //* ===========================================================

  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //* ===========================================================
  // * 2) If token has not expired and there is user set the new password
  //* ===========================================================

  if (!user) {
    return next(new AppError("Token is Invalid or Expired !!", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //* ===========================================================
  // * 3) Upate changePasswordProperty for the user
  //* ===========================================================

  createSendToken(user, 200, res);

  //* ===========================================================
  // * 4) log the user in send JWT
  //* ===========================================================
});

//* ========================================================================================================

//* Now User is alredy login he can also change password without reset password

//* ========================================================================================================

exports.updatePassword = catchAsync(async (req, res, next) => {
  //* ===========================================================

  //* 1) Get user for collection

  //* ===========================================================

  const currentUser = await User.findById(req.user.id).select("+password");

  if (!currentUser) {
    return next(new AppError("Please Singup Again", 401));
  }

  //* ===========================================================

  //* 2) Check enter password is correct

  //* ===========================================================

  const oldPassword = req.body.oldPassword;
  if (!oldPassword) {
    return next(new AppError("Please provide your current password", 400));
  }

  const isOldPasswordMatch = await currentUser.correctPassword(
    oldPassword,
    currentUser.password,
  );
  if (!isOldPasswordMatch) {
    return next(new AppError("Please Provide a currect password ", 401));
  }

  //* ===========================================================

  //* 3) Update Password

  //* ===========================================================

  currentUser.password = req.body.password;
  currentUser.passwordConfirm = req.body.passwordConfirm;
  await currentUser.save();

  //* ===========================================================

  //* 4)Log in user and send JWT token

  //* ===========================================================


  try {
    
    await new Email(currentUser )

    createSendToken(currentUser, 200, res);
  } catch (error) {
    return next(
      new AppError(
        "There was error some , issues is there please try again latter",
        500,
      ),
    );
  }
});

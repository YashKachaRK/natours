const crypto = require("crypto");
const User = require("../models/userModels");
const catchAsync = require("../utils/catchAsync.js");
const AppError = require("../utils/appError.js");
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
  const url = 0;
   try{
    await new Email(newUser, url).sendWelcome();
   }catch(error){
     console.log(error)
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

      const message = `Your account has been temporarily locked after multiple unsuccessful login attempts. You can try signing in again after ${unlockTime}. If you did not attempt to log in, we recommend securing your account.`;

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Account Temporarily Locked</title>
</head>

<body style="
  margin:0;
  padding:0;
  background-color:#f4f7fb;
  font-family:Arial, Helvetica, sans-serif;
">

<table width="100%" cellpadding="0" cellspacing="0" border="0"
  style="padding:40px 15px;background-color:#f4f7fb;">

  <tr>
    <td align="center">

      <table width="600" cellpadding="0" cellspacing="0" border="0"
        style="
          max-width:600px;
          width:100%;
          background:#ffffff;
          border-radius:16px;
          overflow:hidden;
          box-shadow:0 8px 30px rgba(0,0,0,0.08);
        ">

        <!-- Header -->
        <tr>
          <td align="center"
            style="
              background:#111827;
              padding:35px 25px;
            ">

            <div style="
              width:64px;
              height:64px;
              line-height:64px;
              margin:0 auto 18px;
              border-radius:50%;
              background:#f59e0b;
              color:#ffffff;
              font-size:30px;
              font-weight:bold;
            ">
              🔒
            </div>

            <h1 style="
              margin:0;
              color:#ffffff;
              font-size:28px;
              font-weight:700;
            ">
              Account Temporarily Locked
            </h1>

            <p style="
              margin:10px 0 0;
              color:#cbd5e1;
              font-size:15px;
            ">
              Your account has been temporarily locked for security.
            </p>

          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:40px 35px;">

            <p style="
              margin:0 0 18px;
              color:#111827;
              font-size:18px;
              font-weight:600;
            ">
              Hello 👋
            </p>

            <p style="
              margin:0 0 20px;
              color:#4b5563;
              font-size:15px;
              line-height:1.7;
            ">
              We detected multiple unsuccessful login attempts on
              your account. To protect your account, access has been
              temporarily locked.
            </p>

            <!-- Lock Information -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
              style="
                background:#fffbeb;
                border:1px solid #fde68a;
                border-radius:10px;
                margin:25px 0;
              ">

              <tr>
                <td style="padding:20px;">

                  <p style="
                    margin:0 0 8px;
                    color:#92400e;
                    font-size:15px;
                    font-weight:700;
                  ">
                    🔐 Security Protection
                  </p>

                  <p style="
                    margin:0 0 15px;
                    color:#92400e;
                    font-size:14px;
                    line-height:1.6;
                  ">
                    Your account has been locked for 10 minutes
                    because of multiple unsuccessful login attempts.
                  </p>

                  <p style="
                    margin:0;
                    color:#78350f;
                    font-size:14px;
                    line-height:1.6;
                  ">
                    <strong>You can try again after:</strong><br>
                    ${unlockTime}
                  </p>

                </td>
              </tr>

            </table>

            <!-- Account Status -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
              style="
                background:#f8fafc;
                border-radius:10px;
                margin-bottom:25px;
              ">

              <tr>
                <td style="padding:18px 20px;">

                  <p style="
                    margin:0 0 6px;
                    color:#64748b;
                    font-size:12px;
                    text-transform:uppercase;
                    letter-spacing:0.5px;
                  ">
                    Account Status
                  </p>

                  <p style="
                    margin:0;
                    color:#d97706;
                    font-size:16px;
                    font-weight:700;
                  ">
                    ● Temporarily Locked
                  </p>

                </td>
              </tr>

            </table>

            <p style="
              margin:0 0 15px;
              color:#4b5563;
              font-size:14px;
              line-height:1.7;
            ">
              If these login attempts were made by you, wait until
              the time above and then try again with the correct
              password.
            </p>

            <p style="
              margin:0;
              color:#dc2626;
              font-size:14px;
              line-height:1.7;
              font-weight:600;
            ">
              If you did not attempt to log in, please secure your
              account and change your password as soon as possible.
            </p>

          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 35px;">
            <div style="
              height:1px;
              background:#e5e7eb;
            "></div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center"
            style="padding:25px 30px 30px;">

            <p style="
              margin:0 0 8px;
              color:#6b7280;
              font-size:12px;
            ">
              This is an automated account security notification.
            </p>

            <p style="
              margin:0;
              color:#9ca3af;
              font-size:12px;
            ">
              © 2026 Your Company. All rights reserved.
            </p>

          </td>
        </tr>

      </table>

    </td>
  </tr>

</table>

</body>
</html>
`;
      // await sendEmail({
      //   email: user.email,
      //   subject: "Security Alert: Your Account Has Been Temporarily Locked",
      //   message,
      //   html,
      // });
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

  const message =
    "Your password has been updated successfully. You can now use your new password to sign in to your account.";
  const html = `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>Password Updated Successfully</title>
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #f4f7fb;
  font-family: Arial, Helvetica, sans-serif;
">

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background-color: #f4f7fb; padding: 40px 15px;"
  >
    <tr>
      <td align="center">

        <!-- Main Container -->
        <table
          width="600"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width: 600px;
            width: 100%;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          "
        >

          <!-- Header -->
          <tr>
            <td
              align="center"
              style="
                background-color: #111827;
                padding: 35px 25px;
              "
            >

              <div style="
                width: 64px;
                height: 64px;
                line-height: 64px;
                margin: 0 auto 18px;
                border-radius: 50%;
                background-color: #22c55e;
                color: #ffffff;
                font-size: 32px;
                font-weight: bold;
              ">
                ✓
              </div>

              <h1 style="
                margin: 0;
                color: #ffffff;
                font-size: 28px;
                font-weight: 700;
              ">
                Password Updated
              </h1>

              <p style="
                margin: 10px 0 0;
                color: #cbd5e1;
                font-size: 15px;
              ">
                Your account password has been changed successfully.
              </p>

            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 35px;">

              <p style="
                margin: 0 0 18px;
                color: #111827;
                font-size: 18px;
                font-weight: 600;
              ">
                Hello 👋
              </p>

              <p style="
                margin: 0 0 20px;
                color: #4b5563;
                font-size: 15px;
                line-height: 1.7;
              ">
                This is a confirmation that your account password was
                successfully updated.
              </p>

              <!-- Security Box -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  background-color: #f0fdf4;
                  border: 1px solid #bbf7d0;
                  border-radius: 10px;
                  margin: 25px 0;
                "
              >
                <tr>
                  <td style="padding: 20px;">

                    <p style="
                      margin: 0 0 8px;
                      color: #166534;
                      font-size: 15px;
                      font-weight: 700;
                    ">
                      🔐 Security Notice
                    </p>

                    <p style="
                      margin: 0;
                      color: #166534;
                      font-size: 14px;
                      line-height: 1.6;
                    ">
                      Your password has been changed. You can now use your
                      new password the next time you sign in.
                    </p>

                  </td>
                </tr>
              </table>

              <p style="
                margin: 0 0 15px;
                color: #4b5563;
                font-size: 14px;
                line-height: 1.7;
              ">
                If you made this change, no further action is required.
              </p>

              <p style="
                margin: 0;
                color: #dc2626;
                font-size: 14px;
                line-height: 1.7;
                font-weight: 600;
              ">
                If you did not change your password, please secure your
                account immediately.
              </p>

            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 35px;">
              <div style="
                height: 1px;
                background-color: #e5e7eb;
              "></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td
              align="center"
              style="
                padding: 25px 30px 30px;
              "
            >

              <p style="
                margin: 0 0 8px;
                color: #6b7280;
                font-size: 12px;
              ">
                This is an automated security notification.
              </p>

              <p style="
                margin: 0;
                color: #9ca3af;
                font-size: 12px;
              ">
                © 2026 Your Company. All rights reserved.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
  try {
    // await sendEmail({
    //   email: currentUser.email,
    //   subject: "Your Password Has Been Updated Successfully",
    //   message,
    //   html,
    // });

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

const catchAsync = require("../utils/catchAsync.js");
const AppError = require("../utils/appError.js");
const { APIFetures } = require("../utils/tourUtils.js");
const User = require("../models/userModels");
const sendEmail = require("../utils/emailHandler.js");
const multer = require("multer");
const sharp = require("sharp");
// multerStorage store image in disk means local and destination take 3 arguments current req , file , callback function as cb
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/img/user");
//   },
//   filename: (req, file, cb) => {
//     //user-id-timestamp
//     const ext = file.mimetype.split("/")[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

//* diskStorage saves the uploaded file on your server's disk. File Location in ServerDisk Good for local storage (Phsyical Storage)

//*memoryStorage does not save the file to your server's disk. File Location in RAM Good For store data in cloud and other online storage

// * Difference between discStorage and memortStorage

/**
|                        | `diskStorage`        | `memoryStorage`                          |
| ---------------------- | -------------------- | ---------------------------------------- |
| File location          | Server disk           | RAM                                      |
| `req.file.filename`    | ✅ Yes                | ❌ No                                     |
| `req.file.path`        | ✅ Yes                | ❌ No                                     |
| `req.file.buffer`      | ❌ Usually no         | ✅ Yes                                    |
| Good for               | Saving files locally | Uploading to cloud/storage or processing |
| RAM usage              | Low                  | Higher                                   |
| File remains on server | ✅ Yes                | ❌ No                                     |
 * 
 */
// we store buffer image
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
exports.uploadUserPhoto = upload.single("photo");

//resize middleware if in fronted side we take circler image and user upload sqare photo that type of problem we handle here we
// for resize we use sharp package
exports.resizePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/user/${req.file.filename}`); // store in localStorage
  next();
});

exports.getAllUser = catchAsync(async (req, res) => {
  const features = new APIFetures(User.find(), req.query)
    .filter()
    .sort()
    .field()
    .pageLimit();

  const users = await features.query;
  res.status(200).json({
    status: "Success",
    results: users.length,
    data: { users },
  });
});

exports.getSpecificUser = (req, res) => {
  const id = req.params.id;
  const user = User.findById((e) => e._id === id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  res.status(200).json({
    status: "Success",
    data: {
      user,
    },
  });
};

// * here we can do active user set deactive through id in auth token
exports.deleteUser = catchAsync(async (req, res, next) => {
  const currentUser = await User.findById(req.user.id).select("+active");
  if (!currentUser) {
    return next(new AppError("User is not found", 404));
  }

  if (!currentUser.active) {
    return next(
      new AppError("Your Account is deactive Please Active Account", 401),
    );
  }

  currentUser.active = false;

  await currentUser.save();
  // * Delete cookie
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  const message =
    "Your account has been successfully deactivated. You can reactivate your account at any time by signing in and following the account activation process.";
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Account Deactivated</title>
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
    style="padding: 40px 15px; background-color: #f4f7fb;"
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
                background-color: #ef4444;
                color: #ffffff;
                font-size: 30px;
                font-weight: bold;
              ">
                !
              </div>

              <h1 style="
                margin: 0;
                color: #ffffff;
                font-size: 28px;
                font-weight: 700;
              ">
                Account Deactivated
              </h1>

              <p style="
                margin: 10px 0 0;
                color: #cbd5e1;
                font-size: 15px;
              ">
                Your account has been successfully deactivated.
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
                This email confirms that your account has been
                successfully deactivated.
              </p>

              <!-- Warning Box -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  background-color: #fef2f2;
                  border: 1px solid #fecaca;
                  border-radius: 10px;
                  margin: 25px 0;
                "
              >
                <tr>
                  <td style="padding: 20px;">

                    <p style="
                      margin: 0 0 8px;
                      color: #b91c1c;
                      font-size: 15px;
                      font-weight: 700;
                    ">
                      🔒 Account Security Notice
                    </p>

                    <p style="
                      margin: 0;
                      color: #991b1b;
                      font-size: 14px;
                      line-height: 1.6;
                    ">
                      While your account is deactivated, you will not
                      be able to use it normally. Your account data
                      remains محفوظ safely.
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
                If you did not deactivate your account, please activate
                your account and secure it immediately.
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
              style="padding: 25px 30px 30px;"
            >

              <p style="
                margin: 0 0 8px;
                color: #6b7280;
                font-size: 12px;
              ">
                This is an automated account security notification.
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
    await sendEmail({
      email: currentUser.email,
      subject: "Your account has been successfully deactivated",
      message,
      html,
    });

    res.status(200).json({
      status: "success",
      message: "Your account has been successfully deactivated",
    });
  } catch (error) {
    return next(
      new AppError("There was an error. Please try again later.", 500),
    );
  }
});

//* here we can do deactive user set active through need email and password than user is active
exports.activeUser = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return next(new AppError("Please Provide Email and Password", 400));
  }
  const user = await User.findOne({ email })
    .setOptions({ findInactive: true })
    .select("+password +active");
  if (!user) {
    return next(new AppError("User is not found", 404));
  }

  const isPasswordCorrect = await user.correctPassword(password, user.password);

  if (!isPasswordCorrect) {
    return next(new AppError("Password is Incorrect", 401));
  }

  if (user.active) {
    return next(new AppError("you are already active", 400));
  }

  user.active = true;

  await user.save();

  const message =
    "Your account has been successfully activated. You can now sign in and use your account normally.";
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Account Activated Successfully</title>
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
    style="padding: 40px 15px; background-color: #f4f7fb;"
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
                Account Activated
              </h1>

              <p style="
                margin: 10px 0 0;
                color: #cbd5e1;
                font-size: 15px;
              ">
                Your account is active again.
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
                Welcome back 👋
              </p>

              <p style="
                margin: 0 0 20px;
                color: #4b5563;
                font-size: 15px;
                line-height: 1.7;
              ">
                This email confirms that your account has been
                successfully reactivated.
              </p>

              <!-- Success Box -->
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
                      ✓ Activation Successful
                    </p>

                    <p style="
                      margin: 0;
                      color: #166534;
                      font-size: 14px;
                      line-height: 1.6;
                    ">
                      Your account is now active and you can use
                      your account normally.
                    </p>

                  </td>
                </tr>
              </table>

              <!-- Account Status -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  background-color: #f8fafc;
                  border-radius: 10px;
                  margin-bottom: 25px;
                "
              >
                <tr>
                  <td style="padding: 18px 20px;">

                    <p style="
                      margin: 0 0 6px;
                      color: #64748b;
                      font-size: 12px;
                      text-transform: uppercase;
                      letter-spacing: 0.5px;
                    ">
                      Account Status
                    </p>

                    <p style="
                      margin: 0;
                      color: #16a34a;
                      font-size: 16px;
                      font-weight: 700;
                    ">
                      ● Active
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
                You can now log in and continue using your account.
              </p>

              <p style="
                margin: 0;
                color: #dc2626;
                font-size: 14px;
                line-height: 1.7;
                font-weight: 600;
              ">
                If you did not reactivate your account, please
                secure your account immediately.
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
              style="padding: 25px 30px 30px;"
            >

              <p style="
                margin: 0 0 8px;
                color: #6b7280;
                font-size: 12px;
              ">
                This is an automated account security notification.
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
    await sendEmail({
      email: user.email,
      subject: "Your account has been successfully activated",
      message,
      html,
    });

    res.status(200).json({
      status: "success",
      message: "Your account has been successfully activated",
    });
  } catch (error) {
    return next(
      new AppError(
        "There was error some , issues is there please try again later",
        500,
      ),
    );
  }
});

// * Here we update user data name and email through auth token medatory user is login

exports.updateUser = catchAsync(async (req, res, next) => {
  if (!req.body.name) {
    return next(
      new AppError(
        "Please Provide Only Name Here we can only change name",
        400,
      ),
    );
  }
  // * Now check user is exits or not
  const updateData = {
    name: req.body.name,
  };
  if (req.file) {
    updateData.photo = req.file.filename;
  }
  const currentUser = await User.findByIdAndUpdate(req.user.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!currentUser) {
    return next(new AppError("User is not found", 404));
  }

  const message = `${req.body.name} account information has been updated successfully. If you made this change, no further action is required.`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Updated Successfully</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f4f7fb;
  font-family:Arial,Helvetica,sans-serif;
">

<table width="100%" cellpadding="0" cellspacing="0" border="0"
  style="padding:40px 15px;background:#f4f7fb;">
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
              background:#22c55e;
              color:#ffffff;
              font-size:32px;
              font-weight:bold;
            ">
              ✓
            </div>

            <h1 style="
              margin:0;
              color:#ffffff;
              font-size:28px;
            ">
              Account Updated
            </h1>

            <p style="
              margin:10px 0 0;
              color:#cbd5e1;
              font-size:15px;
            ">
              Your account information was updated successfully.
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
              This is a confirmation that your account information
              has been successfully updated.
            </p>

            <!-- Success Box -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
              style="
                background:#f0fdf4;
                border:1px solid #bbf7d0;
                border-radius:10px;
                margin:25px 0;
              ">
              <tr>
                <td style="padding:20px;">

                  <p style="
                    margin:0 0 8px;
                    color:#166534;
                    font-size:15px;
                    font-weight:700;
                  ">
                    ✓ Update Successful
                  </p>

                  <p style="
                    margin:0;
                    color:#166534;
                    font-size:14px;
                    line-height:1.6;
                  ">
                    ${message}
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
              If you made this change, no further action is required.
            </p>

            <p style="
              margin:0;
              color:#dc2626;
              font-size:14px;
              line-height:1.7;
              font-weight:600;
            ">
              If you did not make this change, please secure your
              account immediately.
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
  try {
    await sendEmail({
      email: currentUser.email,
      subject: "Your Data Has Been Updated Successfully",
      message,
      html,
    });

    res.status(200).json({
      status: "success",
      message: "Data Was SuccessFully Update",
    });
  } catch (error) {
    return next(
      new AppError(
        "There was error some , issues is there please try again latter",
        500,
      ),
    );
  }
});

exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError("You are not login please login", 401));
  }
  res.status(200).json({
    status: "Success",
    data: {
      user,
    },
  });
});

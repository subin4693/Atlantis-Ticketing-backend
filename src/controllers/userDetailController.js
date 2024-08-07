const { GridFsStorage } = require("multer-gridfs-storage");
const { GridFSBucket } = require("mongodb");
const { default: mongoose } = require("mongoose");
const multer = require("multer");
const UserDetail = require("../models/userDetailModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require("../models/userModel");

// * update Images
exports.updateUserPhotos = catchAsync(async (req, res, next) => {
  req.body.profile_photo = req.files.map((file) => file.filename);

  const user = await UserDetail.findByIdAndUpdate(req.params.id, req.body);
  res.send({ status: "success", user });
});

// * Get Images with id
exports.getImages = catchAsync(async (req, res, next) => {
  const user = await UserDetail.findById(req.params.id);

  if (!user) {
    return next(new AppError("No user found with that ID"));
  }

  const { db } = mongoose.connection;
  const imageBucket = new GridFSBucket(db, { bucketName: "images" });

  const filenames = client.profile_photo;

  // ? when query images with file names
  // const filenames = req.query.filenames ? req.query.filenames.split(",") : [];

  if (!filenames.length) {
    return res.status(400).send({ error: "No filenames provided" });
  }

  const imagePromises = filenames.map((filename) => {
    return new Promise((resolve, reject) => {
      const imageData = [];
      const downloadStream = imageBucket.openDownloadStreamByName(filename);

      downloadStream.on("data", function(data) {
        imageData.push(data);
      });

      downloadStream.on("error", function() {
        reject(new AppError(`${filename}, error: "Image not found" `), 400);
      });

      downloadStream.on("end", () => {
        resolve({
          filename,
          data: Buffer.concat(imageData).toString("base64"),
        });
      });
    });
  });

  const images = await Promise.all(imagePromises.map((p) => p.catch((e) => e)));

  const successfulImages = images.filter((image) => image.data);
  const failedImages = images.filter((image) => image.error);

  res.status(200).send({
    successfulImages,
    failedImages,
  });
});

// * Create userDetail
exports.createUserDetail = catchAsync(async (req, res, next) => {
  try {
    const user = await UserDetail.create(req.body);

    await User.findByIdAndUpdate(req.body.userId, {
      role: "user",
      userId: user._id,
    });
    const newUser = await UserDetail.findById(user._id).populate("userId");

    res.status(201).json({
      status: "success",
      data: {
        newUser,
      },
    });
  } catch (err) {
    console.log(err);
  }
});

// * Get userDetail by userId
exports.getUserDetailByID = catchAsync(async (req, res, next) => {
  const user = await UserDetail.find({ userId: req.params.id });
  if (!user[0]) {
    return res.status(200).json({ message: "No user for this userid" });
  }

  const nUser = await user[0].populate("userId");

  res.status(200).json({
    status: "success",
    data: {
      UserDetail: nUser,
    },
  });
});

// * update userDetail
exports.updateUserDetail = catchAsync(async (req, res, next) => {
  try {
    const user = await UserDetail.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    const nUser = await user.populate("userId");

    if (!user) {
      return next(new AppError("No user found with that ID"));
    }
    res.status(201).json({
      status: "success",
      data: {
        UserDetail: nUser,
      },
    });
  } catch (err) {
    console.log(err);
  }
});
// * delete userDetail
exports.deleteUserDetail = catchAsync(async (req, res, next) => {
  const user = await UserDetail.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError("No user found with that ID"));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

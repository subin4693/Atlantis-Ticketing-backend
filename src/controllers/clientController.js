const { GridFsStorage } = require("multer-gridfs-storage");
const { GridFSBucket } = require("mongodb");
const { default: mongoose } = require("mongoose");
const multer = require("multer");
const Client = require("../models/clientModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Booked = require("../models/bookingModel");
const User = require("../models/userModel");

// const storage = new GridFsStorage({
//   url: process.env.DATABASE_LOCAL,
//   file: (req, file) => {
//     if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
//       return {
//         bucketName: "images",
//         filename: `${Date.now()}_${file.originalname}`,
//       };
//     }
//   },
// });

// const upload = multer({ storage });

// exports.uploadImages = upload.array("files", 2);

exports.updateClientPhotos = catchAsync(async (req, res, next) => {
  req.body.bestWork = req.files.map((file) => file.filename);

  const client = await Client.findByIdAndUpdate(req.params.id, req.body);
  res.send({ status: "success", client });
});

// * Get Images with id
// async function getImagesByFilenames(filenames) {
//   const { db } = mongoose.connection;
//   const imageBucket = new GridFSBucket(db, { bucketName: "images" });

//   const imagePromises = filenames.map((filename) => {
//     return new Promise((resolve, reject) => {
//       const imageData = [];
//       const downloadStream = imageBucket.openDownloadStreamByName(filename);

//       downloadStream.on("data", function(data) {
//         imageData.push(data);
//       });

//       downloadStream.on("error", function() {
//         reject(new AppError(`${filename}, error: "Image not found" `, 400));
//       });

//       downloadStream.on("end", () => {
//         resolve({
//           filename,
//           data: Buffer.concat(imageData).toString("base64"),
//         });
//       });
//     });
//   });

//   return Promise.all(imagePromises.map((p) => p.catch((e) => e)));
// }

// * Get Images with id
// async function getImagesByFilenames(filenames) {
//   const { db } = mongoose.connection;
//   const imageBucket = new GridFSBucket(db, { bucketName: "images" });

//   const imagePromises = filenames.map((filename) => {
//     return new Promise((resolve, reject) => {
//       const imageData = [];
//       const downloadStream = imageBucket.openDownloadStreamByName(filename);

//       downloadStream.on("data", function(data) {
//         imageData.push(data);
//       });

//       downloadStream.on("error", function() {
//         reject(new AppError(`${filename}, error: "Image not found" `, 400));
//       });

//       downloadStream.on("end", () => {
//         resolve({
//           filename,
//           data: Buffer.concat(imageData).toString("base64"),
//         });
//       });
//     });
//   });

//   return Promise.all(imagePromises.map((p) => p.catch((e) => e)));
// }

// exports.getImages = catchAsync(async (req, res, next) => {
//   const client = await Client.findById(req.params.id);

//   if (!client) {
//     return next(new AppError("No client found with that ID"));
//   }

//   const { db } = mongoose.connection;
//   const imageBucket = new GridFSBucket(db, { bucketName: "images" });

//   const filenames = client.bestWork;

//   if (!filenames.length) {
//     return res.status(400).send({ error: "No filenames provided" });
//   }

//   const imagePromises = filenames.map((filename) => {
//     return new Promise((resolve, reject) => {
//       const imageData = [];
//       const downloadStream = imageBucket.openDownloadStreamByName(filename);

//       downloadStream.on("data", function(data) {
//         imageData.push(data);
//       });

//       downloadStream.on("error", function() {
//         reject(new AppError(`${filename}, error: "Image not found" `), 400);
//       });

//       downloadStream.on("end", () => {
//         resolve({
//           filename,
//           data: Buffer.concat(imageData).toString("base64"),
//         });
//       });
//     });
//   });

//   const images = await Promise.all(imagePromises.map((p) => p.catch((e) => e)));

//   const successfulImages = images.filter((image) => image.data);
//   const failedImages = images.filter((image) => image.error);

//   res.status(200).send({
//     successfulImages,
//     failedImages,
//   });
// });

exports.getAllClients = catchAsync(async (req, res, next) => {
  const client = await Client.find();

  res.status(200).json({
    status: "success",
    results: client.length,
    data: {
      client,
    },
  });
});

exports.createClient = catchAsync(async (req, res, next) => {
  try {
    // const imageFiles = req.files.bestWork ? req.files?.bestWork?.map((file) => file.filename) : [];

    const client = await Client.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      userId: req.body.userId,
      role: req.body.role,
      workExperience: req.body.workExperience,
      // location: req.body.location,
      contact: req.body.contact,
      qId: req.body.qId,
      crNo: req.body.crNo,
      bestWork: req.body.bestWork,
      description: req.body.description,
      availability: req.body.availability,
    });

    await User.findByIdAndUpdate(req.body.userId, {
      role: "client",
    });

    const newClient = await Client.findById(client._id).populate("role");

    // const imageFilenames = newClient.bestWork;
    // const images = await getImagesByFilenames(imageFilenames);

    // const successfulImages = images.filter((image) => image.data);
    // const bestWorkWithImages = successfulImages.map((image) => ({
    //   filename: image.filename,
    //   data: image.data,
    // }));

    res.status(201).json({
      status: "success",
      data: {
        newClient: {
          _id: newClient._id,
          firstName: newClient.firstName,
          lastName: newClient.lastName,
          email: newClient.email,
          userId: newClient.userId,
          role: newClient.role,
          workExperience: newClient.workExperience,
          location: newClient.location,
          contact: newClient.contact,
          qId: newClient.qId,
          crNo: newClient.crNo,
          bestWork: newClient.bestWork,
          description: newClient.description,
          availability: newClient.availability,
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

exports.getClientByID = catchAsync(async (req, res, next) => {
  const client = await Client.find({ userId: req.params.id });

  if (!client[0]) {
    return res.status(200).json({ message: "No client for this userid" });
  }

  const nClient = await client[0].populate("role");

  // const imageFilenames = nClient.bestWork;
  // const images = await getImagesByFilenames(imageFilenames);

  // const successfulImages = images.filter((image) => image.data);
  // const bestWorkWithImages = successfulImages.map((image) => ({
  //   filename: image.filename,
  //   data: image.data,
  // }));

  res.status(200).json({
    status: "success",
    data: {
      client: {
        ...nClient.toObject(),
        // bestWork: bestWorkWithImages,
      },
    },
  });
});

exports.updateClient = catchAsync(async (req, res, next) => {
  try {
    // if (req.files.bestWork) req.body.bestWork = req.files?.bestWork?.map((file) => file.filename);

    const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("role");

    if (!client) {
      return next(new AppError("No client found with that ID"));
    }

    // const imageFilenames = client.bestWork;
    // const images = await getImagesByFilenames(imageFilenames);

    // const successfulImages = images.filter((image) => image.data);
    // const bestWorkWithImages = successfulImages.map((image) => ({
    //   filename: image.filename,
    //   data: image.data,
    // }));

    res.status(201).json({
      status: "success",
      data: {
        client: {
          ...client,
          // bestWork: bestWorkWithImages,
        },
      },
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

exports.deleteClient = catchAsync(async (req, res, next) => {
  const client = await Client.findByIdAndDelete(req.params.id);

  if (!client) {
    return next(new AppError("No client found with that ID"));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.clientBooked = catchAsync(async (req, res, next) => {
  const clientId = req.params.clientId;

  const today = new Date();

  const bookings = await Booked.find({
    clientId,
    date: { $gte: today },
    status: "booked",
  })
    .populate("user", "fullName email")
    .populate("itemId")
    .populate("organizingTeam");

  res.status(200).json({
    status: "success",
    data: {
      bookings,
    },
  });
});

exports.getClientByClientID = catchAsync(async (req, res, next) => {
  const client = await Client.findById(req.params.id);

  if (!client) {
    return res.status(200).json({ message: "No client for this userid" });
  }

  // const imageFilenames = client.bestWork;
  // const images = await getImagesByFilenames(imageFilenames);

  // const successfulImages = images.filter((image) => image.data);
  // const bestWorkWithImages = successfulImages.map((image) => ({
  //   filename: image.filename,
  //   data: image.data,
  // }));

  res.status(200).json({
    status: "success",
    data: {
      client: {
        ...client.toObject(),
        // bestWork: bestWorkWithImages,
      },
    },
  });
});

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
// const { GridFsStorage } = require("multer-gridfs-storage");
// const multer = require("multer");

process.on("uncaughtException", (err) => {
  console.log(err);
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message, err.stack);
  process.exit(1);
});

dotenv.config({ path: "./src/config/config.env" });
const app = require("./app");

// MongoDB cluster
// const DB = process.env.DATABASE_PROD.replace(
//   '<PASSWORD>',
//   process.env.DATABASE_PASSWORD
// );

//Local MonogoDB
const DB = process.env.DATABASE_LOCAL;

mongoose.connect(DB).then(() => console.log("DB connection successful!"));

// // GridFS storage configuration
// const storage = new GridFsStorage({
//   url: DB,
//   file: (req, file) => {
//     return {
//       bucketName: "uploads", // Bucket name in MongoDB
//       filename: file.originalname,
//     };
//   },
// });

// const upload = multer({ storage });

// app.use((req, res, next) => {
//   req.upload = upload;
//   next();
// });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

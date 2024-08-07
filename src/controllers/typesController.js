const Type = require("../models/typeModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.createType = catchAsync(async (req, res) => {
  const newType = new Type(req.body);
  await newType.save();
  res.status(201).json({
    message: "success",
    newType,
  });
});

exports.deleteType = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const deleted = await Type.findOneAndDelete({ _id: id });

  if (!deleted) {
    return next(new AppError("Not found", 404));
  }
  res.status(201).json({
    message: "success",
  });
});

exports.getType = catchAsync(async (req, res) => {
  const types = await Type.find();

  res.status(200).json({
    message: "success",
    types,
  });
});

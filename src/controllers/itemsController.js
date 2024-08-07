const Item = require("../models/itemsModel");
const Client = require("../models/clientModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const mongoose = require("mongoose");

exports.createItems = catchAsync(async (req, res, next) => {
  // const imageFiles = req.files.images ? req.files?.images?.map((file) => file.filename) : [];
  // const decorationFiles = req.files.decorationImages
  //   ? req?.files?.decorationImages?.map((file) => file.filename)
  //   : [];

  // if (decorationFiles.length > 0) req.body.decorationImages = decorationFiles;

  // if (imageFiles.length > 0) req.body.images = imageFiles;

  const newItem = new Item(req.body);
  await newItem.save();
  res.status(201).json({
    message: "success",
    newItem,
  });
});

exports.deleteItem = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const deletedData = await Item.findOneAndDelete({ _id: id });
  if (!deletedData) {
    return next(new AppError("Not found", 404));
  }
  res.status(200).json({ message: "Deleted successfull" });
});

exports.editItem = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  // const imageFiles = req.files.images ? req.files.images.map((file) => file.filename) : [];
  // const decorationFiles = req.files.decorationImages
  //   ? req.files.decorationImages.map((file) => file.filename)
  //   : [];

  // if (decorationFiles.length > 0) req.body.decorationImages = decorationFiles;
  // if (imageFiles.length > 0) req.body.images = imageFiles;

  await Item.findByIdAndUpdate(id, req.body);

  res.status(201).json({ message: "Edited successful" });
});

exports.getItemsByType = catchAsync(async (req, res, next) => {
  const typeId = req.params.typeId;
  const items = await Item.find({ typeId });
  res.status(200).json({
    message: "Success",
    items,
  });
});

exports.getItem = catchAsync(async (req, res, next) => {
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({
      message: "Both start and end date query parameters are required.",
    });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  // Check for valid date range
  if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
    return res.status(400).json({
      message: "Invalid start or end date. Please provide a valid date range.",
    });
  }

  const dateRange = [];
  for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
    dateRange.push(new Date(d)); // Create a new date instance to avoid mutating `d`
  }

  const availableClients = await Client.find({
    availability: {
      $not: {
        $in: dateRange,
      },
      // availability: {
      //   $not: {
      //     $elemMatch: {
      //       $in: dateRange,
      //     },
      //   },
      // },
    },
  }).select("_id");

  const availableClientIds = availableClients.map((client) => client._id);

  const items = await Item.find({
    clientId: { $in: availableClientIds },
  });

  // const fetchImages = async (item) => {
  //   try {
  //     const images = await getImages(item.images);
  //     return { ...item.toObject(), images };
  //   } catch (error) {
  //     console.error(`Error fetching images for item ${item._id}:`, error);
  //     return item.toObject();
  //   }
  // };

  const groupedItems = {};

  for (let item of items) {
    const typeId = item.typeId.toString();
    if (!groupedItems[typeId]) {
      groupedItems[typeId] = [];
    }
    // const updatedItem = await fetchImages(item);
    groupedItems[typeId].push(item);
  }

  res.status(200).json({
    message: "Success",
    items: groupedItems,
  });
});

exports.getSingleItemById = catchAsync(async (req, res, next) => {
  const itemId = req.params.itemId;
  const item = await Item.findById(itemId);
  if (!item) return next(new AppError("Item not found", 404));

  // const images = await getImages(item.images);
  // const decorationImages = await getImages(item.decorationImages);

  res.status(200).json({ message: "success", item: item });
});

// Get item by userId
exports.getItemByUserId = async (req, res, next) => {
  try {
    const Items = await Item.find({ clientId: req.params.userId });

    // let items = [];
    // for (let i = 0; i < Items.length; i++) {
    //   // let img = await getImages(Items[i].images);
    //   // let decorationImages = await getImages(Items[i]?.decorationImages);

    //   items.push({
    //     item: Items[i],
    //     image: img,
    //     decorationImages: decorationImages,
    //   });
    // }

    res.status(200).json({ items: Items });
  } catch (error) {
    console.error("Error:", error);
    next(error);
  }
};

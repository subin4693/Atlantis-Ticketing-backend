// controllers/bookingController.js
const Booking = require("../models/bookingModel");
const Client = require("../models/clientModel");
const Item = require("../models/itemsModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { v4: uuidv4 } = require("uuid");

const mongoose = require("mongoose");

// Create a new booking
exports.createBooking = catchAsync(async (req, res, next) => {
  const { itemIds } = req.body;
  const uniqueId = uuidv4();

  itemIds.map(async (itemId) => {
    const clientId = await Item.findById(itemId).select("clientId");

    const newBooking = new Booking({
      ...req.body,
      clientId: clientId.clientId,
      itemId,
      groupId: uniqueId,
    });
    await newBooking.save();
  });
  res.status(201).json({ message: "New booking added" });
});

// Cancel a booking
exports.cancelBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return next(new AppError("Booking not found", 404));
  }

  booking.status = "cancelled";

  const { date, itemId } = booking;

  const item = await Item.findById(itemId);
  for (let i = 0; i < date.length; i++) {
    const dateIndex = item.dates.findIndex((d) => d.toISOString() === date[i].toISOString());
    if (dateIndex === -1) {
      console.log("Date not found in item");
    } else {
      await Item.updateOne({ _id: itemId }, { $pull: { dates: date[i] } });
    }
  }

  await booking.save();
  res.status(200).json(booking);
});

// Get all bookings
exports.getBookings = async (req, res, next) => {
  const bookings = await Booking.find();
  res.status(200).json({ bookings });
};
//GET BOOKINGS BY CLIENT ID
exports.getBookingsByClientId = async (req, res, next) => {
  const bookings = await Booking.find({ clientId: req.params.id });
  res.status(200).json({ bookings });
};

// edit booking
exports.editBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return next(new AppError("Booking not found", 404));
  }
  if (req.body.date) {
    const { date, itemId } = booking;

    const item = await Item.findById(itemId);
    for (let i = 0; i < date.length; i++) {
      const dateIndex = item.dates.findIndex((d) => d.toISOString() === date[i].toISOString());
      if (dateIndex === -1) {
        console.log("Date not found in item");
      }

      await Item.updateOne({ _id: itemId }, { $pull: { dates: date[i] } });
    }
  }

  Object.assign(booking, { ...req.body, isEdited: true });

  await booking.save();
  res.status(200).json(booking);
});

exports.confirmBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) return next(new AppError("Booking not found", 404));

  const client = await Client.findById(booking.clientId);

  if (!client) return next(new AppError("Client not found", 404));

  if (req.body.isConfirmed) {
    const existingDates = new Set(client.availability.map((date) => date.toISOString()));
    const conflictingDates = booking.date.filter((date) => existingDates.has(date.toISOString()));

    if (conflictingDates.length > 0) {
      return res.status(400).json({
        message: "Some dates in the booking already exist in the client's availability.",
        conflictingDates,
      });
    }

    client.availability.push(...booking.date);

    booking.isConfirmed = true;
  } else {
    client.availability = client.availability.filter(
      (date) =>
        !booking.date.some((bookingDate) => bookingDate.toISOString() === date.toISOString()),
    );

    booking.isConfirmed = false;
  }
  await booking.save();
  await client.save();

  return res.status(201).json({ message: "success", booking });
});

exports.getEvents = catchAsync(async (req, res, next) => {
  const bookings = await Booking.aggregate([
    {
      $lookup: {
        from: "items", // Assuming the collection name for items is 'items'
        localField: "itemId",
        foreignField: "_id",
        as: "itemDetails",
      },
    },
    {
      $unwind: "$itemDetails",
    },
    {
      $group: {
        _id: "$groupId",
        bookings: { $push: "$$ROOT" },
      },
    },
    {
      $project: {
        _id: 0,
        groupId: "$_id",
        bookings: 1,
      },
    },
  ]);

  // Fetch and attach images to the response
  for (let group of bookings) {
    for (let booking of group.bookings) {
      if (booking.itemDetails && booking.itemDetails.images.length > 0) {
        const images = await getImages(booking.itemDetails.images);
        booking.itemDetails.images = images;
      }
    }
  }

  res.status(200).json({
    message: "success",
    events: bookings,
  });
});

// exports.getEvents = catchAsync(async (req, res, next) => {
//   const bookings = await Booking.aggregate([
//     {
//       $lookup: {
//         from: "items", // Assuming the collection name for items is 'items'
//         localField: "itemId",
//         foreignField: "_id",
//         as: "itemDetails",
//       },
//     },
//     {
//       $unwind: "$itemDetails",
//     },
//     {
//       $group: {
//         _id: "$groupId",
//         bookings: { $push: "$$ROOT" },
//       },
//     },
//     {
//       $project: {
//         _id: 0,
//         groupId: "$_id",
//         bookings: 1,
//       },
//     },
//   ]);

//   console.log(bookings);
//   res.status(200).json({
//     message: "success",
//     events: bookings,
//   });
// });

exports.getEventById = catchAsync(async (req, res, next) => {
  try {
    const groupId = req.params.id;

    const bookings = await Booking.find({ groupId })

      .populate({
        path: "itemId",
        populate: { path: "typeId" },
      })
      .exec();

    const bookingsWithImages = await Promise.all(
      bookings.map(async (booking) => {
        const item = booking.itemId;

        const imageFiles = [...item.images, ...item?.decorationImages];
        const images = await getImages(imageFiles);
        return { ...booking.toObject(), item: { ...item.toObject(), images } };
      }),
    );

    res.status(200).json({ message: "Success", bookings: bookingsWithImages });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

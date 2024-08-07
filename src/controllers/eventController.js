const Event = require("../models/eventModel");
const Booking = require("../models/bookingModel");

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");

const Item = require("../models/itemsModel");
const TicketType = require("../models/ticketTypesModel");

const getEvensByCondition = async (condition) => {
  const now = new Date();

  const results = await Event.aggregate([
    {
      $match: condition,
    },
    {
      $addFields: {
        lastDate: { $arrayElemAt: ["$dates", -1] },
      },
    },
    {
      $addFields: {
        isUpcoming: { $gt: ["$lastDate", now] },
      },
    },
    {
      $lookup: {
        from: "items",
        localField: "venue",
        foreignField: "_id",
        as: "venue",
      },
    },
    {
      $lookup: {
        from: "items",
        localField: "catering",
        foreignField: "_id",
        as: "catering",
      },
    },
    {
      $lookup: {
        from: "items",
        localField: "decoration",
        foreignField: "_id",
        as: "decoration",
      },
    },
    {
      $lookup: {
        from: "items",
        localField: "photograph",
        foreignField: "_id",
        as: "photograph",
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        images: 1,
        ticketPrice: 1,
        venue: { $arrayElemAt: ["$venue", 0] },
        catering: { $arrayElemAt: ["$catering", 0] },
        decoration: { $arrayElemAt: ["$decoration", 0] },
        photograph: { $arrayElemAt: ["$photograph", 0] },
        status: 1,
        rejectedBy: 1,
        dates: 1,
        isPublished: 1,
        isUpcoming: 1,
      },
    },
    {
      $group: {
        _id: null,
        upcomingEvents: {
          $push: {
            $cond: {
              if: "$isUpcoming",
              then: {
                item: "$$ROOT",
              },
              else: "$$REMOVE",
            },
          },
        },
        pastEvents: {
          $push: {
            $cond: {
              if: { $not: "$isUpcoming" },
              then: {
                item: "$$ROOT",
              },
              else: "$$REMOVE",
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        upcomingEvents: 1,
        pastEvents: 1,
      },
    },
  ]);

  const { upcomingEvents, pastEvents } = results[0] || {
    upcomingEvents: [],
    pastEvents: [],
  };

  // Fetch and assign images for each event in parallel
  // const [upcomingEventsWithImages, pastEventsWithImages] = await Promise.all([
  //   Promise.all(
  //     upcomingEvents.map(async (event) => ({
  //       item: event.item,
  //       // image: await getImages(event.item.images),
  //     })),
  //   ),
  //   Promise.all(
  //     pastEvents.map(async (event) => ({
  //       item: event.item,
  //       // image: await getImages(event.item.images),
  //     })),
  //   ),
  // ]);
  return { Upcoming: upcomingEvents, Past: pastEvents };
};

exports.createEvent = catchAsync(async (req, res, next) => {
  console.log(req.body);

  const newEvent = new Event({
    name: req.body.event.name,
    description: req.body.event.description,
    images: req.body.event.images,

    dates: req.body.event.dates || [],
  });

  await newEvent.save();

  const categorys = req.body.categorys;
  const eventId = newEvent._id;

  for (cat of categorys) {
    const insertedCategory = new TicketType({ eventId, category: cat.category, price: cat.price });
    await insertedCategory.save();
  }

  const event = await Event.findByIdAndUpdate(eventId, { isPublished: true });

  const data = await getEvensByCondition({ isPublished: true });

  res.status(201).json({ success: true, Upcoming: data.Upcoming, Past: data.Past });
});
exports.getAllEvents = catchAsync(async (req, res, next) => {
  const data = await getEvensByCondition({ isPublished: true });

  res.status(200).json({
    message: "success",
    Upcoming: data.Upcoming,
    Past: data.Past,
  });
});

exports.getAllPublishedEvents = async (req, res, next) => {
  const data = await getEvensByCondition({ isPublished: true });

  res.status(200).json(data);
};

exports.getEventsByUserId = catchAsync(async (req, res, next) => {
  const userId = req.params.userId;

  const data = await getEvensByCondition({ userId: new mongoose.Types.ObjectId(userId) });

  res.status(200).json({
    message: "success",
    Upcoming: data.Upcoming,
    Past: data.Past,
  });
});

exports.getEventsByClientId = catchAsync(async (req, res, next) => {
  const clientId = req.params.clientId;

  const bookings = await Booking.find({ clientId }).populate("eventId userId");

  let upcomingEvents = [];
  let pastEvents = [];

  const now = new Date();

  for (let booking of bookings) {
    const event = booking.eventId;

    if (event && event.dates.length > 0) {
      const latestDate = new Date(Math.max(...event.dates.map((date) => new Date(date))));

      // let images = [];
      // if (event.images && event.images.length > 0) {
      //   images = await getImages(event.images);
      // }

      const eventData = {
        item: booking,
        event: event,
        // images: images,
      };

      if (latestDate < now) {
        pastEvents.push(eventData);
      } else {
        upcomingEvents.push(eventData);
      }
    }
  }

  res.status(200).json({
    message: "success",
    Upcoming: upcomingEvents,
    Past: pastEvents,
  });
});

///b 669e00735ba7aee3532a8e4e
///c 669e00735ba7aee3532a8e4e

exports.confirmEvent = catchAsync(async (req, res, next) => {
  const bookingId = req.params.bookingId;
  const booking = await Booking.findById(bookingId);

  const clientId = booking.clientId;
  if (!booking) {
    return next(new AppError("No Bookings found", 404));
  }
  booking.isConfirmed = "Confirmed";
  await booking.save();

  const bookings = await Booking.find({ eventId: booking.eventId });

  const allConfirmed = bookings.every((b) => b.isConfirmed == "Confirmed");
  if (allConfirmed) {
    await Event.findByIdAndUpdate(booking.eventId, { status: "Confirmed" });
  }

  const Events = await Booking.find({ clientId }).populate("eventId");

  let events = [];
  for (let i = 0; i < Events.length; i++) {
    // let img = await getImages(Events[i]?.eventId?.images);
    events.push({
      item: Events[i],
      // images: img,
    });
  }

  // await Event.findByIdAndUpdate(eventId, { status: "Confirmed" });
  res.status(200).json({ message: "success", events: events });
});

exports.rejectEvent = catchAsync(async (req, res, next) => {
  const bookingId = req.params.bookingId;
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return next(new AppError("No Bookings found", 404));
  }
  const clientId = booking.clientId;
  const item = await Item.findById(booking.itemId)
    .select("typeId")
    .populate("typeId");

  if (!item || !item.typeId) {
    return next(new AppError("Item type not found", 404));
  }

  const itemType = item.typeId.type;

  booking.isConfirmed = "Rejected";
  await booking.save();

  const rejectionObject = {
    id: booking.itemId,
    type: itemType, // Use the type retrieved from the populated typeId
  };

  await Event.findByIdAndUpdate(
    booking.eventId,
    {
      $addToSet: { rejectedBy: rejectionObject },
      status: "Rejected",
      isPublished: false,
    },
    { new: true },
  );

  const Events = await Booking.find({ clientId }).populate("eventId");

  let events = [];
  for (let i = 0; i < Events.length; i++) {
    // let img = await getImages(Events[i]?.eventId?.images);
    events.push({
      item: Events[i],
      // images: img,
    });
  }

  res.status(200).json({ message: "success", events: events });
});

exports.publishEvent = catchAsync(async (req, res, next) => {
  const categorys = req.body.categorys;
  const eventId = req.params.eventId;

  for (cat of categorys) {
    const insertedCategory = new TicketType({ eventId, category: cat.category, price: cat.price });
    await insertedCategory.save();
  }

  const event = await Event.findByIdAndUpdate(eventId, { isPublished: true, status: "Confirmed" });
  const userId = event.userId;

  const data = await getEvensByCondition({ userId: new mongoose.Types.ObjectId(userId) });

  res.status(200).json({
    message: "success",
    Upcoming: data.Upcoming,
    Past: data.Past,
  });
});

exports.cancelEvent = catchAsync(async (req, res, next) => {
  const eventId = req.params.eventId;
  await TicketType.deleteMany({ eventId });
  const event = await Event.findByIdAndUpdate(eventId, { isPublished: false, status: "Canceled" });
  const userId = event.userId;

  const bookings = await Booking.find({ eventId });

  for (book of bookings) {
    book.isConfirmed = "Canceled";
    await book.save();
  }

  const data = await getEvensByCondition({ userId: new mongoose.Types.ObjectId(userId) });

  res.status(200).json({
    message: "success",
    Upcoming: data.Upcoming,
    Past: data.Past,
  });
});

exports.getEventByEventId = catchAsync(async (req, res, next) => {
  const eventId = req.params.eventId;
  const event = await Event.findById(eventId);

  res.status(200).json({
    message: "success",
    data: {
      event: {
        details: event,
        //  images: eventImages
      },
    },
  });
});
exports.editEventById = catchAsync(async (req, res, next) => {
  const eventId = req.params.eventId;
  const { venue, catering, photograph, decoration } = req.body;

  const updateData = {
    userId: req.body.userId,
    name: req.body.name,
    description: req.body.description,
    ticketPrice: req.body.ticketPrice || 0,
    rejectedBy: [],
    isPublished: false,
    status: "Booked",
  };

  const unsetData = {};

  if (JSON.parse(venue)?.id) {
    updateData.venue = JSON.parse(venue).id;
  } else {
    unsetData.venue = "";
  }

  if (JSON.parse(catering)?.id) {
    updateData.catering = JSON.parse(catering).id;
  } else {
    unsetData.catering = "";
  }

  if (JSON.parse(photograph)?.id) {
    updateData.photograph = JSON.parse(photograph).id;
  } else {
    unsetData.photograph = "";
  }

  if (JSON.parse(decoration)?.id) {
    updateData.decoration = JSON.parse(decoration).id;
  } else {
    unsetData.decoration = "";
  }

  const newEvent = await Event.findByIdAndUpdate(
    eventId,
    { $set: updateData, $unset: unsetData },
    { new: true },
  );

  const updatedEvnt = await Event.findByIdAndUpdate(eventId, { $unset: unsetData }, { new: true });

  if (!newEvent) {
    return res.status(404).json({ message: "Event not found" });
  }

  await Booking.deleteMany({ eventId });

  const services = [venue, catering, photograph, decoration];
  for (const service of services) {
    if (service) {
      const parsedService = JSON.parse(service);
      if (parsedService.id && parsedService.clientId) {
        const booking = new Booking({
          userId: req.body.userId,
          clientId: parsedService.clientId,
          itemId: parsedService.id,
          eventId: newEvent._id,
        });

        await booking.save();
      }
    }
  }

  res.status(201).json({ message: "success", event: newEvent, updatedEvnt });
});

exports.deleteFieldFromEvent = catchAsync(async (req, res, next) => {
  const { eventId, field } = req.params;
  const updatedEvent = await Event.findByIdAndUpdate(
    eventId,
    { $unset: { [field]: "" } },
    { new: true }, // Return the updated document
  );

  res.status(200).json({ message: "Field removed successfully", event: updatedEvent });
});

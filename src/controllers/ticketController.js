const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const TicketType = require("../models/ticketTypesModel");
const Ticket = require("../models/ticketsModel");
const User = require("../models/userModel");
const Event = require("../models/eventModel");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

require("dotenv").config();
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});
const signature = `
    <div style="margin-left: 10px;">
        <p style="font-family: Arial, sans-serif; color: #333;"><b>Best regards,</b></p>
        <p style="font-family: Arial, sans-serif; color: #333;"><b>Atlantis</b></p>
    </div>
    <div style="display: flex; justify-content: center; align-items: center; margin-top: 10px; padding: 10px;">
    <div style="display: flex; align-items: center;">
        <img src="https://cdn2.advanceinfotech.org/doha.directory/1200x675/business/2278/futad-advertising-qatar-1657866216.webp" style="width: 100px; height: 100px; margin-right: 10px;">
        <h1 style="color: #921A40; font-size: 2rem; margin: 0;">
            <b>Atlantis</b>
        </h1>
    </div>
</div>
`;

exports.getTicketTypes = catchAsync(async (req, res, next) => {
  const { eventId } = req.params;

  const ticketTypes = await TicketType.find({ eventId });

  res.status(200).json({
    message: "success",
    ticketTypes,
  });
});

exports.bookTickets = catchAsync(async (req, res, next) => {
  const { eventId, emailId, tickets } = req.body;

  if (!eventId || !emailId || !tickets || !Array.isArray(tickets)) {
    return next(new AppError(400, "Invalid data"));
  }

  const ticketTypes = await TicketType.find({ _id: { $in: tickets.map((ticket) => ticket.type) } });

  if (ticketTypes.length !== tickets.length) return next(new AppError(400, "Invalid tickets"));

  const test = tickets.map((ticket) => {
    return {
      eventId,
      type: ticket.type,
      totalCost:
        ticketTypes.find((type) => type._id.toString() === ticket.type.toString()).price *
        ticket.quantity,
      quantity: ticket.quantity,
      purchaseDate: new Date(),
    };
  });

  let totalQuantity = 0,
    totalCost = 0;
  for (t of test) {
    totalQuantity += t.quantity;
    totalCost += t.totalCost;
  }

  // const user = await User.findById(new mongoose.Types.ObjectId(buyerId));
  const event = await Event.findById(new mongoose.Types.ObjectId(eventId));

  res.status(201).json({ message: "ticket booked successfully" });
  const emailContent = `
  <h3 style="font-family: Arial, sans-serif; color: #333;">
      Hello ${emailId.split("@")[0]},
  </h3>
  <p style="font-family: Arial, sans-serif; color: #333;">
      Thank you for purchasing tickets for ${
        event.name
      }. We are thrilled to have you join us for this exciting event. 
      Your support means a lot to us, and we are committed to providing you with an unforgettable experience. 
      From the moment you arrive, we hope you enjoy the vibrant atmosphere, engaging performances, and the overall ambiance 
      that makes this event special. We look forward to seeing you and hope you have a fantastic time!
  </p>
  <p style="font-family: Arial, sans-serif; color: #333;">
      Here are the purchase details:
  </p>
  <h4 style="font-family: Arial, sans-serif; color: #333;">
      Event Name: ${event.name}
  </h4>
  <h4 style="font-family: Arial, sans-serif; color: #333;">
      Number Of Tickets: ${totalQuantity}
  </h4>
  <h4 style="font-family: Arial, sans-serif; color: #333;">
      Total Amount: ${totalCost}  QAR
  </h4>
  <h4 style="font-family: Arial, sans-serif; color: #333;">
      Category:  
  </h4>
  <br>
  ${signature}
`;

  await transporter.sendMail({
    to: emailId,
    subject: `Hello ${emailId.split("@")[0]}, Thank you for purchasing ${event.name} tickets`,
    html: emailContent,
  });
  console.log("Email has been sent");
});

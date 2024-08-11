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
  try {
    const { eventId, emailId, tickets, promoCode } = req.body;

    if (!eventId || !emailId || !tickets || !Array.isArray(tickets)) {
      return next(new AppError(400, "Invalid data"));
    }

    const ticketTypes = await TicketType.find({ _id: { $in: tickets.map((ticket) => ticket.type) } });
    if (ticketTypes.length !== tickets.length) return next(new AppError(400, "Invalid tickets"));

    let totalQuantity = 0, totalCost = 0;

    const ticketDetails = tickets.map((ticket) => {
      const ticketType = ticketTypes.find((type) => type._id.toString() === ticket.type.toString());
      const cost = ticketType.price * ticket.quantity;
      totalQuantity += ticket.quantity;
      totalCost += cost;
      return {
        eventId,
        type: ticket.type,
        totalCost: cost,
        quantity: ticket.quantity,
        purchaseDate: new Date(),
      };
    });

    console.log(`Total cost before discount: ${totalCost} QAR`);

    // Apply promo code discount if provided
    if (promoCode) {
      const promo = await PromoCode.findOne({ code: promoCode, isActive: true });

      if (promo) {
        // Check if promo code has expired
        if (promo.expiresAt && promo.expiresAt < new Date()) {
          return next(new AppError(400, "Promo code expired"));
        }

        // Check if promo code usage limit is exceeded
        if (promo.maxUses <= promo.currentUses) {
          return next(new AppError(400, "Promo code usage limit exceeded"));
        }

        const discount = (promo.discountPercentage / 100) * totalCost;
        console.log(`Discount applied: ${discount} QAR`);
        totalCost -= discount;
        console.log(`Total cost after discount: ${totalCost} QAR`);

        // Increment the promo code usage count
        promo.currentUses += 1;
        await promo.save();
      } else {
        return next(new AppError(400, "Invalid promo code"));
      }
    }

    // Save tickets and send email
    const event = await Event.findById(new mongoose.Types.ObjectId(eventId));
    if (!event) {
      return next(new AppError(404, "Event not found"));
    }

    // Save tickets to the database
    await Ticket.insertMany(ticketDetails);

    const emailContent = `
      <h3 style="font-family: Arial, sans-serif; color: #333;">
          Hello ${emailId.split("@")[0]},
      </h3>
      <p style="font-family: Arial, sans-serif; color: #333;">
          Thank you for purchasing tickets for ${event.name}. We are thrilled to have you join us for this exciting event.
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
          Total Amount: ${totalCost} QAR
      </h4>
      <br>
      ${signature}
    `;

    await transporter.sendMail({
      to: emailId,
      subject: `Hello ${emailId.split("@")[0]}, Thank you for purchasing ${event.name} tickets`,
      html: emailContent,
    });

    res.status(201).json({ message: "Ticket booked successfully" });

  } catch (error) {
    console.error("Error in booking tickets:", error); // Log the error for debugging
    return next(new AppError(500, "Internal Server Error"));
  }
});
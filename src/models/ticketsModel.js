const mongoose = require("mongoose");

const { Schema } = mongoose;

const ticketSchema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    type: {
      type: Schema.Types.ObjectId,
      ref: "TicketType",
      required: true,
    },
    totalCost: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    purchaseDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;

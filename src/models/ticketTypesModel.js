const mongoose = require("mongoose");

const ticketTypesSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  price: {
    type: Number,

    default: 0,
  },
});

const TicketType = mongoose.model("TicketType", ticketTypesSchema);
module.exports = TicketType;

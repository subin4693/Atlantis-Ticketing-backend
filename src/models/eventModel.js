const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    images: [
      {
        type: String,
      },
    ],

    status: {
      type: "String", //Booked Confirmed Rejected
      default: "Booked",
    },

    dates: [
      {
        type: Date,
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;

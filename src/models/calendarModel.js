const mongoose = require("mongoose");

const CalendarSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    session: {
      type: String,
      required: true,
      enum: ["morning", "afternoon", "evening", "night"],
    },
    status: {
      type: String,
      enum: ["blocked", "available"],
      default: "available",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("Calendar", CalendarSchema);

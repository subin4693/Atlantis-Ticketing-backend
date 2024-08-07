const mongoose = require("mongoose");

const { Schema } = mongoose;

const decorationSchema = new Schema(
  {
    theme: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    priceRange: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
    availableDates: [
      {
        type: Date,
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Decoration = mongoose.model("Decoration", decorationSchema);

module.exports = Decoration;

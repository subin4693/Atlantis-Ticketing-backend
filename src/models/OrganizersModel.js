const mongoose = require("mongoose");

const { Schema } = mongoose;

const organizerSchema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tasks: [
      {
        taskId: {
          type: String,
          required: true,
        },
        taskName: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "in_progress", "completed"],
          default: "pending",
          required: true,
        },
        dueDate: {
          type: Date,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Organizer = mongoose.model("Organizer", organizerSchema);

module.exports = Organizer;

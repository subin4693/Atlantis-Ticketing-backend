const mongoose = require("mongoose");

const { Schema } = mongoose;

const typeSchema = new Schema({
  type: {
    type: String,
    required: true,
    unique: true,
  },
});

const Type = mongoose.model("Type", typeSchema);

module.exports = Type;

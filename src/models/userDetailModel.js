const mongoose = require("mongoose");

const userDetailSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    // workExperience: { type: Number, required: true },
    location: { type: String },
    contact: { type: String },
    qId: { type: String },
    profile_photo: [{ type: String,default:"https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png" }],
    // description: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("userDetail", userDetailSchema);

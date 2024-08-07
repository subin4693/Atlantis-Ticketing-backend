// controllers/userController.js
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");

//create a user

exports.createUser = catchAsync(async (req, res, next) => {
  try {
    const { email } = req.body;
    console.log(req.body);
    const userExists = await User.findOne({ email });

    if (userExists) {
      return next(new AppError("User already exists", 400));
    }

    const user = new User(req.body);

    // Attempt to save the user
    await user.save();

    // Convert Mongoose document to plain JavaScript object
    const userObj = user.toObject();
    userObj.id = userObj._id;

    // Remove the password field from the response
    delete userObj.password;

    res.status(200).json({
      status: "success",
      data: userObj,
    });
  } catch (err) {
    console.error("Error details:", err); // Log the error details
    res
      .status(400)
      .json({ message: "An error occurred while creating the user", error: err.message });
  }
});

// login

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      return res.status(200).json({
        status: "success",
        data: {
          name: user.name,
          email: email,
          id: user._id,
          role: user.role,
          phoneNumber: user.phoneNumber,
        },
      });
    } else {
      return next(new AppError("Invalid email or password"));
    }
  } catch (err) {
    res.status(400).json({ message: err });
  }
};

// Get user by id
exports.getUserById = async (req, res, next) => {
  const users = await User.findById(req.params.id);
  res.status(200).json({ users });
};

// update user

exports.updateUser = async (req, res, next) => {
  const userExist = await User.findById(req.params.id);

  if (!userExist) {
    return next(new AppError("User not found"));
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
          role: userExist.role,
        },
      },
      { new: true },
    );

    res.status(200).json({
      status: "success",
      data: {
        name: updatedUser.name,
        email: updatedUser.email,
        id: updatedUser._id,
        role: updatedUser.role,
      },
    });
  } catch (err) {
    res.status(400).json({ message: err });
  }
};

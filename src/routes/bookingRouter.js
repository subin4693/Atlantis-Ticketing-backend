// routes/bookingRoutes.js
const express = require("express");

const router = express.Router();
const bookingController = require("../controllers/bookingController");

// Create a new booking
router.post("/bookings", bookingController.createBooking);

// Cancel a booking
router.patch("/bookings/:id/cancel", bookingController.cancelBooking);

// Get all bookings
router.get("/bookings", bookingController.getBookings);

// edit selected items
router.put("/bookings/:id", bookingController.editBooking);
//get bookings by cliient id
router.get("/bookings/:id", bookingController.getBookingsByClientId);

//confirm bookings by client
router.put("/bookings/confirm/:id", bookingController.confirmBooking);

// router.get("/events", bookingController.getEvents);
// router.get("/events/:id", bookingController.getEventById);
module.exports = router;

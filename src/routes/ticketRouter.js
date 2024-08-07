const express = require("express");

const router = express.Router();
const ticketController = require("../controllers/ticketController");

router.post("/bookings", ticketController.bookTickets);
router.get("/types/:eventId", ticketController.getTicketTypes);

module.exports = router;

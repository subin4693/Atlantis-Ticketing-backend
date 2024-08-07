const express = require("express");

const router = express.Router();
const calendarController = require("../controllers/calendarController");

// Block a date and session
router.post("/block", calendarController.blockDateSession);

// Update a blocked date and session
router.put("/block/:id", calendarController.updateBlockedDateSession);

// Delete a blocked date and session
router.delete("/block/:id", calendarController.deleteBlockedDateSession);

module.exports = router;

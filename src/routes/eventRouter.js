const express = require("express");
const eventController = require("../controllers/eventController");
const itemsController = require("../controllers/itemsController");

const router = express.Router();

router
  .route("/")
  .post(eventController.createEvent)
  .get(eventController.getAllEvents);
router.route("/published").get(eventController.getAllPublishedEvents);
router.route("/:userId").get(eventController.getEventsByUserId);
router.route("/client/:clientId").get(eventController.getEventsByClientId);

router.route("/confirm/:bookingId").post(eventController.confirmEvent);
router.route("/reject/:bookingId").post(eventController.rejectEvent);

router.route("/publish/:eventId").post(eventController.publishEvent);
router.route("/publish/cancel/:eventId").post(eventController.cancelEvent);

router.route("/single-event/:eventId").get(eventController.getEventByEventId);
router.route("/edit/:eventId").put(eventController.editEventById);
router.route("/edit/:eventId/:field").put(eventController.deleteFieldFromEvent);

module.exports = router;

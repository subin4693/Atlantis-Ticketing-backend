const express = require("express");
const userDetailController = require("../controllers/userDetailController");

const router = express.Router();

router.route("/userDetail").post(userDetailController.createUserDetail);

router.route("/upload/:id").post(userDetailController.updateUserPhotos);

router.route("/images/:id").get(userDetailController.getImages);

router
  .route("/userDetail/:id")
  .get(userDetailController.getUserDetailByID)
  .put(userDetailController.updateUserDetail)
  .delete(userDetailController.deleteUserDetail);

module.exports = router;

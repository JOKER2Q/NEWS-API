const express = require("express");
const router = express.Router();
const topNewsController = require("../controllers/topNewsController");
const authenticateToken = require("../middleware/authMiddleware");
router
  .route("/")
  .get(topNewsController.getTopNews)
  .post(
    authenticateToken,
    topNewsController.uploadMedia,
    topNewsController.postTopNews
  );

router
  .route("/:id")
  .get(topNewsController.getANews)
  .patch(
    authenticateToken,
    topNewsController.uploadMedia,
    topNewsController.updateTopNews
  )
  .delete(authenticateToken, topNewsController.deleteTopNews);

module.exports = router;

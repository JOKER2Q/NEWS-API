const express = require("express");
const router = express.Router();
const topNewsController = require("../controllers/topNewsController");
const {
  authenticateToken,
  isAdmin,
  isUser,
} = require("../middleware/authMiddleware");
router
  .route("/")
  .get(topNewsController.getTopNews)
  .post(
    authenticateToken,
    isUser,
    topNewsController.uploadMedia,
    topNewsController.postTopNews
  );

router
  .route("/:id")
  .get(topNewsController.getANews)
  .patch(
    authenticateToken,
    isUser,
    topNewsController.uploadMedia,
    topNewsController.updateTopNews
  )
  .delete(authenticateToken, isUser, topNewsController.deleteTopNews);

module.exports = router;

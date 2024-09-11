const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const newsController = require("../controllers/newsController");
const {
  authenticateToken,
  isAdmin,
  isUser,
} = require("../middleware/authMiddleware");

// Public routes
router.post("/login", authController.login); // Login route to authenticate users
router.post("/sendEmail", newsController.sendEmail); // Send email route

router.route("/search/:search?").get(newsController.getSearchItems);
router.route("/categoriesNews").get(newsController.getFormatedCategories);
router.route("/ALLcategories").get(newsController.getAllCategories);

// Protected routes
router
  .route("/")
  .get( newsController.getAllItems) // Users must be authenticated to access this
  .post(
    authenticateToken,
    isUser,
    newsController.uploadMedia,
    newsController.postItem
  ); // Regular users can post

router
  .route("/:id")
  .get(newsController.getItemById)
  .patch(
    authenticateToken,
    isUser,
    newsController.uploadMedia,
    newsController.updateItemById
  ) // Regular users can update
  .delete(authenticateToken, isAdmin, newsController.deleteItemById); // Only admins can delete

module.exports = router;

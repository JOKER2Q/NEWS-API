const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const {
  authenticateToken,
  isAdmin,
  isUser,
} = require("../middleware/authMiddleware");

// Route to get all users
// You might want to protect this route with `isAdmin` depending on your use case
router.route('/profile').get(authenticateToken , userController.userProfile )
router.route("/").get(authenticateToken, isAdmin, userController.getAllUsers);

// Route to create a new user
// Creating a new user might not need authentication but could be protected if needed
router.route("/").post(authenticateToken, isAdmin, userController.createUser);

// Route to get a specific user by ID
// This route is protected and requires authentication
router.route("/:id").get(authenticateToken, isUser, userController.getUserById);

// Route to update a specific user by ID
// This route is protected and requires authentication
router
  .route("/:id")
  .put(authenticateToken, isAdmin, userController.updateUserById);

// Route to delete a specific user by ID
// This route is protected and requires authentication and admin privileges
router
  .route("/:id")
  .delete(authenticateToken, isAdmin, userController.deleteUserById);

module.exports = router;

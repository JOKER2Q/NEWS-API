const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authenticateToken = require("../middleware/authMiddleware");
// Route to get all users
router.route("/").get(userController.getAllUsers);

// Route to create a new user
router.route("/").post(authenticateToken, userController.createUser);

// Route to get a specific user by ID
router.route("/:id").get(userController.getUserById);

// Route to update a specific user by ID
router.route("/:id").put(authenticateToken, userController.updateUserById);

// Route to delete a specific user by ID
router.route("/:id").delete(authenticateToken, userController.deleteUserById);

module.exports = router;

// routes/adminRoutes.js

const express = require("express");
const router = express.Router();
const { authenticateToken, isAdmin } = require("../middleware/authMiddleware");
const adminController = require("../controllers/activityController");

// Admin routes
router.get("/", authenticateToken, isAdmin, adminController.getActivityLogs);

module.exports = router;

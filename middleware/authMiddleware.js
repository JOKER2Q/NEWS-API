// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../modules/users"); // Adjust path as needed
const bcrypt = require("bcrypt");

// Middleware to authenticate the user based on token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Assuming Bearer token

  if (!token) return res.sendStatus(401); // No token provided

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
    if (err) return res.sendStatus(403); // Invalid token

    const foundUser = await User.findById(user.id);
    if (!foundUser) return res.sendStatus(404); // User not found

    req.user = foundUser; // Attach user to request object
    next();
  });
};

// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.roles.includes("admin")) {
    return next();
  }
  res.status(403).json({ message: "Access denied." });
};

// Middleware to check if user is a regular user
const isUser = (req, res, next) => {
  console.log(req.user);

  if (req.user && (req.user.roles.includes("user") ||req.user.roles.includes("admin")  )) {
    return next();
  }
  res.status(403).json({ message: "Access denied." });
};

module.exports = { authenticateToken, isAdmin, isUser };

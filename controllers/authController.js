const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../modules/users"); // Replace with your User model

// Replace with your JWT secret key
const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || "your_jwt_secret_key";

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });

    // Respond with token
    res.status(200).json({ token, userRole: user.roles });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { login };

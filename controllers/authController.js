const jwt = require("jsonwebtoken");
const User = require("../modules/users"); // Adjust the path to your User model
const secret = process.env.JWT_SECRET || "your_jwt_secret"; // Secret key for JWT

module.exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Compare the provided password with the hashed password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate JWT token with 3 days expiration
    const accessToken = jwt.sign(
      { id: user._id, username: user.username },
      secret,
      { expiresIn: "3d" } // Token expires in 3 days
    );

    // Send the token in the response
    res.json({ accessToken });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

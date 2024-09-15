const logActivity = require("../middleware/activityLogger");
const User = require("../modules/users"); // Assuming you have this model
const bcrypt = require("bcrypt");
//user profile
exports.userProfile = (req, res) => {
  try {
    res.status(200).json({ user: req.user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    // Assuming that only admins should get the list of all users
    if (!req.user || !req.user.roles.includes("admin")) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new user
exports.createUser = async (req, res) => {
  try {
    const { username, password, roles } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with roles
    const newUser = new User({
      username,
      password: hashedPassword,
      roles: roles || ["user"], // Default to 'user' role if no roles provided
    });

    await newUser.save();

    // Log the activity
    await logActivity(
      req.user._id,
      "CREATE",
      newUser._id,
      `Created ${newUser.username} as an ${newUser.roles[0] || "user"}`
    );
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; // Get a specific user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Admins can get any user's details, regular users can get their own details
    if (
      req.user.roles.includes("admin") ||
      req.user._id.toString() === user._id.toString()
    ) {
      res.status(200).json(user);
    } else {
      res.status(403).json({
        message: "Access denied. You can only view your own details.",
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Update a specific user by ID
exports.updateUserById = async (req, res) => {
  try {
    // Admins can update any user's details
    if (!req.user || !req.user.roles.includes("admin")) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const { username, password, roles } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { username, password, roles },
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    // Log the activity
    await logActivity(
      req.user._id,
      "UPDATE",
      updatedUser._id,
      "Updated user details"
    );
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// Delete a specific user by ID
exports.deleteUserById = async (req, res) => {
  try {
    // Admins can delete any user

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Log the activity
    await logActivity(
      req.user._id,
      "DELETE",
      user._id,
      `Deleted ${user.username}`
    );

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

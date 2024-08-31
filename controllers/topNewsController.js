const topNews = require("../modules/topNews");

//START photo handeling

const multer = require("multer");

// Error handling for unsupported file types
const fileError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

// Multer storage configuration
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define the directory based on file type
    if (file.mimetype.startsWith("image")) {
      cb(null, "public/img/news"); // For images
    } else if (file.mimetype.startsWith("video")) {
      cb(null, "public/video"); // For videos
    } else {
      cb(new Error("Unsupported file type"), null);
    }
  },
  filename: (req, file, cb) => {
    // Generate a unique filename
    cb(null, `${file.originalname}`);
  },
});

// Multer file filter configuration
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image") || file.mimetype.startsWith("video")) {
    cb(null, true);
  } else {
    cb(
      fileError("Invalid file type. Only images and videos are allowed."),
      false
    );
  }
};

// Multer configuration
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// Export the multer upload middleware
const uploadMedia = upload.fields([
  { name: "photo", maxCount: 1 }, // For images
  { name: "video", maxCount: 1 }, // For videos
]);

//END photo handeling
const getTopNews = async (req, res) => {
  try {
    const topNewsItems = await topNews.find().sort({ position: 1 }).limit(5);
    res.status(200).json({
      message: "success",
      numberOfNews: topNewsItems.length,
      data: topNewsItems,
    });
  } catch (error) {
    console.error("Error retrieving top news:", error);
    res.status(500).json({ message: "Error retrieving top news" });
  }
};

const postTopNews = async (req, res) => {
  if (req.files) {
    req.body.photo = req.files.photo[0].originalname;
    req.body.video = req.files.video[0].originalname;
  }

  try {
    const newItem = await topNews.create(req.body);

    // Replace with actual logic to save item
    // const item = await Item.create(newItem);
    res.status(201).json({ message: "Item created", item: newItem });
  } catch (err) {
    res.status(500).json({
      status: "failure",
      message: "Error creating item",
      error: err.message,
    });
  }
};

const updateTopNews = async (req, res) => {
  try {
    const itemId = req.params.id;
    const updatedItemData = req.body;

    // Find the item by ID and update it
    const updatedItem = await topNews.findByIdAndUpdate(
      itemId,
      updatedItemData,
      {
        new: true,
      }
    );

    // Replace with actual logic to update item
    // const item = await Item.findByIdAndUpdate(itemId, updatedItem, { new: true });
    res
      .status(200)
      .json({ message: `Item with id ${itemId} updated`, item: updatedItem });
  } catch (err) {
    res.status(500).json({
      status: "failure",
      message: "Error updating item",
      error: err.message,
    });
  }
};

// Delete a top news item by ID
const deleteTopNews = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTopNews = await topNews.findByIdAndDelete(id);

    if (!deletedTopNews) {
      return res.status(404).json({ message: "Top news item not found" });
    }

    res.status(200).json({ message: "Top news item deleted successfully" });
  } catch (error) {
    console.error("Error deleting top news:", error);
    res.status(500).json({ message: "Error deleting top news" });
  }
};

module.exports = {
  getTopNews,
  postTopNews,
  updateTopNews,
  deleteTopNews,
  uploadMedia,
};

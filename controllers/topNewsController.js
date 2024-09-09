const topNews = require("../modules/topNews");
const fs = require("fs");
const path = require("path");
const apiFeatures = require("../utils/apiFeatures");
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
  { name: "photo", maxCount: 3 }, // For images
  { name: "video", maxCount: 1 }, // For videos
]);

//END photo handeling
const getTopNews = async (req, res) => {
  try {
    const features = new apiFeatures(topNews.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const news = await features.query;
    res.status(200).json({
      message: "success",
      numberOfNews: news.length,
      data: news,
    });
  } catch (error) {
    console.error("Error retrieving top news:", error);
    res.status(500).json({ message: "Error retrieving top news" });
  }
};

const getANews = async (req, res) => {
  try {
    const item = await topNews.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    res
      .status(200)
      .json({ message: `Fetching item with id ${req.params.id}`, item });
  } catch (err) {
    res.status(500).json({
      status: "failure",
      message: "Error fetching item",
      error: err.message,
    });
  }
};

const postTopNews = async (req, res) => {
  const itemData = { ...req.body };
  const position = req.body.position;
  // Check if there's already an item with the given position
  const existingItem = await topNews.findOne({ position });
  if (existingItem) {
    const nextInLine = await topNews
      .find({
        position: { $gte: position },
      })
      .sort({ position: -1 }); // Sort in descending order

    // Update positions of items to make space for the new item
    for (const item of nextInLine) {
      await topNews.findByIdAndUpdate(item._id, { $inc: { position: 1 } });
    }
  }

  if (req.files) {
    // Check if `photos` field is an array and handle it
    if (req.files.photo && Array.isArray(req.files.photo)) {
      itemData.photo = req.files.photo.map((file) => file.originalname);
    }
    if (req.files.video) {
      itemData.video = req.files.video[0].originalname;
    }
  }
  try {
    const newItem = await topNews.create(itemData);

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
    const position = req.body.position;
    // Check if there's already an item with the given position
    const existingItem = await topNews.findOne({ position });
    if (existingItem) {
      const nextInLine = await topNews
        .find({
          position: { $gte: position },
        })
        .sort({ position: -1 }); // Sort in descending order

      // Update positions of items to make space for the new item
      for (const item of nextInLine) {
        await topNews.findByIdAndUpdate(item._id, { $inc: { position: 1 } });
      }
    }

    // Extract the item ID from request parameters
    const itemId = req.params.id;
    const oldSources = req.body.oldPhotoPaths || [];

    // Find the current item to get the old photo and video filenames
    const currentItem = await topNews.findById(itemId);
    if (!currentItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Extract and handle the update data
    const updatedItemData = req.body;

    // Handle photo updates
    if (req.files && req.files.photo) {
      // Extract filenames from uploaded photos
      const newPhotoFilenames = req.files.photo.map(
        (file) => file.originalname
      );

      // Delete old photos that are not in the new list
      const oldPhotos = currentItem.photo || [];
      oldPhotos.forEach((filename) => {
        // Check if the old photo is not in the new list and also not in oldSources
        if (
          !newPhotoFilenames.includes(filename) &&
          !oldSources.includes(filename)
        ) {
          const oldPhotoPath = path.join(
            __dirname,
            "..",
            "public",
            "img",
            "news",
            filename
          );
          if (fs.existsSync(oldPhotoPath)) {
            fs.unlinkSync(oldPhotoPath);
          }
        }
      });

      // Update the `photo` field with new filenames and old sources
      updatedItemData.photo = [...newPhotoFilenames, ...oldSources];
    } else {
      // No new photos provided, keep old ones
      updatedItemData.photo = currentItem.photo;
    }

    // Handle video update if a new file is provided
    if (req.files && req.files.video) {
      const newVideoFilename = req.files.video[0].originalname;

      // Delete old video if it exists and is different from the new one
      const oldVideoFilename = currentItem.video;
      if (oldVideoFilename && oldVideoFilename !== newVideoFilename) {
        const oldVideoPath = path.join(
          __dirname,
          "..",
          "public",
          "video",
          oldVideoFilename
        );
        if (fs.existsSync(oldVideoPath)) {
          fs.unlinkSync(oldVideoPath);
        }
      }

      // Update the `video` field with the new filename
      updatedItemData.video = newVideoFilename;
    } else {
      // No new video provided, keep old one
      updatedItemData.video = currentItem.video;
    }

    // Update the item in the database
    const updatedItem = await topNews.findByIdAndUpdate(
      itemId,
      updatedItemData,
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Respond with the updated item
    res.status(200).json({
      message: `Item with id ${itemId} updated`,
      item: updatedItem,
    });
  } catch (err) {
    // Handle any errors
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
  getANews,
};

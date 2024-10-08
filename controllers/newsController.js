// controllers/itemController.js

// Import any models or services you need

const apiFeatures = require("../utils/apiFeatures");

const NewsCard = require("../modules/news");

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const logActivity = require("../middleware/activityLogger");

const nodemailer = require("nodemailer");
const TopNews = require("../modules/topNews");
// const imageError = () => {
//   throw new Error("no image found");
// };

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/img/news");
//   },
//   filename: (req, file, cb) => {
//     //user-76767abc76bc-33334354235.jpg
//     cb(null, `${file.originalname}`);
//   },
// });

// const multerFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith("image")) {
//     cb(null, true);
//   } else {
//     cb(imageError, false);
//   }
// };

// const upload = multer({
//   storage: multerStorage,
//   fileFilter: multerFilter,
// });

// const uploadNewsPhoto = upload.single("photo");

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
    // Get the current timestamp
    const timestamp = Date.now();

    // Generate a random number between 1000 and 9999
    const randomNum = Math.floor(Math.random() * 9000) + 1000;

    // Extract the original file extension
    const originalExt = file.originalname.split(".").pop();

    // Create a new filename with timestamp and random number
    const newFilename = `${timestamp}-${randomNum}.${originalExt}`;

    cb(null, newFilename);
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

//VIDEOS AND WEBS AND WEBS ONLY contain

// Controller function to handle fetching all items

// Controller function to get all categories

//=----
const getAllCategories = async (req, res) => {
  // Extract the language parameter (default to 'arabic' if not provided)
  const lang = req.query.lang || "arabic";

  try {
    // Fetch all distinct categories from the database, filtering by language
    const categories = await NewsCard.distinct("category", { lang: lang });

    // Send the response with categories
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Server Error",
      error: error.message,
    });
  }
};
const getFormatedCategories = async (req, res) => {
  // Extract the language parameter (default to 'arabic' if not provided)
  const lang = req.query.lang || "arabic";

  try {
    // Aggregate news items by category, filtering by language
    const categories = await NewsCard.aggregate([
      {
        $match: { lang: lang }, // Filter by language
      },
      {
        $group: {
          _id: "$category", // Group by category
          news: { $push: "$$ROOT" }, // Collect all news items in each category
          count: { $sum: 1 }, // Count the number of news items in each category
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id", // Rename _id to category
          news: { $slice: ["$news", 5] }, // Limit the 'news' array to the first 5 items
          count: 1, // Include the count in the output
        },
      },
      {
        $sort: { count: -1 }, // Sort by the count in descending order
      },
    ]);

    // Transform the result into the desired format
    const formattedCategories = categories.reduce((acc, { category, news }) => {
      acc[category] = news;
      return acc;
    }, {});

    // Send the response
    res.status(200).json({
      NumOfCategories: categories.length,
      categories: formattedCategories,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "An error occurred while fetching categories",
      error: err.message,
    });
  }
};

// BUILD QUERY
const getAllItems = async (req, res) => {
  const features = new apiFeatures(NewsCard.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  //     EXCUTE QUERY

  const news = await features.query;

  try {
    res.status(200).json({
      message: "Fetching all items",
      data: {
        numOfNews: news.length,
        news,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "failure",
      message: "Error fetching items",
      error: err.message,
    });
  }
};

// Controller function to handle creating a new item
const postItem = async (req, res) => {
  const itemData = { ...req.body };
  if (req.files) {
    // Check if `photos` field is an array and handle it
    if (req.files.photo && Array.isArray(req.files.photo)) {
      itemData.photo = req.files.photo.map((file) => file.filename);
    }

    itemData.video = req.files.video && req.files.video[0].filename;
  }
  try {
    const newItem = await NewsCard.create(itemData);
    // Log the activity
    await logActivity(
      req.user._id,
      "CREATE",
      newItem._id,
      `Created Article with the headline ${newItem.headline} `,
      "news"
    );
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

// Controller function to handle fetching a single item by ID

const getItemById = async (req, res) => {
  try {
    // First, try to find the item in NewsCard
    let item = await NewsCard.findById(req.params.id);

    // If not found in NewsCard, try to find it in TopNews
    if (!item) {
      item = await TopNews.findById(req.params.id);

      // If not found in either, return 404
      if (!item) {
        return res.status(404).json({
          status: "failure",
          message: `Item with id ${req.params.id} not found`,
        });
      }

      // If found in TopNews, return 200 with topItem
      return res.status(200).json({
        message: `Fetching item with id ${req.params.id} from TopNews`,
        item,
      });
    }

    // If found in NewsCard, return 200 with item
    res.status(200).json({
      message: `Fetching item with id ${req.params.id} from NewsCard`,
      item,
    });
  } catch (err) {
    // Return 500 on server error
    res.status(500).json({
      status: "failure",
      message: "Error fetching item",
      error: err.message,
    });
  }
};

// Controller function to handle updating an item by ID

const updateItemById = async (req, res) => {
  try {
    // Extract the item ID from request parameters
    const itemId = req.params.id;
    const oldSources = req.body.oldPhotoPaths || [];
    const oldVideo = req.body.oldVideo;

    // Find the current item to get the old photo and video filenames
    const currentItem = await NewsCard.findById(itemId);
    if (!currentItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Extract and handle the update data
    const updatedItemData = req.body;

    if (oldSources && !req.files.photo) {
      // Delete old photos that are not in the new list
      const oldPhotos = currentItem.photo || [];

      oldPhotos.forEach((filename) => {
        // Check if the old photo is not in the new list and also not in oldSources
        if (!oldSources.includes(filename)) {
          const oldPhotoPath = path.join(
            __dirname,
            "..",
            "public",
            "img",
            "news",
            filename
          );

          if (fs.existsSync(oldPhotoPath)) {
            fs.unlinkSync(oldPhotoPath, { force: true });
          }
        }
      });
      updatedItemData.photo = oldSources;
    } else if (req.files && req.files.photo) {
      // Extract filenames from uploaded photos
      const newPhotoFilenames = req.files.photo.map((file) => file.filename);

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

          if (filename !== "") {
            if (fs.existsSync(oldPhotoPath)) {
              fs.unlinkSync(oldPhotoPath, { force: true });
            }
          }
        }
      });

      updatedItemData.photo = [...newPhotoFilenames];
      oldSources.map((e) => e != "" && updatedItemData.photo.push(e));
    } else {
      // No new photos provided, keep old ones
      updatedItemData.photo = currentItem.photo;
    }

    // Handle video update if a new file is provided
    if (oldVideo) {
      const oldVideoFilename = currentItem.video;
      if (oldVideoFilename) {
        const oldVideoPath = path.join(
          __dirname,
          "..",
          "public",
          "video",
          oldVideoFilename
        );

        if (fs.existsSync(oldVideoPath)) {
          fs.unlinkSync(oldVideoPath, { force: true });
        }
      }
      updatedItemData.video = "no video Available";
    } else if (req.files && req.files.video) {
      const newVideoFilename = req.files.video[0].filename;

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
          fs.unlinkSync(oldVideoPath, { force: true });
        }
      }

      // Update the `video` field with the new filename
      updatedItemData.video = newVideoFilename;
    } else {
      // No new video provided, keep old one
      updatedItemData.video = currentItem.video;
    }

    // Update the item in the database
    const updatedItem = await NewsCard.findByIdAndUpdate(
      itemId,
      updatedItemData,
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Log the activity
    await logActivity(
      req.user._id,
      "UPDATE",
      itemId,
      `Updated Article with the headline ${updatedItem.headline}`,
      "news"
    );
    // Respond with the updated item
    res.status(200).json({
      message: `Item with id ${itemId} updated`,
      item: updatedItem,
    });
  } catch (err) {
    // Handle any errors
    console.log(err);

    res.status(500).json({
      status: "failure",
      message: "Error updating item",
      error: err.message,
    });
  }
};
// Controller function to handle deleting an item by ID
const deleteItemById = async (req, res) => {
  try {
    const itemId = await NewsCard.findByIdAndDelete(req.params.id);
    // Replace with actual logic to delete item
    // await Item.findByIdAndDelete(itemId);
    // Log the activity

    await logActivity(
      req.user._id,
      "DELETE",
      itemId._id,
      `Deleted Article with the headline ${itemId.headline}`,
      "news"
    );
    res.status(200).json({ message: `Item with id ${itemId._id} deleted` });
  } catch (err) {
    res.status(500).json({
      status: "failure",
      message: "Error deleting item",
      error: err.message,
    });
  }
};
const getSearchItems = async (req, res) => {
  // Extract search parameters
  const searchText = req.params.search || "";
  const lang = req.query.lang || "arabic"; // Default to 'arabic' if no language is provided

  try {
    // Query the database with text search and language filter
    let results = await NewsCard.find(
      {
        $text: { $search: searchText },
        lang: lang, // Add language filter to the query
      },
      {
        score: { $meta: "textScore" },
      }
    ).sort({ score: { $meta: "textScore" } });

    // Return the results
    res.status(200).json({
      status: "success",
      results: results.length,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

//SEND EMAIL

//transporter

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: "gmail", // You can use other services like 'smtp', 'mailgun', etc.
  host: "smtp.gmail.com", // The host
  auth: {
    user: process.env.EMAIL, // Store this in your .env file
    pass: process.env.EMAIL_PASSWORD, // Store this in your .env file
  },
});
//

const sendEmail = async (req, res) => {
  try {
    // Destructure and validate required fields
    const { name, from, subject, text } = req.body;

    if (!from || !subject || !text) {
      return res
        .status(400)
        .send(
          "Missing required fields: 'from', 'subject', and 'text' are required."
        );
    }

    // Fixed recipient addre ss
    const to = "rawantemmo@gmail.com";

    const mailOptions = {
      from: from, // Dynamic 'from' address from request body
      to: to, // Fixed 'to' address
      subject: subject,
      text: `Name : ${name} \n Subject : ${subject} \n from : ${from} \n ${text} `,
    };

    // Send email using async/await
    await transporter.sendMail(mailOptions);

    console.log("Email sent successfully");
    res.status(200).send("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({
      status: "error",
      message: "Error sending email. Please check the server logs for details.",
    });
  }
};

// Export the controller functions
module.exports = {
  getAllItems,
  postItem,
  getItemById,
  updateItemById,
  deleteItemById,
  getFormatedCategories,
  getSearchItems,
  uploadMedia,
  sendEmail,
  getAllCategories,
};

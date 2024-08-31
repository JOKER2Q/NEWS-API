// controllers/itemController.js

// Import any models or services you need

const apiFeatures = require("../utils/apiFeatures");

const NewsCard = require("../modules/news");

const multer = require("multer");

const nodemailer = require("nodemailer");
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

//VIDEOS AND WEBS AND WEBS ONLY contain

// Controller function to handle fetching all items

// Controller function to get all categories

//=----

const getAllCategories = async (req, res) => {
  try {
    // Aggregate news items by category
    const categories = await NewsCard.aggregate([
      {
        $group: {
          _id: "$category", // Group by category
          news: { $push: "$$ROOT" }, // Collect all news items in each category
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id", // Rename _id to category
          news: 1, // Include the news items
        },
      },
    ]);

    // Transform the result into the desired format
    const formattedCategories = categories.reduce((acc, { category, news }) => {
      acc[category] = news;
      return acc;
    }, {});

    res.status(200).json({
      NumOfCategories: categories.length,
      categories: formattedCategories,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "An error occurred while fetching categories" });
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
  if (req.files) {
    req.body.photo = req.files.photo[0].originalname;
    req.body.video = req.files.video[0].originalname;
  }
  try {
    const newItem = await NewsCard.create(req.body);

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
    const itemId = await NewsCard.findById(req.params.id);
    // Replace with actual logic to fetch item by ID
    // const item = await Item.findById(itemId);
    res.status(200).json({ message: `Fetching item with id ${itemId}` });
  } catch (err) {
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
    const itemId = req.params.id;
    const updatedItemData = req.body;

    // Find the item by ID and update it
    const updatedItem = await NewsCard.findByIdAndUpdate(
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

// Controller function to handle deleting an item by ID
const deleteItemById = async (req, res) => {
  try {
    const itemId = await NewsCard.findByIdAndDelete(req.params.id);
    // Replace with actual logic to delete item
    // await Item.findByIdAndDelete(itemId);
    res.status(200).json({ message: `Item with id ${itemId} deleted` });
  } catch (err) {
    res.status(500).json({
      status: "failure",
      message: "Error deleting item",
      error: err.message,
    });
  }
};
//SEARCH ITEMS
const getSearchItems = async (req, res) => {
  // Query the database
  const searchText = req.params.search;
  const results = await NewsCard.find(
    { $text: { $search: searchText } },

    {
      score: { $meta: "textScore" },
    }
  ).sort({ score: { $meta: "textScore" } });

  // Count the total number of matching items (for pagination purposes)

  // Return the results
  try {
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
    user: "rinas1122k@gmail.com", // Your email address
    pass: "lgwv dhvn upab dmqo", // Your email password or an application-specific password
  },
});
//

const sendEmail = async (req, res) => {
  try {
    // Destructure and validate required fields
    const { from, subject, text } = req.body;

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
      text: `from : ${from} \n ${text} `,
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
  getAllCategories,
  getSearchItems,
  uploadMedia,
  sendEmail,
};

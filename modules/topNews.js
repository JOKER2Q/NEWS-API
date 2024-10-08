const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define the schema for a Top News item
const topNewsSchema = new Schema({
  headline: {
    type: String,
    required: true,
    trim: true,
  },
  summary: {
    type: String,
    required: true,
    trim: true,
  },
  photo: [
    {
      type: String,
      required: false,
      trim: true,
    },
  ],
  publishedAt: {
    type: Date,
    default: Date.now,
  },
  source: {
    name: {
      type: String,
      trim: true,
    },
    logoUrl: {
      type: String,
      required: false,
      trim: true,
    },
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  readMoreUrl: {
    type: String,
    trim: true,
  },
  position: {
    type: Number, // Position on the top news list (e.g., 1, 2, 3)
    required: true,
    unique: true, // Ensure each position is unique
  },

  video: {
    type: String,
    trim: true,
  },
  lang: {
    type: String,
    enum: ["arabic", "english", "kurdish"], // You can add more here if needed
    default: "arabic", // Default lang for news
  },
});

// Create the model using the schema
const TopNews = mongoose.model("TopNews", topNewsSchema);

module.exports = TopNews;

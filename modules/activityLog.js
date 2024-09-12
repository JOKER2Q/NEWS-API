// models/activityLog.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const activityLogSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  action: {
    type: String,
    enum: ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"],
    required: true,
  },
  target: {
    type: String, // Target could be an item ID or similar
    required: false,
  },
  details: {
    type: String,
    required: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
module.exports = ActivityLog;

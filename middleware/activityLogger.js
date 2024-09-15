// middleware/activityLogger.js
const ActivityLog = require("../modules/activityLog");

const logActivity = async (userId, action, target, details ,type) => {
  try {
    await ActivityLog.create({ userId, action, target, details , type });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
};

module.exports = logActivity;

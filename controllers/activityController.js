const ActivityLog = require("../modules/activityLog");

const getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate("userId", "username")
      .sort({ timestamp: -1 });
    res.status(200).json({
      status: "success",
      data: logs,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Error fetching activity logs",
      error: err.message,
    });
  }
};

module.exports = {
  getActivityLogs,
};

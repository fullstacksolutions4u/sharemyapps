const cron = require('node-cron');
const User = require('../models/User');
const { hourlyRegisteredUsers } = require('../utils/customMetrics');

const updateHourlyMetrics = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const count = await User.countDocuments({ createdAt: { $gte: oneHourAgo } });
    hourlyRegisteredUsers.set(count);
    console.log(`[Metrics] Updated hourly registered users: ${count}`);
  } catch (error) {
    console.error('[Metrics] Error updating hourly registered users:', error);
  }
};

// Run at the beginning of every hour
const hourlyMetricsTask = cron.schedule('0 * * * *', updateHourlyMetrics, {
  scheduled: false // Do not start immediately on creation, we will call start() in index.js
});

module.exports = {
  task: hourlyMetricsTask,
  updateHourlyMetrics, // Exporting for testing or manual execution if needed
};

const cron = require('node-cron');
const ssHrSyncService = require('../services/ssHrSync.service');

const syncUsersToSSHR = async () => {
  try {
    console.log('[Cron] Starting nightly sync to SS HR Consultancy...');
    const result = await ssHrSyncService.syncCandidates();
    if (result.success) {
      console.log(`[Cron] Sync successful! Total synced: ${result.totalSynced}`);
    } else {
      console.log(`[Cron] Sync warning: ${result.message}`);
    }
  } catch (error) {
    console.error('[Cron] Error syncing users to SS HR:', error.message);
  }
};

// Schedule the cron job to run every night at 2:00 AM
const task = cron.schedule('0 2 * * *', () => {
  syncUsersToSSHR();
}, {
  scheduled: true,
  timezone: 'Asia/Kolkata'
});

module.exports = { syncUsersToSSHR, task };

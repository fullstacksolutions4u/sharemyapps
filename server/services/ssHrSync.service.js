const axios = require('axios');
const User = require('../models/User');

const SS_HR_API_URL = process.env.SS_HR_API_URL || 'https://sshrconsultancy.com/api/imported-customers/sync';

class SSHrSyncService {
  /**
   * Format a ShareMyApps User object into SS HR imported customer schema
   */
  formatCandidate(user) {
    return {
      name: (user.name || '').trim(),
      email: (user.email || '').toLowerCase().trim(),
      phone: (user.phone || '').trim(),
      state: (user.state || '').trim(),
      designations: Array.isArray(user.designations) ? user.designations : [],
      cvUrl: (user.cvUrl || '').trim(),
      linkedinUrl: (user.linkedinUrl || '').trim(),
      source: 'ShareMyApps'
    };
  }

  /**
   * Sync all users or specific user IDs to SS HR Consultancy
   * @param {string[]|null} userIds Optional array of user ObjectIds
   */
  async syncCandidates(userIds = null) {
    const query = { isDeleted: { $ne: true } };
    if (Array.isArray(userIds) && userIds.length > 0) {
      query._id = { $in: userIds };
    }

    const users = await User.find(query).lean();
    if (!users || users.length === 0) {
      return { success: false, message: 'No users found to sync' };
    }

    const formattedCandidates = users
      .filter(u => u.email && u.email.trim())
      .map(u => this.formatCandidate(u));

    if (formattedCandidates.length === 0) {
      return { success: false, message: 'No valid candidate emails found to sync' };
    }

    console.log(`[SS HR Sync] Sending ${formattedCandidates.length} candidates to ${SS_HR_API_URL}...`);

    const response = await axios.post(SS_HR_API_URL, formattedCandidates, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });

    return {
      success: true,
      totalSynced: formattedCandidates.length,
      ssHrResponse: response.data
    };
  }
}

module.exports = new SSHrSyncService();

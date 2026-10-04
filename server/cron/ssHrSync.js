const cron = require('node-cron');
const axios = require('axios');
const User = require('../models/User'); // Adjust path if needed

// Replace with your actual SS HR Consultancy backend URL
const SS_HR_API_URL = 'http://localhost:5000/api/imported-customers/sync'; 

const syncUsersToSSHR = async () => {
  try {
    console.log('?? [Cron] Starting nightly sync to SS HR Consultancy...');
    
    // 1. Fetch users from ShareMyApps database
    const users = await User.find({}).lean();

    if (!users || users.length === 0) {
      console.log('? [Cron] No users found to sync.');
      return;
    }

    // 2. Format the data to match what SS HR expects
    const formattedUsers = users.map(user => ({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      state: user.state || '', // Fixed location to state
      designations: user.designations || [],
      cvUrl: user.cvUrl || '',
      source: 'ShareMyApps'
    }));

    // 3. Send the POST request
    const response = await axios.post(SS_HR_API_URL, formattedUsers, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(? [Cron] Sync successful! Inserted: , Updated: );
    
  } catch (error) {
    console.error('? [Cron] Error syncing users to SS HR:', error.message);
  }
};

// Schedule the cron job to run every night at 2:00 AM
cron.schedule('0 2 * * *', () => {
  syncUsersToSSHR();
});

module.exports = { syncUsersToSSHR };

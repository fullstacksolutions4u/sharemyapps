/**
 * One-time migration: Re-align regNumber starting from 1 for all existing users
 * ordered by createdAt (oldest user = 1, latest existing user = 8283).
 *
 * Run once: node server/scripts/realignRegNumbers.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    // Remove regNumber temporarily or use bulkWrite to avoid unique key conflicts during swap
    console.log('Clearing existing regNumber indexes temporarily for clean re-alignment...');
    await User.updateMany({}, { $unset: { regNumber: '' } });

    // Fetch all users sorted by createdAt ascending (oldest first)
    const users = await User.find().sort({ createdAt: 1 }).select('_id name email createdAt');
    console.log(`Found ${users.length} total users to re-align.`);

    const bulkOps = users.map((user, idx) => ({
      updateOne: {
        filter: { _id: user._id },
        update: { $set: { regNumber: idx + 1 } },
      }
    }));

    if (bulkOps.length > 0) {
      console.log('Executing bulk update...');
      const result = await User.bulkWrite(bulkOps);
      console.log(`Bulk update complete. Modified ${result.modifiedCount} users.`);
    }

    const totalCount = await User.countDocuments();
    const lastUser = await User.findOne().sort({ regNumber: -1 }).select('regNumber name email');
    console.log(`\nRe-alignment complete!`);
    console.log(`Total user count: ${totalCount}`);
    console.log(`Highest regNumber user: #${lastUser?.regNumber} - ${lastUser?.name} (${lastUser?.email})`);

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
})();

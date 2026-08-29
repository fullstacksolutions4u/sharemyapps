const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

    const usersBefore = await User.aggregate([
      { $group: { _id: '$userType', count: { $sum: 1 } } }
    ]);
    console.log('User counts by userType before migration:', usersBefore);

    // Update mentee and mentor users to developer
    const res = await User.updateMany(
      { userType: { $in: ['mentee', 'mentor'] } },
      { $set: { userType: 'developer' } }
    );
    console.log(`Updated ${res.modifiedCount} users from mentee/mentor to developer.`);

    const usersAfter = await User.aggregate([
      { $group: { _id: '$userType', count: { $sum: 1 } } }
    ]);
    console.log('User counts by userType after migration:', usersAfter);

    await mongoose.disconnect();
    console.log('Done.');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();

/**
 * One-time migration: assign regNumber starting from 101 to all existing users
 * who don't have one yet, ordered by createdAt (earliest user = 101).
 *
 * Run once:  node server/scripts/assignRegNumbers.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Find the highest existing regNumber so we don't collide
  const last = await User.findOne({ regNumber: { $exists: true } }).sort({ regNumber: -1 }).select('regNumber');
  let next = last?.regNumber ? last.regNumber + 1 : 101;

  // All users without a regNumber, oldest first
  const users = await User.find({ regNumber: { $exists: false } }).sort({ createdAt: 1 }).select('_id name email createdAt');

  console.log(`Found ${users.length} users without a registration number. Starting from ${next}.`);

  for (const user of users) {
    await User.updateOne({ _id: user._id }, { $set: { regNumber: next } });
    console.log(`  #${next} → ${user.name} (${user.email})`);
    next++;
  }

  console.log(`Done. Assigned registration numbers up to ${next - 1}.`);
  await mongoose.disconnect();
})();

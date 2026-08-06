require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const User = require('../models/User');
  const SessionRequest = require('../models/SessionRequest');

  // Find users named 'Tony Sunny' or 'Tony'
  const users = await User.find({ name: { $regex: /Tony/i } });
  console.log('Found users:', users.map(u => ({ id: u._id, name: u.name, email: u.email })));

  for (const user of users) {
    const reqs = await SessionRequest.find({ user: user._id, serviceKey: 'ats_compatible_resume_cover_letter_optimization' });
    console.log(`Requests for ${user.name}:`, reqs);

    if (user.name === 'Tony Sunny' || user.name === 'Tony') {
      console.log(`Deleting requests for ${user.name}...`);
      await SessionRequest.deleteMany({ user: user._id, serviceKey: 'ats_compatible_resume_cover_letter_optimization' });
    }
  }

  mongoose.connection.close();
}

fix().catch(console.error);

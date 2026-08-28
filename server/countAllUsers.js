require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Database connected');
  const countAll = await User.countDocuments();
  console.log('Total users in DB:', countAll);
  
  const types = await User.aggregate([
    { $group: { _id: '$userType', count: { $sum: 1 } } }
  ]);
  console.log('User types count:', types);

  const roles = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]);
  console.log('Roles count:', roles);

  process.exit(0);
}
run();

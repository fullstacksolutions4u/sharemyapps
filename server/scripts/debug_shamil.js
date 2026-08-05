require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const u = await User.findOne({ name: /Muhammad Shamil/i })
    .select('name linkedinUrl githubUrl leetcodeUrl portfolioUrl cvUrl designations')
    .lean();
  console.log('User social links:');
  console.log(JSON.stringify(u, null, 2));
  mongoose.disconnect();
}).catch(console.error);

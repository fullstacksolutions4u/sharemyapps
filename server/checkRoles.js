require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const users = await User.find({ email: { $in: ['cv4amirali@gmail.com', 'tony603t@gmail.com', 't4tonykuriakose@gmail.com'] } });
    console.log(users.map(u => ({ email: u.email, role: u.role, userType: u.userType, hidden: u.hidden })));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

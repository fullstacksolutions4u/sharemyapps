require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const users = await User.find({
      $or: [
        { email: 'cv4amirali@gmail.com' },
        { name: { $regex: /tony/i } },
        { email: { $regex: /tony/i } }
      ]
    });
    
    for (const user of users) {
      user.hidden = true;
      user.isDeleted = false; // explicitly not deleted, just hidden
      await user.save();
      await Project.updateMany({ owner: user._id }, { $set: { hidden: true } });
      console.log('Hidden user:', user.name, user.email);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

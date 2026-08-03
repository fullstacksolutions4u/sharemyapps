require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const { PRIVATE_PAIR_EMAILS } = require('../utils/visibility');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const users = await User.find({ email: { $in: PRIVATE_PAIR_EMAILS } });
    for (const user of users) {
      user.hidden = true;
      user.isDeleted = false;
      await user.save();
      const result = await Project.updateMany(
        { owner: user._id },
        { $set: { hidden: true } }
      );
      console.log('Hidden:', user.name, user.email, 'projects modified:', result.modifiedCount);
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

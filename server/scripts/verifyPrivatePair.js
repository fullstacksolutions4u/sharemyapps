require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const {
  canSeeUser,
  getExcludedHiddenUserIds,
  PRIVATE_PAIR_EMAILS,
} = require('../utils/visibility');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const [tony, amir, other] = await Promise.all([
      User.findOne({ email: PRIVATE_PAIR_EMAILS[0] }),
      User.findOne({ email: PRIVATE_PAIR_EMAILS[1] }),
      User.findOne({ hidden: true, email: { $nin: PRIVATE_PAIR_EMAILS }, role: 'user' }),
    ]);
    console.log('Tony hidden:', tony?.hidden, tony?.email);
    console.log('Amir hidden:', amir?.hidden, amir?.email);
    console.log('Other hidden sample:', other?.name, other?.email);

    console.log('Tony sees Amir:', canSeeUser(tony, amir));
    console.log('Amir sees Tony:', canSeeUser(amir, tony));
    console.log('Public sees Amir:', canSeeUser(null, amir));
    console.log('Public sees Tony:', canSeeUser(null, tony));
    console.log('Other hidden sees Amir:', canSeeUser(other, amir));
    console.log('Amir sees other hidden:', canSeeUser(amir, other));

    const pubEx = await getExcludedHiddenUserIds(null, User);
    const tonyEx = await getExcludedHiddenUserIds(tony, User);
    const amirEx = await getExcludedHiddenUserIds(amir, User);
    console.log('Public excludes Amir?', pubEx.some((id) => String(id) === String(amir._id)));
    console.log('Tony excludes Amir?', tonyEx.some((id) => String(id) === String(amir._id)));
    console.log('Amir excludes Tony?', amirEx.some((id) => String(id) === String(tony._id)));
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

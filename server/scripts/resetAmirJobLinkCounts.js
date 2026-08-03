require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const JobLink = require('../models/JobLink');

const AMIR_EMAIL = 'cv4amirali@gmail.com';

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const amir = await User.findOne({ email: AMIR_EMAIL }).select('_id name email');
    if (!amir) {
      console.error('Amir Ali not found');
      process.exit(1);
    }

    const uid = amir._id;
    console.log('Resetting for:', amir.name, amir.email, String(uid));

    // Clear apply clicks (lifetime clickedIds + weekly apply events)
    const pullClicks = await JobLink.updateMany(
      { clicks: uid },
      { $pull: { clicks: uid } }
    );
    const pullEvents = await JobLink.updateMany(
      { 'clickEvents.user': uid },
      { $pull: { clickEvents: { user: uid } } }
    );

    // Remove shared job posts he contributed (so share/contribution count = 0)
    const deleteShares = await JobLink.deleteMany({ createdBy: uid });

    console.log('Removed from clicks arrays:', pullClicks.modifiedCount);
    console.log('Removed clickEvents:', pullEvents.modifiedCount);
    console.log('Deleted shared JobLinks:', deleteShares.deletedCount);

    // Verify eligibility-style counts
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [applyCount, shareApproved, sharePending, stillClicked] = await Promise.all([
      JobLink.countDocuments({ clickEvents: { $elemMatch: { user: uid, at: { $gte: since } } } }),
      JobLink.countDocuments({ createdBy: uid, status: { $in: ['approved', 'access_granted'] } }),
      JobLink.countDocuments({ createdBy: uid, status: 'pending' }),
      JobLink.countDocuments({ clicks: uid }),
    ]);
    console.log('Verify — weekly applies:', applyCount, 'shares approved:', shareApproved, 'pending:', sharePending, 'clicked links:', stillClicked);

    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

/**
 * Simulate the exact overview-stats server logic for Tony
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const SessionRequest = require('../models/SessionRequest');
const JobAlert = require('../models/JobAlert');
const Vacancy = require('../models/Vacancy');

const TONY_ID = '6a3a7cc01679a4afbb0e6dab';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected\n');

  const userId = new mongoose.Types.ObjectId(TONY_ID);

  // Eligibility check (exact same as server)
  const delivery = await SessionRequest.findOne({
    user: userId,
    serviceKey: 'ats_compatible_resume_cover_letter_optimization',
    status: 'completed',
    completionLink: { $ne: '' },
  }).select('_id').lean();
  const isJobAlertEligible = !!delivery;
  console.log('isJobAlertEligible:', isJobAlertEligible);
  console.log('delivery:', delivery);

  if (!isJobAlertEligible) {
    console.log('BLOCKED: Not eligible — no completed SessionRequest found');
    await mongoose.disconnect();
    return;
  }

  // Now run the aggregate (exact same as server)
  const userObjectId = new mongoose.Types.ObjectId(userId);
  console.log('\nuserObjectId:', userObjectId, 'type:', typeof userObjectId);

  const jobAlertAgg = await JobAlert.aggregate([
    { $match: { notified: true, recipients: userObjectId } },
    { $project: { sessionNumber: 1, count: { $size: { $ifNull: ['$careerLinks', []] } } } },
    { $group: { _id: null, total: { $sum: '$count' } } },
  ]);
  console.log('jobAlertAgg result:', jobAlertAgg);
  const jobAlertCount = jobAlertAgg[0]?.total || 0;
  console.log('jobAlertCount:', jobAlertCount);

  // Also double check: count documents matching
  const matchCount = await JobAlert.countDocuments({ notified: true, recipients: userObjectId });
  console.log('Sessions Tony is in (countDocuments):', matchCount);

  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });

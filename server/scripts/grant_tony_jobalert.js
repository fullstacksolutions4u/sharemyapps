/**
 * Grant Tony full job-alert access:
 *  1. Create a completed SessionRequest for ats_compatible_resume_cover_letter_optimization
 *  2. Add Tony's userId to recipients of ALL notified JobAlert sessions
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const SessionRequest = require('../models/SessionRequest');
const JobAlert = require('../models/JobAlert');

const TONY_ID = '6a3a7cc01679a4afbb0e6dab';
const SERVICE_KEY = 'ats_compatible_resume_cover_letter_optimization';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected\n');

  const oid = new mongoose.Types.ObjectId(TONY_ID);

  // 1. Upsert a completed SessionRequest to make Tony job-alert eligible
  const existing = await SessionRequest.findOne({ user: oid, serviceKey: SERVICE_KEY });
  if (existing) {
    existing.status = 'completed';
    existing.completionLink = 'admin-granted';
    await existing.save();
    console.log('Updated existing SessionRequest → status: completed');
  } else {
    await SessionRequest.create({
      user: oid,
      serviceKey: SERVICE_KEY,
      serviceLabel: 'ATS Compatible Resume & Cover Letter Optimization',
      serviceType: 'document',
      status: 'completed',
      completionLink: 'admin-granted',
    });
    console.log('Created new SessionRequest with status: completed');
  }

  // 2. Add Tony to recipients of all notified job alerts (if not already present)
  const alerts = await JobAlert.find({ notified: true }).select('_id sessionNumber recipients').lean();
  console.log(`\nTotal notified alerts: ${alerts.length}`);

  let updated = 0;
  for (const alert of alerts) {
    const alreadyIn = alert.recipients.some(r => r.toString() === TONY_ID);
    if (!alreadyIn) {
      await JobAlert.updateOne({ _id: alert._id }, { $push: { recipients: oid } });
      updated++;
    }
  }
  console.log(`Added Tony to ${updated} alert sessions (already in ${alerts.length - updated})`);

  // 3. Verify
  const count = await JobAlert.countDocuments({ notified: true, recipients: oid });
  console.log(`\nVerification — Tony is now in ${count} notified alert sessions`);

  // 4. Aggregate careerLinks total
  const agg = await JobAlert.aggregate([
    { $match: { notified: true, recipients: oid } },
    { $project: { count: { $size: { $ifNull: ['$careerLinks', []] } } } },
    { $group: { _id: null, total: { $sum: '$count' } } },
  ]);
  console.log(`Aggregate careerLinks total (what chart will show): ${agg[0]?.total || 0}`);

  await mongoose.disconnect();
  console.log('\nDone ✓');
}

run().catch(e => { console.error(e); process.exit(1); });

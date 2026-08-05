/**
 * Diagnostic: inspect JobAlert documents and recipients for a given user
 * Usage: node scripts/debug_jobalerts.js <userId>
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const JobAlert = require('../models/JobAlert');

const userId = process.argv[2];
if (!userId) { console.error('Usage: node scripts/debug_jobalerts.js <userId>'); process.exit(1); }

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB\n');

  const oid = new mongoose.Types.ObjectId(userId);

  // 1. All notified alerts
  const all = await JobAlert.find({ notified: true }).select('sessionNumber recipients careerLinks jobs createdAt').lean();
  console.log(`Total notified JobAlert sessions: ${all.length}`);

  // 2. Which ones include this user
  const forUser = all.filter(a => a.recipients.some(r => r.toString() === userId));
  console.log(`Sessions with userId in recipients: ${forUser.length}`);
  forUser.forEach(a => {
    console.log(`  Session #${a.sessionNumber} | careerLinks: ${a.careerLinks?.length || 0} | jobs: ${a.jobs?.length || 0} | createdAt: ${a.createdAt}`);
  });

  // 3. Aggregate (same as server code)
  const agg = await JobAlert.aggregate([
    { $match: { notified: true, recipients: oid } },
    { $project: { count: { $size: { $ifNull: ['$careerLinks', []] } } } },
    { $group: { _id: null, total: { $sum: '$count' } } },
  ]);
  console.log(`\nAggregate result (careerLinks total):`, agg);

  // 4. Sample a raw recipient entry to check type
  if (all.length > 0) {
    const sample = all[0];
    const firstRecipient = sample.recipients[0];
    console.log(`\nSample recipient value: "${firstRecipient}" | type: ${typeof firstRecipient} | constructor: ${firstRecipient?.constructor?.name}`);
    console.log(`userId arg: "${userId}" | typeof: ${typeof userId}`);
    console.log(`Strict match: ${firstRecipient?.toString() === userId}`);
  }

  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });

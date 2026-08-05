require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const SessionRequest = require('../models/SessionRequest');
const JobAlert = require('../models/JobAlert');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected\n');

  const userId = '6a3a7cc01679a4afbb0e6dab';

  // 1. All session requests for Tony
  const sessions = await SessionRequest.find({ user: userId }).select('serviceKey status completionLink').lean();
  console.log('All SessionRequests for Tony:');
  if (sessions.length === 0) console.log('  (none)');
  sessions.forEach(s => {
    console.log('  serviceKey:', s.serviceKey, '| status:', s.status, '| link:', s.completionLink || '(none)');
  });

  // 2. Most recent 5 notified alerts - show their recipients
  const recent = await JobAlert.find({ notified: true }).sort({ createdAt: -1 }).limit(5).select('sessionNumber recipients careerLinks createdAt').lean();
  console.log('\nMost recent 5 notified JobAlert sessions:');
  recent.forEach(a => {
    const recipientList = a.recipients.map(r => r.toString());
    const tonyIn = recipientList.includes(userId);
    console.log('  Session#', a.sessionNumber, '| createdAt:', a.createdAt, '| careerLinks:', a.careerLinks?.length, '| Tony in recipients:', tonyIn);
    if (!tonyIn) console.log('    recipients sample:', recipientList.slice(0, 3));
  });

  await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });

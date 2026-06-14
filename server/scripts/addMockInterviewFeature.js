require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Plan = require('../models/Plan');

const FEATURE = 'Technical Mock Interviews';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const plan = await Plan.findOne({ variant: 'dark' });
  if (!plan) {
    console.error('No premium plan (variant: dark) found.');
    process.exit(1);
  }

  if (plan.features.includes(FEATURE)) {
    console.log(`"${FEATURE}" already exists in plan "${plan.name}". Nothing to do.`);
    process.exit(0);
  }

  plan.features.push(FEATURE);
  await plan.save();
  console.log(`Added "${FEATURE}" to plan "${plan.name}". Features now:`);
  plan.features.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });

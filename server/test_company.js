require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const CompanyContact = require('./models/CompanyContact');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const companyName = 'Zafify';
  const extracted = {
    company: 'Zafify',
    email: 'info@zafify.com'
  };

  try {
    const updateDoc = {};
    if (extracted.email) {
      updateDoc.$addToSet = { emails: extracted.email.trim().toLowerCase() };
    }
    const result = await CompanyContact.findOneAndUpdate(
      { name: { $regex: new RegExp(`^${companyName}$`, 'i') } },
      { 
        $setOnInsert: { name: companyName },
        ...updateDoc
      },
      { upsert: true, new: true }
    );
    console.log('Result:', result);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit();
}

test();

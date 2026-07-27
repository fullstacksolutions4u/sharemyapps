const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { sendRank1Email } = require('./utils/email');
const User = require('./models/User');

dotenv.config({ path: __dirname + '/.env' });

async function testEmail() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ name: /amir ali/i });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    console.log(`Sending email to ${user.email}...`);
    await sendRank1Email({ to: user.email, name: user.name });
    console.log('Email sent successfully!');
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testEmail();

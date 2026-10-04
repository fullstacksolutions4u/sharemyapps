const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();
const User = require('./models/User');

const SS_HR_API_URL = 'http://localhost:5000/api/imported-customers/sync';

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    const users = await User.find({}).lean();
    console.log('Found ' + users.length + ' users. Sending to SS HR with linkedinUrl...');

    const formattedUsers = users.map(user => ({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      state: user.state || '',
      designations: user.designations || [],
      cvUrl: user.cvUrl || '',
      linkedinUrl: user.linkedinUrl || '', // Added linkedinUrl
      source: 'ShareMyApps'
    }));

    const response = await axios.post(SS_HR_API_URL, formattedUsers, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('Sync successful!', response.data.data);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    mongoose.disconnect();
  }
}

run();

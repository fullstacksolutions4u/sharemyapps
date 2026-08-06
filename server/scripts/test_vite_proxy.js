const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });
const User = require('../models/User');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const admin = await User.findOne({ role: 'admin' });
  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
  try {
    const res = await axios.post('http://localhost:3000/api/admin/interviews/analyze-report', {
      mcqAssessments: [{ question: 'What is React?', isCorrect: true, comment: 'Good answer' }],
      applicantName: 'Test',
      jobTitle: 'Developer'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Status', res.status);
    console.log(res.data);
  } catch (err) {
    console.error('Error status:', err.response?.status);
    console.error(err.response ? err.response.data : err.message);
  }
  process.exit(0);
}
run();

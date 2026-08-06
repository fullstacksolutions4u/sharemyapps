require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const InterviewModule = require('../models/InterviewModule');
  
  const modules = await InterviewModule.find({ title: { $regex: /micro/i } }).lean();
  console.log(modules.map(m => m.title));
  
  mongoose.connection.close();
}

test().catch(console.error);

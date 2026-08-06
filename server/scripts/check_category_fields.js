require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const InterviewModule = require('../models/InterviewModule');
  
  const modules = await InterviewModule.find().sort({ createdAt: -1 }).limit(10).lean();
  console.log(modules.map(m => ({ title: m.title, category: m.category })));
  
  mongoose.connection.close();
}

test().catch(console.error);

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const InterviewModule = require('../models/InterviewModule');
  const modules = await InterviewModule.find().sort({ createdAt: -1 }).limit(5).lean();
  console.log(modules.map(m => ({ id: m._id, title: m.title, category: m.category, isActive: m.isActive, createdAt: m.createdAt })));
  mongoose.connection.close();
}

test().catch(console.error);

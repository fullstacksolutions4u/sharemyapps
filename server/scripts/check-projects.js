require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Project = require('../models/Project');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const projects = await Project.find({}, 'title liveUrl bannerImage status');
  console.log(`Found ${projects.length} total projects:`);
  for (const p of projects) {
    console.log(`- [${p.status}] ${p.title}: ${p.liveUrl} -> ${p.bannerImage || 'No banner'}`);
  }
  await mongoose.connection.close();
}

run().catch(console.error);

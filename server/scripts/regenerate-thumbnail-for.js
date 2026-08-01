require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Project = require('../models/Project');
const { generateAndUploadThumbnail } = require('../utils/thumbnailGenerator');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Find project by title containing "HR Space"
  const project = await Project.findOne({ title: /HR Space/i });
  if (!project) {
    console.error('Project not found');
    await mongoose.connection.close();
    return;
  }
  
  console.log(`Found project: ${project.title} (${project.liveUrl})`);
  console.log(`Current thumbnail: ${project.bannerImage}`);
  console.log('Generating new thumbnail using Microlink...');
  
  const newUrl = await generateAndUploadThumbnail(project.liveUrl);
  if (newUrl) {
    project.bannerImage = newUrl;
    await project.save();
    console.log(`Successfully updated thumbnail to: ${newUrl}`);
  } else {
    console.log('Failed to generate new thumbnail.');
  }
  
  await mongoose.connection.close();
}

run().catch(console.error);

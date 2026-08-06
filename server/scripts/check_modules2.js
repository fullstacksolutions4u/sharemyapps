require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const InterviewModule = require('../models/InterviewModule');
  
  try {
    const modules = await InterviewModule.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
    console.log(`Found ${modules.length} modules`);
    
    const optimizedModules = modules.map(module => ({
      ...module,
      topics: module.topics.map(topic => ({
        ...topic,
        hasQuiz: topic.quizzes && topic.quizzes.length > 0,
        quizCount: topic.quizzes ? topic.quizzes.length : 0,
        quizzes: undefined
      }))
    }));
    
    console.log(`Successfully mapped ${optimizedModules.length} modules`);
  } catch (error) {
    console.error("Error mapping modules:", error);
  }
  
  mongoose.connection.close();
}

test().catch(console.error);

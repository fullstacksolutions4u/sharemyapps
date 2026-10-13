const path = require('path');
const serverDir = 'T:\\Projects\\Asubrix International\\sharemyapps\\server';
require(path.join(serverDir, 'node_modules', 'dotenv')).config({ path: path.join(serverDir, '.env') });
const mongoose = require(path.join(serverDir, 'node_modules', 'mongoose'));

async function fixQuizIds() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const learningmodules = db.collection('learningmodules');
  const modules = await learningmodules.find({}).toArray();

  let modulesUpdated = 0;
  let topicsUpdated = 0;
  let quizzesFixed = 0;

  for (const mod of modules) {
    let modModified = false;
    for (const topic of mod.topics || []) {
      if (Array.isArray(topic.quizzes) && topic.quizzes.length > 0) {
        let topicModified = false;
        for (const quiz of topic.quizzes) {
          if (!quiz._id) {
            quiz._id = new mongoose.Types.ObjectId();
            quizzesFixed++;
            topicModified = true;
          }
        }
        if (topicModified) {
          topicsUpdated++;
          modModified = true;
        }
      }
    }

    if (modModified) {
      await learningmodules.updateOne(
        { _id: mod._id },
        { $set: { topics: mod.topics } }
      );
      modulesUpdated++;
      console.log(`Updated module: "${mod.title}" (${mod._id})`);
    }
  }

  console.log('\n--- Migration Finished ---');
  console.log(`Modules updated: ${modulesUpdated}`);
  console.log(`Topics updated: ${topicsUpdated}`);
  console.log(`Quizzes assigned new _id: ${quizzesFixed}`);

  // Verification step
  const verifyModules = await learningmodules.find({}).toArray();
  let remainingMissing = 0;
  for (const mod of verifyModules) {
    for (const t of mod.topics || []) {
      for (const q of t.quizzes || []) {
        if (!q._id) remainingMissing++;
      }
    }
  }
  console.log(`Post-verification: Quizzes still missing _id: ${remainingMissing}`);

  await mongoose.disconnect();
}

fixQuizIds().catch(err => {
  console.error('Error during migration:', err);
  process.exit(1);
});

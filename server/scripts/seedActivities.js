require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const LearningProgress = require('../models/LearningProgress');
const User = require('../models/User');

async function seedActivities() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  // Clear existing activities first to avoid duplicates
  await Activity.deleteMany({});
  console.log('Cleared existing activities.');

  let activitiesToInsert = [];

  // 1. PROJECT_APPROVED
  const projects = await Project.find({ status: 'approved' });
  for (const p of projects) {
    if (p.owner) {
      activitiesToInsert.push({
        user: p.owner,
        type: 'PROJECT_APPROVED',
        project: p._id,
        createdAt: p.updatedAt || p.createdAt || new Date(),
      });
    }

    // 2. PROJECT_LIKED
    if (p.likes && p.likes.length > 0) {
      for (const uid of p.likes) {
        activitiesToInsert.push({
          user: uid,
          type: 'PROJECT_LIKED',
          project: p._id,
          createdAt: p.updatedAt || p.createdAt || new Date(), // We don't have exact like dates, so we use project dates
        });
      }
    }

    // 3. PROJECT_RATED
    if (p.ratings && p.ratings.length > 0) {
      for (const r of p.ratings) {
        activitiesToInsert.push({
          user: r.user,
          type: 'PROJECT_RATED',
          project: p._id,
          meta: { rating: r.value },
          createdAt: p.updatedAt || p.createdAt || new Date(),
        });
      }
    }
  }

  // 4. PROJECT_COMMENTED
  const comments = await Comment.find({});
  for (const c of comments) {
    if (c.user && c.project) {
      activitiesToInsert.push({
        user: c.user,
        type: 'PROJECT_COMMENTED',
        project: c.project,
        createdAt: c.createdAt || new Date(),
      });
    }
  }

  // 5. MODULE_STARTED & MODULE_COMPLETED
  const progresses = await LearningProgress.find({});
  
  // Need to get users to calculate dummy rank for completed modules if desired, 
  // but we can just leave rank empty for past completions.
  for (const prog of progresses) {
    if (!prog.userId) continue;

    // First topic completed => started
    if (prog.completedTopics && prog.completedTopics.length > 0) {
      // Group by module
      const moduleStarts = {};
      for (const t of prog.completedTopics) {
        const mId = t.moduleId.toString();
        if (!moduleStarts[mId] || new Date(t.completedAt) < new Date(moduleStarts[mId])) {
          moduleStarts[mId] = t.completedAt;
        }
      }
      for (const [mId, date] of Object.entries(moduleStarts)) {
        activitiesToInsert.push({
          user: prog.userId,
          type: 'MODULE_STARTED',
          module: mId,
          createdAt: date || new Date(),
        });
      }
    }

    if (prog.completedModules && prog.completedModules.length > 0) {
      for (const m of prog.completedModules) {
        activitiesToInsert.push({
          user: prog.userId,
          type: 'MODULE_COMPLETED',
          module: m.moduleId,
          meta: { score: 0 }, // We can't retroactively get their exact score at the time
          createdAt: m.completedAt || new Date(),
        });
      }
    }
  }

  // Insert all
  if (activitiesToInsert.length > 0) {
    await Activity.insertMany(activitiesToInsert);
    console.log(`Successfully seeded ${activitiesToInsert.length} activities.`);
  } else {
    console.log('No activities to seed.');
  }

  mongoose.disconnect();
}

seedActivities().catch(err => {
  console.error(err);
  process.exit(1);
});

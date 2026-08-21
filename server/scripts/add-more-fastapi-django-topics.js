/**
 * Add more FastAPI / Django-only topics to Quiz Zone (no MCQs — generate separately).
 *
 * Usage: node scripts/add-more-fastapi-django-topics.js
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

const MODULE_TITLE = 'Python, FastAPI, Django';

const NEW_TOPICS = [
  // FastAPI
  'FastAPI Authentication (OAuth2, JWT, and Security)',
  'FastAPI Database Integration with SQLAlchemy',
  'FastAPI WebSockets and Streaming Responses',
  'FastAPI Background Tasks and Lifespan Events',
  'FastAPI Testing with pytest and TestClient',
  'Deploying FastAPI Applications (Docker and Cloud)',
  // Django
  'Django Admin Interface and Customization',
  'Django Forms, ModelForms, and Validation',
  'Django Middleware, Signals, and Custom Managers',
  'Django Authentication, Users, and Permissions',
  'Django Caching, Sessions, and Performance',
  'Django File Uploads and Static/Media Files',
  'Django Testing with pytest-django',
  'Django Celery and Background Jobs',
];

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  const LearningModule = require('../models/LearningModule');

  const module = await LearningModule.findOne({
    title: { $regex: /^python(\s*,\s*fastapi\s*,\s*django)?$/i },
  }) || await LearningModule.findOne({ title: { $regex: /^python/i } });

  if (!module) {
    console.error('Python module not found.');
    process.exit(1);
  }

  const existing = new Set(module.topics.map((t) => t.name.trim().toLowerCase()));
  let nextOrder = module.topics.reduce((max, t) => Math.max(max, t.order ?? 0), -1) + 1;
  let added = 0;

  for (const name of NEW_TOPICS) {
    if (existing.has(name.trim().toLowerCase())) {
      console.log(`Skip (exists): ${name}`);
      continue;
    }
    module.topics.push({
      name,
      order: nextOrder++,
      isPracticalProblem: false,
      quizzes: [],
    });
    existing.add(name.trim().toLowerCase());
    added++;
    console.log(`Added: ${name}`);
  }

  await module.save();
  console.log(`Done. ${added} topic(s) added. Total: ${module.topics.length}.`);
  console.log('\nGenerate MCQs with OpenAI:\n  node scripts/generate-quizzes.js --module "Python, FastAPI, Django" --topic-filter "FastAPI|Django" --count 5\n');

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * One-time migration script: copies learning modules from fss_production → sharemyapps
 *
 * Usage:
 *   node scripts/migrate-modules.js
 *
 * Set these env vars before running (or paste URIs directly into the constants below):
 *   FSS_MONGO_URI   — MongoDB URI for the full-stack-solutions database
 *   SHAREMYAPPS_MONGO_URI — MongoDB URI for the sharemyapps database (falls back to MONGO_URI from .env)
 */

require('dotenv').config();
const mongoose = require('mongoose');

// ── Configure these two URIs ──────────────────────────────────────────────────
const FSS_URI          = process.env.FSS_MONGO_URI;          // fss_production DB
const SHAREMYAPPS_URI  = process.env.SHAREMYAPPS_MONGO_URI   // sharemyapps DB
                      || process.env.MONGO_URI;
// ─────────────────────────────────────────────────────────────────────────────

if (!FSS_URI || !SHAREMYAPPS_URI) {
  console.error('\n❌  Missing URI(s).');
  console.error('    Set FSS_MONGO_URI and SHAREMYAPPS_MONGO_URI as env vars, or edit this script.\n');
  process.exit(1);
}

// Raw schemas — we only need the shape, not full validation
const topicSchema = new mongoose.Schema({
  name:              String,
  completed:         Boolean,
  order:             Number,
  isPracticalProblem:Boolean,
  problemUrl:        String,
  quizzes: [{
    question:      String,
    questionCode:  String,
    options:       [String],
    correctAnswer: Number,
    explanation:   String,
    sampleCode:    String,
  }],
}, { _id: true });

const moduleSchema = new mongoose.Schema({
  title:    String,
  category: String,
  topics:   [topicSchema],
  order:    Number,
  isActive: Boolean,
}, { timestamps: true });

async function run() {
  console.log('\n📦  Connecting to databases…');

  const fssConn  = await mongoose.createConnection(FSS_URI,         { maxPoolSize: 5 }).asPromise();
  const smaConn  = await mongoose.createConnection(SHAREMYAPPS_URI, { maxPoolSize: 5 }).asPromise();

  console.log('✅  Connected to both databases.');

  // fss stores modules in the "modules" collection (model name: Module)
  const FssModule = fssConn.model('Module', moduleSchema, 'modules');

  // sharemyapps stores in "learningmodules" (model name: LearningModule)
  const SmaModule = smaConn.model('LearningModule', moduleSchema, 'learningmodules');

  // Fetch all modules from fss (active and inactive)
  const fssModules = await FssModule.find({}).lean();
  console.log(`\n📋  Found ${fssModules.length} module(s) in fss_production.modules`);

  if (fssModules.length === 0) {
    console.log('    Nothing to migrate.');
    await fssConn.close();
    await smaConn.close();
    return;
  }

  // Check existing data in sharemyapps to avoid duplicates.
  // sharemyapps titles have the "Module N :" prefix stripped, so normalize both sides.
  const normTitle = (s) => (s || '').replace(/^module\s+\d+\s*[:\s-]+\s*/i, '').trim().toLowerCase();
  const existingTitles = new Set(
    (await SmaModule.find({}, 'title').lean()).map(m => normTitle(m.title))
  );

  const toInsert = fssModules.filter(m => !existingTitles.has(normTitle(m.title)));
  const skipped  = fssModules.length - toInsert.length;

  if (skipped > 0) {
    console.log(`⚠️   Skipping ${skipped} module(s) already present in sharemyapps (matched by title).`);
  }

  if (toInsert.length === 0) {
    console.log('✅  All modules already exist. Nothing to insert.');
    await fssConn.close();
    await smaConn.close();
    return;
  }

  // Strip _id so MongoDB generates new ones (avoids conflicts), preserve everything else
  const docs = toInsert.map(({ _id, __v, ...rest }) => rest);

  const result = await SmaModule.insertMany(docs, { ordered: false });
  console.log(`\n✅  Migrated ${result.length} module(s) successfully!`);

  // Print summary
  result.forEach((m, i) => {
    console.log(`    ${i + 1}. "${m.title}" — ${m.topics?.length || 0} topic(s)`);
  });

  await fssConn.close();
  await smaConn.close();
  console.log('\n✔️   Done. Both connections closed.\n');
}

run().catch(err => {
  console.error('\n❌  Migration failed:', err.message);
  process.exit(1);
});

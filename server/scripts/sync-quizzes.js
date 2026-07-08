/**
 * Sync quiz questions from the old fss_production database into sharemyapps,
 * WITHOUT touching existing module/topic _ids (user progress references them).
 *
 * - Matches modules by title and topics by name (trimmed, case-insensitive).
 * - Only fills topics whose quizzes array is currently empty.
 * - Handles both old shapes: `quizzes` array and legacy singular `quiz` object.
 *
 * Usage:
 *   node scripts/sync-quizzes.js           # dry run — prints what WOULD change
 *   node scripts/sync-quizzes.js --apply   # actually writes the changes
 *
 * Env vars:
 *   FSS_MONGO_URI          — old full-stack-solutions DB
 *   SHAREMYAPPS_MONGO_URI  — sharemyapps DB (falls back to MONGO_URI from .env)
 */

require('dotenv').config();
const mongoose = require('mongoose');

const FSS_URI         = process.env.FSS_MONGO_URI;
const SHAREMYAPPS_URI = process.env.SHAREMYAPPS_MONGO_URI || process.env.MONGO_URI;
const APPLY           = process.argv.includes('--apply');

if (!FSS_URI || !SHAREMYAPPS_URI) {
  console.error('\n❌  Missing URI(s). Set FSS_MONGO_URI and SHAREMYAPPS_MONGO_URI (or MONGO_URI).\n');
  process.exit(1);
}

// strict:false so no fields get stripped when reading the old DB
const looseSchema = new mongoose.Schema({}, { strict: false });

const norm = (s) => (s || '').trim().toLowerCase();
// Old DB titles look like "Module 29 : System Design" — strip the prefix before comparing
const normTitle = (s) => norm((s || '').replace(/^module\s+\d+\s*[:\s-]+\s*/i, ''));

// Accepts a topic from the old DB, returns a clean quizzes array (or []).
function extractQuizzes(topic) {
  let raw = [];
  if (Array.isArray(topic.quizzes) && topic.quizzes.length > 0) {
    raw = topic.quizzes;
  } else if (topic.quiz && topic.quiz.question) {
    raw = [topic.quiz]; // legacy singular shape
  }
  return raw
    .filter(q => q && q.question && Array.isArray(q.options) && q.options.length === 4 && typeof q.correctAnswer === 'number')
    .map(q => ({
      question: q.question,
      questionCode: q.questionCode || undefined,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || undefined,
      sampleCode: q.sampleCode || undefined,
      // no _id — let MongoDB generate fresh ones
    }));
}

async function run() {
  console.log(`\n📦  Connecting… (mode: ${APPLY ? 'APPLY' : 'DRY RUN'})`);
  const fssConn = await mongoose.createConnection(FSS_URI, { maxPoolSize: 5 }).asPromise();
  const smaConn = await mongoose.createConnection(SHAREMYAPPS_URI, { maxPoolSize: 5 }).asPromise();

  const FssModule = fssConn.model('Module', looseSchema, 'modules');
  const SmaModule = smaConn.model('LearningModule', looseSchema, 'learningmodules');

  const fssModules = await FssModule.find({}).lean();
  const smaModules = await SmaModule.find({}).lean();
  console.log(`✅  Old DB: ${fssModules.length} modules | sharemyapps: ${smaModules.length} modules`);

  const fssByTitle = new Map(fssModules.map(m => [normTitle(m.title), m]));

  let topicsUpdated = 0, quizzesCopied = 0, topicsSkippedHasQuiz = 0, topicsNoSource = 0;
  const unmatchedModules = [];

  for (const smaMod of smaModules) {
    const fssMod = fssByTitle.get(normTitle(smaMod.title));
    if (!fssMod) { unmatchedModules.push(smaMod.title); continue; }

    const fssTopicsByName = new Map((fssMod.topics || []).map(t => [norm(t.name), t]));
    const changes = []; // { topicId, name, quizzes }

    for (const smaTopic of (smaMod.topics || [])) {
      if (Array.isArray(smaTopic.quizzes) && smaTopic.quizzes.length > 0) { topicsSkippedHasQuiz++; continue; }
      const fssTopic = fssTopicsByName.get(norm(smaTopic.name));
      if (!fssTopic) { topicsNoSource++; continue; }
      const quizzes = extractQuizzes(fssTopic);
      if (quizzes.length === 0) { topicsNoSource++; continue; }
      changes.push({ topicId: smaTopic._id, name: smaTopic.name, quizzes });
    }

    if (changes.length === 0) continue;

    console.log(`\n📘  "${smaMod.title}" — ${changes.length} topic(s) to update:`);
    for (const c of changes) {
      console.log(`     • ${c.name}  (+${c.quizzes.length} quiz${c.quizzes.length > 1 ? 'zes' : ''})`);
      if (APPLY) {
        await SmaModule.updateOne(
          { _id: smaMod._id, 'topics._id': c.topicId },
          { $set: { 'topics.$.quizzes': c.quizzes } }
        );
      }
      topicsUpdated++;
      quizzesCopied += c.quizzes.length;
    }
  }

  console.log('\n──────────── Summary ────────────');
  console.log(`Topics ${APPLY ? 'updated' : 'that would be updated'}: ${topicsUpdated}`);
  console.log(`Quizzes ${APPLY ? 'copied' : 'that would be copied'}:  ${quizzesCopied}`);
  console.log(`Topics already having quizzes (untouched): ${topicsSkippedHasQuiz}`);
  console.log(`Topics with no quiz source in old DB:      ${topicsNoSource}`);
  if (unmatchedModules.length) {
    console.log(`Modules with no title match in old DB:     ${unmatchedModules.length}`);
    unmatchedModules.forEach(t => console.log(`     • ${t}`));
  }
  if (!APPLY) console.log('\nℹ️   Dry run only. Re-run with --apply to write these changes.');

  await fssConn.close();
  await smaConn.close();
  console.log('\n✔️   Done.\n');
}

run().catch(err => {
  console.error('\n❌  Sync failed:', err);
  process.exit(1);
});

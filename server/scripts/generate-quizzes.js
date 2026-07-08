/**
 * Generate MCQ quizzes for topics that have none, using OpenAI — two-step, review-first.
 *
 * Step 1 — generate to a JSON file (no DB writes):
 *   node scripts/generate-quizzes.js --module "Nextjs" [--count 5]
 *   → writes scripts/generated/nextjs.json for you to review/edit
 *
 * Step 2 — apply a reviewed file to the DB:
 *   node scripts/generate-quizzes.js --apply scripts/generated/nextjs.json
 *   → only fills topics whose quizzes are still empty; existing quizzes are never touched
 *
 * Env: MONGO_URI (from .env), OPENAI_API_KEY (from .env)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const OpenAI = require('openai');

const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
};

const MODULE_ARG = getArg('--module');
const APPLY_FILE = getArg('--apply');
const COUNT = parseInt(getArg('--count') || '5', 10);

const looseSchema = new mongoose.Schema({}, { strict: false });
const normTitle = (s) => (s || '').replace(/^module\s+\d+\s*[:\s-]+\s*/i, '').trim().toLowerCase();

function validQuiz(q) {
  return q
    && typeof q.question === 'string' && q.question.trim()
    && Array.isArray(q.options) && q.options.length === 4 && q.options.every(o => typeof o === 'string' && o.trim())
    && Number.isInteger(q.correctAnswer) && q.correctAnswer >= 0 && q.correctAnswer <= 3
    && typeof q.explanation === 'string' && q.explanation.trim();
}

async function generateForTopic(client, moduleTitle, topicName, count) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 3000,
    messages: [
      {
        role: 'system',
        content: 'You write technical multiple-choice questions for a developer learning platform. Return ONLY a valid JSON array, no markdown.',
      },
      {
        role: 'user',
        content: `Write ${count} multiple-choice questions to test a developer's understanding of the topic "${topicName}" from the course module "${moduleTitle}".

Return ONLY a JSON array where each item has exactly these keys:
{
  "question": "<clear, specific question text>",
  "questionCode": "<optional code snippet the question refers to, or null>",
  "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
  "correctAnswer": <0-3, index of the correct option>,
  "explanation": "<1-3 sentence explanation of why the answer is correct>",
  "sampleCode": "<optional short code example reinforcing the concept, or null>"
}

Rules:
- Exactly 4 options each; only one correct.
- Vary difficulty: start with fundamentals, end with a trickier application question.
- Distribute correctAnswer indexes — do not always use the same index.
- Options must be plausible; no joke answers.
- Use questionCode only when a code snippet genuinely helps (output-prediction or spot-the-bug questions).
- No markdown fences anywhere in the values.`,
      },
    ],
  });
  const text = response.choices[0].message.content;
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    parsed = match ? JSON.parse(match[0]) : [];
  }
  return (Array.isArray(parsed) ? parsed : [])
    .filter(validQuiz)
    .map(q => ({
      question: q.question.trim(),
      questionCode: q.questionCode || undefined,
      options: q.options.map(o => o.trim()),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation.trim(),
      sampleCode: q.sampleCode || undefined,
    }));
}

async function runGenerate() {
  if (!process.env.OPENAI_API_KEY) { console.error('❌  OPENAI_API_KEY is not set.'); process.exit(1); }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const conn = await mongoose.createConnection(process.env.MONGO_URI, { maxPoolSize: 5 }).asPromise();
  const Module = conn.model('LearningModule', looseSchema, 'learningmodules');
  const mod = (await Module.find({}).lean()).find(m => normTitle(m.title) === normTitle(MODULE_ARG));
  if (!mod) {
    console.error(`❌  No module matching "${MODULE_ARG}" found.`);
    await conn.close(); process.exit(1);
  }

  const targets = (mod.topics || []).filter(t =>
    !t.isPracticalProblem && !(Array.isArray(t.quizzes) && t.quizzes.length > 0)
  );
  console.log(`\n📘  "${mod.title}" — ${targets.length} topic(s) need quizzes (${COUNT} each).\n`);

  const out = { moduleId: String(mod._id), moduleTitle: mod.title, generatedAt: new Date().toISOString(), topics: [] };
  let failed = 0;

  for (const [i, topic] of targets.entries()) {
    process.stdout.write(`  [${i + 1}/${targets.length}] ${topic.name} … `);
    try {
      const quizzes = await generateForTopic(client, mod.title, topic.name, COUNT);
      if (quizzes.length === 0) { console.log('⚠️  no valid quizzes returned'); failed++; continue; }
      out.topics.push({ topicId: String(topic._id), topicName: topic.name, quizzes });
      console.log(`✅  ${quizzes.length} questions`);
    } catch (err) {
      console.log(`❌  ${err.message}`);
      failed++;
    }
  }

  const dir = path.join(__dirname, 'generated');
  fs.mkdirSync(dir, { recursive: true });
  const slug = normTitle(mod.title).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const file = path.join(dir, `${slug}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2), 'utf8');

  const total = out.topics.reduce((s, t) => s + t.quizzes.length, 0);
  console.log(`\n✔️   Wrote ${total} questions for ${out.topics.length} topic(s) → ${file}`);
  if (failed) console.log(`⚠️   ${failed} topic(s) failed — re-run to retry (already-saved topics are skipped only after --apply).`);
  console.log(`\nReview the file, then apply with:\n  node scripts/generate-quizzes.js --apply "${path.relative(path.join(__dirname, '..'), file)}"\n`);
  await conn.close();
}

async function runApply() {
  const file = path.resolve(process.cwd(), APPLY_FILE);
  if (!fs.existsSync(file)) { console.error(`❌  File not found: ${file}`); process.exit(1); }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));

  const conn = await mongoose.createConnection(process.env.MONGO_URI, { maxPoolSize: 5 }).asPromise();
  const Module = conn.model('LearningModule', looseSchema, 'learningmodules');
  const mod = await Module.findById(data.moduleId).lean();
  if (!mod) { console.error('❌  Module from file not found in DB.'); await conn.close(); process.exit(1); }

  console.log(`\n📘  Applying to "${mod.title}"…`);
  let applied = 0, skipped = 0;
  for (const t of data.topics) {
    const dbTopic = (mod.topics || []).find(x => String(x._id) === t.topicId);
    if (!dbTopic) { console.log(`  ⚠️  topic not found, skipping: ${t.topicName}`); skipped++; continue; }
    if (Array.isArray(dbTopic.quizzes) && dbTopic.quizzes.length > 0) {
      console.log(`  ⏭️   already has quizzes, skipping: ${t.topicName}`); skipped++; continue;
    }
    await Module.updateOne(
      { _id: mod._id, 'topics._id': dbTopic._id },
      { $set: { 'topics.$.quizzes': t.quizzes } }
    );
    console.log(`  ✅  ${t.topicName} (+${t.quizzes.length})`);
    applied++;
  }
  console.log(`\n✔️   Applied ${applied} topic(s), skipped ${skipped}.\n`);
  await conn.close();
}

if (APPLY_FILE) runApply().catch(e => { console.error('❌ ', e); process.exit(1); });
else if (MODULE_ARG) runGenerate().catch(e => { console.error('❌ ', e); process.exit(1); });
else {
  console.log('\nUsage:\n  node scripts/generate-quizzes.js --module "Nextjs" [--count 5]\n  node scripts/generate-quizzes.js --apply scripts/generated/nextjs.json\n');
  process.exit(1);
}

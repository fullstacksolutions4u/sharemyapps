/**
 * AUTO MODE: generate MCQs for EVERY topic without quizzes across ALL modules,
 * writing them directly to the database as each topic completes.
 *
 * Usage:
 *   node scripts/batch-generate-quizzes.js [--count 5]
 *
 * - Skips topics that already have quizzes and practical (LeetCode) topics.
 * - Saves a JSON record of everything generated to scripts/generated/_auto-<date>.json.
 * - Safe to re-run: already-filled topics are skipped, so it resumes where it left off.
 *
 * Env: MONGO_URI, OPENAI_API_KEY (from .env)
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
const COUNT = parseInt(getArg('--count') || '5', 10);

const looseSchema = new mongoose.Schema({}, { strict: false });

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
  const match = text.match(/\[[\s\S]*\]/);
  const candidate = match ? match[0] : text;
  let parsed;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    // repair invalid escapes (e.g. psql's \dt, \l inside strings) and retry
    parsed = JSON.parse(candidate.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\'));
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

async function run() {
  if (!process.env.OPENAI_API_KEY) { console.error('❌  OPENAI_API_KEY is not set.'); process.exit(1); }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const conn = await mongoose.createConnection(process.env.MONGO_URI, { maxPoolSize: 5 }).asPromise();
  const Module = conn.model('LearningModule', looseSchema, 'learningmodules');
  const modules = await Module.find({}).sort({ order: 1 }).lean();

  const record = { generatedAt: new Date().toISOString(), modules: [] };
  let grandTopics = 0, grandQuestions = 0, grandFailed = 0;

  for (const mod of modules) {
    const targets = (mod.topics || []).filter(t =>
      !t.isPracticalProblem && !(Array.isArray(t.quizzes) && t.quizzes.length > 0)
    );
    if (targets.length === 0) { console.log(`⏭️   "${mod.title}" — nothing to do`); continue; }

    console.log(`\n📘  "${mod.title}" — ${targets.length} topic(s) to fill`);
    const modRecord = { moduleId: String(mod._id), moduleTitle: mod.title, topics: [] };

    for (const [i, topic] of targets.entries()) {
      process.stdout.write(`  [${i + 1}/${targets.length}] ${topic.name} … `);
      try {
        const quizzes = await generateForTopic(client, mod.title, topic.name, COUNT);
        if (quizzes.length === 0) { console.log('⚠️  no valid quizzes returned'); grandFailed++; continue; }
        await Module.updateOne(
          { _id: mod._id, 'topics._id': topic._id },
          { $set: { 'topics.$.quizzes': quizzes } }
        );
        modRecord.topics.push({ topicId: String(topic._id), topicName: topic.name, quizzes });
        grandTopics++; grandQuestions += quizzes.length;
        console.log(`✅  ${quizzes.length} saved`);
      } catch (err) {
        console.log(`❌  ${err.message}`);
        grandFailed++;
      }
    }
    if (modRecord.topics.length) record.modules.push(modRecord);
  }

  const dir = path.join(__dirname, 'generated');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `_auto-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(file, JSON.stringify(record, null, 2), 'utf8');

  console.log('\n──────────── Summary ────────────');
  console.log(`Topics filled:      ${grandTopics}`);
  console.log(`Questions written:  ${grandQuestions}`);
  console.log(`Failed topics:      ${grandFailed}${grandFailed ? '  (re-run this script to retry just those)' : ''}`);
  console.log(`Audit record:       ${file}`);
  await conn.close();
  console.log('\n✔️   Done.\n');
}

run().catch(e => { console.error('❌ ', e); process.exit(1); });

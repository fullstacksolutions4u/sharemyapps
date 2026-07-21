require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const OpenAI = require("openai");

const args = process.argv.slice(2);
const HAS_GENERATE = args.includes("--generate");
const HAS_SEED = args.includes("--seed");
const APPLY_FILE = (() => { const i = args.indexOf("--apply"); return i !== -1 && args[i + 1] ? args[i + 1] : null; })();
const QUIZ_COUNT = parseInt((() => { const i = args.indexOf("--count"); return i !== -1 && args[i + 1] ? args[i + 1] : "5"; })(), 10);

const NEW_MODULES = [
  {
    title: "React Native",
    category: "Mobile Development",
    order: 104,
    topics: [
      "Introduction to React Native and Cross-Platform Development",
      "Setting Up React Native Environment (Expo and CLI)",
      "Core Components: View, Text, Image, ScrollView",
      "Styling in React Native: StyleSheet and Flexbox",
      "Navigation with React Navigation",
      "Stack Navigator and Tab Navigator",
      "State Management in React Native (useState, useReducer)",
      "Fetching Data with Fetch API and Axios",
      "AsyncStorage and Local Data Persistence",
      "React Native Forms and User Input",
      "Animations with Animated API and Reanimated",
      "Camera, Location and Device Permissions",
      "Push Notifications with Expo and Firebase",
      "Debugging React Native Apps",
      "Publishing to Google Play Store and Apple App Store",
      "React Native Performance Optimization",
      "Integrating Native Modules and Third-Party Libraries",
      "Testing React Native Apps with Jest and Detox"
    ]
  },
  {
    title: "Flutter",
    category: "Mobile Development",
    order: 105,
    topics: [
      "Introduction to Flutter and Dart Programming Language",
      "Setting Up Flutter Development Environment",
      "Dart Basics: Variables, Functions and Control Flow",
      "Dart Object-Oriented Programming",
      "Flutter Widgets: Stateless and Stateful",
      "Layouts in Flutter: Column, Row, Stack and Container",
      "Flutter Navigation and Routing",
      "State Management: setState, Provider and Riverpod",
      "Flutter Forms and Input Validation",
      "HTTP Requests and REST API Integration in Flutter",
      "Local Storage with SharedPreferences and SQLite",
      "Flutter Animations and Custom Painters",
      "Firebase Integration with Flutter",
      "Flutter BLoC Pattern for State Management",
      "Platform-Specific Code: Android and iOS Channels",
      "Flutter Testing: Unit, Widget and Integration Tests",
      "Building and Deploying Flutter Apps",
      "Flutter Performance Best Practices"
    ]
  },
  {
    title: "Vue.js",
    category: "Frontend Framework",
    order: 106,
    topics: [
      "Introduction to Vue.js and the Vue Ecosystem",
      "Vue CLI and Project Structure",
      "Vue Components and Single File Components (SFC)",
      "Template Syntax and Data Binding",
      "Vue Directives: v-if, v-for, v-bind, v-on, v-model",
      "Computed Properties and Watchers",
      "Vue Component Communication: Props and Emits",
      "Vue Lifecycle Hooks",
      "Vue Router for Navigation",
      "State Management with Pinia",
      "Vuex Store (Legacy State Management)",
      "Composables and the Composition API",
      "Vue 3 Reactivity System",
      "HTTP Requests with Axios in Vue",
      "Vue Transitions and Animations",
      "Vue Form Handling and Validation",
      "Unit Testing Vue Components with Vitest",
      "Nuxt.js Fundamentals: SSR with Vue",
      "Deploying Vue Applications"
    ]
  },
  {
    title: "Cyber Security",
    category: "Security",
    order: 107,
    topics: [
      "Introduction to Cyber Security and Threat Landscape",
      "Networking Fundamentals for Security (TCP/IP, DNS, HTTP)",
      "Linux Command Line for Security Professionals",
      "Cryptography Basics: Symmetric, Asymmetric and Hashing",
      "Web Application Security: OWASP Top 10",
      "SQL Injection: Detection and Prevention",
      "Cross-Site Scripting (XSS) and CSRF Attacks",
      "Authentication and Authorization Best Practices",
      "JWT Security and Session Management",
      "HTTPS, TLS and Certificate Management",
      "Penetration Testing Fundamentals",
      "Reconnaissance and Information Gathering",
      "Vulnerability Scanning with Nmap and Nessus",
      "Ethical Hacking and Responsible Disclosure",
      "Firewalls, IDS and IPS Systems",
      "Secure Coding Practices",
      "API Security: Rate Limiting, OAuth2 and API Keys",
      "Cloud Security Fundamentals (AWS, GCP, Azure)",
      "Incident Response and Forensics",
      "Security Compliance: GDPR, ISO 27001 and SOC 2"
    ]
  }
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function validQuiz(q) {
  return q && typeof q.question === "string" && q.question.trim() &&
    Array.isArray(q.options) && q.options.length === 4 &&
    q.options.every(o => typeof o === "string" && o.trim()) &&
    Number.isInteger(q.correctAnswer) && q.correctAnswer >= 0 && q.correctAnswer <= 3 &&
    typeof q.explanation === "string" && q.explanation.trim();
}

async function generateQuizzesForTopic(client, moduleTitle, topicName, count) {
  const prompt = `Write ${count} multiple-choice questions to test a developer understanding of the topic "${topicName}" from the course module "${moduleTitle}".

Return ONLY a JSON array where each item has exactly these keys:
{
  "question": "<clear, specific question text>",
  "questionCode": "<optional code snippet or null>",
  "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
  "correctAnswer": <0-3, index of the correct option>,
  "explanation": "<1-3 sentence explanation of why the answer is correct>",
  "sampleCode": "<optional short code example or null>"
}

Rules:
- Exactly 4 options each; only one correct.
- Vary difficulty: start with fundamentals, end with a trickier application question.
- Distribute correctAnswer indexes - do not always use the same index.
- Options must be plausible; no joke answers.
- Use questionCode only when a code snippet genuinely helps.
- No markdown fences anywhere in the values.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 3000,
    messages: [
      { role: "system", content: "You write technical multiple-choice questions for a developer learning platform. Return ONLY a valid JSON array, no markdown." },
      { role: "user", content: prompt }
    ]
  });
  const text = response.choices[0].message.content;
  let parsed;
  try { parsed = JSON.parse(text); } catch { const m = text.match(/\[[\s\S]*\]/); parsed = m ? JSON.parse(m[0]) : []; }
  return (Array.isArray(parsed) ? parsed : []).filter(validQuiz).map(q => ({
    question: q.question.trim(),
    questionCode: q.questionCode || undefined,
    options: q.options.map(o => o.trim()),
    correctAnswer: q.correctAnswer,
    explanation: q.explanation.trim(),
    sampleCode: q.sampleCode || undefined
  }));
}

async function runGenerate() {
  if (!process.env.OPENAI_API_KEY) { console.error("OPENAI_API_KEY is not set."); process.exit(1); }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const output = { generatedAt: new Date().toISOString(), modules: [] };
  for (const mod of NEW_MODULES) {
    console.log("\n[MODULE] " + mod.title + " (" + mod.topics.length + " topics x " + QUIZ_COUNT + " Qs each)");
    const modOut = { title: mod.title, category: mod.category, order: mod.order, topics: [] };
    for (const [i, topicName] of mod.topics.entries()) {
      process.stdout.write("  [" + (i + 1) + "/" + mod.topics.length + "] " + topicName + " ... ");
      let retries = 2;
      while (retries >= 0) {
        try {
          const quizzes = await generateQuizzesForTopic(client, mod.title, topicName, QUIZ_COUNT);
          console.log(quizzes.length === 0 ? "WARNING: no valid quizzes" : "OK: " + quizzes.length + " questions");
          modOut.topics.push({ name: topicName, order: i, isPracticalProblem: false, quizzes });
          break;
        } catch (err) {
          if (retries > 0 && err.status === 429) {
            console.log("Rate limited, waiting 15s...");
            await sleep(15000);
            retries--;
          } else {
            console.log("ERROR: " + err.message);
            modOut.topics.push({ name: topicName, order: i, isPracticalProblem: false, quizzes: [] });
            break;
          }
        }
      }
      await sleep(600);
    }
    output.modules.push(modOut);
  }
  const dir = path.join(__dirname, "generated");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "new-modules-batch2.json");
  fs.writeFileSync(file, JSON.stringify(output, null, 2), "utf8");
  const totalTopics = output.modules.reduce((s, m) => s + m.topics.length, 0);
  const totalQuizzes = output.modules.reduce((s, m) => s + m.topics.reduce((ts, t) => ts + t.quizzes.length, 0), 0);
  console.log("\nGenerated " + totalTopics + " topics and " + totalQuizzes + " MCQs -> " + file);
  return file;
}

async function runApply(filePath) {
  const file = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(file)) { console.error("File not found: " + file); process.exit(1); }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!data.modules || !Array.isArray(data.modules)) { console.error("Invalid file format."); process.exit(1); }
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");
  const topicSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 200 },
    completed: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    isPracticalProblem: { type: Boolean, default: false },
    problemUrl: { type: String, trim: true },
    quizzes: [{
      question: { type: String, trim: true, required: true },
      questionCode: { type: String, trim: true },
      options: { type: [String], validate: [v => v.length === 4, "Must have 4 options"], required: true },
      correctAnswer: { type: Number, min: 0, max: 3, required: true },
      explanation: { type: String, trim: true },
      sampleCode: { type: String, trim: true }
    }]
  }, { timestamps: true });
  const moduleSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, maxlength: 200, unique: true },
    category: { type: String, trim: true, maxlength: 100 },
    topics: [topicSchema],
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  }, { timestamps: true });
  const LearningModule = mongoose.models.LearningModule || mongoose.model("LearningModule", moduleSchema);
  let created = 0, skipped = 0;
  for (const modData of data.modules) {
    const existing = await LearningModule.findOne({ title: modData.title });
    if (existing) { console.log("  SKIP (exists): " + modData.title); skipped++; continue; }
    const topics = (modData.topics || []).map((t, i) => ({
      name: t.name,
      order: t.order !== undefined ? t.order : i,
      isPracticalProblem: t.isPracticalProblem || false,
      problemUrl: t.problemUrl || "",
      quizzes: (t.quizzes || []).filter(validQuiz).map(q => ({
        question: q.question,
        questionCode: q.questionCode || undefined,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        sampleCode: q.sampleCode || undefined
      }))
    }));
    await LearningModule.create({ title: modData.title, category: modData.category || "", order: modData.order || 0, isActive: true, topics });
    console.log("  CREATED: " + modData.title + " - " + topics.length + " topics, " + topics.reduce((s, t) => s + t.quizzes.length, 0) + " MCQs");
    created++;
  }
  console.log("\nDone: " + created + " created, " + skipped + " skipped.\n");
  await mongoose.disconnect();
}

async function main() {
  if (APPLY_FILE) await runApply(APPLY_FILE);
  else if (HAS_GENERATE) { const file = await runGenerate(); if (HAS_SEED) { console.log("\nAuto-seeding...\n"); await runApply(file); } }
  else { console.log("Usage:\n  --generate [--count 5]\n  --apply <file>\n  --generate --seed"); process.exit(0); }
}

main().catch(e => { console.error(e); process.exit(1); });

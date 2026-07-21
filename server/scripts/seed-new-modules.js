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
    title: "AI / ML",
    category: "Artificial Intelligence",
    order: 100,
    topics: [
      "Introduction to AI and Machine Learning",
      "Types of Machine Learning: Supervised, Unsupervised, Reinforcement",
      "Data Preprocessing and Feature Engineering",
      "Linear Regression and Logistic Regression",
      "Decision Trees and Random Forests",
      "Support Vector Machines (SVM)",
      "K-Nearest Neighbors (KNN) and K-Means Clustering",
      "Neural Networks and Deep Learning Basics",
      "Convolutional Neural Networks (CNN)",
      "Recurrent Neural Networks (RNN) and LSTM",
      "Natural Language Processing (NLP) Fundamentals",
      "Transfer Learning and Pre-trained Models",
      "Model Evaluation: Overfitting, Underfitting, Cross-Validation",
      "Hyperparameter Tuning and Optimization",
      "Introduction to Generative AI and LLMs",
      "Prompt Engineering for LLMs",
      "AI Ethics and Responsible AI",
      "Deploying ML Models with FastAPI and Docker"
    ]
  },
  {
    title: "Angular",
    category: "Frontend Framework",
    order: 101,
    topics: [
      "Introduction to Angular and TypeScript",
      "Angular CLI and Project Structure",
      "Components, Templates and Data Binding",
      "Directives: Structural and Attribute",
      "Services and Dependency Injection",
      "Angular Modules and Lazy Loading",
      "Routing and Navigation with Angular Router",
      "Angular Forms: Template-Driven and Reactive",
      "HTTP Client and API Integration",
      "Observables and RxJS Operators",
      "Angular Pipes and Custom Pipes",
      "Component Communication: Input, Output and EventEmitter",
      "Angular Lifecycle Hooks",
      "State Management with NgRx",
      "Angular Material UI Components",
      "Unit Testing with Jasmine and Karma",
      "Angular Universal - Server-Side Rendering",
      "Performance Optimization and Change Detection",
      "Building and Deploying Angular Applications"
    ]
  },
  {
    title: "Java",
    category: "Backend Language",
    order: 102,
    topics: [
      "Java Basics: Syntax, Variables and Data Types",
      "Control Flow: Conditionals and Loops",
      "Object-Oriented Programming: Classes and Objects",
      "Inheritance, Polymorphism and Abstraction",
      "Interfaces and Abstract Classes",
      "Java Collections Framework (List, Set, Map)",
      "Generics in Java",
      "Exception Handling in Java",
      "Java I/O and File Handling",
      "Java 8 Features: Streams, Lambdas and Optional",
      "Multithreading and Concurrency",
      "Java Memory Management and Garbage Collection",
      "Design Patterns in Java",
      "Introduction to Spring Framework",
      "Spring Boot and REST API Development",
      "Spring Data JPA and Hibernate",
      "Spring Security and JWT Authentication",
      "Unit Testing with JUnit 5 and Mockito",
      "Maven and Gradle Build Tools",
      "Microservices with Spring Cloud"
    ]
  },
  {
    title: "Data Science",
    category: "Data and Analytics",
    order: 103,
    topics: [
      "Introduction to Data Science and the Data Science Lifecycle",
      "Python for Data Science: NumPy and Pandas",
      "Data Collection and Web Scraping",
      "Exploratory Data Analysis (EDA)",
      "Data Cleaning and Handling Missing Values",
      "Data Visualization with Matplotlib and Seaborn",
      "Statistical Concepts: Probability, Distributions and Hypothesis Testing",
      "Correlation, Regression and Causation",
      "Feature Selection and Dimensionality Reduction (PCA)",
      "Machine Learning for Data Science (Scikit-learn)",
      "Time Series Analysis and Forecasting",
      "SQL for Data Analysis",
      "NoSQL Databases and Data Pipelines",
      "Big Data Tools: Hadoop and Spark Fundamentals",
      "Data Warehousing and ETL Processes",
      "Introduction to Power BI and Tableau",
      "A/B Testing and Experimentation",
      "Storytelling with Data and Building Dashboards",
      "Data Science in the Real World: Case Studies and Projects"
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
  const file = path.join(dir, "new-modules.json");
  fs.writeFileSync(file, JSON.stringify(output, null, 2), "utf8");
  const totalTopics = output.modules.reduce((s, m) => s + m.topics.length, 0);
  const totalQuizzes = output.modules.reduce((s, m) => s + m.topics.reduce((ts, t) => ts + t.quizzes.length, 0), 0);
  console.log("\nGenerated " + totalTopics + " topics and " + totalQuizzes + " MCQs -> " + file);
  console.log("Review then apply:\n  node scripts/seed-new-modules.js --apply scripts/generated/new-modules.json\n");
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
  if (APPLY_FILE) {
    await runApply(APPLY_FILE);
  } else if (HAS_GENERATE) {
    const file = await runGenerate();
    if (HAS_SEED) { console.log("\nAuto-seeding...\n"); await runApply(file); }
  } else {
    console.log("Usage:\n  --generate [--count 5]\n  --apply <file>\n  --generate --seed");
    process.exit(0);
  }
}

main().catch(e => { console.error(e); process.exit(1); });

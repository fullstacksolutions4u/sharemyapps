require("dotenv").config({ path: __dirname + '/../.env' });
const mongoose = require("mongoose");

const MODULES = [
  {
    title: "C#",
    category: "Programming Language",
    order: 200,
    topics: [
      {
        name: "Introduction to C#",
        order: 0,
        quizzes: [
          {
            question: "C# was developed by which company?",
            options: ["Apple", "Microsoft", "Google", "Oracle"],
            correctAnswer: 1,
            explanation: "C# was developed by Microsoft as part of its .NET initiative."
          },
          {
            question: "Which of these is the correct entry point of a C# console application?",
            options: ["void start()", "static void Main()", "int main()", "public void Main()"],
            correctAnswer: 1,
            explanation: "The standard entry point is static void Main()."
          }
        ]
      },
      {
        name: "Object-Oriented Programming in C#",
        order: 1,
        quizzes: [
          {
            question: "What keyword is used to inherit a class in C#?",
            options: ["extends", "inherits", ":", "implements"],
            correctAnswer: 2,
            explanation: "In C#, the colon (:) is used for both class inheritance and interface implementation."
          },
          {
            question: "Which keyword prevents a class from being inherited?",
            options: ["static", "sealed", "final", "abstract"],
            correctAnswer: 1,
            explanation: "The 'sealed' keyword in C# prevents other classes from inheriting from it."
          }
        ]
      }
    ]
  },
  {
    title: "Rust",
    category: "Programming Language",
    order: 201,
    topics: [
      {
        name: "Introduction to Rust",
        order: 0,
        quizzes: [
          {
            question: "Which tool is the package manager and build system for Rust?",
            options: ["npm", "pip", "cargo", "maven"],
            correctAnswer: 2,
            explanation: "Cargo is the official package manager and build system for Rust."
          },
          {
            question: "Which keyword is used to declare a variable in Rust?",
            options: ["var", "let", "mut", "val"],
            correctAnswer: 1,
            explanation: "The 'let' keyword is used to declare variables in Rust."
          }
        ]
      },
      {
        name: "Ownership and Borrowing",
        order: 1,
        quizzes: [
          {
            question: "What is Rust's primary memory management model?",
            options: ["Garbage Collection", "Manual Memory Management", "Ownership System", "Reference Counting"],
            correctAnswer: 2,
            explanation: "Rust uses an ownership system with strict compile-time checks to manage memory safely."
          },
          {
            question: "Which symbol is used to create a reference (borrow) in Rust?",
            options: ["*", "&", "@", "#"],
            correctAnswer: 1,
            explanation: "The ampersand (&) is used to create a reference to a value without taking ownership."
          }
        ]
      }
    ]
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const topicSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 200 },
    order: { type: Number, default: 0 },
    isPracticalProblem: { type: Boolean, default: false },
    quizzes: [{
      question: { type: String, required: true, trim: true },
      options: { type: [String], required: true },
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
  for (const mod of MODULES) {
    const existing = await LearningModule.findOne({ title: mod.title });
    if (existing) {
      console.log("  SKIP (already exists): " + mod.title);
      skipped++;
      continue;
    }
    const topics = mod.topics.map((t, i) => ({
      name: t.name,
      order: t.order !== undefined ? t.order : i,
      isPracticalProblem: false,
      quizzes: (t.quizzes || []).map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || ""
      }))
    }));
    await LearningModule.create({
      title: mod.title,
      category: mod.category,
      order: mod.order,
      isActive: true,
      topics
    });
    const totalQuizzes = topics.reduce((s, t) => s + t.quizzes.length, 0);
    console.log("  CREATED: " + mod.title + " -- " + topics.length + " topics, " + totalQuizzes + " quiz questions");
    created++;
  }

  console.log("\nDone: " + created + " module(s) created, " + skipped + " skipped.\n");
  await mongoose.disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });

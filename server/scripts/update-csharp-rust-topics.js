require("dotenv").config({ path: __dirname + '/../.env' });
const mongoose = require("mongoose");

const csharpTopicsList = [
  "Introduction to C#",
  "Object-Oriented Programming in C#",
  "Data Types and Variables",
  "Operators and Expressions",
  "Control Flow (if, switch)",
  "Loops (for, while, do-while)",
  "Arrays and Collections",
  "Methods and Parameters",
  "Classes and Objects",
  "Inheritance and Polymorphism",
  "Interfaces and Abstract Classes",
  "Exception Handling",
  "Strings and String Manipulation",
  "File I/O",
  "Delegates and Events",
  "LINQ (Language Integrated Query)",
  "Generics",
  "Asynchronous Programming (async/await)",
  "Multithreading and Concurrency",
  "Attributes and Reflection",
  "Properties and Indexers",
  "Structs and Enums",
  "Garbage Collection and Memory Management",
  "Entity Framework Core Basics",
  "ASP.NET Core Introduction",
  "Dependency Injection",
  "Unit Testing in C#",
  "Design Patterns in C#",
  "C# 10/11 New Features",
  "Best Practices and Code Optimization"
];

const rustTopicsList = [
  "Introduction to Rust",
  "Ownership and Borrowing",
  "Variables and Mutability",
  "Data Types (Scalar and Compound)",
  "Functions and Comments",
  "Control Flow (if, loop, while, for)",
  "Understanding Ownership",
  "References and Borrowing",
  "The Slice Type",
  "Structs and Data Grouping",
  "Enums and Pattern Matching",
  "Modules, Crates, and Packages",
  "Common Collections (Vector, String, HashMap)",
  "Error Handling (Result, Option, panic!)",
  "Generic Types, Traits, and Lifetimes",
  "Writing Automated Tests",
  "Iterators and Closures",
  "Smart Pointers (Box, Rc, RefCell)",
  "Fearless Concurrency (Threads, Message Passing, Shared State)",
  "Object-Oriented Programming Features of Rust",
  "Patterns and Matching",
  "Advanced Features (Unsafe Rust, Advanced Traits, Macros)",
  "Building a Multithreaded Web Server",
  "Foreign Function Interface (FFI)",
  "WebAssembly with Rust",
  "Asynchronous Programming (async/await)",
  "Tokio and Async Runtimes",
  "Serde and Serialization",
  "Rust and C++ Interoperability",
  "Performance Optimization and Profiling"
];

const templates = [];

function generateTopics(titles) {
  return titles.map((title, i) => {
    return {
      name: title,
      order: i,
      isPracticalProblem: false,
      quizzes: []
    };
  });
}

async function updateModules() {
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

  const csharpModule = await LearningModule.findOne({ title: "C#" });
  if (csharpModule) {
    csharpModule.topics = generateTopics(csharpTopicsList);
    await csharpModule.save();
    console.log("Updated C# module with 30 topics.");
  }

  const rustModule = await LearningModule.findOne({ title: "Rust" });
  if (rustModule) {
    rustModule.topics = generateTopics(rustTopicsList);
    await rustModule.save();
    console.log("Updated Rust module with 30 topics.");
  }

  console.log("Done.");
  await mongoose.disconnect();
}

updateModules().catch(console.error);

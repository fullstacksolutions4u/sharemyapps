require('dotenv').config();
const mongoose = require('mongoose');
const LearningModule = require('./models/LearningModule');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const javaMod = await LearningModule.findOne({ title: { $regex: /java/i, $not: /javascript/i } });
  if (javaMod) {
    console.log("Current Java Topics:");
    javaMod.topics.forEach(t => console.log("- " + t.name));
  }
  process.exit(0);
});

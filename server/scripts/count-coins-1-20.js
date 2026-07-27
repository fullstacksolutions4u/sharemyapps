require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const LearningModule = require('../models/LearningModule');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const modules = await LearningModule.find({ order: { $gte: 1, $lte: 20 } });
  let totalCoins = 0;
  let totalQuizzes = 0;
  
  modules.forEach(m => {
    const title = m.title || '';
    let pointsPerQuiz = (title.toLowerCase() === 'html & css') ? 1 : 2;
    let modQuizzes = 0;
    (m.topics || []).forEach(t => {
      if (t.quizzes && t.quizzes.length > 0) {
        modQuizzes += t.quizzes.length;
      }
    });
    totalCoins += modQuizzes * pointsPerQuiz;
    totalQuizzes += modQuizzes;
  });
  
  console.log('Total Quizzes (1-20): ' + totalQuizzes);
  console.log('Max Coins (1-20): ' + totalCoins);
  process.exit(0);
}).catch(console.error);

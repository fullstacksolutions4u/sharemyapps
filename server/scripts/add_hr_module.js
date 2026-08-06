require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const InterviewModule = require('../models/InterviewModule');
  
  const hrModule = new InterviewModule({
    title: 'HR & Communication Skills',
    category: 'HR',
    order: 100,
    isActive: true,
    topics: [
      {
        name: 'Behavioral Questions',
        order: 0,
        quizzes: [
          { question: 'Tell me about a time you had a conflict with a coworker and how you resolved it.' },
          { question: 'What is your greatest weakness, and how are you working to improve it?' },
          { question: 'Describe a situation where you had to meet a tight deadline.' }
        ]
      },
      {
        name: 'Communication Skills',
        order: 1,
        quizzes: [
          { question: 'How do you explain complex technical concepts to a non-technical stakeholder?' },
          { question: 'Give an example of a time you successfully persuaded your team to adopt your idea.' }
        ]
      },
      {
        name: 'Culture Fit & Motivation',
        order: 2,
        quizzes: [
          { question: 'Why do you want to work for our company?' },
          { question: 'Where do you see yourself in 5 years?' }
        ]
      }
    ]
  });

  await hrModule.save();
  console.log('Successfully created HR & Communication Skills module!');
  
  mongoose.connection.close();
}

test().catch(console.error);

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

const CATEGORY_DEFS = [
  { key: 'frontend', keywords: ['frontend', 'html', 'css', 'react', 'vue', 'angular', 'ui', 'ux', 'tailwind', 'next', 'state management', 'redux', 'zustand', 'context api', 'mobx'] },
  { key: 'backend', keywords: ['backend', 'node', 'express', 'api', 'server', 'rest', 'graphql'] },
  { key: 'database', keywords: ['database', 'mongodb', 'sql', 'nosql', 'postgres', 'mysql', 'redis', 'mongo'] },
  { key: 'programming', keywords: ['javascript', 'python', 'java', 'typescript', 'c++', 'c#', 'rust', 'go', 'php', 'programming language', 'script'] },
  { key: 'dsa', keywords: ['dsa', 'data structure', 'algorithm', 'sorting', 'searching', 'tree', 'graph'] },
  { key: 'mobile', keywords: ['react native', 'react-native', 'mobile', 'android', 'ios', 'flutter', 'swift', 'kotlin'] },
  { key: 'system_design', keywords: ['system design', 'architecture', 'microservice', 'scalab', 'distributed'] },
  { key: 'ai', keywords: ['ai', 'artificial intelligence', 'machine learning', 'nlp', 'deep learning', 'ml'] },
  { key: 'devops', keywords: ['devops', 'deployment', 'fundamentals', 'advanced', 'docker', 'kubernetes', 'ci/cd', 'aws', 'jenkins', 'pipeline'] },
  { key: 'data_science', keywords: ['data science', 'data analysis', 'statistics', 'pandas', 'numpy', 'jupyter'] },
  { key: 'cyber_security', keywords: ['cyber security', 'security', 'cryptography', 'ethical hacking', 'penetration testing'] },
];

function getModuleCategory(mod) {
  const haystack = `${mod.title} ${mod.category || ''}`.toLowerCase();
  let bestKey = null;
  let bestLen = -1;
  for (const cat of CATEGORY_DEFS) {
    for (const kw of cat.keywords) {
      if (haystack.includes(kw) && kw.length > bestLen) {
        bestKey = cat.key;
        bestLen = kw.length;
      }
    }
  }
  return bestKey;
}

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const InterviewModule = require('../models/InterviewModule');
  
  const modules = await InterviewModule.find({ isActive: true }).lean();
  
  const missing = [];
  modules.forEach(mod => {
    if (/^evaluation module$/i.test(mod.title || '')) return;
    const key = getModuleCategory(mod);
    if (!key) missing.push(mod.title);
  });
  
  console.log('Missing modules:', missing);
  mongoose.connection.close();
}

test().catch(console.error);

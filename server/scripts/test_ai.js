require('dotenv').config({ path: '../.env' });
const { analyzeReport } = require('../controllers/aiReportController');

async function test() {
  const req = {
    body: {
      mcqAssessments: [{ question: 'What is React?', isCorrect: true, comment: 'Good answer' }],
      applicantName: 'Test',
      jobTitle: 'Developer'
    }
  };
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      console.log('Status:', this.statusCode);
      console.log('Data:', data);
    }
  };

  await analyzeReport(req, res);
}

test().catch(console.error);

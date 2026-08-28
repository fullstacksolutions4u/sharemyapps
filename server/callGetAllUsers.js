require('dotenv').config();
const mongoose = require('mongoose');
const adminController = require('./controllers/adminController');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Database connected');

  const req = { query: {} };
  const res = {
    json: (data) => {
      console.log('Success! Returned data length:', data.length);
      if (data.length > 0) {
        console.log('First user:', { name: data[0].name, userType: data[0].userType });
      }
    },
    status: (code) => {
      console.log('Status code:', code);
      return res;
    }
  };

  try {
    await adminController.getAllUsers(req, res);
  } catch (err) {
    console.error('Controller crashed:', err);
  }

  process.exit(0);
}
run();

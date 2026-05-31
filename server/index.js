require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const passport = require('passport');

require('./middleware/passport');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');
const announcementRoutes = require('./routes/announcements');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/announcements', announcementRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// TEMPORARY — remove after running once in production
app.get('/api/migrate-reg-numbers', async (_req, res) => {
  const User = require('./models/User');
  const last = await User.findOne({ regNumber: { $exists: true } }).sort({ regNumber: -1 }).select('regNumber');
  let next = last?.regNumber ? last.regNumber + 1 : 101;
  const users = await User.find({ regNumber: { $exists: false } }).sort({ createdAt: 1 }).select('_id name email');
  for (const user of users) {
    await User.updateOne({ _id: user._id }, { $set: { regNumber: next } });
    next++;
  }
  res.json({ assigned: users.length, upTo: next - 1 });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

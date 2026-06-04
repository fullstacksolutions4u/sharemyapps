require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const passport = require('passport');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

require('./middleware/passport');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');
const announcementRoutes = require('./routes/announcements');
const vacancyRoutes = require('./routes/vacancies');
const freelanceRoutes = require('./routes/freelance');
const mentorshipRoutes = require('./routes/mentorship');
const jdAnalysisRoutes = require('./routes/jdAnalysis');

const app = express();

app.use(compression());
app.use(helmet({ contentSecurityPolicy: false }));
app.set('json spaces', 0);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
const generalLimiter = rateLimit({ windowMs: 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/jd', aiLimiter, jdAnalysisRoutes);
app.use('/api/projects', generalLimiter, projectRoutes);
app.use('/api/admin', generalLimiter, adminRoutes);
app.use('/api/notifications', generalLimiter, notificationRoutes);
app.use('/api/messages', generalLimiter, messageRoutes);
app.use('/api/users', generalLimiter, userRoutes);
app.use('/api/announcements', generalLimiter, announcementRoutes);
app.use('/api/vacancies', generalLimiter, vacancyRoutes);
app.use('/api/freelance', generalLimiter, freelanceRoutes);
app.use('/api/mentorship', generalLimiter, mentorshipRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

mongoose.connect(process.env.MONGO_URI, { maxPoolSize: 10 })
  .then(() => {
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

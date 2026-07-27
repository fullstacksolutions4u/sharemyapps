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
const paymentRoutes = require('./routes/payments');
const planRoutes = require('./routes/plans');
const offerRoutes = require('./routes/offers');
const learningModuleRoutes = require('./routes/learningModules');
const learningProgressRoutes = require('./routes/learningProgress');
const learningFeedbackRoutes = require('./routes/learningFeedback');
const premiumServicesRoutes = require('./routes/premiumServices');
const feedRoutes = require('./routes/feed');
const jobLinkRoutes = require('./routes/jobLinks');
const showcaseRoutes = require('./routes/showcase');
const { startJobAlertScheduler } = require('./jobs/jobAlertScheduler');
const { task: thumbnailTask } = require('./cron/thumbnails');
const { task: hourlyMetricsTask } = require('./cron/hourlyMetrics');
const { startMetricsPusher } = require('./utils/metricsPusher');
require('./utils/customMetrics'); // Initialize custom metrics on startup

const promBundle = require('express-prom-bundle');
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: { project_name: 'sharemyapps' },
  normalizePath: (req, opts) => {
    return req.route ? req.route.path : '#fallback';
  },
  promClient: {
    collectDefaultMetrics: {
    }
  }
});

const app = express();
app.set('trust proxy', 1); 
app.use(metricsMiddleware);

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
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
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
app.use('/api/payments', generalLimiter, paymentRoutes);
app.use('/api/plans', generalLimiter, planRoutes);
app.use('/api/offers', generalLimiter, offerRoutes);
app.use('/api/learning-modules', generalLimiter, learningModuleRoutes);
app.use('/api/learning-progress', generalLimiter, learningProgressRoutes);
app.use('/api/learning-feedback', generalLimiter, learningFeedbackRoutes);
app.use('/api/premium-services', generalLimiter, premiumServicesRoutes);
app.use('/api/feed', generalLimiter, feedRoutes);
app.use('/api/job-links', generalLimiter, jobLinkRoutes);
app.use('/api/showcase', generalLimiter, showcaseRoutes);

// Developer: view own interview feedback (auth required)
app.use('/api/interview-feedback', generalLimiter, require('./middleware/auth').protect, (req, res, next) => {
  require('./controllers/interviewController').getMyFeedback(req, res, next);
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

mongoose.connect(process.env.MONGO_URI, { maxPoolSize: 10 })
  .then(() => {
    console.log('MongoDB connected');
    startJobAlertScheduler();
    thumbnailTask.start();
    hourlyMetricsTask.start();
    startMetricsPusher();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

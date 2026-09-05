require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const passport = require('passport');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

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
const interviewModuleRoutes = require('./routes/interviewModules');
const communityPostRoutes = require('./routes/communityPosts');
const { startJobAlertScheduler } = require('./jobs/jobAlertScheduler');
const { task: thumbnailTask } = require('./cron/thumbnails');

const app = express();
app.set('trust proxy', 1); 

app.use(compression());
// ─── Security Headers ─────────────────────────────────────────────────────────
// XSS Defense          → contentSecurityPolicy  (Topic #1)
// Clickjacking Defense → frameguard + frameAncestors  (Topic #2)
// Security Headers     → hsts, referrerPolicy, permissionsPolicy, etc.  (Topic #3)
// See docs/security/ for full documentation
// ──────────────────────────────────────────────────────────────────────────────
app.use(helmet({

  // ── Topic #2: Clickjacking ──────────────────────────────────────────────────
  // X-Frame-Options: DENY — blocks our app being embedded in any external iframe
  frameguard: { action: 'deny' },

  // ── Topic #3: HSTS ─────────────────────────────────────────────────────────
  // Strict-Transport-Security — force HTTPS for 1 year, across all subdomains
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },

  // ── Topic #3: Referrer Policy ──────────────────────────────────────────────
  // FIX: Helmet default 'no-referrer' breaks Google OAuth and Razorpay callbacks.
  // 'strict-origin-when-cross-origin' sends only the domain on cross-origin requests.
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // ── Topic #3: Cross-Origin-Resource-Policy ─────────────────────────────────
  // FIX: Helmet default 'same-origin' blocks our React frontend (different origin)
  // from fetching our API. CORS headers already restrict which domains can call us.
  crossOriginResourcePolicy: { policy: 'cross-origin' },

  // ── Topic #3: Permissions-Policy ──────────────────────────────────────────
  // NOTE: Helmet 8.x has no built-in permissionsPolicy — set via custom middleware below.

  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://apis.google.com",
        "https://accounts.google.com",
        "https://checkout.razorpay.com",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",                   // Required for TailwindCSS inline styles
        "https://fonts.googleapis.com",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://res.cloudinary.com",
        "https://lh3.googleusercontent.com",
        "https://firebasestorage.googleapis.com",
        "https://storage.googleapis.com",
      ],
      connectSrc: [
        "'self'",
        ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
        ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : []),
        "https://accounts.google.com",
        "https://api.razorpay.com",
        "https://lumberjack.razorpay.com",
        "https://firebasestorage.googleapis.com",
      ],
      // Controls what iframes YOUR app can LOAD (outbound) — Razorpay, Google OAuth
      frameSrc: [
        "https://accounts.google.com",
        "https://api.razorpay.com",
        "https://checkout.razorpay.com",
        "https://drive.google.com",          // CV preview iframe in Profile page
        "https://docs.google.com",           // Google Docs CV preview
      ],
      // Clickjacking Defense — Layer 2: CSP frame-ancestors (modern, stronger)
      // 'none' = nobody can embed ShareMyApps in an iframe on any external site
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],                 // Block Flash / plugins
      upgradeInsecureRequests: [],           // Force HTTPS in production
    },
  },
  crossOriginEmbedderPolicy: false,          // Required for Cloudinary images to load
}));

// ── Topic #3: Permissions-Policy ─────────────────────────────────────────────
// Helmet 8.x has no built-in permissionsPolicy middleware — set it directly.
// Restricts browser features: blocks camera, mic, geolocation, USB from being
// silently activated by our pages or any embedded third-party scripts.
app.use((_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    [
      'camera=()',           // No camera access on any origin
      'microphone=()',       // No microphone access
      'geolocation=()',      // No location tracking
      'usb=()',              // No USB device access
      'payment=(self)',      // Payment API allowed only on our own domain (Razorpay)
      'interest-cohort=()', // Opt out of FLoC / ad-targeting
    ].join(', ')
  );
  next();
});
app.set('json spaces', 0);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim().replace(/\/$/, '')); // Strip trailing slashes for reliable exact-matching

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200 // Legacy browsers (IE11, smart TVs) choke on 204
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
app.use('/api/interview-modules', generalLimiter, interviewModuleRoutes);
app.use('/api/community-posts', generalLimiter, communityPostRoutes);

// Developer: interview feedback (auth required)
app.use('/api/interview-feedback', generalLimiter, require('./middleware/auth').protect, require('./routes/interviewFeedback'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Information Disclosure Prevention — global error handler (must be LAST middleware)
// Returns generic messages in production to avoid leaking internal error details.
// See docs/security/04_information_disclosure.md
app.use(errorHandler);

mongoose.connect(process.env.MONGO_URI, { maxPoolSize: 10 })
  .then(() => {
    console.log('MongoDB connected');
    startJobAlertScheduler();
    thumbnailTask.start();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
// trigger restart

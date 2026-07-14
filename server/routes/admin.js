const router = require('express').Router();
const { protect, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const {
  getPendingProjects,
  getAllProjects,
  updateProjectStatus,
  adminUpdateProject,
  getAllUsers,
  getStats,
  getUserGrowth,
  setBadge,
  setDesignation,
  adminUpdateUser,
  toggleFeatured,
  adminToggleHidden,
  toggleUserHidden,
  getResumes,
  deleteUser,
  deleteProject,
  setResumeData,
  setAdminNote,
  getCompanies,
  getEmailRecipients,
  sendCustomEmail,
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
} = require('../controllers/adminController');
const { adminSendMessage } = require('../controllers/messageController');
const {
  getAllVacanciesAdmin,
  createVacancy,
  updateVacancy,
  deleteVacancy,
  replyToInterest,
  toggleVacancyStatus,
} = require('../controllers/vacancyController');
const { adminGetUserJDHistory } = require('../controllers/jdAnalysisController');
const { adminGetPayments } = require('../controllers/paymentController');
const { getAdminConfig, updateAdminConfig } = require('../controllers/configController');
const freelance = require('../controllers/freelanceOpportunityController');
const mentorship = require('../controllers/mentorshipOpportunityController');
const { aiChat } = require('../controllers/aiChatController');
const { adminGetPlans, adminCreatePlan, adminUpdatePlan, adminDeletePlan } = require('../controllers/planController');
const { adminGetOffers, adminUpdateOffer, adminDeleteOffer, adminGetOfferStats, adminGetOfferPortfolio, adminMarkWhatsappContacted, adminToggleEnroll, adminActivate } = require('../controllers/freeOfferController');

router.use(protect, requireAdmin);

router.get('/stats', getStats);
router.get('/user-growth', getUserGrowth);
router.get('/projects', getAllProjects);
router.get('/projects/pending', getPendingProjects);
router.patch('/projects/:id/status', updateProjectStatus);
router.put('/projects/:id', adminUpdateProject);
router.get('/users', getAllUsers);
router.get('/resumes', getResumes);
router.get('/companies', getCompanies);
router.get('/email/users', getEmailRecipients);
router.post('/email/send', sendCustomEmail);
router.get('/email/templates', getEmailTemplates);
router.post('/email/templates', createEmailTemplate);
router.put('/email/templates/:id', updateEmailTemplate);
router.delete('/email/templates/:id', deleteEmailTemplate);
router.patch('/users/:id/badge', setBadge);
router.patch('/users/:id/designation', setDesignation);
router.put('/users/:id', adminUpdateUser);
router.patch('/users/:id/hide', toggleUserHidden);
router.patch('/users/:id/note', setAdminNote);
router.put('/users/:id/resume', setResumeData);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/message', adminSendMessage);
router.get('/users/:id/jd-history', adminGetUserJDHistory);
router.get('/users/:id/portfolio-visits', async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const visits = await Notification.find({ fromUser: req.params.id, type: 'recruiter_visit' })
      .populate('user', 'name avatar email designations regNumber')
      .sort({ createdAt: -1 })
      .lean();
    res.json(visits);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete('/projects/:id', deleteProject);
router.patch('/projects/:id/featured', toggleFeatured);
router.patch('/projects/:id/hide', adminToggleHidden);

router.get('/vacancies', getAllVacanciesAdmin);
router.post('/vacancies', createVacancy);
router.put('/vacancies/:id', updateVacancy);
router.delete('/vacancies/:id', deleteVacancy);
router.post('/vacancies/:id/reply', replyToInterest);
router.patch('/vacancies/:id/toggle-status', toggleVacancyStatus);

// Freelance opportunities
router.get('/freelance', freelance.getAllAdmin);
router.post('/freelance', freelance.create);
router.put('/freelance/:id', freelance.update);
router.delete('/freelance/:id', freelance.remove);
router.patch('/freelance/:id/toggle-status', freelance.toggleStatus);
router.post('/freelance/:id/reply', freelance.replyToInterest);

// Mentorship opportunities
router.get('/mentorship', mentorship.getAllAdmin);
router.post('/mentorship', mentorship.create);
router.put('/mentorship/:id', mentorship.update);
router.delete('/mentorship/:id', mentorship.remove);
router.patch('/mentorship/:id/toggle-status', mentorship.toggleStatus);
router.post('/mentorship/:id/reply', mentorship.replyToInterest);

router.get('/payments', adminGetPayments);
router.get('/config', getAdminConfig);
router.put('/config', updateAdminConfig);

router.get('/plans', adminGetPlans);
router.post('/plans', adminCreatePlan);
router.put('/plans/:id', adminUpdatePlan);
router.delete('/plans/:id', adminDeletePlan);

// ── Mentorship Program applications ──────────────────────────────────────────
router.get('/mentorship-applications', async (req, res) => {
  try {
    const MentorshipApplication = require('../models/MentorshipApplication');
    const applications = await MentorshipApplication.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email avatar regNumber')
      .lean();
    res.json({ applications });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/mentorship-applications/:id', async (req, res) => {
  try {
    const MentorshipApplication = require('../models/MentorshipApplication');
    const Notification = require('../models/Notification');
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    const application = await MentorshipApplication.findByIdAndUpdate(
      req.params.id,
      { status, reviewedAt: new Date(), reviewedBy: req.user._id },
      { new: true }
    ).populate('user', 'name email avatar regNumber');
    if (!application) return res.status(404).json({ message: 'Application not found.' });

    if (status === 'approved') {
      await Notification.create({
        user:    application.user._id,
        type:    'mentorship_approved',
        title:   'Mentorship Application Approved 🎓',
        message: 'Your Mentorship Program application has been verified. You can now complete the payment from the Mentorship Program page to start your journey.',
      });
    } else if (status === 'rejected') {
      await Notification.create({
        user:    application.user._id,
        type:    'mentorship_rejected',
        title:   'Mentorship Application Update',
        message: 'Your Mentorship Program application was not approved at this time. You can update your details and apply again.',
      });
    }
    res.json({ application });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Repair: backfill FreeOffer + premiumServices for payment-only users
router.post('/offers/repair-payment-users', async (req, res) => {
  try {
    const Payment   = require('../models/Payment');
    const FreeOffer = require('../models/FreeOffer');
    const payments  = await Payment.find({ status: 'success', pack: /^placement_/ }).lean();
    let fixed = 0;
    for (const p of payments) {
      const uid = p.user;
      // Ensure premiumServices entry
      await User.updateOne({ _id: uid }, { $pull: { premiumServices: { key: 'placement_session' } } });
      await User.updateOne({ _id: uid }, { $push: { premiumServices: { key: 'placement_session', notes: `Payment: ${p.razorpayPaymentId}` } } });
      // Ensure FreeOffer entry
      const existing = await FreeOffer.findOne({ user: uid }).lean();
      if (!existing) {
        await FreeOffer.create({ user: uid, status: 'approved', enrolled: true, enrolledAt: p.createdAt });
        fixed++;
      }
    }
    res.json({ ok: true, fixed, total: payments.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Free offer applications
router.get('/offers', adminGetOffers);
router.get('/offers/stats', adminGetOfferStats);
router.get('/offers/:id/portfolio', adminGetOfferPortfolio);
router.get('/offers/:id/timeline', async (req, res) => {
  try {
    const FreeOffer = require('../models/FreeOffer');
    const offer = await FreeOffer.findById(req.params.id).populate('user', 'name createdAt').lean();
    if (!offer) return res.status(404).json({ message: 'Not found' });

    const events = [];
    if (offer.user?.createdAt) {
      events.push({ id: 'signup', eventType: 'signup', label: 'Signed Up', note: '', at: offer.user.createdAt });
    }
    events.push({ id: 'applied', eventType: 'applied', label: 'Applied for Placement Service', note: '', at: offer.createdAt });
    if (offer.whatsappContacted && offer.whatsappContactedAt) {
      events.push({ id: 'whatsapp', eventType: 'whatsapp', label: 'WhatsApp Contacted', note: '', at: offer.whatsappContactedAt });
    }
    if (offer.enrolled && offer.enrolledAt) {
      events.push({ id: 'enrolled', eventType: 'enrolled', label: 'Enrolled in Program', note: '', at: offer.enrolledAt });
    }
    for (const a of (offer.activities || [])) {
      if (a.type === 'meeting' && a.scheduledAt) {
        events.push({ id: String(a._id) + '_log', eventType: 'meeting_logged', note: a.note, scheduledAt: a.scheduledAt, at: a.createdAt });
        events.push({ id: String(a._id) + '_meet', eventType: 'meeting_attend', note: a.note, scheduledAt: a.scheduledAt, at: a.scheduledAt });
      } else {
        events.push({ id: String(a._id), eventType: a.type, note: a.note, scheduledAt: a.scheduledAt, at: a.createdAt });
      }
    }
    events.sort((a, b) => new Date(b.at) - new Date(a.at));
    res.json({ events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.patch('/offers/:id/whatsapp-contacted', adminMarkWhatsappContacted);
router.patch('/offers/:id/enroll', adminToggleEnroll);
router.patch('/offers/:id/activate', adminActivate);
router.post('/offers/:id/activity', async (req, res) => {
  try {
    const FreeOffer = require('../models/FreeOffer');
    const { type, note, scheduledAt } = req.body;
    const offer = await FreeOffer.findByIdAndUpdate(
      req.params.id,
      { $push: { activities: { type: type || 'note', note: note || '', scheduledAt: scheduledAt || null, createdAt: new Date() } } },
      { new: true }
    );
    if (!offer) return res.status(404).json({ message: 'Not found' });
    res.json({ activities: offer.activities });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.patch('/offers/:id/summary-comment', async (req, res) => {
  try {
    const FreeOffer = require('../models/FreeOffer');
    const offer = await FreeOffer.findByIdAndUpdate(
      req.params.id,
      { summaryComment: req.body.comment || '' },
      { new: true }
    );
    if (!offer) return res.status(404).json({ message: 'Not found' });
    res.json({ summaryComment: offer.summaryComment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.patch('/offers/:id', adminUpdateOffer);
router.delete('/offers/:id', adminDeleteOffer);

// Generate (or regenerate) AI summary for a premium user
router.post('/offers/:id/ai-summary', async (req, res) => {
  try {
    const FreeOffer = require('../models/FreeOffer');
    const OpenAI = require('openai');

    const offer = await FreeOffer.findById(req.params.id).populate('user').lean();
    if (!offer) return res.status(404).json({ message: 'Not found' });

    const u = offer.user;

    let formResponse = null;
    let formHeaders = [];

    // Preferred source: the job-search intake the user submitted in-app
    const CandidateIntake = require('../models/CandidateIntake');
    const intake = await CandidateIntake.findOne({ user: u._id }).lean();
    if (intake) {
      const intakeFields = [
        ['Full Name', intake.fullName],
        ['Current job search status', intake.jobSearchStatus === 'Other' ? intake.jobSearchStatusOther : intake.jobSearchStatus],
        ['How long actively looking for a job', intake.searchDuration === 'Other' ? intake.searchDurationOther : intake.searchDuration],
        ['Platforms used to search for jobs', intake.platformsUsed],
        ['Job applications submitted per day', intake.applicationsPerDay],
        ['Interview calls received (week/month)', intake.interviewCallsFrequency],
        ['Interviews scheduled (week/month)', intake.interviewsScheduledPerWeek],
        ['Available today for a meeting', intake.availableForMeetingToday],
      ].filter(([, v]) => v && String(v).trim());
      formResponse = Object.fromEntries(intakeFields);
      formHeaders = intakeFields.map(([q]) => q);
    }

    // Fallback for legacy applicants: match the old Google Form responses sheet
    if (!formResponse) try {
      const SHEET_ID = '10_CRMyhBMV_Ntmb-siPkBvgJRKRhNi3UyNgeycCsWQY';
      const GID = '676388485';
      const r = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`);
      if (r.ok) {
        const csv = (await r.text()).replace(/^﻿/, '');
        const lines = csv.trim().split('\n');
        formHeaders = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
        const parse = (line) => {
          const vals = []; let cur = ''; let inQ = false;
          for (const ch of line) {
            if (ch === '"') { inQ = !inQ; }
            else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
            else { cur += ch; }
          }
          vals.push(cur.trim());
          return vals;
        };
        const rows = lines.slice(1).map(line => {
          const vals = parse(line);
          return formHeaders.reduce((obj, h, i) => { obj[h] = vals[i] || ''; return obj; }, {});
        });
        const emailKey = formHeaders.find(h => /email/i.test(h));
        const nameKey = formHeaders.find(h => /name/i.test(h));
        const norm = s => (s || '').toLowerCase().trim();
        formResponse = (emailKey && rows.find(row => norm(row[emailKey]) === norm(u.email)))
          || (nameKey && rows.find(row => norm(row[nameKey]) === norm(u.name)))
          || null;
      }
    } catch { /* proceed without form */ }

    const profileSnippet = {
      name: u.name, email: u.email, phone: u.phone,
      designations: u.designations, bio: u.bio,
      familiarTech: u.familiarTech, yearsOfExperience: u.yearsOfExperience,
      joiningAvailability: u.joiningAvailability,
      currentSalary: u.currentSalary, expectedSalary: u.expectedSalary,
      jobMode: u.jobMode, preferredLocations: u.preferredLocations,
      place: u.place, district: u.district, state: u.state, country: u.country,
      linkedinUrl: u.linkedinUrl, githubUrl: u.githubUrl,
      portfolioUrl: u.portfolioUrl, cvUrl: u.cvUrl,
    };

    const prompt = `You are a recruitment assistant. Analyze the three data sources below for a premium job-hunting service applicant and return a structured JSON summary. Return ONLY valid JSON — no markdown, no code fences, no explanation.

Schema (use null for missing fields):
{
  "headline": "one-line professional headline",
  "overview": "2-3 sentence professional overview",
  "keySkills": ["skill1", "skill2"],
  "experience": [
    { "company": "Company Name", "role": "Designation / Title", "period": "Mon YYYY – Mon YYYY or Present" }
  ],
  "education": "highest qualification – institution",
  "jobPreferences": {
    "mode": "Remote / Hybrid / On-site",
    "locations": ["city1"],
    "availability": "immediate / X weeks notice",
    "currentCTC": "₹X LPA or null",
    "expectedCTC": "₹X LPA or null"
  },
  "strengths": ["strength1", "strength2", "strength3"],
  "gaps": ["gap1", "gap2"],
  "formInsights": "key takeaways from the form response, or null if no form data",
  "readinessScore": 8,
  "readinessNote": "one sentence on why this score",
  "formSummary": "2-3 natural sentences rewriting the form answers as proper English prose. IMPORTANT: mention ALL platform/job-board names exactly as given (e.g. LinkedIn, Indeed, Naukri, Company Website, Referrals — do not drop any). Example: 'They have been actively job hunting for over 3 months, applying through Company Website, LinkedIn, Indeed, Naukri, and referrals. They have sent 10+ applications but received no interviews or offers so far. They are open to relocation.' Use null if no form data."
}

## Profile Data
${JSON.stringify(profileSnippet, null, 2)}

## Resume Data
${u.resumeData ? JSON.stringify(u.resumeData, null, 2) : 'null'}

## Form Response
${formResponse ? JSON.stringify(formResponse, null, 2) : 'null'}

## Admin Notes (use as additional context and instructions only — do NOT rephrase, quote, or echo this text in any output field)
${(() => {
  if (!offer.summaryComment) return 'null';
  try {
    const n = JSON.parse(offer.summaryComment);
    if (n && typeof n === 'object') {
      const lines = [];
      if (n.wellness) lines.push(`Wellness:\n${n.wellness.split('\n').filter(Boolean).map(l => `• ${l}`).join('\n')}`);
      if (n.strength) lines.push(`Strength:\n${n.strength.split('\n').filter(Boolean).map(l => `• ${l}`).join('\n')}`);
      if (n.advice)   lines.push(`Advice:\n${n.advice.split('\n').filter(Boolean).map(l => `• ${l}`).join('\n')}`);
      return lines.length ? lines.join('\n\n') : 'null';
    }
  } catch { /* ignore */ }
  return offer.summaryComment;
})()}`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    let aiSummary;
    try {
      aiSummary = JSON.parse(completion.choices[0].message.content);
    } catch {
      aiSummary = { raw: completion.choices[0].message.content };
    }

    // Embed raw form fields so the frontend can render them without re-fetching
    if (formResponse && formHeaders.length) {
      aiSummary._formFields = formHeaders
        .filter(h => !/timestamp/i.test(h) && formResponse[h])
        .map(h => ({ question: h, answer: formResponse[h] }));
    }

    const aiSummaryAt = new Date();
    await FreeOffer.findByIdAndUpdate(req.params.id, { aiSummary, aiSummaryAt });

    res.json({ aiSummary, aiSummaryAt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/fix-spelling', async (req, res) => {
  try {
    const OpenAI = require('openai');
    const { text } = req.body;
    if (!text?.trim()) return res.json({ text });
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: `Fix only spelling and grammar mistakes in the text below. Do not rephrase, reformat, or change the meaning. Return only the corrected text with no explanation.\n\n${text}` }],
      temperature: 0,
    });
    res.json({ text: completion.choices[0].message.content.trim() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/ai-chat', aiChat);

// Premium service users — merges profile + resumeData + Google Form responses
router.get('/premium-users', async (req, res) => {
  try {
    const FreeOffer = require('../models/FreeOffer');

    const offers = await FreeOffer.find({ enrolled: true })
      .populate('user')
      .sort({ enrolledAt: -1 })
      .lean();

    // Fetch Google Form CSV
    let formRows = [];
    let formHeaders = [];
    try {
      const SHEET_ID = '10_CRMyhBMV_Ntmb-siPkBvgJRKRhNi3UyNgeycCsWQY';
      const GID = '676388485';
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
      const r = await fetch(url);
      if (r.ok) {
        const csv = (await r.text()).replace(/^﻿/, '');
        const lines = csv.trim().split('\n');
        formHeaders = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
        const parseCSVLine = (line) => {
          const values = [];
          let cur = '';
          let inQ = false;
          for (const ch of line) {
            if (ch === '"') { inQ = !inQ; }
            else if (ch === ',' && !inQ) { values.push(cur.trim()); cur = ''; }
            else { cur += ch; }
          }
          values.push(cur.trim());
          return values;
        };
        formRows = lines.slice(1).map(line => {
          const vals = parseCSVLine(line);
          return formHeaders.reduce((obj, h, i) => { obj[h] = vals[i] || ''; return obj; }, {});
        });
      }
    } catch { /* form fetch failed — proceed without it */ }

    const nameKey = formHeaders.find(h => /name/i.test(h));
    const emailKey = formHeaders.find(h => /email/i.test(h));
    const norm = s => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();

    const users = offers.map(offer => {
      const u = offer.user || {};
      let formResponse = null;

      if (emailKey) {
        formResponse = formRows.find(r => norm(r[emailKey]) === norm(u.email)) || null;
      }
      if (!formResponse && nameKey) {
        formResponse = formRows.find(r => norm(r[nameKey]) === norm(u.name)) || null;
      }

      return {
        offerId: offer._id,
        enrolledAt: offer.enrolledAt,
        whatsappContacted: offer.whatsappContacted,
        aiSummary: offer.aiSummary || null,
        aiSummaryAt: offer.aiSummaryAt || null,
        profile: {
          _id: u._id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          avatar: u.avatar,
          regNumber: u.regNumber,
          bio: u.bio,
          designations: u.designations,
          familiarTech: u.familiarTech,
          linkedinUrl: u.linkedinUrl,
          githubUrl: u.githubUrl,
          leetcodeUrl: u.leetcodeUrl,
          portfolioUrl: u.portfolioUrl,
          cvUrl: u.cvUrl,
          place: u.place,
          district: u.district,
          state: u.state,
          country: u.country,
          joiningAvailability: u.joiningAvailability,
          currentSalary: u.currentSalary,
          expectedSalary: u.expectedSalary,
          jobMode: u.jobMode,
          preferredLocations: u.preferredLocations,
          yearsOfExperience: u.yearsOfExperience,
          gender: u.gender,
          dateOfBirth: u.dateOfBirth,
          adminNote: u.adminNote,
        },
        resumeData: u.resumeData || null,
        formResponse,
      };
    });

    res.json({ users, formHeaders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Premium service catalog (admin CRUD) ─────────────────────────────────────

router.get('/premium-services/catalog', async (_req, res) => {
  try {
    const PremiumService = require('../models/PremiumService');
    const services = await PremiumService.find().sort({ number: 1 }).lean();
    res.json({ services });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/premium-services/catalog', async (req, res) => {
  try {
    const PremiumService = require('../models/PremiumService');
    const { label, description, bullets, unlockedMessage, active, serviceType } = req.body;
    if (!label?.trim()) return res.status(400).json({ message: 'Label is required' });
    const key = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const count = await PremiumService.countDocuments();
    const service = await PremiumService.create({
      key,
      number: count + 1,
      label: label.trim(),
      description: description?.trim() || '',
      bullets: (bullets || []).map(b => b.trim()).filter(Boolean),
      unlockedMessage: unlockedMessage?.trim() || '',
      active: active !== false,
      serviceType: serviceType || 'session',
    });
    res.status(201).json({ service });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A service with this key already exists' });
    res.status(500).json({ message: err.message });
  }
});

router.put('/premium-services/catalog/:id', async (req, res) => {
  try {
    const PremiumService = require('../models/PremiumService');
    const { label, description, bullets, unlockedMessage, active, serviceType } = req.body;
    const $set = {};
    if (label !== undefined)            $set.label = label.trim();
    if (description !== undefined)      $set.description = description.trim();
    if (bullets !== undefined)          $set.bullets = bullets.map(b => b.trim()).filter(Boolean);
    if (unlockedMessage !== undefined)  $set.unlockedMessage = unlockedMessage.trim();
    if (active !== undefined)           $set.active = active;
    if (serviceType !== undefined)      $set.serviceType = serviceType;
    const service = await PremiumService.findByIdAndUpdate(
      req.params.id, { $set }, { new: true, runValidators: true }
    ).lean();
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ service });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/premium-services/catalog/:id', async (req, res) => {
  try {
    const PremiumService = require('../models/PremiumService');
    const service = await PremiumService.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Per-user premium service unlock / revoke ──────────────────────────────────

router.get('/premium-services/users', async (_req, res) => {
  try {
    const FreeOffer = require('../models/FreeOffer');
    const Payment   = require('../models/Payment');

    const [offers, payments] = await Promise.all([
      FreeOffer.find()
        .populate('user', 'name email avatar regNumber designations premiumServices isDeleted')
        .sort({ createdAt: -1 })
        .lean(),
      Payment.find({ status: 'success', pack: /^placement_/ })
        .populate('user', 'name email avatar regNumber designations premiumServices isDeleted')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const seen = new Set();
    const users = [];

    // Offer-based users first
    for (const o of offers) {
      if (!o.user || o.user.isDeleted) continue;
      const id = String(o.user._id);
      if (!seen.has(id)) {
        seen.add(id);
        users.push({ ...o.user, appliedAt: o.createdAt, enrolled: o.enrolled });
      }
    }

    // Payment users not already in list
    for (const p of payments) {
      if (!p.user || p.user.isDeleted) continue;
      const id = String(p.user._id);
      if (!seen.has(id)) {
        seen.add(id);
        users.push({ ...p.user, appliedAt: p.createdAt, enrolled: true, paidViaRazorpay: true });
      }
    }

    res.json({ users });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

const FREE_ACCESS_NOTE = 'Free access granted by admin';

// Users for granting free premium access; optional ?q= filters by name/email
router.get('/premium-services/search-users', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const filter = { isDeleted: { $ne: true } };
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { email: rx }];
    }
    const users = await User.find(filter)
      .select('name email avatar userType premiumServices freePremiumGrant')
      .sort({ createdAt: -1 })
      .lean();
    const FreeOffer = require('../models/FreeOffer');
    const offerUserIds = new Set(
      (await FreeOffer.find().select('user').lean()).map(o => String(o.user))
    );
    res.json({
      users: users.map(u => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        userType: u.userType,
        hasPremium: (u.premiumServices || []).some(s => s.key === 'placement_session'),
        hasOffer: offerUserIds.has(String(u._id)),
        hasGrant: !!u.freePremiumGrant?.granted,
      })),
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Users invited to free premium access by an admin, with where they are in the pipeline
router.get('/premium-services/free-access', async (_req, res) => {
  try {
    const FreeOffer = require('../models/FreeOffer');
    const users = await User.find({ 'freePremiumGrant.granted': true, isDeleted: { $ne: true } })
      .select('name email avatar freePremiumGrant')
      .sort({ 'freePremiumGrant.grantedAt': -1 })
      .lean();
    const offers = await FreeOffer.find({ user: { $in: users.map(u => u._id) } }).lean();
    const offerByUser = {};
    for (const o of offers) offerByUser[String(o.user)] = o;
    res.json({
      users: users.map(u => {
        const offer = offerByUser[String(u._id)];
        return {
          _id: u._id,
          name: u.name,
          email: u.email,
          avatar: u.avatar,
          grantedAt: u.freePremiumGrant?.grantedAt || null,
          // pipeline stage: invited → applied → activated
          stage: !offer ? 'invited' : (offer.status === 'approved' && offer.enrolled) ? 'activated' : 'applied',
        };
      }),
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Grant free premium access: invites the user — they get an Apply button on the
// Premium page. Applying puts them in Placement Applicants (pending); activation
// there unlocks services and the Premium Member tag.
router.post('/premium-services/:userId/grant-free', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('premiumServices freePremiumGrant isDeleted');
    if (!user || user.isDeleted) return res.status(404).json({ message: 'User not found' });
    if (user.freePremiumGrant?.granted) return res.status(409).json({ message: 'User already has a free access grant' });
    const FreeOffer = require('../models/FreeOffer');
    const existing = await FreeOffer.findOne({ user: user._id }).lean();
    if (existing) return res.status(409).json({ message: 'User already has a placement application' });
    if (user.premiumServices.some(s => s.key === 'placement_session'))
      return res.status(409).json({ message: 'User already has premium access' });
    user.freePremiumGrant = { granted: true, grantedAt: new Date(), grantedBy: req.user._id };
    await user.save();
    res.status(201).json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Revoke an admin-granted free access: clears the invitation, removes the application
// it produced, and pulls any services unlocked by its activation.
router.delete('/premium-services/:userId/revoke-free', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('freePremiumGrant');
    if (!user || !user.freePremiumGrant?.granted)
      return res.status(404).json({ message: 'No admin-granted free access found for this user' });
    const FreeOffer = require('../models/FreeOffer');
    await FreeOffer.deleteOne({ user: user._id });
    await User.updateOne(
      { _id: user._id },
      {
        $set: { freePremiumGrant: { granted: false, grantedAt: null, grantedBy: null } },
        $pull: { premiumServices: { notes: { $in: ['Auto-unlocked on activation', FREE_ACCESS_NOTE] } } },
      }
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/premium-services/:userId/services', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('premiumServices').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ premiumServices: user.premiumServices || [] });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/premium-services/:userId/unlock', async (req, res) => {
  try {
    const { key, notes } = req.body;
    if (!key) return res.status(400).json({ message: 'Service key is required' });
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const already = user.premiumServices.find(s => s.key === key);
    if (already) return res.status(409).json({ message: 'Service already unlocked for this user' });
    user.premiumServices.push({ key, notes: notes || '', unlockedBy: req.user._id });
    await user.save();
    res.json({ premiumServices: user.premiumServices });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/premium-services/:userId/revoke/:key', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const before = user.premiumServices.length;
    user.premiumServices = user.premiumServices.filter(s => s.key !== req.params.key);
    if (user.premiumServices.length === before) return res.status(404).json({ message: 'Service not found on this user' });
    await user.save();
    res.json({ premiumServices: user.premiumServices });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Session Requests ─────────────────────────────────────────────────────────

// All entitled users for a document-type service with their delivery status
router.get('/session-requests/entitled/:serviceKey', async (req, res) => {
  try {
    const SessionRequest = require('../models/SessionRequest');
    const FreeOffer = require('../models/FreeOffer');
    const { serviceKey } = req.params;

    // Users with placement_session unlock or direct service unlock
    const usersWithUnlock = await User.find({
      $or: [
        { 'premiumServices.key': serviceKey },
        { 'premiumServices.key': 'placement_session' },
      ],
    }).select('name email avatar premiumServices').lean();

    // Users with approved offers
    const approvedOffers = await FreeOffer.find({ status: 'approved' })
      .populate('user', 'name email avatar premiumServices')
      .lean();
    const offerUserIds = new Set(approvedOffers.map(o => String(o.user?._id)).filter(Boolean));
    const offerUsers = approvedOffers.map(o => o.user).filter(Boolean);

    // Merge, deduplicate
    const allMap = new Map();
    for (const u of usersWithUnlock) allMap.set(String(u._id), u);
    for (const u of offerUsers) if (!allMap.has(String(u._id))) allMap.set(String(u._id), u);
    const entitledUsers = [...allMap.values()];

    // Attach existing session requests
    const userIds = entitledUsers.map(u => u._id);
    const sessions = await SessionRequest.find({ user: { $in: userIds }, serviceKey }).lean();
    const sessionByUser = {};
    for (const s of sessions) sessionByUser[String(s.user)] = s;

    const result = entitledUsers.map(u => ({
      ...u,
      session: sessionByUser[String(u._id)] || null,
    }));

    res.json({ users: result });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin directly sends a document link to a user (creates or updates the session)
router.post('/session-requests/document-deliver', async (req, res) => {
  try {
    const SessionRequest = require('../models/SessionRequest');
    const PremiumService = require('../models/PremiumService');
    const { sendResumeReadyEmail } = require('../utils/email');
    const { userId, serviceKey, completionLink } = req.body;
    if (!userId || !serviceKey || !completionLink?.trim())
      return res.status(400).json({ message: 'userId, serviceKey and completionLink are required' });

    const [targetUser, service] = await Promise.all([
      User.findById(userId).select('name email avatar').lean(),
      PremiumService.findOne({ key: serviceKey }).lean(),
    ]);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    const serviceLabel = service?.label || serviceKey;

    // Upsert: update existing session or create a new completed one
    let session = await SessionRequest.findOneAndUpdate(
      { user: userId, serviceKey },
      { $set: { status: 'completed', completionLink: completionLink.trim(), serviceLabel, serviceType: 'document' } },
      { new: true }
    );
    if (!session) {
      session = await SessionRequest.create({
        user: userId,
        serviceKey,
        serviceLabel,
        serviceType: 'document',
        status: 'completed',
        completionLink: completionLink.trim(),
      });
    }

    if (targetUser.email) {
      sendResumeReadyEmail({
        to: targetUser.email,
        name: targetUser.name || 'there',
        serviceLabel,
        completionLink: completionLink.trim(),
      }).catch(() => {});
    }

    const populated = await SessionRequest.findById(session._id).populate('user', 'name email avatar').lean();
    res.json({ session: populated });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/session-requests/user/:userId', async (req, res) => {
  try {
    const SessionRequest = require('../models/SessionRequest');
    await SessionRequest.deleteMany({ user: req.params.userId });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/session-requests', async (_req, res) => {
  try {
    const SessionRequest = require('../models/SessionRequest');
    const sessions = await SessionRequest.find()
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ sessions });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/session-requests/:id', async (req, res) => {
  try {
    const SessionRequest = require('../models/SessionRequest');
    const { sendSessionScheduledEmail } = require('../utils/email');
    const { meetLink, scheduledAt } = req.body;
    const update = { status: 'scheduled' };
    if (meetLink !== undefined)    update.meetLink = meetLink.trim();
    if (scheduledAt !== undefined) update.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    const session = await SessionRequest.findByIdAndUpdate(req.params.id, update, { new: true }).populate('user', 'name email avatar');
    if (!session) return res.status(404).json({ message: 'Session request not found' });

    if (session.user?.email && meetLink?.trim()) {
      sendSessionScheduledEmail({
        to: session.user.email,
        name: session.user.name || 'there',
        serviceLabel: session.serviceLabel,
        meetLink: meetLink.trim(),
        scheduledAt: update.scheduledAt,
      }).catch(() => {});
    }

    res.json({ session });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/session-requests/:id/complete', async (req, res) => {
  try {
    const SessionRequest = require('../models/SessionRequest');
    const { sendResumeReadyEmail } = require('../utils/email');
    const { completionLink, coverLetterLink } = req.body;
    if (!completionLink?.trim()) return res.status(400).json({ message: 'Resume link is required' });

    const $set = { status: 'completed', completionLink: completionLink.trim() };
    if (coverLetterLink?.trim()) $set.coverLetterLink = coverLetterLink.trim();

    const session = await SessionRequest.findByIdAndUpdate(
      req.params.id,
      { $set },
      { new: true }
    ).populate('user', 'name email avatar');
    if (!session) return res.status(404).json({ message: 'Session request not found' });

    if (session.user?.email) {
      sendResumeReadyEmail({
        to: session.user.email,
        name: session.user.name || 'there',
        serviceLabel: session.serviceLabel,
        completionLink: completionLink.trim(),
        coverLetterLink: coverLetterLink?.trim() || '',
      }).catch(() => {});
    }

    res.json({ session });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Google Form responses (public sheet CSV export)
router.get('/form-responses', async (_req, res) => {
  try {
    const SHEET_ID = '10_CRMyhBMV_Ntmb-siPkBvgJRKRhNi3UyNgeycCsWQY';
    const GID = '676388485';
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch sheet');
    const csv = (await response.text()).replace(/^﻿/, '');
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    const rows = lines.slice(1).map(line => {
      const values = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') { inQuotes = !inQuotes; }
        else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
        else { current += char; }
      }
      values.push(current.trim());
      return headers.reduce((obj, h, i) => { obj[h] = values[i] || ''; return obj; }, {});
    });
    res.json({ headers, rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch form responses' });
  }
});

// ── Job Recommendations (premium users who received resume/cover letter documents) ──

async function getJobAlertEligibleUsers() {
  const SessionRequest = require('../models/SessionRequest');

  const completed = await SessionRequest.find({
    serviceKey: 'ats_compatible_resume_cover_letter_optimization',
    status: 'completed',
    completionLink: { $ne: '' },
  }).select('user').lean();

  const userIds = [...new Set(completed.map(sr => String(sr.user)))];
  return User.find({ _id: { $in: userIds }, isDeleted: { $ne: true } }).select('name email').lean();
}

router.get('/job-recommendations/premium-users', async (_req, res) => {
  try {
    const users = await getJobAlertEligibleUsers();
    res.json({ users, count: users.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

const JOB_ALERT_TITLE = 'New Job Openings 🎯';
const JOB_ALERT_MESSAGE = 'New hiring opportunities are live! Check your dashboard for company and recruiters email IDs and career page links — share your CV or upload your resume to apply directly.';

// Career-page links where users upload their resume directly; url gets https:// if no protocol given
function cleanCareerLinks(links) {
  if (!Array.isArray(links)) return [];
  return links
    .map(l => {
      const company = l.company?.trim() || '';
      let url = l.url?.trim() || '';
      if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
      return { company, url };
    })
    .filter(l => l.company && l.url);
}

router.post('/job-recommendations/send', async (req, res) => {
  try {
    const JobAlert = require('../models/JobAlert');
    const Notification = require('../models/Notification');
    const { jobs, careerLinks, userIds, scheduledAt } = req.body;
    const cleanJobs = (Array.isArray(jobs) ? jobs : [])
      .map(j => ({
        emailId: j.emailId?.trim() || '',
        subject: j.subject?.trim() || '',
        gotResponse: !!j.gotResponse,
        comment: j.comment?.trim() || '',
      }))
      .filter(j => j.emailId && j.subject);
    const cleanLinks = cleanCareerLinks(careerLinks);
    if (cleanJobs.length === 0 && cleanLinks.length === 0)
      return res.status(400).json({ message: 'Add at least one job (company name + email id) or one career page link' });

    let users = await getJobAlertEligibleUsers();
    if (Array.isArray(userIds) && userIds.length > 0) {
      const idSet = new Set(userIds.map(String));
      users = users.filter(u => idSet.has(String(u._id)));
    }
    if (users.length === 0)
      return res.status(404).json({ message: 'No eligible users to send to' });

    const sendAt = scheduledAt ? new Date(scheduledAt) : new Date();
    if (Number.isNaN(sendAt.getTime()))
      return res.status(400).json({ message: 'Invalid scheduled date/time' });
    const isScheduledForLater = sendAt.getTime() > Date.now() + 60 * 1000;

    const lastSession = await JobAlert.findOne().sort({ sessionNumber: -1 }).select('sessionNumber').lean();
    const sessionNumber = (lastSession?.sessionNumber || 0) + 1;

    const alert = await JobAlert.create({
      jobs: cleanJobs,
      careerLinks: cleanLinks,
      sentBy: req.user._id,
      recipients: users.map(u => u._id),
      scheduledAt: sendAt,
      notified: false,
      sessionNumber,
    });

    if (isScheduledForLater) {
      return res.json({ scheduled: true, scheduledAt: sendAt, total: users.length, sessionNumber });
    }

    const { sendJobAlertEmail } = require('../utils/email');
    let sent = 0, failed = 0;
    for (const u of users) {
      try {
        await Notification.create({
          user:     u._id,
          type:     'job_alert',
          title:    JOB_ALERT_TITLE,
          message:  JOB_ALERT_MESSAGE,
          jobAlert: alert._id,
        });
        sendJobAlertEmail({ to: u.email, name: u.name }).catch(err => console.error('Job alert email error:', err));
        sent++;
      } catch {
        failed++;
      }
    }
    alert.notified = true;
    await alert.save();
    res.json({ scheduled: false, sent, failed, total: users.length, sessionNumber });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// History of past job-alert sessions, for reusing a company/email list against new users
router.get('/job-recommendations/sessions', async (_req, res) => {
  try {
    const JobAlert = require('../models/JobAlert');
    const sessions = await JobAlert.find()
      .sort({ sessionNumber: -1 })
      .limit(50)
      .select('sessionNumber jobs careerLinks recipients scheduledAt notified createdAt')
      .populate('recipients', 'name email')
      .lean();
    res.json({
      sessions: sessions.map(s => ({
        _id: s._id,
        sessionNumber: s.sessionNumber,
        jobs: s.jobs,
        careerLinks: s.careerLinks || [],
        recipients: s.recipients ? s.recipients.map(u => ({ _id: u._id, name: u.name, email: u.email })) : [],
        recipientCount: s.recipients?.length || 0,
        scheduledAt: s.scheduledAt,
        notified: s.notified,
        createdAt: s.createdAt,
      })),
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Detailed history of job-alert sessions populated with user names, grouped by day in frontend
router.get('/job-recommendations/history', async (_req, res) => {
  try {
    const JobAlert = require('../models/JobAlert');
    const sessions = await JobAlert.find()
      .populate('recipients', 'name email')
      .sort({ scheduledAt: -1, createdAt: -1 })
      .lean();
    res.json({
      sessions: sessions.map(s => ({
        _id: s._id,
        sessionNumber: s.sessionNumber,
        scheduledAt: s.scheduledAt,
        createdAt: s.createdAt,
        notified: s.notified,
        recipients: s.recipients ? s.recipients.map(u => ({ _id: u._id, name: u.name, email: u.email })) : [],
      })),
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Modify a job-alert session. Scheduled sessions can change jobs, recipients, and send time;
// sent sessions can only change the job/link list (e.g. removing rejected emails) — recipients
// are not re-notified.
router.put('/job-recommendations/sessions/:id', async (req, res) => {
  try {
    const JobAlert = require('../models/JobAlert');
    const alert = await JobAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Session not found' });

    const { jobs, careerLinks, userIds, scheduledAt } = req.body;

    if (jobs !== undefined || careerLinks !== undefined) {
      const cleanJobs = jobs !== undefined
        ? (Array.isArray(jobs) ? jobs : [])
            .map(j => ({
              emailId: j.emailId?.trim() || '',
              subject: j.subject?.trim() || '',
              gotResponse: !!j.gotResponse,
              comment: j.comment?.trim() || '',
            }))
            .filter(j => j.emailId && j.subject)
        : alert.jobs;
      const cleanLinks = careerLinks !== undefined ? cleanCareerLinks(careerLinks) : alert.careerLinks;
      if (cleanJobs.length === 0 && cleanLinks.length === 0)
        return res.status(400).json({ message: 'Add at least one job (company name + email id) or one career page link' });
      alert.jobs = cleanJobs;
      alert.careerLinks = cleanLinks;
    }

    if (!alert.notified) {
      if (userIds !== undefined) {
        if (!Array.isArray(userIds) || userIds.length === 0)
          return res.status(400).json({ message: 'Select at least one user' });
        alert.recipients = userIds;
      }

      if (scheduledAt !== undefined) {
        const sendAt = scheduledAt ? new Date(scheduledAt) : new Date();
        if (Number.isNaN(sendAt.getTime()))
          return res.status(400).json({ message: 'Invalid scheduled date/time' });
        alert.scheduledAt = sendAt;
      }
    }

    await alert.save();
    res.json({
      session: {
        _id: alert._id,
        sessionNumber: alert.sessionNumber,
        jobs: alert.jobs,
        careerLinks: alert.careerLinks,
        recipients: alert.recipients.map(String),
        recipientCount: alert.recipients.length,
        scheduledAt: alert.scheduledAt,
        notified: alert.notified,
        createdAt: alert.createdAt,
      },
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete a job-alert session from history. Cancels it if not yet sent.
router.delete('/job-recommendations/sessions/:id', async (req, res) => {
  try {
    const JobAlert = require('../models/JobAlert');
    const alert = await JobAlert.findByIdAndDelete(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Session not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;

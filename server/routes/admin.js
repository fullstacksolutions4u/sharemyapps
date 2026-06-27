const router = require('express').Router();
const { protect, requireAdmin } = require('../middleware/auth');
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
const { adminGetOffers, adminUpdateOffer, adminDeleteOffer, adminGetOfferStats, adminGetOfferPortfolio, adminMarkWhatsappContacted, adminToggleEnroll } = require('../controllers/freeOfferController');

router.use(protect, requireAdmin);

router.get('/stats', getStats);
router.get('/user-growth', getUserGrowth);
router.get('/projects', getAllProjects);
router.get('/projects/pending', getPendingProjects);
router.patch('/projects/:id/status', updateProjectStatus);
router.put('/projects/:id', adminUpdateProject);
router.get('/users', getAllUsers);
router.get('/resumes', getResumes);
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
    events.push({ id: 'applied', eventType: 'applied', label: 'Applied for Premium Service', note: '', at: offer.createdAt });
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

    // Fetch and match form response
    let formResponse = null;
    let formHeaders = [];
    try {
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

module.exports = router;

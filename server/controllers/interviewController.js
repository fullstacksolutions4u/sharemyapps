const InterviewSession = require('../models/InterviewSession');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendInterviewTipsEmail } = require('../utils/email');

const DEFAULT_SECTIONS = [
  { title: 'Frontend', rating: 3, notes: '' },
  { title: 'Backend',  rating: 3, notes: '' },
];

// GET /admin/interviews — list sessions with filters
exports.listSessions = async (req, res) => {
  try {
    const { userId, vacancyId, date, minRating, maxRating, shared, unassigned, page = 1, limit = 30 } = req.query;
    const filter = {};

    if (userId)    filter.user = userId;
    if (vacancyId) filter.vacancy = vacancyId;
    if (unassigned === 'true') filter.user = null;
    if (shared !== undefined) filter.sharedWithCandidate = shared === 'true';
    if (date) {
      const d = new Date(date);
      filter.interviewedAt = {
        $gte: new Date(d.setHours(0, 0, 0, 0)),
        $lte: new Date(d.setHours(23, 59, 59, 999)),
      };
    }
    if (minRating || maxRating) {
      filter.overallRating = {};
      if (minRating) filter.overallRating.$gte = Number(minRating);
      if (maxRating) filter.overallRating.$lte = Number(maxRating);
    }

    const sessions = await InterviewSession.find(filter)
      .populate('user', 'name email avatar regNumber designations familiarTech yearsOfExperience place state')
      .populate('evaluatedBy', 'name avatar')
      .populate('vacancy', 'title company status')
      .sort({ interviewedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const total = await InterviewSession.countDocuments(filter);

    res.json({ sessions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /admin/interviews/user/:userId — all sessions for one developer
exports.getUserSessions = async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ user: req.params.userId })
      .populate('user', 'name email avatar regNumber designations')
      .populate('evaluatedBy', 'name avatar')
      .populate('vacancy', 'title company status')
      .sort({ sessionNumber: -1 })
      .lean();
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /admin/interviews — create general (unassigned) session slot
exports.createGeneralSession = async (req, res) => {
  try {
    const { googleMeetLink, status, interviewedAt, user, vacancy } = req.body;

    let sessionNumber;
    if (user) {
      const userExists = await User.findById(user).lean();
      if (!userExists) return res.status(404).json({ message: 'User not found' });
      const lastUserSession = await InterviewSession.findOne({ user })
        .sort({ sessionNumber: -1 })
        .lean();
      sessionNumber = (lastUserSession?.sessionNumber || 0) + 1;
    } else {
      const lastSession = await InterviewSession.findOne()
        .sort({ sessionNumber: -1 })
        .lean();
      sessionNumber = (lastSession?.sessionNumber || 0) + 1;
    }

    const session = await InterviewSession.create({
      user:          user || null,
      evaluatedBy:   req.user._id,
      vacancy:       vacancy || null,
      sessionNumber,
      overallRating: 5,
      googleMeetLink: googleMeetLink ?? '',
      status:        status ?? 'scheduled',
      sections:      DEFAULT_SECTIONS,
      interviewedAt: interviewedAt ? new Date(interviewedAt) : new Date(),
    });

    await session.populate('evaluatedBy', 'name avatar');
    if (session.user) await session.populate('user', 'name email avatar regNumber designations');
    if (session.vacancy) await session.populate('vacancy', 'title company status');

    res.status(201).json({ session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /admin/interviews/user/:userId — create new session
exports.createSession = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Auto-increment session number for this user
    const lastSession = await InterviewSession.findOne({ user: userId })
      .sort({ sessionNumber: -1 }).lean();
    const sessionNumber = (lastSession?.sessionNumber || 0) + 1;

    const {
      overallRating, headline, summary, googleMeetLink, status,
      sections, pros, cons, improvementTips, interviewedAt, mcqAssessments, vacancy
    } = req.body;

    const session = await InterviewSession.create({
      user:          userId,
      evaluatedBy:   req.user._id,
      vacancy:       vacancy || null,
      sessionNumber,
      overallRating: overallRating ?? 5,
      headline:      headline ?? '',
      summary:       summary ?? '',
      googleMeetLink: googleMeetLink ?? '',
      status:        status ?? 'completed',
      sections:      sections && sections.length ? sections : DEFAULT_SECTIONS,
      pros:          pros    ?? [],
      cons:          cons    ?? [],
      improvementTips: improvementTips ?? [],
      interviewedAt: interviewedAt ? new Date(interviewedAt) : new Date(),
      mcqAssessments: mcqAssessments ?? [],
    });

    await session.populate('user', 'name email avatar regNumber designations');
    await session.populate('evaluatedBy', 'name avatar');
    await session.populate('vacancy', 'title company status');

    res.status(201).json({ session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /admin/interviews/:sessionId — update session
exports.updateSession = async (req, res) => {
  try {
    const { user, overallRating, headline, summary, googleMeetLink, status, sections, pros, cons, improvementTips, interviewedAt, mcqAssessments, vacancy } = req.body;

    const updates = { overallRating, headline, summary, googleMeetLink, status, sections, pros, cons, improvementTips, interviewedAt, mcqAssessments };
    if (vacancy !== undefined) updates.vacancy = vacancy || null;
    if (user !== undefined) {
      updates.user = user || null;
      if (user) {
        const existing = await InterviewSession.findById(req.params.sessionId).lean();
        if (!existing?.user) {
          const lastSession = await InterviewSession.findOne({ user })
            .sort({ sessionNumber: -1 })
            .lean();
          updates.sessionNumber = (lastSession?.sessionNumber || 0) + 1;
        }
      }
    }

    const session = await InterviewSession.findByIdAndUpdate(
      req.params.sessionId,
      updates,
      { new: true }
    )
      .populate('user', 'name email avatar regNumber designations')
      .populate('evaluatedBy', 'name avatar')
      .populate('vacancy', 'title company status');

    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /admin/interviews/:sessionId
exports.deleteSession = async (req, res) => {
  try {
    const session = await InterviewSession.findByIdAndDelete(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /admin/interviews/:sessionId/share — share tips with developer (in-app + email)
exports.shareWithCandidate = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.sessionId)
      .populate('user', 'name email avatar regNumber designations');

    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (!session.user) return res.status(400).json({ message: 'Session has no applicant assigned' });

    session.sharedWithCandidate   = true;
    session.sharedWithCandidateAt = new Date();
    await session.save();

    const u = session.user;
    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

    // 1. In-app notification
    await Notification.create({
      user:    u._id,
      type:    'interview_feedback',
      title:   `Your Interview Feedback is Ready 🎯`,
      message: `Session #${session.sessionNumber} feedback has been shared with you. Check your dashboard for personalised improvement tips!`,
    });

    // 2. Email notification
    sendInterviewTipsEmail({
      to:              u.email,
      name:            u.name,
      sessionNumber:   session.sessionNumber,
      overallRating:   session.overallRating,
      headline:        session.headline,
      pros:            session.pros,
      cons:            session.cons,
      improvementTips: session.improvementTips,
      dashboardUrl:    `${CLIENT_URL}/dashboard`,
    }).catch(err => console.error('[Interview Tips Email] failed:', err));

    res.json({ session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/interview-feedback — developer sees their own sessions (only shared ones)
exports.getMyFeedback = async (req, res) => {
  try {
    const sessions = await InterviewSession.find({
      user: req.user._id,
      sharedWithCandidate: true,
    })
      .populate('evaluatedBy', 'name avatar')
      .sort({ sessionNumber: -1 })
      .lean();

    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /admin/interviews/summarize
exports.summarizeMcqs = async (req, res) => {
  try {
    const { mcqAssessments, candidateName, interviewerComments } = req.body;
    if (!Array.isArray(mcqAssessments) || mcqAssessments.length === 0) {
      return res.status(400).json({ message: 'No MCQ assessments provided.' });
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ message: 'OpenAI API key is not configured on the server.' });
    }

    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const correctCount = mcqAssessments.filter(a => a.isCorrect).length;
    const incorrectCount = mcqAssessments.length - correctCount;

    const details = mcqAssessments.map((a, idx) => {
      return `Question ${idx + 1}: "${a.question}"
Category: ${a.moduleTitle || 'N/A'} -> ${a.topicName || 'N/A'}
Candidate Answer Status: ${a.isCorrect ? 'Correct / Right Answer' : 'Incorrect / Wrong Answer'}
Interviewer Comment: ${a.comment || 'None'}`;
    }).join('\n\n');

    const prompt = `You are an expert technical interviewer assessing a developer candidate.
We conducted a live interview assessment. Here are the results:
Candidate name: ${candidateName || 'The candidate'}
Score: ${correctCount} correct, ${incorrectCount} incorrect, ${mcqAssessments.length} total evaluated
${interviewerComments ? `Interviewer overall comments: ${interviewerComments}` : ''}

Assessment details:
${details}

Based on correct answers, wrong answers, per-question interviewer comments, and any overall comments, generate a structured interview evaluation in JSON format.
Ensure overallRating is between 1 and 10 (can be decimal, e.g. 7.5).
improvementTips should contain constructive suggestions.

JSON Output Schema:
{
  "headline": "A short sentence summing up the performance, e.g. 'Strong JavaScript core, but struggled with DOM manipulation.'",
  "summary": "A detailed paragraph evaluating the candidate's interview performance: strengths, weaknesses, and overall impression.",
  "overallRating": 8,
  "pros": ["HTML semantic markup knowledge", "Excellent recursion understanding"],
  "cons": ["Struggled with absolute positioning in CSS", "Confused about JavaScript Promises"],
  "improvementTips": [
    {
      "area": "JavaScript Promises",
      "tip": "Review Async/Await syntax and resolve/reject handling with hands-on practice.",
      "resourceUrl": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise"
    }
  ]
}

Return ONLY valid JSON. Do not write any explanations before or after.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a professional technical interviewer helper. Always respond in JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    const jsonText = response.choices[0].message.content.trim();
    const result = JSON.parse(jsonText);

    res.json(result);
  } catch (err) {
    console.error('[summarizeMcqs Error]:', err);
    res.status(500).json({ message: 'Failed to generate AI summary: ' + err.message });
  }
};

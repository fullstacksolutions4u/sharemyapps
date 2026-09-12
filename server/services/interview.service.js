const interviewRepo = require('../repositories/interview.repository');
const { sendInterviewTipsEmail } = require('../utils/email');
const OpenAI = require('openai');

const DEFAULT_SECTIONS = [
  { title: 'Frontend', rating: 3, notes: '' },
  { title: 'Backend',  rating: 3, notes: '' },
];

class InterviewService {
  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  async listSessions(options) {
    const filter = {};
    if (options.userId) filter.user = options.userId;
    if (options.vacancyId) filter.vacancy = options.vacancyId;
    if (options.unassigned) filter.user = null;
    if (options.shared !== undefined) filter.sharedWithCandidate = options.shared;
    if (options.date) {
      const d = new Date(options.date);
      filter.interviewedAt = {
        $gte: new Date(d.setHours(0, 0, 0, 0)),
        $lte: new Date(d.setHours(23, 59, 59, 999)),
      };
    }
    if (options.minRating || options.maxRating) {
      filter.overallRating = {};
      if (options.minRating) filter.overallRating.$gte = options.minRating;
      if (options.maxRating) filter.overallRating.$lte = options.maxRating;
    }

    const skip = (options.page - 1) * options.limit;
    const { sessions, total } = await interviewRepo.getSessions(filter, skip, options.limit);
    return { sessions, total, page: options.page, pages: Math.ceil(total / options.limit) };
  }

  async getUserSessions(userId) {
    return await interviewRepo.getUserSessions(userId);
  }

  async createGeneralSession(adminId, data) {
    const { googleMeetLink, status, interviewedAt, user, vacancy } = data;

    let sessionNumber;
    if (user) {
      const userExists = await interviewRepo.findUserById(user);
      if (!userExists) {
        const err = new Error('User not found'); err.status = 404; throw err;
      }
      const lastUserSession = await interviewRepo.getLastUserSession(user);
      sessionNumber = (lastUserSession?.sessionNumber || 0) + 1;
    } else {
      const lastSession = await interviewRepo.getLastSession();
      sessionNumber = (lastSession?.sessionNumber || 0) + 1;
    }

    const session = await interviewRepo.createSession({
      user:          user || null,
      evaluatedBy:   adminId,
      vacancy:       vacancy || null,
      sessionNumber,
      overallRating: 5,
      googleMeetLink: googleMeetLink ?? '',
      status:        status ?? 'scheduled',
      sections:      DEFAULT_SECTIONS,
      interviewedAt: interviewedAt ? new Date(interviewedAt) : new Date(),
    });

    return await interviewRepo.findSessionById(session._id);
  }

  async createSession(adminId, userId, data) {
    const user = await interviewRepo.findUserById(userId);
    if (!user) {
      const err = new Error('User not found'); err.status = 404; throw err;
    }

    const lastSession = await interviewRepo.getLastUserSession(userId);
    const sessionNumber = (lastSession?.sessionNumber || 0) + 1;

    const {
      overallRating, headline, summary, googleMeetLink, status,
      sections, pros, cons, improvementTips, interviewedAt, mcqAssessments, vacancy
    } = data;

    const session = await interviewRepo.createSession({
      user:          userId,
      evaluatedBy:   adminId,
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

    return await interviewRepo.findSessionById(session._id);
  }

  async updateSession(sessionId, data) {
    const { user, overallRating, headline, summary, googleMeetLink, status, sections, pros, cons, improvementTips, interviewedAt, mcqAssessments, vacancy } = data;

    const updates = { overallRating, headline, summary, googleMeetLink, status, sections, pros, cons, improvementTips, interviewedAt, mcqAssessments };
    if (vacancy !== undefined) updates.vacancy = vacancy || null;
    
    if (user !== undefined) {
      updates.user = user || null;
      if (user) {
        const existing = await interviewRepo.findSessionByIdLean(sessionId);
        if (!existing?.user) {
          const lastSession = await interviewRepo.getLastUserSession(user);
          updates.sessionNumber = (lastSession?.sessionNumber || 0) + 1;
        }
      }
    }

    const session = await interviewRepo.updateSession(sessionId, updates);
    if (!session) {
      const err = new Error('Session not found'); err.status = 404; throw err;
    }
    return session;
  }

  async deleteSession(sessionId) {
    const session = await interviewRepo.deleteSession(sessionId);
    if (!session) {
      const err = new Error('Session not found'); err.status = 404; throw err;
    }
    return { message: 'Deleted' };
  }

  async shareWithCandidate(sessionId) {
    const session = await interviewRepo.findSessionById(sessionId);
    if (!session) {
      const err = new Error('Session not found'); err.status = 404; throw err;
    }
    if (!session.user) {
      const err = new Error('Session has no applicant assigned'); err.status = 400; throw err;
    }

    session.sharedWithCandidate = true;
    session.sharedWithCandidateAt = new Date();
    await interviewRepo.saveSession(session);

    const u = session.user;
    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

    await interviewRepo.createNotification({
      user:    u._id,
      type:    'interview_feedback',
      title:   `Your Interview Feedback is Ready 🎯`,
      message: `Session #${session.sessionNumber} feedback has been shared with you. Check your dashboard for personalised improvement tips!`,
    });

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

    return session;
  }

  async getMyFeedback(userId) {
    return await interviewRepo.getMyFeedback(userId);
  }

  async summarizeMcqs(data) {
    if (!this.openai) {
      const err = new Error('OpenAI API key is not configured on the server.'); err.status = 500; throw err;
    }

    const { mcqAssessments, candidateName, interviewerComments } = data;
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

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a professional technical interviewer helper. Always respond in JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    const jsonText = response.choices[0].message.content.trim();
    return JSON.parse(jsonText);
  }
}

module.exports = new InterviewService();

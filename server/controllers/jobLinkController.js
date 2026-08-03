const JobLink = require('../models/JobLink');
const JobLinkFeedback = require('../models/JobLinkFeedback');
const CompanyContact = require('../models/CompanyContact');
const OpenAI = require('openai');
const { sendJobLinkRejectedEmail, sendJobLinkUnlockedEmail } = require('../utils/email');
const { getCurrentWeekStartMonday6AM } = require('../utils/weekBoundary');

const FREE_APPLY_LIMIT = 2;

function calculateExpirationDate(postedDate) {
  const defaultExp = Date.now() + 5 * 24 * 60 * 60 * 1000;
  if (!postedDate || typeof postedDate !== 'string') return new Date(defaultExp);
  
  const parsed = new Date(`${postedDate} ${new Date().getFullYear()}`);
  if (isNaN(parsed.getTime())) return new Date(defaultExp);
  
  return new Date(parsed.getTime() + 5 * 24 * 60 * 60 * 1000);
}

function weekStart() {
  return getCurrentWeekStartMonday6AM();
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeJobUrl(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  try {
    const parsed = new URL(trimmed);
    parsed.hash = '';
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, '') || '';
    return `${host}${path}${parsed.search}`.toLowerCase();
  } catch {
    return trimmed.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '').toLowerCase();
  }
}

function titlesMatch(a, b) {
  const na = (a || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const nb = (b || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

function companiesMatch(a, b) {
  const na = (a || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const nb = (b || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

function findDuplicateAgainstList({ url, title, company, excludeId, approvedLinks, vacancyMatch }) {
  const normUrl = normalizeJobUrl(url);
  let urlMatch = null;
  let companyTitleMatch = null;

  for (const existing of approvedLinks) {
    if (excludeId && existing._id.toString() === excludeId.toString()) continue;

    if (normUrl && normalizeJobUrl(existing.url) === normUrl) {
      urlMatch = existing;
    }
    if (titlesMatch(title, existing.title) && companiesMatch(company, existing.company)) {
      companyTitleMatch = existing;
    }
    if (urlMatch && companyTitleMatch) break;
  }

  const matched = urlMatch || companyTitleMatch || vacancyMatch || null;
  if (!matched) {
    return { isDuplicate: false, duplicateReason: null, matchedJob: null };
  }

  const reasons = [];
  if (urlMatch) reasons.push('url');
  if (companyTitleMatch) reasons.push('company_title');
  if (vacancyMatch && matched === vacancyMatch) reasons.push('vacancy');

  return {
    isDuplicate: true,
    duplicateReason: reasons.join('+') || 'match',
    matchedJob: {
      _id: matched._id,
      title: matched.title || '',
      company: matched.company || '',
      url: matched.url || '',
      status: matched.status || 'approved',
      source: vacancyMatch && matched === vacancyMatch ? 'vacancy' : 'job_link',
    },
  };
}

const APPLY_INSTRUCTION =
  'Get 2 free job applies each week. Share at least 1 job post per week with the community to unlock unlimited applies.';

/**
 * Apply Now rules for Job Post Links:
 * - 2 free Apply Now clicks per rolling 7-day week without contributing
 * - To apply to more, user needs ≥1 approved or access_granted contribution in the last 7 days
 * - Re-opening an already-clicked link is always allowed
 * - Does NOT apply to Our Client Vacancies or Freelance
 */
async function getJobLinkApplyEligibility(userId) {
  const since = weekStart();

  const [clickedDocs, weeklyApplyDocs, weeklyApprovedCount, pendingContributionCount] = await Promise.all([
    JobLink.find({ clicks: userId }).select('_id').lean(),
    JobLink.find({
      clickEvents: { $elemMatch: { user: userId, at: { $gte: since } } },
    }).select('_id').lean(),
    JobLink.countDocuments({
      createdBy: userId,
      status: { $in: ['approved', 'access_granted'] },
      $or: [
        { approvedAt: { $gte: since } },
        { $and: [{ approvedAt: { $exists: false } }, { updatedAt: { $gte: since } }] },
      ],
    }),
    JobLink.countDocuments({ createdBy: userId, status: 'pending' }),
  ]);

  const clickedIds = clickedDocs.map((d) => d._id.toString());
  const weeklyApplyCount = weeklyApplyDocs.length;
  const hasWeeklyContribution = weeklyApprovedCount > 0;
  const pendingContribution = pendingContributionCount > 0;
  const canApplyMore = hasWeeklyContribution || weeklyApplyCount < FREE_APPLY_LIMIT;

  return {
    canApplyMore,
    hasWeeklyContribution,
    pendingContribution,
    freeApplyUsed: weeklyApplyCount >= FREE_APPLY_LIMIT,
    applyCount: weeklyApplyCount,
    freeApplyLimit: FREE_APPLY_LIMIT,
    clickedIds,
    message: canApplyMore ? null : APPLY_INSTRUCTION,
    instruction: APPLY_INSTRUCTION,
  };
}

exports.getJobLinkApplyEligibility = async (req, res) => {
  try {
    const eligibility = await getJobLinkApplyEligibility(req.user._id);
    res.json({ success: true, data: eligibility });
  } catch (error) {
    console.error('Error fetching job link apply eligibility:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getJobLinks = async (req, res) => {
  try {
    const activeThreshold = new Date();
    activeThreshold.setDate(activeThreshold.getDate() - 15);
    activeThreshold.setHours(0, 0, 0, 0);

    const jobLinks = await JobLink.find({
      status: 'approved',
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: { $exists: false }, createdAt: { $gte: activeThreshold } }
      ]
    })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name avatar profileImage designations linkedinUrl')
      .lean();

    res.json({ success: true, data: jobLinks });
  } catch (error) {
    console.error('Error fetching job links:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createJobLink = async (req, res) => {
  try {
    const { url, platform } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required.' });
    }

    const jobLink = await JobLink.create({
      url,
      platform: platform || 'other',
      createdBy: req.user._id,
      status: 'pending'
    });

    const populatedLink = await JobLink.findById(jobLink._id)
      .populate('createdBy', 'name avatar profileImage designations linkedinUrl')
      .lean();

    res.json({ success: true, data: populatedLink });
  } catch (error) {
    console.error('Error creating job link:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAdminJobLinks = async (req, res) => {
  try {
    const jobLinks = await JobLink.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email avatar profileImage')
      .populate('clicks', 'name email')
      .lean();
    res.json({ success: true, data: jobLinks });
  } catch (error) {
    console.error('Error fetching admin job links:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createAdminJobLink = async (req, res) => {
  try {
    const { url, title, company, postedDate, workMode, location, platform, experience, state } = req.body;

    if (!url || !title || !workMode) {
      return res.status(400).json({ success: false, message: 'URL, Designation, and Work Mode are required' });
    }

    const jobLink = await JobLink.create({
      url,
      title,
      company: company || '',
      postedDate: postedDate || '',
      workMode,
      location,
      experience: experience || '',
      state: state || '',
      expiresAt: calculateExpirationDate(postedDate),
      approvedAt: new Date(),
      platform: platform || 'other',
      createdBy: req.user._id,
      status: 'approved'
    });

    const populatedLink = await JobLink.findById(jobLink._id)
      .populate('createdBy', 'name email avatar profileImage')
      .lean();

    res.json({ success: true, data: populatedLink });
  } catch (error) {
    console.error('Error creating admin job link:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateJobLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, title, company, postedDate, workMode, location, url, experience, state } = req.body;

    const link = await JobLink.findById(id);
    if (!link) {
      return res.status(404).json({ success: false, message: 'Job link not found' });
    }

    const prevStatus = link.status;
    if (status) {
      link.status = status;
      if (status === 'approved') {
        link.expiresAt = calculateExpirationDate(postedDate !== undefined ? postedDate : link.postedDate);
        if (prevStatus !== 'approved' || !link.approvedAt) {
          link.approvedAt = new Date();
        }
      } else if (status === 'access_granted') {
        // Credit contributor for Apply Now unlock; do not list publicly
        if (prevStatus !== 'access_granted' || !link.approvedAt) {
          link.approvedAt = new Date();
        }
      }
    }
    if (title !== undefined) link.title = title;
    if (company !== undefined) link.company = company;
    if (postedDate !== undefined) link.postedDate = postedDate;
    if (workMode !== undefined) link.workMode = workMode;
    if (location !== undefined) link.location = location;
    if (url !== undefined) link.url = url;
    if (experience !== undefined) link.experience = experience;
    if (state !== undefined) link.state = state;
    if (req.body.adminNote !== undefined) link.adminNote = req.body.adminNote;

    await link.save();

    const unlockedNow =
      (status === 'approved' || status === 'access_granted') &&
      prevStatus !== status &&
      link.createdBy;

    if (unlockedNow) {
      const User = require('../models/User');
      const user = await User.findById(link.createdBy);
      if (user && user.email) {
        const weekStartAt = weekStart();
        const alreadySentThisWeek =
          user.jobLinkUnlockEmailSentAt &&
          user.jobLinkUnlockEmailSentAt >= weekStartAt;

        if (!alreadySentThisWeek) {
          try {
            await sendJobLinkUnlockedEmail({
              to: user.email,
              name: user.name,
              linkUrl: link.url,
              title: link.title,
              company: link.company,
              unlockType: status,
            });
            user.jobLinkUnlockEmailSentAt = new Date();
            await user.save();
          } catch (err) {
            console.error('Error sending job link unlock email:', err);
          }
        }
      }
    }

    if (status === 'rejected' && prevStatus !== 'rejected' && link.createdBy) {
      const User = require('../models/User');
      const user = await User.findById(link.createdBy);
      if (user && user.email) {
        await sendJobLinkRejectedEmail({
          to: user.email,
          name: user.name,
          linkUrl: link.url,
          adminNote: link.adminNote
        }).catch(err => console.error('Error sending rejection email:', err));
      }
    }

    res.json({ success: true, data: link });
  } catch (error) {
    console.error('Error updating job link:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.extractJobDetails = async (req, res) => {
  try {
    const { text, url, excludeId } = req.body;

    if (!text || text.trim().length < 30) {
      return res.status(400).json({ success: false, message: 'Please paste more job description content.' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ success: false, message: 'OpenAI API key is not configured.' });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const existingApproved = await JobLink.find({ status: 'approved' })
      .select('title company url status createdAt')
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();

    const existingCatalog = existingApproved
      .slice(0, 80)
      .map((j, i) => `${i + 1}. ${j.title || 'Untitled'} @ ${j.company || 'Unknown'} | ${j.url || ''}`)
      .join('\n');

    const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const prompt = `You are a job description parser and duplicate detector for an admin job-links tool.
Extract structured information for all job positions/openings in the content. If multiple positions are mentioned, extract each as a separate item in "jobs".
CURRENT DATE: ${currentDate}

ALREADY APPROVED / LISTED JOB POSTS (use these to flag duplicates — same company+role or same opening even if wording differs):
${existingCatalog || '(none yet)'}

Return ONLY a valid JSON object with a single "jobs" key containing an array of objects (no markdown, no explanation, just raw JSON):
{
  "jobs": [
    {
      "title": "most relevant job designation/role (e.g. Full Stack Developer, React Developer, Backend Engineer, AWS DevOps Engineer, Project Manager, Node.js Developer)",
      "company": "company name if mentioned, if an email ID is present extract the company name from the domain name (e.g., from name@example.com extract 'Example', remove common extensions like .com, .in, .net), else empty string",
      "postedDate": "job posting date if mentioned. If relative (e.g. '1w', '2d'), calculate the exact date based on CURRENT DATE and output in 'Month DD' format (e.g. 'July 21'). Else empty string",
      "workMode": "one of: Remote, Onsite, Hybrid — infer from context if not explicitly stated",
      "location": "city and state/country if mentioned. For Indian cities, use the state name instead of 'India' (e.g. 'Jaipur, Rajasthan', 'Bengaluru, Karnataka', 'Mumbai, Maharashtra', 'Hyderabad, Telangana'). For non-Indian locations use city and country. Else empty string.",
      "state": "the Indian state name — ONLY fill if there is exactly ONE clear Indian city or area mentioned (e.g. 'Bengaluru' → 'Karnataka', 'Hyderabad' → 'Telangana'). If a non-Indian country/city is mentioned (e.g. 'USA', 'London'), return 'Out of India'. If multiple locations are mentioned, or if the location is Remote, return empty string.",
      "experience": "experience requirement as a short string (e.g. 2-4 years, 3+ years), else empty string",
      "email": "any email address found in the job posting (e.g. hr@company.com), else empty string",
      "aiLikelyDuplicate": true or false — true if this opening clearly matches an ALREADY APPROVED listing above (same company + same/similar role, or same job post),
      "aiDuplicateNote": "short reason if aiLikelyDuplicate is true (e.g. 'Same as listed: React Developer @ Matrix Marketers'), else empty string"
    }
  ]
}

Job posting content:
${text.slice(0, 4000)}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1600,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '';

    // Strip markdown code fences if present
    const cleaned = responseText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    let extracted;
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({ success: false, message: 'AI returned unexpected format. Please try again.' });
    }

    let jobList = [];
    if (extracted.jobs && Array.isArray(extracted.jobs)) {
      jobList = extracted.jobs;
    } else if (Array.isArray(extracted)) {
      jobList = extracted;
    } else {
      jobList = [extracted];
    }

    const Vacancy = require('../models/Vacancy');
    const processedJobs = [];
    for (const job of jobList) {
      const jobCompany = job.company || '';
      const jobTitle = job.title || '';
      const jobEmail = job.email || '';
      const aiLikelyDuplicate = Boolean(job.aiLikelyDuplicate);
      const aiDuplicateNote = (job.aiDuplicateNote || '').trim();

      let vacancyMatch = null;
      if (jobCompany && jobTitle) {
        vacancyMatch = await Vacancy.findOne({
          company: new RegExp(escapeRegExp(jobCompany.trim()), 'i'),
          title: new RegExp(escapeRegExp(jobTitle.trim()), 'i'),
          status: { $in: ['active', 'pending'] },
        }).select('title company status').lean();
      }

      const dbMatch = findDuplicateAgainstList({
        url,
        title: jobTitle,
        company: jobCompany,
        excludeId,
        approvedLinks: existingApproved,
        vacancyMatch,
      });

      const isDuplicate = dbMatch.isDuplicate || aiLikelyDuplicate;
      let duplicateReason = dbMatch.duplicateReason;
      if (aiLikelyDuplicate && !duplicateReason) duplicateReason = 'ai';
      else if (aiLikelyDuplicate && duplicateReason) duplicateReason = `${duplicateReason}+ai`;

      if (jobCompany) {
        const companyName = jobCompany.trim();
        try {
          const updateDoc = {};
          if (jobEmail) {
            updateDoc.$addToSet = { emails: jobEmail.trim().toLowerCase() };
          }
          await CompanyContact.findOneAndUpdate(
            { name: { $regex: new RegExp(`^${escapeRegExp(companyName)}$`, 'i') } },
            { 
              $setOnInsert: { name: companyName },
              ...updateDoc
            },
            { upsert: true, new: true }
          );
        } catch (err) {
          console.error('Error saving company contact:', err);
        }
      }

      processedJobs.push({
        title: jobTitle,
        company: jobCompany,
        postedDate: job.postedDate || '',
        workMode: ['Remote', 'Onsite', 'Hybrid'].includes(job.workMode) ? job.workMode : '',
        location: job.location || '',
        state: job.state || '',
        experience: job.experience || '',
        email: jobEmail,
        isDuplicate,
        duplicateReason: duplicateReason || null,
        matchedJob: dbMatch.matchedJob,
        aiLikelyDuplicate,
        aiDuplicateNote,
      });
    }

    return res.json({
      success: true,
      data: processedJobs
    });
  } catch (error) {
    console.error('Error extracting job details:', error);
    res.status(500).json({ success: false, message: 'Failed to extract job details. Try again.' });
  }
};

exports.submitFeedback = async (req, res) => {
  try {
    const { heardBack } = req.body;
    const { id: jobLink } = req.params;
    const user = req.user._id;

    if (typeof heardBack !== 'boolean') {
      return res.status(400).json({ success: false, message: 'heardBack must be a boolean' });
    }

    const feedback = await JobLinkFeedback.findOneAndUpdate(
      { user, jobLink },
      { heardBack },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: feedback });
  } catch (error) {
    console.error('Error submitting job link feedback:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAdminFeedback = async (req, res) => {
  try {
    const feedback = await JobLinkFeedback.find()
      .populate('user', 'name email avatar')
      .populate('jobLink', 'title company')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: feedback });
  } catch (error) {
    console.error('Error fetching admin feedback:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAdminCompanies = async (req, res) => {
  try {
    const companies = await CompanyContact.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: companies });
  } catch (error) {
    console.error('Error fetching admin companies:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.recordClick = async (req, res) => {
  try {
    const jobLink = await JobLink.findById(req.params.id);
    if (!jobLink) {
      return res.status(404).json({ success: false, message: 'Job link not found' });
    }
    if (!jobLink.clicks) {
      jobLink.clicks = [];
    }

    const alreadyClicked = jobLink.clicks.some((id) => id.toString() === req.user._id.toString());
    if (alreadyClicked) {
      return res.json({ success: true, message: 'Click already recorded', alreadyClicked: true });
    }

    const eligibility = await getJobLinkApplyEligibility(req.user._id);
    if (!eligibility.canApplyMore) {
      return res.status(403).json({
        success: false,
        code: 'APPLY_LIMIT',
        message: eligibility.message,
        data: eligibility,
      });
    }

    jobLink.clicks.push(req.user._id);
    if (!jobLink.clickEvents) jobLink.clickEvents = [];
    jobLink.clickEvents.push({ user: req.user._id, at: new Date() });
    await jobLink.save();

    const updated = await getJobLinkApplyEligibility(req.user._id);
    res.json({ success: true, message: 'Click recorded successfully', data: updated });
  } catch (error) {
    console.error('Error recording job link click:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

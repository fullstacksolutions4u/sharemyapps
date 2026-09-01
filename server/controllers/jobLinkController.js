const JobLink = require('../models/JobLink');
const { normalizeJobLocation } = require('../utils/indiaLocation');
const JobLinkFeedback = require('../models/JobLinkFeedback');
const CompanyContact = require('../models/CompanyContact');
const OpenAI = require('openai');
const { sendJobLinkRejectedEmail } = require('../utils/email');
const { getCurrentWeekStartMonday6AM } = require('../utils/weekBoundary');
const { hasJobLinkUnlimitedApply } = require('../utils/jobLinkAccess');
const {
  normalizeJobDesignation,
  titlesEquivalent,
  getDesignationPromptBlock,
  postProcessExtractedJob,
} = require('../utils/jobDesignation');

const FREE_APPLY_LIMIT = 3;

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
  return titlesEquivalent(a, b);
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
  'Get 3 free applies weekly. Upgrade to Premium for ₹199/- for unlimited lifetime applies.';

/**
 * Apply Now rules for Job Post Links:
 * - 3 free Apply Now clicks per rolling 7-day week without contributing
 * - To apply to more, user needs ≥1 approved or access_granted contribution in the last 7 days
 * - Re-opening an already-clicked link is always allowed
 * - Does NOT apply to Our Client Vacancies or Freelance
 */
async function getJobLinkApplyEligibility(userId) {
  const since = weekStart();

  const User = require('../models/User');
  const FreeOffer = require('../models/FreeOffer');
  const Plan = require('../models/Plan');
  const [clickedDocs, weeklyApplyDocs, userDoc, freeOfferDoc, planDoc] = await Promise.all([
    JobLink.find({ clicks: userId }).select('_id').lean(),
    JobLink.find({
      clickEvents: { $elemMatch: { user: userId, at: { $gte: since } } },
    }).select('_id').lean(),
    User.findById(userId).select('premiumServices freePremiumGrant').lean(),
    FreeOffer.findOne({ user: userId }).select('_id').lean(),
    Plan.findOne({ name: 'JobLinkUnlimited' }).select('price').lean(),
  ]);

  const hasPremiumServices = hasJobLinkUnlimitedApply(userDoc?.premiumServices);
  const isApplicant = !!freeOfferDoc || !!userDoc?.freePremiumGrant?.granted;
  const isPremium = hasPremiumServices || isApplicant;

  const clickedIds = clickedDocs.map((d) => d._id.toString());
  const weeklyApplyCount = weeklyApplyDocs.length;
  const canApplyMore = isPremium || weeklyApplyCount < FREE_APPLY_LIMIT;

  const dynamicApplyInstruction = `Get 3 free applies weekly. Upgrade to Premium for ₹${planDoc?.price ?? 199}/- for unlimited lifetime applies.`;

  return {
    canApplyMore,
    isPremium,
    freeApplyUsed: weeklyApplyCount >= FREE_APPLY_LIMIT,
    applyCount: weeklyApplyCount,
    freeApplyLimit: FREE_APPLY_LIMIT,
    clickedIds,
    message: canApplyMore ? null : dynamicApplyInstruction,
    instruction: dynamicApplyInstruction,
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

    const normalized = normalizeJobLocation(location, state, '');

    const jobLink = await JobLink.create({
      url,
      title: normalizeJobDesignation(title),
      company: company || '',
      postedDate: postedDate || '',
      workMode,
      location: normalized.location,
      experience: experience || '',
      state: normalized.state,
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
    if (title !== undefined) link.title = normalizeJobDesignation(title);
    if (company !== undefined) link.company = company;
    if (postedDate !== undefined) link.postedDate = postedDate;
    if (workMode !== undefined) link.workMode = workMode;
    if (location !== undefined || state !== undefined) {
      const normalized = normalizeJobLocation(
        location !== undefined ? location : link.location,
        state !== undefined ? state : link.state,
        ''
      );
      link.location = normalized.location;
      link.state = normalized.state;
    }
    if (url !== undefined) link.url = url;
    if (experience !== undefined) link.experience = experience;
    if (req.body.adminNote !== undefined) link.adminNote = req.body.adminNote;

    await link.save();



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
      .map((j, i) => `${i + 1}. ${normalizeJobDesignation(j.title) || 'Untitled'} @ ${j.company || 'Unknown'} | ${j.url || ''}`)
      .join('\n');

    const designationBlock = getDesignationPromptBlock(existingApproved.map((j) => j.title));

    const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const prompt = `You are a job description parser and duplicate detector for an admin job-links tool.
Extract structured information for all job positions/openings in the content. If multiple positions are mentioned, extract each as a separate item in "jobs".
CURRENT DATE: ${currentDate}

${designationBlock}

ALREADY APPROVED / LISTED JOB POSTS (use these to flag duplicates — same company+role or same opening even if wording differs):
${existingCatalog || '(none yet)'}

LOCATION EXTRACTION (critical — used for state filter on user side):
1. If ANY city, town, district, area, or tech park is mentioned, location MUST be "Place, State" for India.
2. Always infer the Indian state: Mohali → Mohali, Punjab | Ernakulam/Infopark/Kochi → Ernakulam, Kerala | Chakan → Chakan, Maharashtra.
3. Never return only the city name for Indian locations (e.g. "Mohali" alone is wrong).
4. Fill the "state" field with the state name whenever location has an Indian place.

Return ONLY a valid JSON object with a single "jobs" key containing an array of objects (no markdown, no explanation, just raw JSON):
{
  "jobs": [
    {
      "title": "Exact job title from the post (e.g. IT Remote Support Engineer). Use a canonical label only when the role clearly matches the list above. Never use Other if a specific role is stated.",
      "company": "company name if mentioned, if an email ID is present extract the company name from the domain name (e.g., from name@example.com extract 'Example', remove common extensions like .com, .in, .net), else empty string",
      "postedDate": "job posting date if mentioned. If relative (e.g. '1w', '2d'), calculate the exact date based on CURRENT DATE and output in 'Month DD' format (e.g. 'July 21'). Else empty string",
      "workMode": "one of: Remote, Onsite, Hybrid — infer from context. Job title 'Remote Support' does NOT mean Remote work mode if a physical office/location is specified (e.g. Infopark → Onsite)",
      "location": "REQUIRED when any city, area, office, or tech park is mentioned. Format MUST be 'Place, State' for India (e.g. 'Ernakulam, Kerala', 'Mohali, Punjab', 'Chakan, Maharashtra', 'Bengaluru, Karnataka'). Always infer the Indian state from the place name — never return only the city (e.g. 'Mohali' alone is WRONG; use 'Mohali, Punjab'). For non-Indian locations use 'City, Country' and set state to 'Out of India'. Empty only if fully remote with no place mentioned.",
      "state": "Indian state name matching the location (e.g. 'Kerala', 'Punjab', 'Maharashtra'). REQUIRED whenever location has an Indian place. Use 'Out of India' for foreign locations. Empty only for Remote or when no location at all.",
      "experience": "experience requirement as a short string (e.g. 2-4 years, 3+ years, Fresher). Put Freshers/Fresher/Entry Level here — not in title",
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
    const sourceText = text.slice(0, 4000);
    const processedJobs = [];
    for (const job of jobList) {
      const processed = postProcessExtractedJob(job, sourceText);
      const jobCompany = processed.company || '';
      const jobTitle = processed.title || '';
      const jobEmail = processed.email || '';
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
        postedDate: processed.postedDate || '',
        workMode: ['Remote', 'Onsite', 'Hybrid'].includes(processed.workMode) ? processed.workMode : '',
        location: processed.location || '',
        state: processed.state || '',
        experience: processed.experience || '',
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

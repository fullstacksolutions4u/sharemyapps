const jobLinkRepo = require('../repositories/jobLink.repository');
const { normalizeJobLocation } = require('../utils/indiaLocation');
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

class JobLinkService {
  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  async getJobLinkApplyEligibility(userId) {
    const since = getCurrentWeekStartMonday6AM();

    const [clickedDocs, weeklyApplyDocs, userDoc, freeOfferDoc, planDoc] = await Promise.all([
      jobLinkRepo.findClickedLinksByUser(userId),
      jobLinkRepo.findWeeklyApplyDocs(userId, since),
      jobLinkRepo.getUser(userId),
      jobLinkRepo.getFreeOfferByUser(userId),
      jobLinkRepo.getPlanByName('JobLinkUnlimited'),
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

  async getJobLinks() {
    const activeThreshold = new Date();
    activeThreshold.setDate(activeThreshold.getDate() - 15);
    activeThreshold.setHours(0, 0, 0, 0);
    return await jobLinkRepo.getActiveJobLinks(activeThreshold);
  }

  async createJobLink(userId, data) {
    const jobLink = await jobLinkRepo.createJobLink({
      ...data,
      createdBy: userId,
      status: 'pending'
    });
    return await jobLinkRepo.findJobLinkByIdPopulated(jobLink._id, 'createdBy', 'name avatar profileImage designations linkedinUrl');
  }

  async getAdminJobLinks() {
    return await jobLinkRepo.getAdminJobLinks();
  }

  async createAdminJobLink(userId, data) {
    const jobLink = await jobLinkRepo.createJobLink({
      ...data,
      expiresAt: calculateExpirationDate(data.postedDate),
      approvedAt: new Date(),
      createdBy: userId,
      status: 'approved'
    });
    return await jobLinkRepo.findJobLinkByIdPopulated(jobLink._id, 'createdBy', 'name email avatar profileImage');
  }

  async updateJobLink(id, data) {
    const link = await jobLinkRepo.findJobLinkById(id);
    if (!link) {
      const err = new Error('Job link not found'); err.status = 404; throw err;
    }

    const prevStatus = link.status;
    const { status, title, company, postedDate, workMode, location, url, experience, state, adminNote } = data;

    if (status) {
      link.status = status;
      if (status === 'approved') {
        link.expiresAt = calculateExpirationDate(postedDate !== undefined ? postedDate : link.postedDate);
        if (prevStatus !== 'approved' || !link.approvedAt) {
          link.approvedAt = new Date();
        }
      } else if (status === 'access_granted') {
        if (prevStatus !== 'access_granted' || !link.approvedAt) {
          link.approvedAt = new Date();
        }
      }
    }
    if (title !== undefined) link.title = title;
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
    if (adminNote !== undefined) link.adminNote = adminNote;

    await jobLinkRepo.saveJobLink(link);

    if (status === 'rejected' && prevStatus !== 'rejected' && link.createdBy) {
      const user = await jobLinkRepo.getUser(link.createdBy);
      if (user && user.email) {
        await sendJobLinkRejectedEmail({
          to: user.email,
          name: user.name,
          linkUrl: link.url,
          adminNote: link.adminNote
        }).catch(err => console.error('Error sending rejection email:', err));
      }
    }

    return link;
  }

  async extractJobDetails(data) {
    if (!this.openai) {
      const err = new Error('OpenAI API key is not configured.'); err.status = 500; throw err;
    }

    const { text, url, excludeId } = data;
    const existingApproved = await jobLinkRepo.findApprovedLinks(300);
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
      "location": "REQUIRED when any city, area, office, or tech park is mentioned. Format MUST be 'Place, State' for India (e.g. 'Ernakulam, Kerala', 'Mohali, Punjab', 'Chakan, Maharashtra', 'Bengaluru, Karnataka'). Always infer the Indian state from the place name — never return only the city (e.g. 'Mohali' alone is WRONG; use 'Mohali, Punjab'). For non-Indian locations use 'City, Country' and set state to 'Out of India'. Empty only if fully remote with no place mentioned. Do NOT append 'Out of India' if the location is just 'Remote'.",
      "state": "Indian state name matching the location (e.g. 'Kerala', 'Punjab', 'Maharashtra'). REQUIRED whenever location has an Indian place. Use 'Out of India' for foreign locations. Empty only for Remote or when no location at all.",
      "experience": "experience requirement as a short string (e.g. 2-4 years, 3+ years, Fresher). Put Freshers/Fresher/Entry Level here — not in title",
      "isInternship": "true or false boolean — true if the job role is explicitly an internship or intern role, else false",
      "email": "any email address found in the job posting (e.g. hr@company.com), else empty string",
      "aiLikelyDuplicate": true or false — true if this opening clearly matches an ALREADY APPROVED listing above (same company + same/similar role, or same job post),
      "aiDuplicateNote": "short reason if aiLikelyDuplicate is true (e.g. 'Same as listed: React Developer @ Matrix Marketers'), else empty string"
    }
  ]
}

Job posting content:
${text.slice(0, 4000)}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1600,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '';
    const cleaned = responseText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    let extracted;
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      const err = new Error('AI returned unexpected format. Please try again.'); err.status = 500; throw err;
    }

    let jobList = [];
    if (extracted.jobs && Array.isArray(extracted.jobs)) {
      jobList = extracted.jobs;
    } else if (Array.isArray(extracted)) {
      jobList = extracted;
    } else {
      jobList = [extracted];
    }

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
        vacancyMatch = await jobLinkRepo.findVacancyMatch(
          new RegExp(escapeRegExp(jobCompany.trim()), 'i'),
          new RegExp(escapeRegExp(jobTitle.trim()), 'i')
        );
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
        try {
          await jobLinkRepo.upsertCompanyContact(jobCompany.trim(), jobEmail ? jobEmail.trim().toLowerCase() : null);
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

    return processedJobs;
  }

  async submitFeedback(userId, jobLinkId, heardBack) {
    return await jobLinkRepo.upsertFeedback(userId, jobLinkId, heardBack);
  }

  async getAdminFeedback() {
    return await jobLinkRepo.getAdminFeedback();
  }

  async getAdminCompanies() {
    return await jobLinkRepo.getAdminCompanies();
  }

  async recordClick(userId, jobLinkId) {
    const jobLink = await jobLinkRepo.findJobLinkById(jobLinkId);
    if (!jobLink) {
      const err = new Error('Job link not found'); err.status = 404; throw err;
    }
    if (!jobLink.clicks) {
      jobLink.clicks = [];
    }

    const alreadyClicked = jobLink.clicks.some((id) => id.toString() === userId.toString());
    if (alreadyClicked) {
      return { message: 'Click already recorded', alreadyClicked: true };
    }

    jobLink.clicks.push(userId);
    if (!jobLink.clickEvents) jobLink.clickEvents = [];
    jobLink.clickEvents.push({ user: userId, at: new Date() });
    await jobLinkRepo.saveJobLink(jobLink);

    const updatedEligibility = await this.getJobLinkApplyEligibility(userId);
    return { message: 'Click recorded successfully', data: updatedEligibility };
  }
}

module.exports = new JobLinkService();

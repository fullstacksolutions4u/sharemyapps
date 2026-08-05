/**
 * Canonical job designations for Job Post Links (aligned with admin dropdown).
 * normalizeJobDesignation() collapses spelling variants to these labels.
 */
const CANONICAL_DESIGNATIONS = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'MERN Stack Developer',
  'MEAN Stack Developer',
  'React Developer',
  'React Native Developer',
  'Node.js Developer',
  'Python Developer',
  'Java Developer',
  'Android Developer',
  'iOS Developer',
  'DevOps Engineer',
  'UI/UX Designer',
  'QA Engineer',
  'Data Scientist',
  'Data Analyst',
  'Product Manager',
  'Other',
];

function normalizeKey(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[.\-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripParentheticals(str) {
  return String(str || '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Remove Junior / Senior / Jr / Sr level prefixes — not part of canonical designation. */
function stripSeniorityPrefix(str) {
  let s = String(str || '').trim();
  const levelPrefix = /^(junior|senior|jr\.?|sr\.?)\s+/i;
  while (levelPrefix.test(s)) {
    s = s.replace(levelPrefix, '').trim();
  }
  return s;
}

/** Collapse spacing variants e.g. "MERNStack" → "mern stack" */
function expandStackTokens(key) {
  return key
    .replace(/\bmernstack\b/g, 'mern stack')
    .replace(/\bmeanstack\b/g, 'mean stack')
    .replace(/\bfullstack\b/g, 'full stack')
    .replace(/\bfrontend\b/g, 'front end')
    .replace(/\bbackend\b/g, 'back end');
}

const ALIAS_TO_CANONICAL = {
  'front end developer': 'Frontend Developer',
  'frontend developer': 'Frontend Developer',
  'full stack developer': 'Full Stack Developer',
  'full stack engineer': 'Full Stack Developer',
  'fullstack developer': 'Full Stack Developer',
  'fullstack engineer': 'Full Stack Developer',
  'mern stack developer': 'MERN Stack Developer',
  'mernstack developer': 'MERN Stack Developer',
  'mean stack developer': 'MEAN Stack Developer',
  'meanstack developer': 'MEAN Stack Developer',
  'react developer': 'React Developer',
  'react js developer': 'React Developer',
  'reactjs developer': 'React Developer',
  'react native developer': 'React Native Developer',
  'node js developer': 'Node.js Developer',
  'nodejs developer': 'Node.js Developer',
  'node developer': 'Node.js Developer',
  'python developer': 'Python Developer',
  'java developer': 'Java Developer',
  'android developer': 'Android Developer',
  'ios developer': 'iOS Developer',
  'devops engineer': 'DevOps Engineer',
  'ui ux designer': 'UI/UX Designer',
  'ui designer': 'UI/UX Designer',
  'ux designer': 'UI/UX Designer',
  'qa engineer': 'QA Engineer',
  'quality assurance engineer': 'QA Engineer',
  'data scientist': 'Data Scientist',
  'data analyst': 'Data Analyst',
  'product manager': 'Product Manager',
};

function stripFresherFromTitle(str) {
  return String(str || '')
    .replace(/\s*[\(\[\-–—]\s*freshers?\s*[\)\]]?\s*$/i, '')
    .replace(/\s+freshers?\s*$/i, '')
    .trim();
}

function cleanExtractedDesignation(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let s = stripSeniorityPrefix(raw.trim());
  s = stripParentheticals(s);
  s = stripFresherFromTitle(s);
  return s.trim();
}

/** Regex fallbacks when AI returns empty / "Other". */
function inferTitleFromText(text) {
  if (!text || typeof text !== 'string') return '';
  const patterns = [
    /(?:we'?re\s+)?hiring:?\s*[🚀\s]*(.+?)(?:!|\n|$)/i,
    /(?:open\s+)?(?:position|role|opening)[:\s]+(.+?)(?:!|\n|$)/i,
    /looking for\s+(?:enthusiastic\s+|talented\s+|skilled\s+)?(.+?)(?:\s+to join|\s+who|\(|!|\n)/i,
    /join our team as\s+(?:a\s+|an\s+)?(.+?)(?:!|\(|\.|\n)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const cleaned = cleanExtractedDesignation(match[1]);
      if (cleaned && cleaned.toLowerCase() !== 'other') return cleaned;
    }
  }
  return '';
}

function inferCompanyFromEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const m = email.match(/@([a-z0-9-]+)\./i);
  if (!m) return '';
  const slug = m[1].replace(/[-_]/g, ' ').trim();
  if (!slug) return '';
  return slug
    .split(/\s+/)
    .map((w) => w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function normalizeExperienceLevel(raw, sourceText = '') {
  let exp = String(raw || '').trim();
  if (/freshers?/i.test(exp)) return 'Fresher';
  if (!exp && /freshers?|recent graduate|entry level/i.test(sourceText)) return 'Fresher';
  return exp;
}

function inferWorkMode({ workMode, location, title, text }) {
  const wm = String(workMode || '').trim();
  const loc = String(location || '').trim();
  const haystack = `${text || ''} ${title || ''}`.toLowerCase();

  // If a physical location is given and it's not "Remote", strongly prefer Onsite
  if (loc && !/^remote$/i.test(loc)) {
    if (/infopark|office|onsite|on-site|on site/i.test(haystack) || loc.includes(',')) {
      if (!wm || wm.toLowerCase() === 'remote') return 'Onsite';
    }
    // A named city/place with no explicit remote/hybrid keyword → default Onsite
    if (!wm || !['Remote', 'Onsite', 'Hybrid'].includes(wm)) {
      if (!/\bhybrid\b/i.test(haystack) && !/\bremote\b/i.test(haystack)) return 'Onsite';
    }
    // AI said Remote but a location is specified → override to Onsite
    if (wm.toLowerCase() === 'remote' && !/\bremote\b.*\b(role|work|position|job)\b/i.test(haystack)) {
      return 'Onsite';
    }
  }
  if (['Remote', 'Onsite', 'Hybrid'].includes(wm)) return wm;
  if (/hybrid/i.test(haystack)) return 'Hybrid';
  if (/\bremote\b/i.test(haystack) && !/remote support|remote engineer/i.test(title || '')) return 'Remote';
  if (/infopark|onsite|on-site|on site/i.test(haystack)) return 'Onsite';
  return wm;
}

function postProcessExtractedJob(job, sourceText) {
  let title = cleanExtractedDesignation(job.title || '');
  if (!title || title.toLowerCase() === 'other') {
    title = inferTitleFromText(sourceText) || title;
  }
  title = normalizeJobDesignation(title);

  let company = String(job.company || '').trim();
  const email = String(job.email || '').trim();
  if (!company && email) company = inferCompanyFromEmail(email);

  const experience = normalizeExperienceLevel(job.experience, sourceText);
  const location = String(job.location || '').trim();
  const workMode = inferWorkMode({
    workMode: job.workMode,
    location,
    title,
    text: sourceText,
  });

  return {
    ...job,
    title,
    company,
    experience,
    workMode,
    location,
  };
}
function normalizeJobDesignation(raw) {
  if (!raw || typeof raw !== 'string') return '';

  const cleaned = cleanExtractedDesignation(raw);
  if (!cleaned) return '';
  if (cleaned.toLowerCase() === 'other') return '';

  const direct = CANONICAL_DESIGNATIONS.find(
    (c) => c.toLowerCase() === cleaned.toLowerCase()
  );
  if (direct && direct !== 'Other') return direct;

  const key = expandStackTokens(normalizeKey(cleaned));

  if (ALIAS_TO_CANONICAL[key]) return ALIAS_TO_CANONICAL[key];

  const compact = key.replace(/\s/g, '');
  for (const canonical of CANONICAL_DESIGNATIONS) {
    if (canonical === 'Other') continue;
    const cKey = normalizeKey(canonical);
    if (key === cKey || compact === cKey.replace(/\s/g, '')) return canonical;
  }

  for (const [alias, canonical] of Object.entries(ALIAS_TO_CANONICAL)) {
    if (compact === alias.replace(/\s/g, '')) return canonical;
  }

  return cleaned;
}

function titlesEquivalent(a, b) {
  const na = normalizeJobDesignation(a);
  const nb = normalizeJobDesignation(b);
  if (!na || !nb) return false;
  return na.toLowerCase() === nb.toLowerCase();
}

function getDesignationPromptBlock(existingTitles = []) {
  const uniqueExisting = [...new Set(
    existingTitles.map((t) => normalizeJobDesignation(t)).filter(Boolean)
  )].slice(0, 40);

  return `
TITLE / DESIGNATION EXTRACTION (critical):
1. Extract the EXACT job title from the post heading or opening line (e.g. "We're Hiring: IT Remote Support Engineer (Freshers)" → title "IT Remote Support Engineer").
2. Put "(Freshers)", "Freshers", "Fresher", "Entry Level" in experience — NOT in title.
3. Do NOT use "Other" when a specific role is stated. Only use "Other" if no role can be determined.
4. For developer roles that match a canonical label below, use that exact string.
5. For non-developer or support roles (IT Support, Remote Support Engineer, HR, etc.), keep the full stated title.

Canonical labels when the role matches:
${CANONICAL_DESIGNATIONS.filter((c) => c !== 'Other').join(' | ')}

Normalization rules (when canonical applies):
- "Front End Developer" → Frontend Developer; "ReactJS Developer" → React Developer
- "MERNStack Developer" → MERN Stack Developer
- Do NOT include Junior/Senior/Jr/Sr in title
- Do NOT append parenthetical tech when a canonical label fits
- Java Lead is separate from Java Developer

EXISTING DESIGNATIONS ALREADY IN USE (reuse exact strings when the role matches):
${uniqueExisting.length ? uniqueExisting.join(', ') : '(none yet)'}
`.trim();
}

module.exports = {
  CANONICAL_DESIGNATIONS,
  normalizeJobDesignation,
  titlesEquivalent,
  getDesignationPromptBlock,
  cleanExtractedDesignation,
  inferTitleFromText,
  postProcessExtractedJob,
};

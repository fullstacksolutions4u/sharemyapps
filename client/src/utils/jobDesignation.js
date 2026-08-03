/** Client-side mirror of server/utils/jobDesignation.js for filter grouping. */
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

function stripSeniorityPrefix(str) {
  let s = String(str || '').trim();
  const levelPrefix = /^(junior|senior|jr\.?|sr\.?)\s+/i;
  while (levelPrefix.test(s)) {
    s = s.replace(levelPrefix, '').trim();
  }
  return s;
}

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

export function normalizeJobDesignation(raw) {
  if (!raw || typeof raw !== 'string') return '';

  const trimmed = raw.trim();
  if (!trimmed) return '';

  const withoutLevel = stripSeniorityPrefix(trimmed);

  const direct = CANONICAL_DESIGNATIONS.find(
    (c) => c.toLowerCase() === withoutLevel.toLowerCase()
  );
  if (direct) return direct;

  const withoutParen = stripParentheticals(withoutLevel);
  const key = expandStackTokens(normalizeKey(withoutParen));

  if (ALIAS_TO_CANONICAL[key]) return ALIAS_TO_CANONICAL[key];

  const compact = key.replace(/\s/g, '');
  for (const canonical of CANONICAL_DESIGNATIONS) {
    const cKey = normalizeKey(canonical);
    if (key === cKey || compact === cKey.replace(/\s/g, '')) return canonical;
  }

  for (const [alias, canonical] of Object.entries(ALIAS_TO_CANONICAL)) {
    if (compact === alias.replace(/\s/g, '')) return canonical;
  }

  return withoutParen || withoutLevel || trimmed;
}

export { CANONICAL_DESIGNATIONS };

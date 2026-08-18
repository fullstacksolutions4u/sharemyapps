const OpenAI = require('openai');

let client = null;
function getClient() {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set');
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

exports.extractJDRequirements = async (jdText) => {
  const response = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 512,
    messages: [
      {
        role: 'system',
        content: 'You extract hiring requirements from job descriptions. Return ONLY valid JSON, no markdown.',
      },
      {
        role: 'user',
        content: `Extract hiring requirements from this job description.
Return ONLY a JSON object with exactly these keys (no markdown, no extra keys):

{
  "skills": ["canonical skill names, max 15"],
  "roles": ["job title keywords, max 5"],
  "level": "junior" | "mid" | "senior" | "any",
  "minYears": <integer or null>,
  "niceToHave": ["bonus/preferred skills, max 8"],
  "locationType": "onsite" | "remote" | "hybrid" | "any",
  "locationCity": "<city name or null>",
  "locationState": "<state/region name or null>"
}

Normalization rules:
- Use "React" not "ReactJS", "Node.js" not "NodeJS", "PostgreSQL" not "Postgres", "TypeScript" not "TS", "JavaScript" not "JS", "MongoDB" not "Mongo", "Next.js" not "NextJS", "Vue.js" not "VueJS", "Express.js" not "Express"
- minYears: extract the minimum years required (e.g. "3+ years" -> 3, "2-4 years" -> 2). Null if not mentioned.
- level: infer from seniority language even if not explicit ("entry-level" -> "junior", "lead" -> "senior").
- locationType: "onsite" if job requires physical presence, "remote" if fully remote, "hybrid" if mixed, "any" if not mentioned.
- locationCity: the city or area name if an onsite/hybrid location is specified (e.g. "Kochi", "Mohali", "Ernakulam"). Null if remote or not mentioned.
- locationState: ALWAYS infer the state/region for the city (e.g. "Kerala" for Kochi/Ernakulam, "Punjab" for Mohali, "Maharashtra" for Pune/Chakan). Never leave null when a place is mentioned.

JD:
${jdText}`,
      },
    ],
  });

  const text = response.choices[0].message.content;
  try {
    const parsed = JSON.parse(text);
    return enrichExtractedLocation(parsed);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    try {
      const parsed = match ? JSON.parse(match[0]) : { skills: [], roles: [], level: 'any', minYears: null, niceToHave: [], locationType: 'any', locationCity: null, locationState: null };
      return enrichExtractedLocation(parsed);
    } catch {
      return { skills: [], roles: [], level: 'any', minYears: null, niceToHave: [], locationType: 'any', locationCity: null, locationState: null };
    }
  }
};

function enrichExtractedLocation(extracted) {
  const { inferStateFromPlace } = require('./indiaLocation');
  const city = extracted.locationCity?.trim() || '';
  let state = extracted.locationState?.trim() || '';
  if (city && !state) {
    state = inferStateFromPlace(city) || '';
    if (state) extracted.locationState = state;
  }
  return extracted;

const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.extractJDRequirements = async (jdText) => {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 256,
    messages: [
      {
        role: 'system',
        content: 'You extract hiring requirements from job descriptions. Return ONLY valid JSON, no markdown.',
      },
      {
        role: 'user',
        content: `Extract requirements from this job description and return JSON with exactly these keys:
- skills: array of tech skills, frameworks, tools (e.g. ["React", "Node.js", "AWS"])
- roles: array of job title keywords (e.g. ["Full Stack Developer", "Backend Engineer"])
- level: one of: junior | mid | senior | any

JD:
${jdText}`,
      },
    ],
  });

  const text = response.choices[0].message.content;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { skills: [], roles: [], level: 'any' };
  }
};

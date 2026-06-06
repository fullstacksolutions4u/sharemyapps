const OpenAI = require('openai');
const Project = require('../models/Project');
const User = require('../models/User');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function buildContext() {
  const [projects, developers, stats] = await Promise.all([
    Project.find()
      .populate('owner', 'name email')
      .select('title description techTags status category appType likes ratings viewCount featured hidden createdAt')
      .sort({ createdAt: -1 })
      .limit(150)
      .lean(),
    User.find({ userType: 'developer', isDeleted: { $ne: true } })
      .select('name email bio designations badge freelanceAvailable mentorshipAvailable place district state country regNumber hidden createdAt resumeData')
      .sort({ createdAt: -1 })
      .limit(150)
      .lean(),
    Promise.all([
      Project.countDocuments({ status: 'approved' }),
      Project.countDocuments({ status: 'pending' }),
      Project.countDocuments({ status: 'rejected' }),
      User.countDocuments({ userType: 'developer', isDeleted: { $ne: true } }),
      User.countDocuments({ userType: 'client', isDeleted: { $ne: true } }),
    ]),
  ]);

  const [approvedCount, pendingCount, rejectedCount, devCount, clientCount] = stats;

  const projectData = projects.map(p => ({
    id: p._id,
    title: p.title,
    description: p.description?.slice(0, 180),
    tech: p.techTags,
    status: p.status,
    category: p.category || null,
    appType: p.appType,
    likes: p.likes?.length || 0,
    avgRating: p.ratings?.length
      ? (p.ratings.reduce((s, r) => s + r.value, 0) / p.ratings.length).toFixed(1)
      : null,
    views: p.viewCount || 0,
    featured: p.featured,
    hidden: p.hidden,
    owner: p.owner?.name || 'Unknown',
    ownerEmail: p.owner?.email || '',
    createdAt: p.createdAt?.toISOString().slice(0, 10),
  }));

  const developerData = developers.map(d => {
    const r = d.resumeData || {};
    const educationInstitutions = (r.education || []).map(e => e.institution).filter(Boolean);
    const allSkills = [
      ...(r.skills?.languages || []),
      ...(r.skills?.frontend || []),
      ...(r.skills?.backend || []),
      ...(r.skills?.databases || []),
      ...(r.skills?.cloud_devops || []),
    ];
    return {
      id: d._id,
      name: d.name,
      email: d.email,
      bio: (r.summary || d.bio || '').slice(0, 200),
      designations: d.designations?.length ? d.designations : [r.title, r.current_role].filter(Boolean),
      badge: d.badge,
      freelanceAvailable: d.freelanceAvailable,
      mentorshipAvailable: d.mentorshipAvailable,
      location: [d.place, d.district, d.state, d.country].filter(Boolean).join(', ')
        || [r.location, r.state, r.country].filter(Boolean).join(', ')
        || 'Not specified',
      regNumber: d.regNumber,
      hidden: d.hidden,
      joinedAt: d.createdAt?.toISOString().slice(0, 10),
      currentCompany: r.current_company || null,
      experienceYears: r.experience_years || null,
      education: educationInstitutions,
      skills: allSkills.slice(0, 20),
      resumeProjects: (r.projects || []).map(p => p.name).slice(0, 5),
    };
  });

  return { projectData, developerData, approvedCount, pendingCount, rejectedCount, devCount, clientCount };
}

exports.aiChat = async (req, res) => {
  const { messages = [] } = req.body;

  if (!messages.length) {
    return res.status(400).json({ message: 'messages array is required' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ message: 'OPENAI_API_KEY is not configured on the server' });
  }

  try {
    const { projectData, developerData, approvedCount, pendingCount, rejectedCount, devCount, clientCount } = await buildContext();

    const systemPrompt = `You are an intelligent admin assistant for ShareMyApps — a platform where developers showcase side projects to clients and recruiters.

You have real-time access to the platform database and can answer any question about projects and developers.

## Platform Summary
- Total developers: ${devCount}
- Total clients: ${clientCount}
- Projects: ${approvedCount} approved, ${pendingCount} pending, ${rejectedCount} rejected

## Projects (${projectData.length} most recent)
${JSON.stringify(projectData)}

## Developers (${developerData.length} most recent)
${JSON.stringify(developerData)}

## Instructions
- Answer questions about specific projects, developers, trends, statistics, or moderation.
- Be concise and accurate.
- NEVER use markdown pipe tables (| col | col |). Instead, present lists of people or projects as numbered entries like:
  1. **Name** — Location · Experience · Company
     Skills: React, Node.js
  or use simple bullet lists with bold labels.
- For stats and counts, use a short bullet summary.
- If asked for a list of people, show each person as a numbered item with key details on separate indented lines.
- If asked about a specific person or project, find them in the data and summarize relevant info.
- Today's date is ${new Date().toISOString().slice(0, 10)}.`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: true,
      max_tokens: 1500,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ message: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
};

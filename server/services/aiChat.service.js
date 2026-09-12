const aiChatRepo = require('../repositories/aiChat.repository');
const OpenAI = require('openai');

class AiChatService {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async buildContext() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [projects, developers, stats] = await Promise.all([
      aiChatRepo.getProjectsForContext(),
      aiChatRepo.getDevelopersForContext(),
      aiChatRepo.getStatsForContext(startOfMonth),
    ]);

    const [approvedCount, pendingCount, rejectedCount, devCount, clientCount, newDevsThisMonth, newProjectsThisMonth, projectsForSale] = stats;

    const projectData = projects.map(p => ({
      title: p.title,
      description: p.description?.slice(0, 150),
      tech: p.techTags,
      status: p.status,
      category: p.category || null,
      appType: p.appType,
      likes: p.likes?.length || 0,
      avgRating: p.ratings?.length
        ? (p.ratings.reduce((s, r) => s + r.value, 0) / p.ratings.length).toFixed(1)
        : null,
      views: p.viewCount || 0,
      featured: p.featured || false,
      hidden: p.hidden || false,
      salePrice: p.salePrice || null,
      owner: p.owner?.name || 'Unknown',
      createdAt: p.createdAt?.toISOString().slice(0, 10),
    }));

    const techFreq = {};
    projects.forEach(p => (p.techTags || []).forEach(t => { techFreq[t] = (techFreq[t] || 0) + 1; }));
    const topTechStacks = Object.entries(techFreq).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([t, c]) => `${t} (${c})`);

    const catFreq = {};
    projects.forEach(p => { if (p.category) catFreq[p.category] = (catFreq[p.category] || 0) + 1; });
    const topCategories = Object.entries(catFreq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([c, n]) => `${c}: ${n}`);

    const topRated = projects
      .filter(p => p.status === 'approved' && p.ratings?.length >= 2)
      .map(p => ({ title: p.title, owner: p.owner?.name, rating: (p.ratings.reduce((s, r) => s + r.value, 0) / p.ratings.length).toFixed(1), views: p.viewCount || 0 }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);

    const locationFreq = {};
    developers.forEach(d => {
      const r = d.resumeData || {};
      const loc = d.state || r.state || d.country || r.country || 'Unknown';
      locationFreq[loc] = (locationFreq[loc] || 0) + 1;
    });
    const topLocations = Object.entries(locationFreq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([l, n]) => `${l}: ${n}`);

    const developerData = developers.map(d => {
      const r = d.resumeData || {};
      const allSkills = [
        ...(r.skills?.languages || []),
        ...(r.skills?.frontend || []),
        ...(r.skills?.backend || []),
        ...(r.skills?.databases || []),
        ...(r.skills?.cloud_devops || []),
      ];
      return {
        name: d.name,
        bio: (r.summary || d.bio || '').slice(0, 150),
        designations: (d.designations?.length ? d.designations : [r.title, r.current_role].filter(Boolean)).slice(0, 3),
        badge: d.badge || null,
        freelanceAvailable: d.freelanceAvailable,
        mentorshipAvailable: d.mentorshipAvailable,
        location: [d.place, d.state, d.country].filter(Boolean).join(', ') || [r.state, r.country].filter(Boolean).join(', ') || 'Not specified',
        joinedAt: d.createdAt?.toISOString().slice(0, 10),
        experienceYears: r.experience_years || null,
        currentCompany: r.current_company || null,
        skills: allSkills.slice(0, 15),
      };
    });

    return {
      projectData, developerData,
      approvedCount, pendingCount, rejectedCount, devCount, clientCount,
      newDevsThisMonth, newProjectsThisMonth, projectsForSale,
      topTechStacks, topCategories, topRated, topLocations,
    };
  }

  async getChatStream(messages) {
    if (!process.env.OPENAI_API_KEY) {
      const err = new Error('OPENAI_API_KEY is not configured on the server');
      err.status = 500;
      throw err;
    }

    const {
      projectData, developerData,
      approvedCount, pendingCount, rejectedCount, devCount, clientCount,
      newDevsThisMonth, newProjectsThisMonth, projectsForSale,
      topTechStacks, topCategories, topRated, topLocations,
    } = await this.buildContext();

    const systemPrompt = `You are an intelligent admin assistant for ShareMyApps — a platform where developers showcase side projects to clients and recruiters.

You have real-time access to the full platform database. Today's date: ${new Date().toISOString().slice(0, 10)}.

## Platform Statistics
- Developers: ${devCount} total (${newDevsThisMonth} joined this month)
- Clients: ${clientCount}
- Projects: ${approvedCount} approved · ${pendingCount} pending · ${rejectedCount} rejected
- Projects listed for sale: ${projectsForSale}
- New projects this month: ${newProjectsThisMonth}

## Top Tech Stacks
${topTechStacks.join(', ')}

## Top Categories
${topCategories.join(' | ')}

## Top Rated Projects
${topRated.map((p, i) => `${i + 1}. ${p.title} by ${p.owner} — ⭐ ${p.rating} · ${p.views} views`).join('\n')}

## Developer Locations
${topLocations.join(' | ')}

## All Projects (${projectData.length})
${JSON.stringify(projectData)}

## All Developers (${developerData.length})
${JSON.stringify(developerData)}

## Response Rules
- Be direct and specific — use actual numbers and names from the data above.
- Never say "I don't have access" if the data exists above; always compute from it.
- For lists use numbered entries with bold names: **1. Name** — detail · detail
- For stats use bullet points with bold labels.
- For single item lookups, give a clear summary paragraph.
- Keep responses concise — no filler phrases like "Great question!" or "I hope this helps".
- NEVER use markdown pipe tables.
- If data genuinely doesn't exist (e.g. gender, age), say so clearly in one line.`;

    return await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: true,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
    });
  }
}

module.exports = new AiChatService();

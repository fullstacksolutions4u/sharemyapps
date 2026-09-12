const showcaseRepo = require('../repositories/showcase.repository');

class ShowcaseService {
  async listShowcases() {
    return await showcaseRepo.listShowcases();
  }

  async createShowcase(userId, data) {
    const payload = {
      title: data.title,
      recruiterName: data.recruiterName || '',
      companyName: data.companyName || '',
      jdNote: data.jdNote || '',
      candidates: data.candidates || [],
      expiresAt: data.expiresAt || null,
      createdBy: userId,
    };
    return await showcaseRepo.createShowcase(payload);
  }

  async updateShowcase(id, data) {
    const page = await showcaseRepo.updateShowcase(id, data);
    if (!page) {
      const err = new Error('Showcase not found'); err.status = 404; throw err;
    }
    return page;
  }

  async deleteShowcase(id) {
    const page = await showcaseRepo.deleteShowcase(id);
    if (!page) {
      const err = new Error('Showcase not found'); err.status = 404; throw err;
    }
    return { message: 'Deleted' };
  }

  async toggleShowcase(id) {
    const page = await showcaseRepo.findShowcaseById(id);
    if (!page) {
      const err = new Error('Showcase not found'); err.status = 404; throw err;
    }
    page.isActive = !page.isActive;
    await showcaseRepo.saveShowcase(page);
    return { isActive: page.isActive };
  }

  async getPublicShowcase(slug) {
    const page = await showcaseRepo.getPublicShowcaseBySlug(slug);
    if (!page) {
      const err = new Error('Showcase not found'); err.status = 404; throw err;
    }
    if (!page.isActive) {
      const err = new Error('This showcase link is no longer active.'); err.status = 410; throw err;
    }
    if (page.expiresAt && new Date() > new Date(page.expiresAt)) {
      const err = new Error('This showcase link has expired.'); err.status = 410; throw err;
    }

    showcaseRepo.incrementViewCount(page._id);

    const users = await showcaseRepo.getCandidates(page.candidates);
    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));
    const orderedUsers = page.candidates.map(id => userMap[id.toString()]).filter(Boolean);

    const sessionMap = {};
    const sessions = await showcaseRepo.getSessions(page.candidates);
    sessions.forEach(s => {
      const uid = s.user.toString();
      if (!sessionMap[uid]) sessionMap[uid] = s;
    });

    const projectMap = {};
    const allProjects = await showcaseRepo.getProjects(page.candidates);
    allProjects.forEach(p => {
      const aid = p.author.toString();
      if (!projectMap[aid]) projectMap[aid] = [];
      if (projectMap[aid].length < 4) projectMap[aid].push(p);
    });

    const candidates = orderedUsers.map(u => ({
      user: u,
      latestSession: sessionMap[u._id.toString()] || null,
      projects: projectMap[u._id.toString()] || [],
    }));

    return {
      title: page.title,
      recruiterName: page.recruiterName,
      companyName: page.companyName,
      jdNote: page.jdNote,
      createdAt: page.createdAt,
      slug: page.slug,
      candidates,
    };
  }
}

module.exports = new ShowcaseService();

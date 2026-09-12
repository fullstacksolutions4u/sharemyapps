const { normalizeJobLocation } = require('../utils/indiaLocation');
const { normalizeJobDesignation } = require('../utils/jobDesignation');

class JobLinkDto {
  static validateCreate(data) {
    const { url, platform } = data;
    if (!url) {
      const err = new Error('URL is required.'); err.status = 400; throw err;
    }
    return { url, platform: platform || 'other' };
  }

  static validateAdminCreate(data) {
    const { url, title, company, postedDate, workMode, location, platform, experience, isInternship, state } = data;
    if (!url || !title || !workMode) {
      const err = new Error('URL, Designation, and Work Mode are required'); err.status = 400; throw err;
    }
    const normalized = normalizeJobLocation(location, state, '');
    return {
      url,
      title: normalizeJobDesignation(title),
      company: company || '',
      postedDate: postedDate || '',
      workMode,
      location: normalized.location,
      experience: experience || '',
      isInternship: Boolean(isInternship),
      state: normalized.state,
      platform: platform || 'other',
    };
  }

  static validateAdminUpdate(data) {
    const { status, title, company, postedDate, workMode, location, url, experience, state, adminNote } = data;
    const update = {};
    if (status !== undefined) update.status = status;
    if (title !== undefined) update.title = normalizeJobDesignation(title);
    if (company !== undefined) update.company = company;
    if (postedDate !== undefined) update.postedDate = postedDate;
    if (workMode !== undefined) update.workMode = workMode;
    if (location !== undefined) update.location = location;
    if (state !== undefined) update.state = state;
    if (url !== undefined) update.url = url;
    if (experience !== undefined) update.experience = experience;
    if (adminNote !== undefined) update.adminNote = adminNote;
    return update;
  }

  static validateExtract(data) {
    const { text, url, excludeId } = data;
    if (!text || text.trim().length < 30) {
      const err = new Error('Please paste more job description content.'); err.status = 400; throw err;
    }
    return { text, url, excludeId };
  }

  static validateFeedback(data) {
    const { heardBack } = data;
    if (typeof heardBack !== 'boolean') {
      const err = new Error('heardBack must be a boolean'); err.status = 400; throw err;
    }
    return { heardBack };
  }
}

module.exports = JobLinkDto;

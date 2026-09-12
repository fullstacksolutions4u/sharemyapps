class AdminDto {
  static validateUpdateProjectStatus(data) {
    const { status, adminNote } = data;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      const err = new Error('Invalid status'); err.status = 400; throw err;
    }
    return { status, adminNote };
  }

  static validateAdminUpdateProject(data) {
    return data;
  }

  static validateAdminUpdateUser(data) {
    return data;
  }

  static validateSetDesignation(data) {
    const raw = data.designations ?? data.designation;
    return (Array.isArray(raw) ? raw : [raw]).map(d => String(d).trim()).filter(Boolean);
  }

  static validateSetBadge(data) {
    const { badge } = data;
    if (!['new_member', 'active', 'top', 'champion'].includes(badge)) {
      const err = new Error('Invalid badge value'); err.status = 400; throw err;
    }
    return badge;
  }

  static validateSetResumeData(data) {
    const { resumeData } = data;
    if (resumeData !== null && typeof resumeData !== 'object') {
      const err = new Error('resumeData must be a JSON object or null'); err.status = 400; throw err;
    }
    return resumeData;
  }

  static validateSendCustomEmail(data) {
    const { subject, body, userIds, templateId } = data;
    return { subject, body, userIds, templateId };
  }

  static validateCreateEmailTemplate(data) {
    const { name, subject, body } = data;
    if (!name?.trim()) { const err = new Error('Template name is required'); err.status = 400; throw err; }
    if (!subject?.trim()) { const err = new Error('Subject is required'); err.status = 400; throw err; }
    if (!body?.trim()) { const err = new Error('Body is required'); err.status = 400; throw err; }
    return { name, subject, body };
  }
}

module.exports = AdminDto;

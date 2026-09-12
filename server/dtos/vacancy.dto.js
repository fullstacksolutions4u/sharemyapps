const parseSkills = (skills) =>
  Array.isArray(skills)
    ? skills.map(s => s.trim()).filter(Boolean)
    : (skills || '').split(',').map(s => s.trim()).filter(Boolean);

class VacancyDto {
  static validateReportVacancy(data) {
    const { company, title, type, salaryRange, description } = data;
    if (!company || !title || !description) {
      const err = new Error('Company, Designation, and Description are required'); err.status = 400; throw err;
    }
    return { company, title, type: type || 'remote', salaryRange, description };
  }

  static validateCreateVacancy(data) {
    const { title, company, description, skills, location, type, industry, jobType, experience, salaryRange, listOnOpportunities, positions } = data;
    return {
      title, company, description,
      skills: parseSkills(skills),
      location, type, industry, jobType, experience, salaryRange,
      listOnOpportunities: listOnOpportunities !== false,
      positions: parseSkills(positions),
    };
  }

  static validateUpdateVacancy(data) {
    const { title, company, description, skills, location, type, industry, jobType, experience, salaryRange, status, positions } = data;
    return {
      title, company, description,
      skills: parseSkills(skills),
      location, type, industry, jobType, experience, salaryRange, status,
      positions: parseSkills(positions),
    };
  }

  static validateReplyToInterest(data) {
    const { userId, message } = data;
    if (!userId || !message?.trim()) {
      const err = new Error('userId and message are required'); err.status = 400; throw err;
    }
    return { userId, message: message.trim() };
  }

  static validateUpdateApplicantStatus(data) {
    const { userId, userIds, status, note } = data;
    if ((!userId && (!userIds || !userIds.length)) || !status) {
      const err = new Error('userId or userIds and status are required'); err.status = 400; throw err;
    }
    return { userId, userIds, status, note };
  }
}

module.exports = VacancyDto;

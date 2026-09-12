class FreelanceOpportunityDto {
  static validateCreate(data) {
    const { title, description, skills, budget, duration, type, status } = data;
    if (!title?.trim() || !description?.trim()) {
      const err = new Error('Title and description are required'); err.status = 400; throw err;
    }
    const skillArr = typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(Boolean) : skills || [];
    return { title, description, skills: skillArr, budget, duration, type, status };
  }

  static validateUpdate(data) {
    const { skills, ...rest } = data;
    const skillArr = typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(Boolean) : skills || [];
    return { ...rest, skills: skillArr };
  }

  static validateReply(data) {
    const { userId, message } = data;
    if (!userId || !message?.trim()) {
      const err = new Error('userId and message required'); err.status = 400; throw err;
    }
    return { userId, message: message.trim() };
  }
}

module.exports = FreelanceOpportunityDto;

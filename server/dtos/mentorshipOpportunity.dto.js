class MentorshipOpportunityDto {
  static validateCreate(data) {
    const { title, description, topics, type, duration, availability, status } = data;
    if (!title?.trim() || !description?.trim()) {
      const err = new Error('Title and description are required'); err.status = 400; throw err;
    }
    const topicArr = typeof topics === 'string' ? topics.split(',').map(s => s.trim()).filter(Boolean) : topics || [];
    return { title, description, topics: topicArr, type, duration, availability, status };
  }

  static validateUpdate(data) {
    const { topics, ...rest } = data;
    const topicArr = typeof topics === 'string' ? topics.split(',').map(s => s.trim()).filter(Boolean) : topics || [];
    return { ...rest, topics: topicArr };
  }

  static validateReply(data) {
    const { userId, message } = data;
    if (!userId || !message?.trim()) {
      const err = new Error('userId and message required'); err.status = 400; throw err;
    }
    return { userId, message: message.trim() };
  }
}

module.exports = MentorshipOpportunityDto;

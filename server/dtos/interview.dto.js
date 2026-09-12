class InterviewDto {
  static validateListOptions(query) {
    const { userId, vacancyId, date, minRating, maxRating, shared, unassigned, page = 1, limit = 30 } = query;
    return {
      userId,
      vacancyId,
      date,
      minRating: minRating ? Number(minRating) : null,
      maxRating: maxRating ? Number(maxRating) : null,
      shared: shared !== undefined ? shared === 'true' : undefined,
      unassigned: unassigned === 'true',
      page: Number(page) || 1,
      limit: Number(limit) || 30
    };
  }

  static validateCreateSession(data) {
    return data;
  }

  static validateUpdateSession(data) {
    return data;
  }

  static validateSummarizeMcqs(data) {
    const { mcqAssessments, candidateName, interviewerComments } = data;
    if (!Array.isArray(mcqAssessments) || mcqAssessments.length === 0) {
      const err = new Error('No MCQ assessments provided.'); err.status = 400; throw err;
    }
    return { mcqAssessments, candidateName, interviewerComments };
  }
}

module.exports = InterviewDto;

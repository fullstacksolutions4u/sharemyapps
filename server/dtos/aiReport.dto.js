class AiReportDto {
  static validateAnalyze(data) {
    const { mcqAssessments, applicantName, jobTitle } = data;
    if (!mcqAssessments || !Array.isArray(mcqAssessments)) {
      const err = new Error('Invalid assessments data'); err.status = 400; throw err;
    }
    return { mcqAssessments, applicantName, jobTitle };
  }
}

module.exports = AiReportDto;

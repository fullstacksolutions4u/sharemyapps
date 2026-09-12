class JDAnalysisDto {
  static validateSaveHistory(data) {
    const { jd, extracted, resultCount, developers } = data;
    if (!jd?.trim()) {
      const err = new Error('jd is required'); err.status = 400; throw err;
    }
    return { jd, extracted, resultCount, developers };
  }
}

module.exports = JDAnalysisDto;

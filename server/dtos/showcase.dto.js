class ShowcaseDto {
  static validateCreate(data) {
    const { title, recruiterName, companyName, jdNote, candidates, expiresAt } = data;
    if (!title) {
      const err = new Error('Title is required');
      err.status = 400;
      throw err;
    }
    return { title, recruiterName, companyName, jdNote, candidates, expiresAt };
  }

  static validateUpdate(data) {
    return data;
  }
}

module.exports = ShowcaseDto;

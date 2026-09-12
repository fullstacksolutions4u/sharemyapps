class AnnouncementDto {
  static validateCreate(data) {
    const { text } = data;
    if (!text?.trim()) {
      const err = new Error('Text required');
      err.status = 400;
      throw err;
    }
    return { text: text.trim() };
  }

  static validateUpdate(data) {
    const { text } = data;
    if (!text?.trim()) {
      const err = new Error('Text required');
      err.status = 400;
      throw err;
    }
    return { text: text.trim() };
  }
}

module.exports = AnnouncementDto;

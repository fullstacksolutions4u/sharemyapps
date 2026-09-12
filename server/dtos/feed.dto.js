class FeedDto {
  static validateComment(data) {
    const { text } = data;
    if (!text || !text.trim()) {
      const err = new Error('Comment text is required');
      err.status = 400;
      throw err;
    }
    return { text: text.trim() };
  }
}

module.exports = FeedDto;

class MessageDto {
  static validateText(data) {
    const text = data.text?.trim();
    if (!text) {
      const err = new Error('Message text required'); err.status = 400; throw err;
    }
    return { text };
  }

  static validateReply(data) {
    const text = data.text?.trim();
    if (!text) {
      const err = new Error('Reply text required'); err.status = 400; throw err;
    }
    return { text };
  }
}

module.exports = MessageDto;

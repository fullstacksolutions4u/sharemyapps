// DTO layer for validating payloads
class ProjectDto {
  static validateCreate(data) {
    const { title, description, liveUrl } = data;
    if (!title || !description || !liveUrl) {
      const err = new Error('Title, description, and live URL are required');
      err.status = 400;
      throw err;
    }
    return data;
  }

  static validateRating(data) {
    const value = parseInt(data.value);
    if (!value || value < 1 || value > 5) {
      const err = new Error('Rating must be 1–5');
      err.status = 400;
      throw err;
    }
    return { value };
  }

  static validateComment(data) {
    const text = data.text?.trim();
    if (!text) {
      const err = new Error('Comment text required');
      err.status = 400;
      throw err;
    }
    return { text };
  }
}

module.exports = ProjectDto;

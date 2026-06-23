import api from './axios';

export const moduleAPI = {
  getAll: () => api.get('/learning-modules'),
  getById: (id) => api.get(`/learning-modules/${id}`),
  getTopicQuizzes: (moduleId, topicId) => api.get(`/learning-modules/${moduleId}/topics/${topicId}/quizzes`),
};

export const progressAPI = {
  getProgress: () => api.get('/learning-progress'),
  toggleTopic: (moduleId, topicId) => api.post('/learning-progress/topic', { moduleId, topicId }),
  submitQuizAttempt: (data) => api.post('/learning-progress/quiz', data),
  getStats: () => api.get('/learning-progress/stats'),
};

export const feedbackAPI = {
  create: (data) => api.post('/learning-feedback', data),
};

const progressRepo = require('../repositories/learningProgress.repository');
const { getUserVisibilityClause } = require('../utils/visibility');
const User = require('../models/User');

class LearningProgressService {
  async getProgress(userId) {
    let progress = await progressRepo.findProgressByUserId(userId);
    if (!progress) {
      progress = await progressRepo.createProgress(userId);
    }
    const user = await progressRepo.findUserById(userId, 'points badges');
    return {
      progress: {
        completedTopics: progress.completedTopics,
        completedModules: progress.completedModules,
        attemptedQuizzes: progress.attemptedQuizzes || []
      },
      userStats: user ? { points: user.points || 0, badges: user.badges || [] } : null
    };
  }

  async toggleTopicCompletion(userReq, data) {
    const { moduleId, topicId } = data;

    if (!userReq) {
      return {
        _unauthenticated: true,
        message: 'Progress tracked locally',
        progress: { completedTopics: [], completedModules: [], attemptedQuizzes: [] },
      };
    }

    const [module, progress, user] = await Promise.all([
      progressRepo.findModuleById(moduleId),
      progressRepo.findProgressByUserId(userReq._id),
      progressRepo.findUserById(userReq._id)
    ]);

    if (!module) {
      const err = new Error('Module not found'); err.status = 404; throw err;
    }

    let progressDoc = progress;
    if (!progressDoc) {
      const LearningProgress = require('../models/LearningProgress');
      progressDoc = new LearningProgress({ userId: userReq._id, completedTopics: [], completedModules: [] });
    }

    const topicIndex = progressDoc.completedTopics.findIndex(
      t => t.moduleId.toString() === moduleId && t.topicId === topicId
    );

    let isCompleted;

    if (topicIndex === -1) {
      const isFirstTopicInModule = progressDoc.completedTopics.filter(t => t.moduleId.toString() === moduleId).length === 0;

      progressDoc.completedTopics.push({ moduleId, topicId, completedAt: new Date() });
      isCompleted = true;

      if (isFirstTopicInModule) {
        progressRepo.createActivity({
          user: userReq._id,
          type: 'MODULE_STARTED',
          module: moduleId,
        }).catch(() => {});
      }
    } else {
      const topicAttempts = (progressDoc.attemptedQuizzes || []).filter(
        q => q.moduleId.toString() === moduleId && q.topicId === topicId
      );
      const correctCount = topicAttempts.filter(q => q.isCorrect).length;
      if (correctCount > 0 && user) {
        const order = module.order || 0;
        const pointsPerCorrect = order <= 10 ? 1 : order <= 20 ? 2 : 3;
        user.points = Math.max(0, (user.points || 0) - correctCount * pointsPerCorrect);
        await progressRepo.saveUser(user);
      }

      if (progressDoc.attemptedQuizzes) {
        progressDoc.attemptedQuizzes = progressDoc.attemptedQuizzes.filter(
          q => !(q.moduleId.toString() === moduleId && q.topicId === topicId)
        );
      }

      progressDoc.completedTopics.splice(topicIndex, 1);
      isCompleted = false;
    }

    const completedModuleTopics = progressDoc.completedTopics.filter(t => t.moduleId.toString() === moduleId);
    if (completedModuleTopics.length === module.topics.length) {
      if (!progressDoc.completedModules.find(m => m.moduleId.toString() === moduleId)) {
        progressDoc.completedModules.push({ moduleId, completedAt: new Date() });
        
        (async () => {
          try {
            const topUsers = await progressRepo.findDevUsersForLeaderboard(
              { role: { $ne: 'admin' }, userType: 'developer', isDeleted: { $ne: true }, hidden: { $ne: true } },
              { points: -1, createdAt: 1 },
              null,
              'points'
            );
            const rank = topUsers.findIndex(u => u._id.toString() === userReq._id.toString()) + 1;
            await progressRepo.createActivity({
              user: userReq._id,
              type: 'MODULE_COMPLETED',
              module: moduleId,
              meta: { score: user?.points || 0, rank: rank > 0 ? rank : null }
            });
          } catch (e) { console.error('Error logging module completion', e); }
        })();
      }
    } else {
      const idx = progressDoc.completedModules.findIndex(m => m.moduleId.toString() === moduleId);
      if (idx > -1) progressDoc.completedModules.splice(idx, 1);
    }

    await progressRepo.saveProgress(progressDoc);

    const isFirstTopic = isCompleted && progressDoc.completedTopics.length === 1;
    const firstTopicMessage = isFirstTopic
      ? '🎯 Great start! Complete quizzes to build your skills and climb the leaderboard. 🏆 Happy learning! 🌟'
      : null;

    return {
      message: isCompleted ? 'Topic marked as completed' : 'Topic marked as incomplete',
      firstTopicMessage,
      progress: {
        completedTopics: progressDoc.completedTopics,
        completedModules: progressDoc.completedModules,
        attemptedQuizzes: progressDoc.attemptedQuizzes || []
      },
      userStats: user ? { points: user.points || 0, badges: user.badges || [], newBadges: [] } : null
    };
  }

  async submitQuizAttempt(userReq, data) {
    const { moduleId, topicId, quizId, isCorrect } = data;

    let progress = await progressRepo.findProgressByUserId(userReq._id);
    if (!progress) {
      const LearningProgress = require('../models/LearningProgress');
      progress = new LearningProgress({ userId: userReq._id, completedTopics: [], completedModules: [], attemptedQuizzes: [] });
    }
    if (!progress.attemptedQuizzes) progress.attemptedQuizzes = [];

    const existing = progress.attemptedQuizzes.find(
      q => q.moduleId.toString() === moduleId && q.topicId === topicId && q.quizId.toString() === quizId
    );
    if (existing) {
      const err = new Error('Quiz already attempted');
      err.status = 400;
      err.data = existing;
      throw err;
    }

    progress.attemptedQuizzes.push({ moduleId, topicId, quizId, isCorrect, attemptedAt: new Date() });
    await progressRepo.saveProgress(progress);

    let pointsAwarded = 0;
    let newBadges = [];

    if (isCorrect) {
      const module = await progressRepo.findModuleById(moduleId);
      if (module) {
        const moduleTitle = module.title || '';
        if (moduleTitle.toLowerCase() === 'html & css') {
          pointsAwarded = 1;
        } else {
          pointsAwarded = 2;
        }

        const userDoc = await progressRepo.findUserById(userReq._id);
        const oldPoints = userDoc.points || 0;
        const newPoints = oldPoints + pointsAwarded;

        let prevRank = 9999;
        let prevRank1User = null;
        try {
          const devFilter = { 
            role: { $ne: 'admin' }, 
            userType: 'developer', 
            isDeleted: { $ne: true }, 
            hidden: { $ne: true }
          };
          const devsBefore = await progressRepo.findDevUsersForLeaderboard(
            devFilter,
            { points: -1, createdAt: 1 },
            null,
            '_id points email name'
          );
          prevRank = devsBefore.findIndex(d => d._id.toString() === userDoc._id.toString()) + 1;
          if (prevRank === 0) prevRank = devsBefore.length + 1;
          prevRank1User = devsBefore[0];
        } catch (err) {
          console.error('[Leaderboard Ranks Before] error:', err);
        }

        userDoc.points = newPoints;

        const oldLevel = Math.floor(oldPoints / 100);
        const newLevel = Math.floor(newPoints / 100);
        if (newLevel > oldLevel) {
          if (!userDoc.badges) userDoc.badges = [];
          for (let i = oldLevel + 1; i <= newLevel; i++) {
            const badgeName = `Level ${i} Badge`;
            if (!userDoc.badges.includes(badgeName)) {
              userDoc.badges.push(badgeName);
              newBadges.push(badgeName);
            }
          }
        }
        await progressRepo.saveUser(userDoc);

        try {
          const devFilter = { 
            role: { $ne: 'admin' }, 
            userType: 'developer', 
            isDeleted: { $ne: true }, 
            hidden: { $ne: true }
          };
          const devsAfter = await progressRepo.findDevUsersForLeaderboard(
            devFilter,
            { points: -1, createdAt: 1 },
            null,
            '_id points email name'
          );
          const newRank = devsAfter.findIndex(d => d._id.toString() === userDoc._id.toString()) + 1;

          const { sendTop10CongratsEmail, sendTop5CongratsEmail, sendRank1Email, sendPushedDownEmail } = require('../utils/email');

          if (prevRank > 10 && newRank <= 10 && newRank > 5) {
            sendTop10CongratsEmail({ to: userDoc.email, name: userDoc.name }).catch(err => console.error('[Leaderboard Email] Top 10 failed:', err));
          }

          if (prevRank > 5 && newRank <= 5 && newRank > 1) {
            if (!userDoc.top5CongratsSent) {
              userDoc.top5CongratsSent = true;
              await progressRepo.saveUser(userDoc);
            }
            sendTop5CongratsEmail({ to: userDoc.email, name: userDoc.name }).catch(err => console.error('[Leaderboard Email] Top 5 failed:', err));
          }

          if (prevRank > 1 && newRank === 1) {
            userDoc.hasRank1Offer = true;
            await progressRepo.saveUser(userDoc);
            sendRank1Email({ to: userDoc.email, name: userDoc.name }).catch(err => console.error('[Leaderboard Email] Rank 1 failed:', err));

            try {
              await progressRepo.createActivity({
                user: userDoc._id,
                type: 'LEADERBOARD_TOP',
                meta: { score: newPoints }
              });
            } catch (err) {
              console.error('[Leaderboard Activity] failed:', err);
            }

            if (prevRank1User && prevRank1User._id.toString() !== userDoc._id.toString()) {
              const currentRankOfPrev1 = devsAfter.findIndex(d => d._id.toString() === prevRank1User._id.toString()) + 1;
              if (currentRankOfPrev1 === 2) {
                sendPushedDownEmail({ to: prevRank1User.email, name: prevRank1User.name }).catch(err => console.error('[Leaderboard Email] Pushed down failed:', err));
              }
            }
          }
        } catch (err) {
          console.error('[Leaderboard Ranks After] error:', err);
        }
      }
    }

    return {
      moduleId, topicId, quizId, isCorrect, pointsAwarded, newBadges
    };
  }

  async getProgressStats(userId) {
    const [progress, allModules] = await Promise.all([
      progressRepo.findProgressByUserId(userId),
      progressRepo.findAllModules()
    ]);
    const totalModules = allModules.length;
    const totalTopics = allModules.reduce((sum, m) => sum + m.topics.length, 0);
    const completedModules = progress ? progress.completedModules.length : 0;
    const completedTopics = progress ? progress.completedTopics.length : 0;
    return {
      totalModules,
      completedModules,
      totalTopics,
      completedTopics,
      moduleProgress: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
      topicProgress: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0
    };
  }

  async getLeaderboard(userReq) {
    const visibility = await getUserVisibilityClause(userReq, User);
    const devFilter = { 
      role: { $ne: 'admin' }, 
      userType: 'developer', 
      isDeleted: { $ne: true },
      ...visibility,
    };

    const topUsers = await progressRepo.findDevUsersForLeaderboard(
      devFilter,
      { points: -1, createdAt: 1 },
      10,
      'name avatar points'
    );

    const leaderboard = topUsers.map((u, i) => ({
      rank: i + 1,
      name: u.name,
      profileImage: u.avatar,
      points: u.points || 0,
      userId: u._id,
    }));

    let userRank = null;
    let userPoints = 0;
    if (userReq) {
      const currentUser = await progressRepo.findUserByIdLean(userReq._id, 'points createdAt hidden');
      userPoints = currentUser?.points || 0;
      if (currentUser) {
        const usersAbove = await progressRepo.countDevUsersForLeaderboard({
          ...devFilter,
          $or: [
            { points: { $gt: userPoints } },
            { points: userPoints, createdAt: { $lt: currentUser.createdAt } },
          ],
        });
        userRank = usersAbove + 1;
      }
    }

    return { leaderboard, userRank, userPoints };
  }
}

module.exports = new LearningProgressService();

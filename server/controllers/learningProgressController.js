const LearningProgress = require('../models/LearningProgress');
const LearningModule = require('../models/LearningModule');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { getUserVisibilityClause } = require('../utils/visibility');

const getProgress = async (req, res) => {
  try {
    let progress = await LearningProgress.findOne({ userId: req.user._id });
    if (!progress) {
      progress = await LearningProgress.create({ userId: req.user._id, completedTopics: [], completedModules: [] });
    }
    const user = await User.findById(req.user._id).select('points badges');
    res.status(200).json({
      success: true,
      progress: {
        completedTopics: progress.completedTopics,
        completedModules: progress.completedModules,
        attemptedQuizzes: progress.attemptedQuizzes || []
      },
      userStats: user ? { points: user.points || 0, badges: user.badges || [] } : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching progress' });
  }
};

const toggleTopicCompletion = async (req, res) => {
  try {
    const { moduleId, topicId } = req.body;
    if (!moduleId || !topicId) {
      return res.status(400).json({ success: false, message: 'Module ID and Topic ID are required' });
    }

    if (!req.user) {
      return res.status(200).json({
        success: true,
        message: 'Progress tracked locally',
        progress: { completedTopics: [], completedModules: [], attemptedQuizzes: [] },
        _unauthenticated: true
      });
    }

    const [module, progress, user] = await Promise.all([
      LearningModule.findById(moduleId).lean(),
      LearningProgress.findOne({ userId: req.user._id }),
      User.findById(req.user._id)
    ]);

    if (!module) return res.status(404).json({ success: false, message: 'Module not found' });

    let progressDoc = progress;
    if (!progressDoc) {
      progressDoc = new LearningProgress({ userId: req.user._id, completedTopics: [], completedModules: [] });
    }

    const topicIndex = progressDoc.completedTopics.findIndex(
      t => t.moduleId.toString() === moduleId && t.topicId === topicId
    );

    let isCompleted;

    if (topicIndex === -1) {
      // Check if this is the first topic in the module
      const isFirstTopicInModule = progressDoc.completedTopics.filter(t => t.moduleId.toString() === moduleId).length === 0;

      progressDoc.completedTopics.push({ moduleId, topicId, completedAt: new Date() });
      isCompleted = true;

      if (isFirstTopicInModule) {
        Activity.create({
          user: req.user._id,
          type: 'MODULE_STARTED',
          module: moduleId,
        }).catch(() => {});
      }
    } else {
      // Deduct points earned from quizzes for this topic
      const topicAttempts = (progressDoc.attemptedQuizzes || []).filter(
        q => q.moduleId.toString() === moduleId && q.topicId === topicId
      );
      const correctCount = topicAttempts.filter(q => q.isCorrect).length;
      if (correctCount > 0 && user) {
        const order = module.order || 0;
        const pointsPerCorrect = order <= 10 ? 1 : order <= 20 ? 2 : 3;
        user.points = Math.max(0, (user.points || 0) - correctCount * pointsPerCorrect);
        await user.save();
      }

      // Remove quiz attempts for this topic
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
        
        // Fetch leaderboard info asynchronously to include in Activity
        (async () => {
          try {
            const topUsers = await User.find({ role: { $ne: 'admin' }, userType: 'developer', isDeleted: { $ne: true }, hidden: { $ne: true } })
              .select('points').sort({ points: -1, createdAt: 1 }).lean();
            const rank = topUsers.findIndex(u => u._id.toString() === req.user._id.toString()) + 1;
            await Activity.create({
              user: req.user._id,
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

    await progressDoc.save();

    const isFirstTopic = isCompleted && progressDoc.completedTopics.length === 1;
    const firstTopicMessage = isFirstTopic
      ? '🎯 Great start! Complete quizzes to build your skills and climb the leaderboard. 🏆 Happy learning! 🌟'
      : null;

    res.status(200).json({
      success: true,
      message: isCompleted ? 'Topic marked as completed' : 'Topic marked as incomplete',
      firstTopicMessage,
      progress: {
        completedTopics: progressDoc.completedTopics,
        completedModules: progressDoc.completedModules,
        attemptedQuizzes: progressDoc.attemptedQuizzes || []
      },
      userStats: user ? { points: user.points || 0, badges: user.badges || [], newBadges: [] } : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error updating progress' });
  }
};

const submitQuizAttempt = async (req, res) => {
  try {
    const { moduleId, topicId, quizId, isCorrect } = req.body;
    if (!moduleId || !topicId || !quizId) {
      return res.status(400).json({ success: false, message: 'Module ID, Topic ID, and Quiz ID are required' });
    }

    let progress = await LearningProgress.findOne({ userId: req.user._id });
    if (!progress) {
      progress = new LearningProgress({ userId: req.user._id, completedTopics: [], completedModules: [], attemptedQuizzes: [] });
    }
    if (!progress.attemptedQuizzes) progress.attemptedQuizzes = [];

    const existing = progress.attemptedQuizzes.find(
      q => q.moduleId.toString() === moduleId && q.topicId === topicId && q.quizId.toString() === quizId
    );
    if (existing) {
      return res.status(400).json({ success: false, message: 'Quiz already attempted', data: existing });
    }

    progress.attemptedQuizzes.push({ moduleId, topicId, quizId, isCorrect, attemptedAt: new Date() });
    await progress.save();

    let pointsAwarded = 0;
    let newBadges = [];

    if (isCorrect) {
      const module = await LearningModule.findById(moduleId);
      if (module) {
        const moduleTitle = module.title || '';
        if (moduleTitle.toLowerCase() === 'html & css') {
          pointsAwarded = 1;
        } else {
          pointsAwarded = 2;
        }

        const userDoc = await User.findById(req.user._id);
        const oldPoints = userDoc.points || 0;
        const newPoints = oldPoints + pointsAwarded;

        // Fetch ranks before saving new points
        let prevRank = 9999;
        let prevRank1User = null;
        try {
          const devFilter = { 
            role: { $ne: 'admin' }, 
            userType: 'developer', 
            isDeleted: { $ne: true }, 
            hidden: { $ne: true }
          };
          const devsBefore = await User.find(devFilter)
            .select('_id points email name')
            .sort({ points: -1, createdAt: 1 })
            .lean();
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
        await userDoc.save();

        // Fetch ranks after saving new points
        try {
          const devFilter = { 
            role: { $ne: 'admin' }, 
            userType: 'developer', 
            isDeleted: { $ne: true }, 
            hidden: { $ne: true }
          };
          const devsAfter = await User.find(devFilter)
            .select('_id points email name')
            .sort({ points: -1, createdAt: 1 })
            .lean();
          const newRank = devsAfter.findIndex(d => d._id.toString() === userDoc._id.toString()) + 1;

          // Event triggers
          const { sendTop10CongratsEmail, sendTop5CongratsEmail, sendRank1Email, sendPushedDownEmail } = require('../utils/email');

          // 1. Enter into Top 10 (prev > 10, new <= 10, and new > 5)
          if (prevRank > 10 && newRank <= 10 && newRank > 5) {
            sendTop10CongratsEmail({ to: userDoc.email, name: userDoc.name }).catch(err => console.error('[Leaderboard Email] Top 10 failed:', err));
          }

          // 3. Enter into Top 5 (prev > 5, new <= 5, and new > 1)
          if (prevRank > 5 && newRank <= 5 && newRank > 1) {
            if (!userDoc.top5CongratsSent) {
              userDoc.top5CongratsSent = true;
              await userDoc.save();
            }
            sendTop5CongratsEmail({ to: userDoc.email, name: userDoc.name }).catch(err => console.error('[Leaderboard Email] Top 5 failed:', err));
          }

          // 3. First ranking (prev > 1, new === 1)
          if (prevRank > 1 && newRank === 1) {
            userDoc.hasRank1Offer = true;
            await userDoc.save();
            sendRank1Email({ to: userDoc.email, name: userDoc.name }).catch(err => console.error('[Leaderboard Email] Rank 1 failed:', err));

            // Generate Leaderboard Top Activity
            try {
              await Activity.create({
                user: userDoc._id,
                type: 'LEADERBOARD_TOP',
                meta: { score: newPoints }
              });
            } catch (err) {
              console.error('[Leaderboard Activity] failed:', err);
            }

            // If someone else was rank 1 before, and they are now rank 2, send them the "down to second" email
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

    res.status(200).json({
      success: true,
      message: 'Quiz attempt recorded',
      data: { moduleId, topicId, quizId, isCorrect, pointsAwarded, newBadges }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error submitting quiz attempt' });
  }
};

const getProgressStats = async (req, res) => {
  try {
    const [progress, allModules] = await Promise.all([
      LearningProgress.findOne({ userId: req.user._id }),
      LearningModule.find()
    ]);
    const totalModules = allModules.length;
    const totalTopics = allModules.reduce((sum, m) => sum + m.topics.length, 0);
    const completedModules = progress ? progress.completedModules.length : 0;
    const completedTopics = progress ? progress.completedTopics.length : 0;
    res.status(200).json({
      success: true,
      stats: {
        totalModules,
        completedModules,
        totalTopics,
        completedTopics,
        moduleProgress: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
        topicProgress: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching statistics' });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const visibility = await getUserVisibilityClause(req.user, User);
    const devFilter = { 
      role: { $ne: 'admin' }, 
      userType: 'developer', 
      isDeleted: { $ne: true },
      ...visibility,
    };

    const topUsers = await User.find(devFilter)
      .select('name avatar points')
      .sort({ points: -1, createdAt: 1 })
      .limit(10)
      .lean();

    const leaderboard = topUsers.map((u, i) => ({
      rank: i + 1,
      name: u.name,
      profileImage: u.avatar,
      points: u.points || 0,
      userId: u._id,
    }));

    let userRank = null;
    let userPoints = 0;
    if (req.user) {
      const currentUser = await User.findById(req.user._id).select('points createdAt hidden').lean();
      userPoints = currentUser?.points || 0;
      if (currentUser) {
        const usersAbove = await User.countDocuments({
          ...devFilter,
          $or: [
            { points: { $gt: userPoints } },
            { points: userPoints, createdAt: { $lt: currentUser.createdAt } },
          ],
        });
        userRank = usersAbove + 1;
      }
    }

    res.status(200).json({ success: true, leaderboard, userRank, userPoints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProgress, toggleTopicCompletion, submitQuizAttempt, getProgressStats, getLeaderboard };

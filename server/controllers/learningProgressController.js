const LearningProgress = require('../models/LearningProgress');
const LearningModule = require('../models/LearningModule');
const User = require('../models/User');

const DAILY_LIMIT = 40;

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
        progress: { completedTopics: [], completedModules: [] },
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
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);
      const todaysCompletions = progressDoc.completedTopics.filter(t => {
        const at = new Date(t.completedAt);
        return at >= todayStart && at < todayEnd;
      }).length;

      if (todaysCompletions >= DAILY_LIMIT) {
        return res.status(400).json({
          success: false,
          message: '⏸️ Daily Limit Reached!',
          dailyLimitExceeded: true,
          limitMessage: `You've already completed ${DAILY_LIMIT} topics today! 🎯\n\nTake time to deeply understand each concept. Quality learning beats quantity every time. Review what you've learned, practice thoroughly, and come back tomorrow with fresh energy! 🌟`
        });
      }

      progressDoc.completedTopics.push({ moduleId, topicId, completedAt: new Date() });
      isCompleted = true;
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
      }
    } else {
      const idx = progressDoc.completedModules.findIndex(m => m.moduleId.toString() === moduleId);
      if (idx > -1) progressDoc.completedModules.splice(idx, 1);
    }

    await progressDoc.save();

    const isFirstTopic = isCompleted && progressDoc.completedTopics.length === 1;
    const firstTopicMessage = isFirstTopic
      ? "🎯 Great start! Earn coins by completing quizzes. Every 100 coins unlocks a new badge! 🏆 Happy learning! 🌟"
      : null;

    res.status(200).json({
      success: true,
      message: isCompleted ? 'Topic marked as completed' : 'Topic marked as incomplete',
      firstTopicMessage,
      progress: {
        completedTopics: progressDoc.completedTopics,
        completedModules: progressDoc.completedModules
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
        const order = module.order || 0;
        pointsAwarded = order <= 10 ? 1 : order <= 20 ? 2 : 3;

        const userDoc = await User.findById(req.user._id);
        const oldPoints = userDoc.points || 0;
        const newPoints = oldPoints + pointsAwarded;
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
    const topUsers = await User.find({ role: { $ne: 'admin' } })
      .select('name profileImage points')
      .sort({ points: -1, createdAt: 1 })
      .limit(20)
      .lean();

    const leaderboard = topUsers.map((u, i) => ({
      rank: i + 1,
      name: u.name,
      profileImage: u.profileImage,
      points: u.points || 0,
      userId: u._id,
    }));

    let userRank = null;
    let userPoints = 0;
    if (req.user) {
      const currentUser = await User.findById(req.user._id).select('points createdAt').lean();
      userPoints = currentUser?.points || 0;
      // Among equal-points users, earlier signup = better rank → newer users rank last
      const usersAbove = await User.countDocuments({
        role: { $ne: 'admin' },
        $or: [
          { points: { $gt: userPoints } },
          // same or no points (null/undefined/0) — use signup date as tiebreaker
          { points: { $not: { $gt: userPoints } }, createdAt: { $lt: currentUser.createdAt } },
        ],
      });
      userRank = usersAbove + 1;
    }

    res.status(200).json({ success: true, leaderboard, userRank, userPoints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProgress, toggleTopicCompletion, submitQuizAttempt, getProgressStats, getLeaderboard };

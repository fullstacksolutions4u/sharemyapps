const userStatsRepo = require('../repositories/userStats.repository');
const { getPremiumAccess } = require('../utils/premiumAccess');
const { buildOverviewActivity } = require('../utils/overviewActivity');
const mongoose = require('mongoose');

class UserStatsService {
  async getCount() {
    return await userStatsRepo.countUsers();
  }

  async getOverviewStats(user) {
    const userId = user._id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { hasAccess: isJobAlertEligible } = await getPremiumAccess(userId);

    const [applicationsCount, jobPostLinksCount, progressDoc, projectsCount, modules, jobAlertCount, activity] = await Promise.all([
      userStatsRepo.countVacanciesApplied(userId),
      userStatsRepo.countJobPostLinks(userObjectId),
      userStatsRepo.getLearningProgress(userId),
      userStatsRepo.countProjectsByOwner(userId),
      userStatsRepo.getActiveLearningModules(),
      isJobAlertEligible ? userStatsRepo.getJobAlertCount(userObjectId) : Promise.resolve(0),
      buildOverviewActivity(userId, userObjectId, isJobAlertEligible),
    ]);

    const coins = user.points || 0;
    const modulesCount = progressDoc?.completedModules?.length || 0;

    const categoriesMap = {
      system_design: ['system design', 'architecture', 'software engineering', 'microservices', 'micro services'],
      frontend: ['frontend framework', 'frontend', 'ui/ux', 'design', 'html', 'css', 'react'],
      backend: ['backend language', 'backend', 'api', 'node', 'express'],
      database: ['database', 'data and analytics', 'sql', 'nosql', 'mongodb'],
      ai: ['artificial intelligence', 'ai', 'machine learning', 'nlp'],
      programming_languages: ['programming language', 'programming languages', 'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'rust', 'go', 'php'],
      dsa: ['dsa', 'data structures', 'algorithms', 'algorithm'],
      mobile_development: ['react native', 'react-native', 'mobile development', 'mobile', 'android', 'ios', 'flutter'],
      others: ['security', 'cyber security', 'data science'],
    };

    const catStats = {
      frontend: { name: 'Frontend', totalTopics: 0, completedTopics: 0 },
      backend: { name: 'Backend', totalTopics: 0, completedTopics: 0 },
      database: { name: 'Database', totalTopics: 0, completedTopics: 0 },
      ai: { name: 'AI', totalTopics: 0, completedTopics: 0 },
      programming_languages: { name: 'Programming languages', totalTopics: 0, completedTopics: 0 },
      dsa: { name: 'DSA', totalTopics: 0, completedTopics: 0 },
      mobile_development: { name: 'Mobile development', totalTopics: 0, completedTopics: 0 },
      system_design: { name: 'System design', totalTopics: 0, completedTopics: 0 },
      others: { name: 'data science, cyber security', totalTopics: 0, completedTopics: 0 },
    };

    const getModuleUiCategory = (mod) => {
      const cat = (mod.category || '').toLowerCase();
      const title = (mod.title || '').toLowerCase();
      const haystack = `${cat} ${title}`;
      let bestKey = 'others';
      let bestLen = -1;
      for (const [uiCat, keywords] of Object.entries(categoriesMap)) {
        for (const kw of keywords) {
          if ((cat.includes(kw) || title.includes(kw) || haystack.includes(kw)) && kw.length > bestLen) {
            bestKey = uiCat;
            bestLen = kw.length;
          }
        }
      }
      return bestKey;
    };

    const completedTopicKeys = new Set(
      (progressDoc?.completedTopics || []).map((t) => `${t.moduleId.toString()}_${t.topicId}`)
    );

    for (const mod of modules) {
      const uiCat = getModuleUiCategory(mod);
      const topicsCount = mod.topics?.length || 0;
      catStats[uiCat].totalTopics += topicsCount;

      for (const topic of mod.topics || []) {
        const key = `${mod._id.toString()}_${topic._id.toString()}`;
        if (completedTopicKeys.has(key)) {
          catStats[uiCat].completedTopics += 1;
        }
      }
    }

    const skillPathStats = Object.values(catStats).map((c) => {
      const progress = c.totalTopics > 0
        ? Math.round((c.completedTopics / c.totalTopics) * 100)
        : 0;
      return {
        name: c.name,
        progress,
        completedTopics: c.completedTopics,
        totalTopics: c.totalTopics,
      };
    });

    return {
      applicationsCount,
      jobPostLinksCount,
      modulesCount,
      coins,
      projectsCount,
      skillPathStats,
      isJobAlertEligible,
      jobAlertCount,
      dailyActivity: activity.dailyActivity,
      monthlyActivity: activity.monthlyActivity,
    };
  }

  async getHeroStats() {
    return await userStatsRepo.getHeroStats();
  }
}

module.exports = new UserStatsService();

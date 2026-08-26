const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sharemyapps')
  .then(async () => {
    const User = require('./models/User');
    const Project = require('./models/Project');

    const skip = 0;
    const limit = 3;

    const allDevs = await User.find(
      {
        role: { $ne: 'admin' },
        isDeleted: { $ne: true },
        hidden: { $ne: true },
        userType: 'developer',
      },
      { password: 0, googleId: 0, adminNote: 0 }
    ).sort({ createdAt: -1 }).lean();

    const allIds = allDevs.map(d => d._id);
    const projects = await Project.find(
      { owner: { $in: allIds }, status: 'approved' },
      { owner: 1, title: 1 }
    ).lean();

    const projectMap = {};
    for (const p of projects) {
      const key = p.owner.toString();
      if (!projectMap[key]) projectMap[key] = [];
      projectMap[key].push(p.title);
    }

    const result = allDevs
      .map(d => ({
        ...d,
        projectNames: projectMap[d._id.toString()] || [],
        projectCount: (projectMap[d._id.toString()] || []).length,
      }))
      .sort((a, b) => {
        if (a.projectCount !== b.projectCount) {
          return b.projectCount - a.projectCount;
        }
        const aHasAv = a.avatar && a.avatar.trim() ? 1 : 0;
        const bHasAv = b.avatar && b.avatar.trim() ? 1 : 0;
        if (aHasAv !== bHasAv) {
          return bHasAv - aHasAv;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
      .slice(skip, skip + limit);

    console.log('Result length:', result.length);
    if (result.length > 0) {
      console.log('Sample result user:', JSON.stringify(result[0], null, 2));
    }
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

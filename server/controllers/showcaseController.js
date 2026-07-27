const ShowcasePage  = require('../models/ShowcasePage');
const InterviewSession = require('../models/InterviewSession');
const User = require('../models/User');
const Project = require('../models/Project');

// ─── Admin CRUD ──────────────────────────────────────────────────────────────

exports.listShowcases = async (req, res) => {
  try {
    const pages = await ShowcasePage.find()
      .populate('createdBy', 'name')
      .populate('candidates', 'name avatar regNumber designations familiarTech')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ pages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createShowcase = async (req, res) => {
  try {
    const { title, recruiterName, companyName, jdNote, candidates, expiresAt } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const page = await ShowcasePage.create({
      title,
      recruiterName: recruiterName || '',
      companyName:   companyName   || '',
      jdNote:        jdNote        || '',
      candidates:    candidates    || [],
      expiresAt:     expiresAt     || null,
      createdBy:     req.user._id,
    });

    await page.populate('createdBy', 'name');
    await page.populate('candidates', 'name avatar regNumber designations familiarTech');

    res.status(201).json({ page });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateShowcase = async (req, res) => {
  try {
    const { title, recruiterName, companyName, jdNote, candidates, expiresAt } = req.body;
    const page = await ShowcasePage.findByIdAndUpdate(
      req.params.id,
      { title, recruiterName, companyName, jdNote, candidates, expiresAt },
      { new: true }
    )
      .populate('createdBy', 'name')
      .populate('candidates', 'name avatar regNumber designations familiarTech');

    if (!page) return res.status(404).json({ message: 'Showcase not found' });
    res.json({ page });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteShowcase = async (req, res) => {
  try {
    const page = await ShowcasePage.findByIdAndDelete(req.params.id);
    if (!page) return res.status(404).json({ message: 'Showcase not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleShowcase = async (req, res) => {
  try {
    const page = await ShowcasePage.findById(req.params.id);
    if (!page) return res.status(404).json({ message: 'Showcase not found' });
    page.isActive = !page.isActive;
    await page.save();
    res.json({ isActive: page.isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Public Recruiter View ────────────────────────────────────────────────────

exports.getPublicShowcase = async (req, res) => {
  try {
    const page = await ShowcasePage.findOne({ slug: req.params.slug }).lean();
    if (!page) return res.status(404).json({ message: 'Showcase not found' });
    if (!page.isActive) return res.status(410).json({ message: 'This showcase link is no longer active.' });
    if (page.expiresAt && new Date() > new Date(page.expiresAt)) {
      return res.status(410).json({ message: 'This showcase link has expired.' });
    }

    // Increment view count (fire and forget)
    ShowcasePage.updateOne({ _id: page._id }, { $inc: { viewCount: 1 } }).catch(() => {});

    // Fetch full user profiles for all candidates
    const users = await User.find({ _id: { $in: page.candidates } })
      .select('name email phone avatar regNumber designations familiarTech bio yearsOfExperience place district state country linkedinUrl githubUrl portfolioUrl cvUrl expectedSalary currentSalary preferredLocations jobMode joiningAvailability resumeData gender')
      .lean();

    // Preserve the order set by admin
    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));
    const orderedUsers = page.candidates
      .map(id => userMap[id.toString()])
      .filter(Boolean);

    // Fetch latest shared interview session per candidate
    const sessionMap = {};
    const sessions = await InterviewSession.find({
      user: { $in: page.candidates },
      sharedWithCandidate: true,
    })
      .sort({ sessionNumber: -1 })
      .lean();

    sessions.forEach(s => {
      const uid = s.user.toString();
      if (!sessionMap[uid]) sessionMap[uid] = s; // take the latest
    });

    // Fetch published projects per candidate (up to 4 each)
    const allProjects = await Project.find({
      author: { $in: page.candidates },
      status: 'approved',
    })
      .select('title description thumbnail category tags likes ratings author')
      .sort({ createdAt: -1 })
      .lean();

    const projectMap = {};
    allProjects.forEach(p => {
      const aid = p.author.toString();
      if (!projectMap[aid]) projectMap[aid] = [];
      if (projectMap[aid].length < 4) projectMap[aid].push(p);
    });

    // Compose candidate objects
    const candidates = orderedUsers.map(u => ({
      user:           u,
      latestSession:  sessionMap[u._id.toString()] || null,
      projects:       projectMap[u._id.toString()] || [],
    }));

    res.json({
      title:         page.title,
      recruiterName: page.recruiterName,
      companyName:   page.companyName,
      jdNote:        page.jdNote,
      createdAt:     page.createdAt,
      slug:          page.slug,
      candidates,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

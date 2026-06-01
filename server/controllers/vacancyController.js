const Vacancy = require('../models/Vacancy');
const Notification = require('../models/Notification');

const parseSkills = (skills) =>
  Array.isArray(skills)
    ? skills.map(s => s.trim()).filter(Boolean)
    : (skills || '').split(',').map(s => s.trim()).filter(Boolean);

// ─── Public / User ────────────────────────────────────────────────────────────

exports.getVacancies = async (req, res) => {
  try {
    const vacancies = await Vacancy.find().sort({ status: 1, createdAt: -1 }); // active first (a < c)
    const userId = req.user?._id?.toString();
    const result = vacancies.map(v => ({
      ...v.toObject(),
      interestCount: v.interests.length,
      interested: userId ? v.interests.some(id => id.toString() === userId) : false,
      interests: undefined,
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.showInterest = async (req, res) => {
  try {
    const vacancy = await Vacancy.findOne({ _id: req.params.id, status: 'active' });
    if (!vacancy) return res.status(404).json({ message: 'Vacancy not found or closed' });
    const userId = req.user._id;
    if (vacancy.interests.some(id => id.toString() === userId.toString())) {
      return res.status(400).json({ message: 'Already interested' });
    }
    vacancy.interests.push(userId);
    await vacancy.save();
    res.json({ interested: true, interestCount: vacancy.interests.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.withdrawInterest = async (req, res) => {
  try {
    const vacancy = await Vacancy.findOne({ _id: req.params.id, status: 'active' });
    if (!vacancy) return res.status(404).json({ message: 'Vacancy not found or closed' });
    vacancy.interests = vacancy.interests.filter(id => id.toString() !== req.user._id.toString());
    await vacancy.save();
    res.json({ interested: false, interestCount: vacancy.interests.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

exports.getAllVacanciesAdmin = async (req, res) => {
  try {
    const vacancies = await Vacancy.find()
      .sort({ createdAt: -1 })
      .populate('interests', 'name email regNumber userType avatar');
    res.json(vacancies);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createVacancy = async (req, res) => {
  try {
    const { title, company, description, skills, location, type, industry, jobType, salaryRange } = req.body;
    const vacancy = await Vacancy.create({
      title, company, description,
      skills: parseSkills(skills),
      location, type, industry, jobType, salaryRange,
      createdBy: req.user._id,
    });
    res.status(201).json(vacancy);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.updateVacancy = async (req, res) => {
  try {
    const { title, company, description, skills, location, type, industry, jobType, salaryRange, status } = req.body;
    const vacancy = await Vacancy.findByIdAndUpdate(
      req.params.id,
      { title, company, description, skills: parseSkills(skills), location, type, industry, jobType, salaryRange, status },
      { new: true, runValidators: true }
    ).populate('interests', 'name email regNumber userType avatar');
    if (!vacancy) return res.status(404).json({ message: 'Vacancy not found' });
    res.json(vacancy);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.replyToInterest = async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message?.trim()) {
      return res.status(400).json({ message: 'userId and message are required' });
    }
    const vacancy = await Vacancy.findById(req.params.id);
    if (!vacancy) return res.status(404).json({ message: 'Vacancy not found' });

    const hasInterest = vacancy.interests.some(id => id.toString() === userId);
    if (!hasInterest) return res.status(400).json({ message: 'User has not shown interest in this vacancy' });

    await Notification.create({
      user: userId,
      fromUser: req.user._id,
      type: 'vacancy_reply',
      title: `Admin replied about: ${vacancy.title}`,
      message: message.trim(),
      vacancy: vacancy._id,
    });

    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.toggleVacancyStatus = async (req, res) => {
  try {
    const vacancy = await Vacancy.findById(req.params.id);
    if (!vacancy) return res.status(404).json({ message: 'Vacancy not found' });
    vacancy.status = vacancy.status === 'active' ? 'closed' : 'active';
    await vacancy.save();
    res.json({ status: vacancy.status });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteVacancy = async (req, res) => {
  try {
    const vacancy = await Vacancy.findByIdAndDelete(req.params.id);
    if (!vacancy) return res.status(404).json({ message: 'Vacancy not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

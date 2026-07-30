const Vacancy = require('../models/Vacancy');
const Notification = require('../models/Notification');
const { sendJobApplicationEmail, sendApplicationReviewingEmail } = require('../utils/email');
const User = require('../models/User');

const parseSkills = (skills) =>
  Array.isArray(skills)
    ? skills.map(s => s.trim()).filter(Boolean)
    : (skills || '').split(',').map(s => s.trim()).filter(Boolean);

// ─── Public / User ────────────────────────────────────────────────────────────

exports.getVacancies = async (req, res) => {
  try {
    const vacancies = await Vacancy.find({ createdBy: { $exists: true, $ne: null } }).sort({ status: 1, createdAt: -1 }).limit(200).lean();
    const userId = req.user?._id?.toString();
    const result = vacancies.map(v => ({
      ...v,
      interestCount: v.interests.length,
      interested: userId ? v.interests.some(id => id.toString() === userId) : false,
      applicationStatus: userId && v.applicantStatus && v.applicantStatus[userId] ? v.applicantStatus[userId] : null,
      interests: undefined,
      applicantStatus: undefined,
      applicantStatusHistory: undefined,
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
    const isFirstTime = !vacancy.everApplied.some(id => id.toString() === userId.toString());
    vacancy.interests.push(userId);
    if (isFirstTime) {
      vacancy.everApplied.push(userId);
      if (!vacancy.applicantStatusHistory) vacancy.applicantStatusHistory = new Map();
      vacancy.applicantStatusHistory.set(userId.toString(), [{ status: 'applied', date: new Date() }]);
    }
    await vacancy.save();
    res.json({ interested: true, interestCount: vacancy.interests.length });

    if (isFirstTime) {
      sendJobApplicationEmail({
        to: req.user.email,
        name: req.user.name,
        vacancy,
      }).catch(() => {});
    }
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

exports.reportVacancy = async (req, res) => {
  try {
    const { company, title, type, salaryRange, description } = req.body;
    if (!company || !title || !description) {
      return res.status(400).json({ message: 'Company, Designation, and Description are required' });
    }
    const vacancy = await Vacancy.create({
      title,
      company,
      description,
      type: type || 'remote',
      salaryRange,
      status: 'pending',
      createdBy: req.user._id,
    });
    res.status(201).json(vacancy);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// ─── Admin ────────────────────────────────────────────────────────────────────

exports.getAllVacanciesAdmin = async (req, res) => {
  try {
    const vacancies = await Vacancy.find()
      .sort({ createdAt: -1 })
      .populate('interests', 'name email phone regNumber userType avatar cvUrl')
      .populate('createdBy', 'name email phone companyName userType')
      .lean();
    res.json(vacancies);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createVacancy = async (req, res) => {
  try {
    const { title, company, description, skills, location, type, industry, jobType, experience, salaryRange } = req.body;
    const vacancy = await Vacancy.create({
      title, company, description,
      skills: parseSkills(skills),
      location, type, industry, jobType, experience, salaryRange,
      createdBy: req.user._id,
    });
    res.status(201).json(vacancy);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.updateVacancy = async (req, res) => {
  try {
    const { title, company, description, skills, location, type, industry, jobType, experience, salaryRange, status } = req.body;
    const vacancy = await Vacancy.findByIdAndUpdate(
      req.params.id,
      { title, company, description, skills: parseSkills(skills), location, type, industry, jobType, experience, salaryRange, status },
      { new: true, runValidators: true }
    ).populate('interests', 'name email phone regNumber userType avatar cvUrl');
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
exports.updateApplicantStatus = async (req, res) => {
  try {
    const { userId, status, note } = req.body;
    if (!userId || !status) {
      return res.status(400).json({ message: 'userId and status are required' });
    }
    const vacancy = await Vacancy.findById(req.params.id);
    if (!vacancy) return res.status(404).json({ message: 'Vacancy not found' });
    
    // Ensure the applicantStatus Map exists
    if (!vacancy.applicantStatus) {
      vacancy.applicantStatus = new Map();
    }
    
    const previousStatus = vacancy.applicantStatus.get(userId);
    if (previousStatus !== status) {
      vacancy.applicantStatus.set(userId, status);
      
      if (!vacancy.applicantStatusHistory) vacancy.applicantStatusHistory = new Map();
      const history = vacancy.applicantStatusHistory.get(userId) || [];
      history.push({ status: status, date: new Date(), note: note || '' });
      vacancy.applicantStatusHistory.set(userId, history);
      
      await vacancy.save();

      const user = await User.findById(userId).select('name email');
      if (user) {
        if (status === 'reviewing') {
          sendApplicationReviewingEmail({
            to: user.email,
            name: user.name,
            vacancyTitle: vacancy.title
          }).catch(console.error);
        }

        // Ensure notification type is valid or skip it if it fails
        try {
          await Notification.create({
            user: userId,
            fromUser: req.user._id,
            type: 'vacancy_reply', // using a valid enum type instead of vacancy_status_update
            title: 'Application Status Updated',
            message: `Your application status for "${vacancy.title}" has been updated to: ${status}`,
            vacancy: vacancy._id,
          });
        } catch (notifErr) {
          console.error('Notification error:', notifErr);
        }
      }
    }
    
    res.json({ success: true, applicantStatus: vacancy.applicantStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markVacancyViewed = async (req, res) => {
  try {
    const vacancy = await Vacancy.findByIdAndUpdate(req.params.id, { isViewed: true }, { new: true });
    if (!vacancy) return res.status(404).json({ message: 'Vacancy not found' });
    res.json(vacancy);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

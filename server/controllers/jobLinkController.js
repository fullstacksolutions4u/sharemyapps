const JobLink = require('../models/JobLink');

exports.getJobLinks = async (req, res) => {
  try {
    const jobLinks = await JobLink.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('createdBy', 'name avatar profileImage designations linkedinUrl')
      .lean();

    res.json({ success: true, data: jobLinks });
  } catch (error) {
    console.error('Error fetching job links:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createJobLink = async (req, res) => {
  try {
    const { url, platform } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required.' });
    }

    const jobLink = await JobLink.create({
      url,
      platform: platform || 'other',
      createdBy: req.user._id,
      status: 'pending'
    });

    const populatedLink = await JobLink.findById(jobLink._id)
      .populate('createdBy', 'name avatar profileImage designations linkedinUrl')
      .lean();

    res.json({ success: true, data: populatedLink });
  } catch (error) {
    console.error('Error creating job link:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAdminJobLinks = async (req, res) => {
  try {
    const jobLinks = await JobLink.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email avatar profileImage')
      .lean();
    res.json({ success: true, data: jobLinks });
  } catch (error) {
    console.error('Error fetching admin job links:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createAdminJobLink = async (req, res) => {
  try {
    const { url, title, workMode, location, platform, experience } = req.body;

    if (!url || !title || !workMode || !location) {
      return res.status(400).json({ success: false, message: 'All fields except experience are required' });
    }

    const jobLink = await JobLink.create({
      url,
      title,
      workMode,
      location,
      experience: experience || '',
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      platform: platform || 'other',
      createdBy: req.user._id,
      status: 'approved'
    });

    const populatedLink = await JobLink.findById(jobLink._id)
      .populate('createdBy', 'name email avatar profileImage')
      .lean();

    res.json({ success: true, data: populatedLink });
  } catch (error) {
    console.error('Error creating admin job link:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateJobLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, title, company, workMode, location, url, experience } = req.body;

    const link = await JobLink.findById(id);
    if (!link) {
      return res.status(404).json({ success: false, message: 'Job link not found' });
    }

    if (status) {
      link.status = status;
      if (status === 'approved') {
        link.expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
      }
    }
    if (title !== undefined) link.title = title;
    if (company !== undefined) link.company = company;
    if (workMode !== undefined) link.workMode = workMode;
    if (location !== undefined) link.location = location;
    if (url !== undefined) link.url = url;
    if (experience !== undefined) link.experience = experience;

    await link.save();
    res.json({ success: true, data: link });
  } catch (error) {
    console.error('Error updating job link:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

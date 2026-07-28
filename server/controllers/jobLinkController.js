const JobLink = require('../models/JobLink');
const OpenAI = require('openai');

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

    const existingLink = await JobLink.findOne({ url });
    if (existingLink) {
      return res.status(400).json({ success: false, message: 'Link already shared' });
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

    if (!url || !title || !workMode) {
      return res.status(400).json({ success: false, message: 'URL, Designation, and Work Mode are required' });
    }

    const existingLink = await JobLink.findOne({ url });
    if (existingLink) {
      return res.status(400).json({ success: false, message: 'Link already shared' });
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

exports.extractJobDetails = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length < 30) {
      return res.status(400).json({ success: false, message: 'Please paste more job description content.' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ success: false, message: 'OpenAI API key is not configured.' });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `You are a job description parser. Extract structured information from the following job posting content.

Return ONLY a valid JSON object with these exact keys (no markdown, no explanation, just raw JSON):
{
  "title": "most relevant job designation/role (e.g. Full Stack Developer, React Developer, Backend Engineer)",
  "company": "company name if mentioned, else empty string",
  "workMode": "one of: Remote, Onsite, Hybrid — infer from context if not explicitly stated",
  "location": "city and country if mentioned, else empty string",
  "experience": "experience requirement as a short string (e.g. 2-4 years, 3+ years), else empty string"
}

Job posting content:
${text.slice(0, 4000)}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 300,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '';

    // Strip markdown code fences if present
    const cleaned = responseText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    let extracted;
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({ success: false, message: 'AI returned unexpected format. Please try again.' });
    }

    return res.json({
      success: true,
      data: {
        title: extracted.title || '',
        company: extracted.company || '',
        workMode: ['Remote', 'Onsite', 'Hybrid'].includes(extracted.workMode) ? extracted.workMode : '',
        location: extracted.location || '',
        experience: extracted.experience || '',
      }
    });
  } catch (error) {
    console.error('Error extracting job details:', error);
    res.status(500).json({ success: false, message: 'Failed to extract job details. Try again.' });
  }
};

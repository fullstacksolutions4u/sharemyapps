const JobLink = require('../models/JobLink');
const JobLinkFeedback = require('../models/JobLinkFeedback');
const CompanyContact = require('../models/CompanyContact');
const OpenAI = require('openai');
const { sendJobLinkRejectedEmail } = require('../utils/email');

function calculateExpirationDate(postedDate) {
  const defaultExp = Date.now() + 5 * 24 * 60 * 60 * 1000;
  if (!postedDate || typeof postedDate !== 'string') return new Date(defaultExp);
  
  const parsed = new Date(`${postedDate} ${new Date().getFullYear()}`);
  if (isNaN(parsed.getTime())) return new Date(defaultExp);
  
  return new Date(parsed.getTime() + 5 * 24 * 60 * 60 * 1000);
}

exports.getJobLinks = async (req, res) => {
  try {
    const activeThreshold = new Date();
    activeThreshold.setDate(activeThreshold.getDate() - 15);
    activeThreshold.setHours(0, 0, 0, 0);

    const jobLinks = await JobLink.find({
      status: 'approved',
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: { $exists: false }, createdAt: { $gte: activeThreshold } }
      ]
    })
      .sort({ createdAt: -1 })
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
      .populate('clicks', 'name email')
      .lean();
    res.json({ success: true, data: jobLinks });
  } catch (error) {
    console.error('Error fetching admin job links:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createAdminJobLink = async (req, res) => {
  try {
    const { url, title, company, postedDate, workMode, location, platform, experience, state } = req.body;

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
      company: company || '',
      postedDate: postedDate || '',
      workMode,
      location,
      experience: experience || '',
      state: state || '',
      expiresAt: calculateExpirationDate(postedDate),
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
    const { status, title, company, postedDate, workMode, location, url, experience, state } = req.body;

    const link = await JobLink.findById(id);
    if (!link) {
      return res.status(404).json({ success: false, message: 'Job link not found' });
    }

    if (status) {
      link.status = status;
      if (status === 'approved') {
        link.expiresAt = calculateExpirationDate(postedDate !== undefined ? postedDate : link.postedDate);
      }
    }
    if (title !== undefined) link.title = title;
    if (company !== undefined) link.company = company;
    if (postedDate !== undefined) link.postedDate = postedDate;
    if (workMode !== undefined) link.workMode = workMode;
    if (location !== undefined) link.location = location;
    if (url !== undefined) link.url = url;
    if (experience !== undefined) link.experience = experience;
    if (state !== undefined) link.state = state;
    if (req.body.adminNote !== undefined) link.adminNote = req.body.adminNote;

    await link.save();

    if (status === 'rejected' && link.createdBy) {
      const User = require('../models/User');
      const user = await User.findById(link.createdBy);
      if (user && user.email) {
        await sendJobLinkRejectedEmail({
          to: user.email,
          name: user.name,
          linkUrl: link.url,
          adminNote: link.adminNote
        }).catch(err => console.error('Error sending rejection email:', err));
      }
    }

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

    const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const prompt = `You are a job description parser. Extract structured information from the following job posting content.
CURRENT DATE: ${currentDate}

Return ONLY a valid JSON object with these exact keys (no markdown, no explanation, just raw JSON):
{
  "title": "most relevant job designation/role (e.g. Full Stack Developer, React Developer, Backend Engineer)",
  "company": "company name if mentioned, if an email ID is present extract the company name from the domain name (e.g., from name@example.com extract 'Example', remove common extensions like .com, .in, .net), else empty string",
  "postedDate": "job posting date if mentioned. If relative (e.g. '1w', '2d'), calculate the exact date based on CURRENT DATE and output in 'Month DD' format (e.g. 'July 21'). Else empty string",
  "workMode": "one of: Remote, Onsite, Hybrid — infer from context if not explicitly stated",
  "location": "city and state/country if mentioned. For Indian cities, use the state name instead of 'India' (e.g. 'Jaipur, Rajasthan', 'Bengaluru, Karnataka', 'Mumbai, Maharashtra', 'Hyderabad, Telangana'). For non-Indian locations use city and country. Else empty string.",
  "state": "the Indian state name — ONLY fill if there is exactly ONE clear Indian city or area mentioned (e.g. 'Bengaluru' → 'Karnataka', 'Hyderabad' → 'Telangana'). If a non-Indian country/city is mentioned (e.g. 'USA', 'London'), return 'Out of India'. If multiple locations are mentioned, or if the location is Remote, return empty string.",
  "experience": "experience requirement as a short string (e.g. 2-4 years, 3+ years), else empty string",
  "email": "any email address found in the job posting (e.g. hr@company.com), else empty string"
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

    let isDuplicate = false;
    if (extracted.company && extracted.title) {
      // Escape regex chars to be safe
      const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const companyRegex = new RegExp(escapeRegExp(extracted.company.trim()), 'i');
      const titleRegex = new RegExp(escapeRegExp(extracted.title.trim()), 'i');

      const existingLink = await JobLink.findOne({
        company: companyRegex,
        title: titleRegex
      });
      
      const Vacancy = require('../models/Vacancy');
      const existingVacancy = await Vacancy.findOne({
        company: companyRegex,
        title: titleRegex
      });

      if (existingLink || existingVacancy) isDuplicate = true;
    }

    if (extracted.company) {
      const companyName = extracted.company.trim();
      try {
        const updateDoc = {};
        if (extracted.email) {
          updateDoc.$addToSet = { emails: extracted.email.trim().toLowerCase() };
        }
        await CompanyContact.findOneAndUpdate(
          { name: { $regex: new RegExp(`^${companyName}$`, 'i') } },
          { 
            $setOnInsert: { name: companyName },
            ...updateDoc
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error('Error saving company contact:', err);
      }
    }

    return res.json({
      success: true,
      data: {
        title: extracted.title || '',
        company: extracted.company || '',
        postedDate: extracted.postedDate || '',
        workMode: ['Remote', 'Onsite', 'Hybrid'].includes(extracted.workMode) ? extracted.workMode : '',
        location: extracted.location || '',
        state: extracted.state || '',
        experience: extracted.experience || '',
        email: extracted.email || '',
        isDuplicate
      }
    });
  } catch (error) {
    console.error('Error extracting job details:', error);
    res.status(500).json({ success: false, message: 'Failed to extract job details. Try again.' });
  }
};

exports.submitFeedback = async (req, res) => {
  try {
    const { heardBack } = req.body;
    const { id: jobLink } = req.params;
    const user = req.user._id;

    if (typeof heardBack !== 'boolean') {
      return res.status(400).json({ success: false, message: 'heardBack must be a boolean' });
    }

    const feedback = await JobLinkFeedback.findOneAndUpdate(
      { user, jobLink },
      { heardBack },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: feedback });
  } catch (error) {
    console.error('Error submitting job link feedback:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAdminFeedback = async (req, res) => {
  try {
    const feedback = await JobLinkFeedback.find()
      .populate('user', 'name email avatar')
      .populate('jobLink', 'title company')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: feedback });
  } catch (error) {
    console.error('Error fetching admin feedback:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAdminCompanies = async (req, res) => {
  try {
    const companies = await CompanyContact.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: companies });
  } catch (error) {
    console.error('Error fetching admin companies:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.recordClick = async (req, res) => {
  try {
    const jobLink = await JobLink.findById(req.params.id);
    if (!jobLink) {
      return res.status(404).json({ success: false, message: 'Job link not found' });
    }
    if (!jobLink.clicks) {
      jobLink.clicks = [];
    }
    if (!jobLink.clicks.includes(req.user._id)) {
      jobLink.clicks.push(req.user._id);
      await jobLink.save();
    }
    res.json({ success: true, message: 'Click recorded successfully' });
  } catch (error) {
    console.error('Error recording job link click:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const ShowcasePage = require('../models/ShowcasePage');
const InterviewSession = require('../models/InterviewSession');
const User = require('../models/User');
const Project = require('../models/Project');

class ShowcaseRepository {
  async listShowcases() {
    return await ShowcasePage.find()
      .populate('createdBy', 'name')
      .populate('candidates', 'name avatar regNumber designations familiarTech')
      .sort({ createdAt: -1 })
      .lean();
  }

  async createShowcase(data) {
    const page = await ShowcasePage.create(data);
    await page.populate('createdBy', 'name');
    await page.populate('candidates', 'name avatar regNumber designations familiarTech');
    return page;
  }

  async updateShowcase(id, data) {
    return await ShowcasePage.findByIdAndUpdate(id, data, { new: true })
      .populate('createdBy', 'name')
      .populate('candidates', 'name avatar regNumber designations familiarTech');
  }

  async deleteShowcase(id) {
    return await ShowcasePage.findByIdAndDelete(id);
  }

  async findShowcaseById(id) {
    return await ShowcasePage.findById(id);
  }

  async saveShowcase(page) {
    return await page.save();
  }

  async getPublicShowcaseBySlug(slug) {
    return await ShowcasePage.findOne({ slug }).lean();
  }

  incrementViewCount(id) {
    ShowcasePage.updateOne({ _id: id }, { $inc: { viewCount: 1 } }).catch(() => {});
  }

  async getCandidates(candidateIds) {
    return await User.find({ _id: { $in: candidateIds } })
      .select('name email phone avatar regNumber designations familiarTech bio yearsOfExperience place district state country linkedinUrl githubUrl portfolioUrl cvUrl expectedSalary currentSalary preferredLocations jobMode joiningAvailability resumeData gender')
      .lean();
  }

  async getSessions(candidateIds) {
    return await InterviewSession.find({
      user: { $in: candidateIds },
      sharedWithCandidate: true,
    })
      .sort({ sessionNumber: -1 })
      .lean();
  }

  async getProjects(candidateIds) {
    return await Project.find({
      author: { $in: candidateIds },
      status: 'approved',
    })
      .select('title description thumbnail category tags likes ratings author')
      .sort({ createdAt: -1 })
      .lean();
  }
}

module.exports = new ShowcaseRepository();

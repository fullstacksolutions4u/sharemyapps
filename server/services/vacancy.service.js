const vacancyRepo = require('../repositories/vacancy.repository');
const { sendJobApplicationEmail, sendApplicationReviewingEmail } = require('../utils/email');

class VacancyService {
  async getVacancies(userId) {
    const vacancies = await vacancyRepo.getPublicVacancies();
    return vacancies.map(v => {
      let shortlistedCount = 0;
      if (v.applicantStatus) {
        for (const status of Object.values(v.applicantStatus)) {
          if (status === 'shortlisted') shortlistedCount++;
        }
      }

      return {
        ...v,
        interestCount: v.interests.length,
        interested: userId ? v.interests.some(id => id.toString() === userId) : false,
        applicationStatus: userId && v.applicantStatus && v.applicantStatus[userId] ? v.applicantStatus[userId] : null,
        appliedPosition: userId && v.applicantPositions && v.applicantPositions[userId] ? v.applicantPositions[userId] : null,
        shortlistedCount,
        interests: undefined,
        applicantStatus: undefined,
        applicantStatusHistory: undefined,
        applicantPositions: undefined,
      };
    });
  }

  async showInterest(vacancyId, user, position) {
    const vacancy = await vacancyRepo.findActiveVacancyById(vacancyId);
    if (!vacancy) {
      const err = new Error('Vacancy not found or closed'); err.status = 404; throw err;
    }
    
    const userIdStr = user._id.toString();
    if (vacancy.interests.some(id => id.toString() === userIdStr)) {
      const err = new Error('Already interested'); err.status = 400; throw err;
    }
    
    const isFirstTime = !vacancy.everApplied.some(id => id.toString() === userIdStr);
    vacancy.interests.push(user._id);
    if (isFirstTime) {
      vacancy.everApplied.push(user._id);
      if (!vacancy.applicantStatusHistory) vacancy.applicantStatusHistory = new Map();
      vacancy.applicantStatusHistory.set(userIdStr, [{ status: 'applied', date: new Date() }]);
    }

    if (position) {
      if (!vacancy.applicantPositions) vacancy.applicantPositions = new Map();
      vacancy.applicantPositions.set(userIdStr, position);
    }

    await vacancyRepo.saveVacancy(vacancy);

    const positionText = position ? `${vacancy.title} (${position})` : vacancy.title;

    if (isFirstTime) {
      sendJobApplicationEmail({
        to: user.email,
        name: user.name,
        vacancy,
        selectedPosition: position || null,
      }).catch(() => {});
    }

    vacancyRepo.createNotification({
      user: user._id,
      type: 'vacancy_reply',
      title: `Application Submitted – ${vacancy.title}`,
      message: `Your application for "${positionText}" has been received. Shortlisted profiles will be listed on the platform shortly, so keep checking back here!`,
      vacancy: vacancy._id,
    }).catch(console.error);

    return { interested: true, interestCount: vacancy.interests.length };
  }

  async withdrawInterest(vacancyId, userId) {
    const vacancy = await vacancyRepo.findActiveVacancyById(vacancyId);
    if (!vacancy) {
      const err = new Error('Vacancy not found or closed'); err.status = 404; throw err;
    }
    
    const userIdStr = userId.toString();
    vacancy.interests = vacancy.interests.filter(id => id.toString() !== userIdStr);
    await vacancyRepo.saveVacancy(vacancy);
    
    return { interested: false, interestCount: vacancy.interests.length };
  }

  async reportVacancy(userId, data) {
    return await vacancyRepo.createVacancy({
      ...data,
      status: 'pending',
      createdBy: userId,
    });
  }

  async getAllVacanciesAdmin() {
    return await vacancyRepo.getAllVacanciesAdmin();
  }

  async createVacancy(userId, data) {
    return await vacancyRepo.createVacancy({
      ...data,
      createdBy: userId,
    });
  }

  async updateVacancy(id, data) {
    const vacancy = await vacancyRepo.updateVacancy(id, data);
    if (!vacancy) {
      const err = new Error('Vacancy not found'); err.status = 404; throw err;
    }
    return vacancy;
  }

  async replyToInterest(vacancyId, adminId, data) {
    const vacancy = await vacancyRepo.findVacancyById(vacancyId);
    if (!vacancy) {
      const err = new Error('Vacancy not found'); err.status = 404; throw err;
    }

    const hasInterest = vacancy.interests.some(id => id.toString() === data.userId);
    if (!hasInterest) {
      const err = new Error('User has not shown interest in this vacancy'); err.status = 400; throw err;
    }

    await vacancyRepo.createNotification({
      user: data.userId,
      fromUser: adminId,
      type: 'vacancy_reply',
      title: `Admin replied about: ${vacancy.title}`,
      message: data.message,
      vacancy: vacancy._id,
    });

    return { success: true };
  }

  async toggleVacancyStatus(id) {
    const vacancy = await vacancyRepo.findVacancyById(id);
    if (!vacancy) {
      const err = new Error('Vacancy not found'); err.status = 404; throw err;
    }
    vacancy.status = vacancy.status === 'active' ? 'closed' : 'active';
    await vacancyRepo.saveVacancy(vacancy);
    return { status: vacancy.status };
  }

  async deleteVacancy(id) {
    const vacancy = await vacancyRepo.deleteVacancy(id);
    if (!vacancy) {
      const err = new Error('Vacancy not found'); err.status = 404; throw err;
    }
    return { message: 'Deleted' };
  }

  async updateApplicantStatus(vacancyId, adminId, data) {
    const vacancy = await vacancyRepo.findVacancyById(vacancyId);
    if (!vacancy) {
      const err = new Error('Vacancy not found'); err.status = 404; throw err;
    }
    
    if (!vacancy.applicantStatus) vacancy.applicantStatus = new Map();
    if (!vacancy.applicantStatusHistory) vacancy.applicantStatusHistory = new Map();
    
    const targetUserIds = data.userIds || [data.userId];
    let changed = false;

    for (const uId of targetUserIds) {
      const previousStatus = vacancy.applicantStatus.get(uId);
      if (previousStatus !== data.status) {
        vacancy.applicantStatus.set(uId, data.status);
        
        const history = vacancy.applicantStatusHistory.get(uId) || [];
        history.push({ status: data.status, date: new Date(), note: data.note || '' });
        vacancy.applicantStatusHistory.set(uId, history);
        changed = true;

        vacancyRepo.getUserById(uId).then(user => {
          if (user) {
            if (data.status === 'reviewing') {
              sendApplicationReviewingEmail({
                to: user.email,
                name: user.name,
                vacancyTitle: vacancy.title
              }).catch(console.error);
            }

            const isShortlisted = data.status === 'shortlisted';
            vacancyRepo.createNotification({
              user: uId,
              fromUser: adminId,
              type: 'vacancy_reply',
              title: isShortlisted ? '🎉 Profile Shortlisted!' : 'Application Status Updated',
              message: isShortlisted
                ? `Congratulations! Your profile for "${vacancy.title}" has been shortlisted! Shortlisted profiles are listed directly on the job card on the platform.`
                : `Your application status for "${vacancy.title}" has been updated to: ${data.status}. Check the job card on the platform for shortlisted profiles.`,
              vacancy: vacancy._id,
            }).catch(console.error);
          }
        }).catch(console.error);
      }
    }
    
    if (changed) {
      await vacancyRepo.saveVacancy(vacancy);
    }
    
    return { success: true, applicantStatus: vacancy.applicantStatus };
  }

  async markVacancyViewed(id) {
    const vacancy = await vacancyRepo.markVacancyViewed(id);
    if (!vacancy) {
      const err = new Error('Vacancy not found'); err.status = 404; throw err;
    }
    return vacancy;
  }

  async getShortlistedProfiles(id) {
    const vacancy = await vacancyRepo.getVacancyWithInterests(id);
    if (!vacancy) {
      const err = new Error('Vacancy not found'); err.status = 404; throw err;
    }

    const shortlisted = [];
    if (vacancy.applicantStatus && vacancy.interests) {
      for (const user of vacancy.interests) {
        if (vacancy.applicantStatus[user._id.toString()] === 'shortlisted') {
          shortlisted.push({
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
            regNumber: user.regNumber,
            userType: user.userType
          });
        }
      }
    }
    return { success: true, shortlisted };
  }

  async getSharedProfiles(id) {
    const vacancy = await vacancyRepo.getVacancyForSharedProfiles(id);
    if (!vacancy) {
      const err = new Error('Vacancy not found'); err.status = 404; throw err;
    }

    const sessions = await vacancyRepo.getInterviewSessionsForVacancy(id);
    return { success: true, vacancy, sessions };
  }
}

module.exports = new VacancyService();

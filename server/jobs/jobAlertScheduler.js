const JobAlert = require('../models/JobAlert');
const Notification = require('../models/Notification');

const JOB_ALERT_TITLE = 'New Job Openings 🎯';
const JOB_ALERT_MESSAGE = 'New jobs have been released. Please check out your dashboard and apply.';

async function processDueJobAlerts() {
  const due = await JobAlert.find({ notified: false, scheduledAt: { $lte: new Date() } });
  for (const alert of due) {
    for (const userId of alert.recipients) {
      try {
        await Notification.create({
          user:     userId,
          type:     'job_alert',
          title:    JOB_ALERT_TITLE,
          message:  JOB_ALERT_MESSAGE,
          jobAlert: alert._id,
        });
      } catch { /* skip failed recipient, don't block the rest */ }
    }
    alert.notified = true;
    await alert.save();
  }
}

function startJobAlertScheduler() {
  processDueJobAlerts().catch(err => console.error('Job alert scheduler error:', err));
  setInterval(() => {
    processDueJobAlerts().catch(err => console.error('Job alert scheduler error:', err));
  }, 60 * 1000);
}

module.exports = { startJobAlertScheduler };

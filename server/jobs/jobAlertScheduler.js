const JobAlert = require('../models/JobAlert');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendJobAlertEmail } = require('../utils/email');

const JOB_ALERT_TITLE = 'New Job Openings 🎯';
const JOB_ALERT_MESSAGE = 'New jobs have been released. Please check out your dashboard and apply.';

async function processDueJobAlerts() {
  const due = await JobAlert.find({ notified: false, scheduledAt: { $lte: new Date() } });
  for (const alert of due) {
    const recipients = await User.find({ _id: { $in: alert.recipients } }).select('name email').lean();
    for (const u of recipients) {
      try {
        await Notification.create({
          user:     u._id,
          type:     'job_alert',
          title:    JOB_ALERT_TITLE,
          message:  JOB_ALERT_MESSAGE,
          jobAlert: alert._id,
        });
        sendJobAlertEmail({ to: u.email, name: u.name }).catch(err => console.error('Job alert email error:', err));
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

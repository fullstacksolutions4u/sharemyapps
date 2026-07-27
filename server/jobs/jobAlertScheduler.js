const JobAlert = require('../models/JobAlert');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendJobAlertEmail } = require('../utils/email');

const JOB_ALERT_TITLE = 'New Job Openings 🎯';
const JOB_ALERT_MESSAGE = 'New hiring opportunities are live! Check your dashboard for company and recruiters email IDs and career page links — share your CV or upload your resume to apply directly.';

async function processDueJobAlerts() {
  const due = await JobAlert.find({ notified: false, isDraft: false, scheduledAt: { $lte: new Date() } }).select('_id');
  for (const { _id } of due) {
    // Atomically claim the alert so concurrent scheduler instances can't both process it.
    const alert = await JobAlert.findOneAndUpdate(
      { _id, notified: false },
      { notified: true },
      { new: true }
    );
    if (!alert) continue;

    const recipients = await User.find({ _id: { $in: alert.recipients } }).select('name email').lean();
    
    // 1. Bulk create notifications
    const notifications = recipients.map(u => ({
      user:     u._id,
      type:     'job_alert',
      title:    JOB_ALERT_TITLE,
      message:  JOB_ALERT_MESSAGE,
      jobAlert: alert._id,
    }));
    
    const NOTIFICATION_CHUNK_SIZE = 500;
    for (let i = 0; i < notifications.length; i += NOTIFICATION_CHUNK_SIZE) {
      const chunk = notifications.slice(i, i + NOTIFICATION_CHUNK_SIZE);
      await Notification.insertMany(chunk, { ordered: false }).catch(err => console.error('Job alert notification error:', err));
    }

    // 2. Send emails in small chunks to prevent Event Loop and Network pool starvation
    const EMAIL_CHUNK_SIZE = 50;
    for (let i = 0; i < recipients.length; i += EMAIL_CHUNK_SIZE) {
      const chunk = recipients.slice(i, i + EMAIL_CHUNK_SIZE);
      await Promise.all(
        chunk.map(u => sendJobAlertEmail({ to: u.email, name: u.name }).catch(err => console.error('Job alert email error:', err)))
      );
      // Give the event loop a breather
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

function startJobAlertScheduler() {
  processDueJobAlerts().catch(err => console.error('Job alert scheduler error:', err));
  setInterval(() => {
    processDueJobAlerts().catch(err => console.error('Job alert scheduler error:', err));
  }, 60 * 1000);
}

module.exports = { startJobAlertScheduler };

const Brevo = require('@getbrevo/brevo');

const api = new Brevo.TransactionalEmailsApi();
api.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
const BASE_URL   = process.env.CLIENT_URL || 'http://localhost:5173';
const LOGO_URL   = 'https://res.cloudinary.com/di0vbvioi/image/upload/v1780659567/sharemyapp/logo.png';
const LINKEDIN_URL = 'https://linkedin.com/company/sharemyapps';
const FROM = { name: 'ShareMyApps', email: process.env.EMAIL_FROM || 'sharemyappsportal@gmail.com' };

const FOOTER = (text) => `
  <div style="background:#F3F0EB;padding:16px 32px;text-align:center;">
    <p style="color:#9CA3AF;font-size:12px;margin:0 0 8px;">${text}</p>
    <a href="${LINKEDIN_URL}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;color:#0A66C2;font-size:12px;font-weight:600;">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
      Follow us on LinkedIn
    </a>
  </div>
`;

exports.sendFeedbackEmail = async ({ senderName, senderEmail, text }) => {
  await api.sendTransacEmail({
    sender: FROM,
    to: [{ email: 'hello@sharemyapps.in', name: 'ShareMyApps' }],
    replyTo: { email: senderEmail, name: senderName },
    subject: `New Feedback from ${senderName}`,
    htmlContent: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E5E1DA;">
        <div style="background:#00A693;padding:24px 32px;text-align:center;">
          <img src="${LOGO_URL}" alt="ShareMyApps" style="height:80px;object-fit:contain;" />
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 16px;font-size:18px;color:#1A1A1A;">New Feedback Received</h2>
          <p style="color:#374151;margin:0 0 4px;font-size:13px;"><strong>From:</strong> ${senderName} (${senderEmail})</p>
          <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin-top:16px;white-space:pre-wrap;font-size:14px;color:#374151;">${text}</div>
        </div>
        ${FOOTER('This is an automated notification from ShareMyApps feedback form.')}
      </div>
    `,
  });
};

exports.sendProjectApprovedEmail = async ({ to, name, projectTitle, projectId, adminNote }) => {
  const projectUrl = `${BASE_URL}/project/${projectId}`;

  await api.sendTransacEmail({
    sender: FROM,
    to: [{ email: to, name }],
    subject: `"${projectTitle}" is now live @ ShareMyApps`,
    htmlContent: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E5E1DA;">
        <div style="background:#00A693;padding:24px 32px;text-align:center;">
          <img src="${LOGO_URL}" alt="ShareMyApps" style="height:80px;object-fit:contain;" />
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 8px;font-size:18px;color:#1A1A1A;">🎉 Your project is live!</h2>
          <p style="color:#374151;margin:0 0 16px;">Hi ${name},</p>
          <p style="color:#374151;margin:0 0 16px;">
            Great news — your project <strong>"${projectTitle}"</strong> has been approved by our team and is now publicly visible on ShareMyApps.
          </p>
          ${adminNote ? `
          <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:14px 16px;margin-bottom:16px;">
            <p style="margin:0;font-size:13px;color:#166534;"><strong>Admin tip:</strong> ${adminNote}</p>
          </div>` : ''}
          <a href="${projectUrl}" style="display:inline-block;background:#00A693;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;margin-bottom:24px;">
            View your project →
          </a>
          <p style="color:#6B7280;font-size:13px;margin:0;">
            Now recruiters, clients, and mentoring students can explore your projects on ShareMyApps.
          </p>
        </div>
        ${FOOTER('You received this email because you submitted a project on ShareMyApps.')}
      </div>
    `,
  });
};

exports.sendOtpEmail = async ({ to, otp }) => {
  await api.sendTransacEmail({
    sender: FROM,
    to: [{ email: to }],
    subject: 'Your ShareMyApps password reset OTP',
    htmlContent: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;background:#FAF9F6;border-radius:16px;overflow:hidden;border:1px solid #E5E1DA;">
        <div style="background:#00A693;padding:20px 32px;text-align:center;">
          <img src="${LOGO_URL}" alt="ShareMyApps" style="height:36px;object-fit:contain;" />
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 8px;font-size:18px;color:#1A1A1A;">Reset your password</h2>
          <p style="color:#6B7280;margin:0 0 24px;font-size:14px;">Use the one-time code below to reset your password. It expires in <strong>10 minutes</strong>.</p>
          <div style="text-align:center;background:#fff;border:1px solid #E5E1DA;border-radius:12px;padding:28px;">
            <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#00A693;">${otp}</span>
          </div>
          <p style="margin:20px 0 0;font-size:12px;color:#9CA3AF;text-align:center;">If you didn't request this, you can safely ignore this email.</p>
        </div>
        ${FOOTER('You received this because a password reset was requested on ShareMyApps.')}
      </div>
    `,
  });
};

exports.sendCollaboratorAddedEmail = async ({ to, name, addedByName, projectTitle, projectId }) => {
  const projectUrl = `${BASE_URL}/project/${projectId}`;

  await api.sendTransacEmail({
    sender: FROM,
    to: [{ email: to, name }],
    subject: `${addedByName} added you as a collaborator on "${projectTitle}"`,
    htmlContent: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E5E1DA;">
        <div style="background:#00A693;padding:24px 32px;text-align:center;">
          <img src="${LOGO_URL}" alt="ShareMyApps" style="height:80px;object-fit:contain;" />
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 8px;font-size:18px;color:#1A1A1A;">👥 You've been added as a collaborator!</h2>
          <p style="color:#374151;margin:0 0 16px;">Hi ${name},</p>
          <p style="color:#374151;margin:0 0 16px;">
            <strong>${addedByName}</strong> has added you as a collaborator on the project
            <strong>"${projectTitle}"</strong> on ShareMyApps. Your name will now appear on the project page.
          </p>
          <a href="${projectUrl}" style="display:inline-block;background:#00A693;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;margin-bottom:24px;">
            View project →
          </a>
          <p style="color:#6B7280;font-size:13px;margin:0;">
            This project is now linked to your profile. Share it to showcase your work.
          </p>
        </div>
        ${FOOTER('You received this because someone added you as a collaborator on ShareMyApps.')}
      </div>
    `,
  });
};

exports.sendProjectRejectedEmail = async ({ to, name, projectTitle, projectId, adminNote }) => {
  const editUrl = `${BASE_URL}/dashboard`;

  await api.sendTransacEmail({
    sender: FROM,
    to: [{ email: to, name }],
    subject: `Action needed on your project "${projectTitle}"`,
    htmlContent: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E5E1DA;">
        <div style="background:#00A693;padding:24px 32px;text-align:center;">
          <img src="${LOGO_URL}" alt="ShareMyApps" style="height:80px;object-fit:contain;" />
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 8px;font-size:18px;color:#1A1A1A;">Your project needs some changes</h2>
          <p style="color:#374151;margin:0 0 16px;">Hi ${name},</p>
          <p style="color:#374151;margin:0 0 16px;">
            Your project <strong>"${projectTitle}"</strong> wasn't approved at this time. Please review the feedback below, update your project, and resubmit.
          </p>
          ${adminNote ? `
          <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:14px 16px;margin-bottom:16px;">
            <p style="margin:0;font-size:13px;color:#991B1B;"><strong>Admin note:</strong> ${adminNote}</p>
          </div>` : `
          <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:14px 16px;margin-bottom:16px;">
            <p style="margin:0;font-size:13px;color:#991B1B;">Please ensure your project has a working live URL, clear description, and appropriate content.</p>
          </div>`}
          <a href="${editUrl}" style="display:inline-block;background:#00A693;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;margin-bottom:24px;">
            Edit and resubmit →
          </a>
          <p style="color:#6B7280;font-size:13px;margin:0;">
            Once you've made the changes, you can resubmit for review from your dashboard.
          </p>
        </div>
        ${FOOTER('You received this email because you submitted a project on ShareMyApps.')}
      </div>
    `,
  });
};
